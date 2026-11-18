#!/usr/bin/env node
/**
 * MindMosaic safety gate — shared PreToolUse hook for Claude Code and AGY.
 *
 * Reads one hook payload on stdin, classifies the proposed tool call and prints
 * a decision. It FAILS CLOSED: malformed input, internal errors and anything it
 * cannot classify safely become `deny` or `ask`, never `allow`.
 *
 * Cline payload:        { preToolUse: { toolName, parameters } }  -> { cancel, errorMessage }
 * Claude Code payload:  { tool_name, tool_input: { command | file_path | path ... }, cwd }
 * AGY payload:          { toolCall: { name, args: { CommandLine, Cwd, ... } } }
 *
 * This is a guardrail, not a sandbox. It classifies command STRINGS; it cannot see
 * inside scripts a command runs. Production protection also depends on the
 * permission rules in .claude/settings.json and on credentials/branch protection
 * outside the repository (see docs/AI_ENVIRONMENT_SAFETY.md).
 *
 * No dependencies. Node >= 18.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROD_REF = "uermhsptduikehuyceiz";
const DEV_REF = "mfglzabnayacssgertat";
const PROTECTED_BRANCHES = new Set(["main", "master"]);
const MAX_INPUT = 1_000_000;
const MAX_COMMAND = 60_000;
const MAX_DEPTH = 4;
const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));

function isProjectMcpPath(value, cwd = PROJECT_ROOT) {
  return path.resolve(cwd, value) === path.resolve(PROJECT_ROOT, ".mcp.json");
}

const RANK = { allow: 0, ask: 1, deny: 2 };

/* ------------------------------------------------------------------ results */

function mk(decision, rule, reason) {
  return { decision, rule, reason: `MindMosaic safety gate [${rule}]: ${reason}` };
}
const deny = (rule, reason) => mk("deny", rule, reason);
const ask = (rule, reason) => mk("ask", rule, reason);
const ALLOW = { decision: "allow", rule: "none", reason: "" };

function worst(results) {
  let best = ALLOW;
  for (const r of results) if (r && RANK[r.decision] > RANK[best.decision]) best = r;
  return best;
}

/* ------------------------------------------------------------ path patterns */

const norm = (p) => String(p).replace(/\\/g, "/").toLowerCase();

const EXAMPLE_SUFFIX = /\.example$/;

/** True if `p` names a credential-bearing file (reads AND writes are refused). */
const SECRET_CANDIDATES = [".env", ".env.local", ".env.production", ".env.development.local", ".env.e2e.local", ".env.test.local", "secrets.json", ".npmrc", ".claude.json", "id_rsa"];
function globToRegExp(g) {
  const body = g
    .replace(/[.+^$(){}|\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp("^" + body + "$");
}
function isSecretPath(p) {
  const whole = norm(p);
  const tail = whole.split(/[=@]/).pop() ?? whole; // --opt=.env, @.env (curl)
  return isSecretPathInner(whole) || (tail !== whole && isSecretPathInner(tail));
}
function isSecretPathInner(s) {
  const baseGlob = s.split("/").pop() ?? "";
  if (/[*?]/.test(baseGlob)) {
    try {
      const re = globToRegExp(baseGlob);
      if (SECRET_CANDIDATES.some((c) => re.test(c))) return true;
    } catch {
      return true; // unparseable glob: refuse
    }
  }
  if (/(^|\/)\.env\*/.test(s)) return true; // glob that would match env files
  const base = s.split("/").pop() ?? "";
  if (/^\.env(\..+)?$/.test(base) && !EXAMPLE_SUFFIX.test(base)) return true;
  if (/^(secrets|\.credentials|auth|credentials|\.claude|\.mcp)\.json(?:\.bak)?$/.test(base)) return true;
  if (/(^|\/)\.(aws|ssh)\/|(^|\/)\.claude\/backups\/|(^|\/)\.vercel\/(?!project\.json$)/.test(s)) return true;
  if (/^(\.npmrc|\.netrc|\.pgpass|\.git-credentials|id_rsa|id_ed25519|id_ecdsa)$/.test(base)) return true;
  if (/\.(pem|pfx|p12|key)$/.test(base)) return true;
  if (/(^|\/)\.aws\/credentials$/.test(s)) return true;
  if (/(^|\/)\.cline\/data\/(secrets|settings)/.test(s)) return true;
  return false;
}

/** Config that defines the safety controls themselves: edits need approval. */
function isProtectedConfig(p) {
  const s = norm(p);
  return (
    /(^|\/)\.claude\/(settings(\.local)?\.json|hooks\/)/.test(s) ||
    /(^|\/)\.github\/(workflows\/|codeowners$)/.test(s) ||
    /(^|\/)(vercel\.json|\.mcp\.json)$/.test(s) ||
    /(^|\/)\.agents\/hooks\.json$/.test(s) ||
    /(^|\/)\.agents\/scripts\/safety-gate\.mjs$/.test(s) ||
    /(^|\/)\.clineignore$/.test(s) ||
    /(^|\/)\.clinerules\/hooks\//.test(s)
  );
}

/* ------------------------------------------------------ whole-string checks */

const SECRET_LITERAL =
  /\b(sk|rk|pk)_(live|test)_[A-Za-z0-9]{8,}|\bwhsec_[A-Za-z0-9]{8,}|\bsbp_[A-Za-z0-9]{16,}|\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\./;

const SECRET_VAR_NAME =
  "(?:[A-Z0-9_]*(?:SECRET|SERVICE_ROLE|TOKEN|PRIVATE_KEY|API_KEY|APIKEY|PASSWORD|PASSWD|WEBHOOK_SECRET|DB_URL|DATABASE_URL|STITCH|STRIPE)[A-Z0-9_]*)";
// A variable READ: $NAME, ${NAME}, %NAME%, $env:NAME, process.env.NAME, os.environ["NAME"], printenv NAME
const SECRET_VAR_READ = new RegExp(
  `(?:\\$\\{?|%|\\$env:|env:|process\\.env\\.|process\\.env\\[['"]|environ\\[['"]|getenv\\(['"]|getenvironmentvariable\\(['"]|printenv\\s+)${SECRET_VAR_NAME}`,
  "i",
);
const ENV_DUMP = /(?:^|[\s;&|(])(?:printenv|export\s+-p|declare\s+-x|get-childitem\s+env:|gci\s+env:|dir\s+env:|ls\s+env:)(?:\s*$|[\s;&|)])/i;

/** Squash to [a-z0-9] so quote/escape/backtick splitting of the ref still matches. */
const PROD_HEX = Buffer.from(PROD_REF).toString("hex");
const PROD_B64 = [0, 1, 2].map((p) => Buffer.from("a".repeat(p) + PROD_REF + "xxx").toString("base64").slice(4, -8));
function mentionsProdRef(text) {
  try { text += " " + decodeURIComponent(text); } catch { /* retain the original input */ }
  const squashed = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (squashed.includes(PROD_REF) || squashed.includes(PROD_HEX)) return true;
  if (PROD_B64.some((b) => text.includes(b))) return true;
  const reversed = [...squashed].reverse().join("");
  return reversed.includes(PROD_REF);
}

/* ---------------------------------------------------------------- tokenizer */

const BENIGN_VARS = new Set(["CLAUDE_PROJECT_DIR", "HOME", "PWD", "USERPROFILE", "TMPDIR", "TEMP", "TMP", "?"]);

function varsDynamic(tok) {
  // $NAME / ${NAME} / %NAME% / $env:NAME / $(...) marker / brace expansion marker
  if (tok.includes("\u0001")) return true;
  const re = /\$\{?([A-Za-z_][A-Za-z0-9_]*|\?)\}?|%([A-Za-z_][A-Za-z0-9_]*)%|\$env:([A-Za-z_][A-Za-z0-9_]*)/g;
  let m;
  while ((m = re.exec(tok))) {
    const name = m[1] ?? m[2] ?? m[3];
    if (!BENIGN_VARS.has(name)) return true;
  }
  return /\$\{[^}]*[^A-Za-z0-9_}][^}]*\}/.test(tok); // ${X:-y}, ${!x}
}

/**
 * Pull command substitutions out of `cmd`, returning the outer text with a marker
 * in their place and the inner command strings to evaluate separately.
 */
function extractSubstitutions(cmd) {
  const inner = [];
  let out = "";
  let i = 0;
  let single = false;
  while (i < cmd.length) {
    const c = cmd[i];
    if (single) {
      out += c;
      if (c === "'") single = false;
      i++;
      continue;
    }
    if (c === "'") {
      single = true;
      out += c;
      i++;
      continue;
    }
    if ((c === "$" || c === "<" || c === ">") && cmd[i + 1] === "(") {
      let depth = 1;
      let j = i + 2;
      while (j < cmd.length && depth > 0) {
        if (cmd[j] === "(") depth++;
        else if (cmd[j] === ")") depth--;
        j++;
      }
      inner.push(cmd.slice(i + 2, depth === 0 ? j - 1 : j));
      out += "\u0001";
      i = j;
      continue;
    }
    if (c === "`") {
      let j = i + 1;
      while (j < cmd.length && cmd[j] !== "`") j++;
      inner.push(cmd.slice(i + 1, j));
      out += "\u0001";
      i = j + 1;
      continue;
    }
    out += c;
    i++;
  }
  return { outer: out, inner };
}

/** Remove heredoc bodies (they are data, not commands) unless they expand substitutions. */
function stripHeredocs(cmd) {
  const lines = cmd.split(/\r?\n/);
  const kept = [];
  let end = null;
  let body = [];
  let expands = false;
  for (const line of lines) {
    if (end !== null) {
      if (line.trim() === end) {
        if (expands && body.some((l) => /\$\(|`/.test(l))) kept.push(...body);
        end = null;
        body = [];
      } else body.push(line);
      continue;
    }
    kept.push(line);
    const m = /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/.exec(line);
    if (m) {
      end = m[2];
      expands = m[1] === "";
    }
  }
  if (end !== null) kept.push(...body); // unterminated: keep everything
  return kept.join("\n");
}

/**
 * Split into segments of {words, dyn[]}. Separators: ; & && | || newline ( ) { }
 * (except redirects like 2>&1 and brace expansion). Quotes and escapes are removed
 * from words, so g"i"t and \git become git.
 */
function tokenize(text, ps) {
  const segs = [];
  let words = [];
  let dyns = [];
  let cur = "";
  let has = false;
  let quote = null;
  const pushWord = () => {
    if (has) {
      words.push(cur);
      dyns.push(varsDynamic(cur));
    }
    cur = "";
    has = false;
  };
  const pushSeg = () => {
    pushWord();
    if (words.length) segs.push({ words, dyn: dyns });
    words = [];
    dyns = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote === "'") {
      if (c === "'") {
        if (ps && text[i + 1] === "'") {
          cur += "'";
          i++;
        } else quote = null;
      } else cur += c;
      continue;
    }
    if (quote === '"') {
      if (c === '"') quote = null;
      else if ((ps && c === "`") || (!ps && c === "\\")) {
        i++;
        cur += text[i] ?? "";
      } else cur += c;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      has = true;
      continue;
    }
    if (!ps && c === "\\") {
      i++;
      cur += text[i] ?? "";
      has = true;
      continue;
    }
    if (ps && c === "`") {
      i++;
      cur += text[i] ?? "";
      has = true;
      continue;
    }
    if (c === "{" && text[i - 1] !== "$") {
      const close = text.indexOf("}", i);
      const inside = close === -1 ? "" : text.slice(i + 1, close);
      if (close !== -1 && !/[\s;]/.test(inside) && (inside.includes(",") || inside.includes(".."))) {
        cur += "\u0001"; // brace expansion: dynamic
        has = true;
        i = close;
        continue;
      }
      pushSeg();
      continue;
    }
    if (c === "}" && !/\$\{[^}]*$/.test(cur)) {
      pushSeg();
      continue;
    }
    if (c === ";" || c === "\n" || c === "\r" || c === "(" || c === ")") {
      pushSeg();
      continue;
    }
    if (c === "|") {
      pushSeg();
      continue;
    }
    if (c === "&") {
      const prev = text[i - 1];
      const next = text[i + 1];
      if (prev === ">" || prev === "<" || next === ">") {
        cur += c;
        has = true;
      } else pushSeg();
      continue;
    }
    if (/\s/.test(c)) {
      pushWord();
      continue;
    }
    cur += c;
    has = true;
  }
  pushSeg();
  return segs;
}

/* ------------------------------------------------------- command resolution */

const WRAPPERS = new Set(["env", "command", "exec", "builtin", "nohup", "time", "nice", "sudo", "doas", "stdbuf", "timeout", "call", "start", "xargs", "&", "."]);
const RUNNERS = new Set(["npx", "pnpx", "bunx"]);
const BASENAME_EXT = /\.(exe|cmd|bat|ps1|com|mjs|js|cjs)$/;

function baseName(w) {
  let s = w.replace(/\\/g, "/").split("/").pop() ?? "";
  s = s.replace(/^(@[^/@]+\/)?([^@]+)@.*$/, "$2"); // pkg@latest -> pkg
  return s.toLowerCase().replace(BASENAME_EXT, "");
}

/** Returns { name, args, dynamicName } after stripping env assignments, wrappers and package runners. */
function resolveCommand(words, dyn) {
  let i = 0;
  for (let guard = 0; guard < 12 && i < words.length; guard++) {
    const w = words[i];
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(w) && !dyn[i]) {
      i++;
      continue;
    }
    const b = baseName(w);
    if (WRAPPERS.has(b) || WRAPPERS.has(w)) {
      i++;
      while (i < words.length && (words[i].startsWith("-") || /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i]) || /^\d+[smhd]?$/.test(words[i]))) i++;
      continue;
    }
    if (RUNNERS.has(b) || ((b === "npm" || b === "pnpm" || b === "yarn" || b === "corepack") && /^(exec|dlx|x)$/i.test(words[i + 1] ?? ""))) {
      i += RUNNERS.has(b) ? 1 : 2;
      while (i < words.length && words[i].startsWith("-")) {
        if (/^(-p|--package|--call|-c)$/.test(words[i])) i++;
        i++;
      }
      continue;
    }
    break;
  }
  if (i >= words.length) return { name: "", args: [], argDyn: [], dynamicName: false };
  return { name: baseName(words[i]), args: words.slice(i + 1), argDyn: dyn.slice(i + 1), dynamicName: dyn[i] };
}

/* -------------------------------------------------------------- git helpers */

function findGitDir(startDir) {
  let dir = path.resolve(startDir || process.cwd());
  for (let i = 0; i < 40; i++) {
    const g = path.join(dir, ".git");
    try {
      const st = fs.statSync(g);
      if (st.isDirectory()) return g;
      if (st.isFile()) {
        const m = /^gitdir:\s*(.+)$/m.exec(fs.readFileSync(g, "utf8"));
        if (m) return path.resolve(dir, m[1].trim());
      }
    } catch {
      /* keep walking */
    }
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

function currentBranch(startDir) {
  try {
    const gd = findGitDir(startDir);
    if (!gd) return null;
    const m = /^ref:\s*refs\/heads\/(.+)$/m.exec(fs.readFileSync(path.join(gd, "HEAD"), "utf8"));
    return m ? m[1].trim() : "(detached)";
  } catch {
    return null;
  }
}

const GIT_SUBCOMMANDS_SAFE = new Set(
  "status diff log show add commit branch switch checkout restore fetch pull merge rebase stash worktree tag ls-files rev-parse remote config cherry-pick blame grep describe reflog apply am format-patch mv rm clean reset bisect submodule show-ref ls-tree cat-file check-ignore shortlog diff-tree for-each-ref rev-list merge-base symbolic-ref update-index notes init clone archive count-objects fsck name-rev range-diff hash-object var version help sparse-checkout ls-remote diff-index diff-files difftool mergetool revert show-branch whatchanged verify-commit verify-tag gc prune maintenance restore update-ref bundle push".split(
    /\s+/,
  ),
);

/** Reduce a push refspec to its destination ref name, lowercase, no refs/heads/ prefix. */
function refspecDest(spec) {
  let s = spec.replace(/[<>].*$/, "").replace(/^\+/, "");
  if (s.includes(":")) s = s.slice(s.lastIndexOf(":") + 1);
  s = s.replace(/^refs\/heads\//i, "").replace(/^heads\//i, "").replace(/^origin\//i, "");
  return s.toLowerCase();
}

function classifyGit(args, argDyn, ctx) {
  // strip global options
  let i = 0;
  let dirOpt = null;
  while (i < args.length && args[i].startsWith("-")) {
    const a = args[i];
    if (a === "-C") {
      dirOpt = args[i + 1];
      i += 2;
    } else if (a === "-c" || a === "--exec-path" || a === "--namespace" || a === "--git-dir" || a === "--work-tree" || a === "--super-prefix") {
      if (a === "-c" && /^(alias\.|core\.(hookspath|sshcommand|fsmonitor|pager)|remote\..*\.(push|pushurl|url)|url\..*insteadof|credential)/i.test(args[i + 1] ?? ""))
        (ctx.pending ??= []).push(ask("git-config-override", "git -c overrides alias/hook/remote/credential behaviour; cannot classify safely."));
      i += a.includes("=") ? 1 : 2;
    } else i++;
  }
  const sub = (args[i] ?? "").toLowerCase();
  const rest = args.slice(i + 1);
  const restDyn = argDyn.slice(i + 1);
  const anyDyn = restDyn.some(Boolean) || argDyn[i];
  const results = [];
  const branchDir = dirOpt ? path.resolve(ctx.cwd || process.cwd(), dirOpt) : ctx.cwd;
  const branch = ctx.forcedBranch ?? currentBranch(branchDir);
  const onProtected = branch !== null && PROTECTED_BRANCHES.has(branch.toLowerCase());

  if (!sub) return ALLOW;
  if (argDyn[i]) return ask("git-dynamic-subcommand", "git subcommand is built from a variable or substitution.");
  if (!GIT_SUBCOMMANDS_SAFE.has(sub)) return ask("git-unknown-subcommand", `git '${sub}' is not a recognised subcommand (possible user alias); cannot classify safely.`);

  switch (sub) {
    case "push": {
      const flags = rest.filter((a) => a.startsWith("-"));
      const positional = rest.filter((a) => !a.startsWith("-"));
      if (flags.some((f) => /^--(mirror|all|prune|delete|tags|follow-tags)$/.test(f) || /^-[a-z]*d[a-z]*$/.test(f)))
        return deny("git-push-bulk", "git push --mirror/--all/--prune/--delete is not permitted.");
      if (flags.some((f) => /^--(force|force-with-lease|force-if-includes)(=.*)?$/.test(f) || /^-[a-z]*f[a-z]*$/.test(f)))
        results.push(deny("git-push-force", "Force pushes are not permitted."));
      const hasRepo = flags.some((f) => /^--repo(=|$)/.test(f));
      const specs = hasRepo ? positional : positional.slice(1); // first positional is the remote unless --repo
      for (const spec of specs) {
        const dest = refspecDest(spec);
        const srcless = spec.startsWith(":");
        if (PROTECTED_BRANCHES.has(dest) || dest === "head" && onProtected || srcless && PROTECTED_BRANCHES.has(dest))
          return deny("git-push-main", "Pushing to main/master (including HEAD:main, +main, refs/heads/main, :main) is forbidden. Open a PR from dev.");
        if (/[*?[]/.test(spec)) return deny("git-push-glob", "Wildcard push refspecs are not permitted.");
      }
      if (restDyn.some(Boolean)) return deny("git-push-dynamic", "git push with a variable/substituted remote or refspec cannot be classified; refusing.");
      if (onProtected) return deny("git-push-from-main", "Pushing from main/master is forbidden.");
      if (flags.some((f) => f === "--no-verify" || f === "--repo" || f.startsWith("--receive-pack") || f.startsWith("--exec"))) {
        return deny("git-push-options", "Options that bypass checks or redirect the push are forbidden.");
      }
      if (specs.length === 0 || specs.some((spec) => refspecDest(spec) === "head")) {
        return deny("git-push-implicit", "Specify a remote and an explicit destination branch.");
      }
      const wrongRemote = hasRepo
        ? flags.some((flag) => flag.startsWith("--repo=") && flag !== "--repo=origin")
        : positional[0] !== "origin";
      if (wrongRemote) {
        return deny("git-push-remote", "Pushes must target the configured origin.");
      }
      results.push(ask("git-push", "git push requires explicit user approval."));
      return worst(results);
    }
    case "reset":
      if (rest.some((a) => a === "--hard" || a === "--merge" || a === "--keep")) return deny("git-reset-hard", "git reset --hard/--merge/--keep can destroy other agents' work.");
      if (onProtected) return deny("git-on-main", "Rewriting main/master is forbidden.");
      return ALLOW;
    case "clean":
      if (rest.some((a) => /^-[a-z]*f/.test(a) || a === "--force")) return deny("git-clean", "git clean -f deletes untracked files (possibly other agents' work).");
      return ALLOW;
    case "update-ref":
      if (rest.some((a) => /refs\/heads\/(main|master)$/i.test(a) || PROTECTED_BRANCHES.has(a.toLowerCase())) || onProtected)
        return deny("git-update-ref-main", "Moving main/master refs is forbidden.");
      return ask("git-update-ref", "git update-ref rewrites refs directly.");
    case "branch": {
      const mutating = rest.some((a) => /^(-[a-z]*[dDmMcCf][a-z]*|--delete|--move|--force|--copy)$/.test(a));
      const hitsMain = rest.some((a) => PROTECTED_BRANCHES.has(a.toLowerCase()));
      if (mutating && (hitsMain || onProtected)) return deny("git-branch-main", "Modifying or deleting main/master is forbidden.");
      if (rest.some((a) => /^-[a-z]*D[a-z]*$/.test(a))) return ask("git-branch-force-delete", "Force-deleting a branch can lose unmerged work.");
      return ALLOW;
    }
    case "commit":
    case "merge":
    case "cherry-pick":
    case "am":
    case "rebase":
    case "pull":
    case "revert":
      if (onProtected) return deny("git-on-main", `git ${sub} while main/master is checked out is forbidden (never merge/commit into main).`);
      return ALLOW;
    case "checkout":
    case "switch": {
      const toMain = rest.some((a) => PROTECTED_BRANCHES.has(a.toLowerCase()));
      if (toMain && !rest.includes("--")) ctx.forcedBranch = "main"; // later segments in this command run on main
      if (rest.some((a) => a === "-f" || a === "--force" || a === "--discard-changes")) return ask("git-checkout-force", "Forced checkout discards local changes.");
      if (sub === "checkout" && rest.includes("--") && rest[rest.indexOf("--") + 1] === ".") return ask("git-discard-all", "git checkout -- . discards all working-tree changes.");
      return ALLOW;
    }
    case "restore":
      if (rest.includes(".") && !rest.some((a) => a === "--staged")) return ask("git-discard-all", "git restore . discards all working-tree changes.");
      return ALLOW;
    case "stash":
      if (/^(drop|clear)$/.test(rest[0] ?? "")) return ask("git-stash-drop", "Stash stack is shared with other worktrees/agents.");
      if (rest.length === 0 || /^(push|save|pop|apply)$/.test(rest[0] ?? "")) return ask("git-stash", "The stash stack is shared across worktrees; use a WIP commit instead.");
      return ALLOW;
    case "worktree":
      if (/^(remove|prune|move)$/.test(rest[0] ?? "")) return ask("git-worktree-remove", "Removing a worktree can destroy another agent's work.");
      return ALLOW;
    case "reflog":
    case "gc":
    case "prune":
      if (rest.some((a) => /expire|delete|--prune|now/.test(a))) return ask("git-history-prune", "Irreversibly prunes history.");
      return ALLOW;
    case "config": {
      const joined = rest.join(" ").toLowerCase();
      const writes = !rest.some((a) => /^--(get|get-all|get-regexp|list|show-origin)$|^-l$/.test(a));
      if (writes && /alias\.|hookspath|remote\..*\.(push|pushurl|url)|insteadof|credential|sshcommand|pager|safe\.directory/.test(joined))
        return ask("git-config-write", "Changing git alias/hook/remote/credential config can bypass this gate.");
      return ALLOW;
    }
    case "remote":
      if (/^(add|set-url|remove|rm|rename|set-head)$/.test(rest[0] ?? "")) return ask("git-remote-change", "Changing remotes can redirect pushes.");
      return ALLOW;
    case "clone":
    case "fetch":
    case "ls-remote":
      return ALLOW;
    case "add":
    case "rm":
    case "mv":
      return ALLOW; // secret-path files are caught by the generic path check
    default:
      if (anyDyn && /^(apply|bundle)$/.test(sub)) return ask("git-dynamic", "Dynamic arguments to git cannot be classified.");
      return ALLOW;
  }
}

/* -------------------------------------------------------------- other tools */

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[?::1\]?|host\.docker\.internal|0\.0\.0\.0)$/i;

function classifyUrls(tokens, mutating) {
  const results = [];
  for (const t of tokens) {
    const re = /\b([a-z][a-z0-9+.-]*):\/\/(?:[^\s/@]*@)?([^\s/:?#'"]+)(?::\d+)?/gi;
    let m;
    while ((m = re.exec(t))) {
      const scheme = m[1].toLowerCase();
      const host = m[2].toLowerCase();
      if (LOCAL_HOST.test(host)) continue;
      if (/^(?:api\.stripe\.com|api\.vercel\.com)$/.test(host)) {
        results.push(deny("hosted-api", "Use the project-approved tools for Stripe or Vercel."));
        continue;
      }
      if (host === `${DEV_REF}.supabase.co`) continue;
      if (/(^|\.)(supabase\.(co|com|net)|stripe\.com|api\.vercel\.com)$/.test(host))
        results.push(ask("remote-service-host", `Request to ${host} is not the permitted DEV project; requires approval.`));
      else if (/^postgres(ql)?$/.test(scheme)) results.push(ask("remote-db-url", "Connection to a non-local Postgres host requires approval."));
      else if (mutating) results.push(ask("remote-mutation", `Mutating request to external host ${host} requires approval.`));
    }
  }
  return worst(results);
}

function classifySupabase(args, argDyn) {
  const a = args.map((x) => x.toLowerCase());
  const sub = a.find((x) => !x.startsWith("-")) ?? "";
  const sub2 = a.filter((x) => !x.startsWith("-"))[1] ?? "";
  if (argDyn.some(Boolean)) return ask("supabase-dynamic", "supabase arguments built from variables cannot be classified (project ref may be production).");
  if (sub === "link") {
    return a.includes(DEV_REF) ? ask("supabase-link-dev", "supabase link changes the linked project; requires approval.") : deny("supabase-link", "supabase link without the explicit DEV project ref is refused.");
  }
  if (a.some((x) => /^--(linked|db-url|project-ref|project-id|access-token|password)(=|$)/.test(x)))
    return ask("supabase-remote", "supabase command targets a hosted project (--linked/--db-url/--project-ref); requires approval and DEV identity check.");
  if (sub === "db" && /^(push|pull|dump|remote)$/.test(sub2)) return ask("supabase-db-remote", "supabase db push/pull/dump targets the linked hosted project; requires approval.");
  if (sub === "migration" && /^(repair|up|squash|fetch)$/.test(sub2)) return ask("supabase-migration-remote", "supabase migration repair/up/squash targets a hosted DB; requires approval.");
  if (/^(login|logout|secrets|projects|branches|orgs|domains|vanity-subdomains|sso|backups|network-bans|network-restrictions|ssl-enforcement|postgres-config|storage|config|functions|snippets|services|unlink|inspect)$/.test(sub)) {
    if (sub === "functions" && /^(serve|new)$/.test(sub2)) return ALLOW;
    if (sub === "functions" && sub2 === "download") return ask("supabase-functions-download", "supabase functions download reads the linked hosted project; requires approval and DEV identity check.");
    if (sub === "config" && sub2 === "push") return ask("supabase-config-push", "supabase config push mutates a hosted project.");
    if (sub === "login") return deny("supabase-login", "Interactive/token login is not permitted for agents.");
    return ask("supabase-hosted-admin", `supabase ${sub} manages hosted resources; requires approval.`);
  }
  if (sub === "status" && a.some((x, i) => /^(-o|--output)(=|$)/.test(x) && /env|json|toml|yaml/.test(x.includes("=") ? x : (a[i + 1] ?? "")))) return deny("supabase-status-secrets", "supabase status -o env/json/toml/yaml prints JWT and service-role secrets.");
  if (/^(start|stop|status|init|migration|db|test|gen|help|--version|-v|bootstrap|completion|seed)?$/.test(sub)) return ALLOW;
  return ask("supabase-unknown", `supabase '${sub}' cannot be classified safely.`);
}

function classifyVercel(args, argDyn) {
  const a = args.map((x) => x.toLowerCase());
  if (a.some((x) => x === "--prod" || x === "--production" || /^--target(=|$)/.test(x) && /prod/.test(a.join(" ")) || x === "production"))
    return deny("vercel-prod", "Production deploys/changes are forbidden.");
  if (argDyn.some(Boolean)) return ask("vercel-dynamic", "vercel arguments built from variables cannot be classified.");
  const sub = a.find((x) => !x.startsWith("-")) ?? "";
  if (/^(whoami|ls|list|inspect|help|version)$/.test(sub)) return ALLOW;
  if (a.length === 1 && /^(--version|-v|--help)$/.test(a[0])) return ALLOW;
  return deny("vercel-read-only", "Only Vercel platform inspection commands are permitted.");
}

function classifyGh(args, argDyn) {
  const a = args.map((x) => x.toLowerCase());
  const pos = a.filter((x) => !x.startsWith("-"));
  const [g, s] = pos;
  if (argDyn.some(Boolean)) return ask("gh-dynamic", "gh arguments built from variables cannot be classified.");
  if (g === "pr" && s === "merge") return deny("gh-pr-merge", "Repository owners merge PRs through GitHub after CI and review.");
  if (g === "auth" && /^(token|login|refresh|setup-git)$/.test(s ?? "")) return deny("gh-auth", "Reading or changing GitHub credentials is not permitted.");
  if (g === "api") {
    const mutation = a.some((x, i) =>
      (/^(-x|--method)$/.test(x) && a[i + 1] !== "get") ||
      (/^(?:-x|--method=).+/.test(x) && !/^(-xget|--method=get)$/.test(x)) ||
      /^(-[fF].*|--field(?:=|$)|--raw-field(?:=|$)|--input(?:=|$))/.test(x)
    );
    if (mutation || s === "graphql") return deny("gh-api-write", "Use explicit PR commands for authorized changes; GitHub API mutations are forbidden.");
    if (/secret|credential|artifact|deployment/.test(s ?? "")) return deny("gh-api-sensitive", "This GitHub API endpoint can expose protected data.");
    return ALLOW;
  }
  if (g === "pr" && s === "create") {
    const base = a.flatMap((x, i) => x === "--base" || x === "-b" ? [a[i + 1]] : x.startsWith("--base=") ? [x.slice(7)] : []);
    return base.length === 1 && base[0] === "dev"
      ? ask("gh-pr-create", "Opening a pull request into dev requires user approval.")
      : deny("gh-pr-base", "Specify --base dev when opening a pull request.");
  }
  if (g === "pr" && /^(view|list|checks|diff|status|checkout)$/.test(s ?? "")) return ALLOW;
  if (g === "run" && /^(view|list|watch|download)$/.test(s ?? "")) return ALLOW;
  if (g === "repo" && /^(view|list|clone)$/.test(s ?? "")) return ALLOW;
  if (g === "release" && /^(view|list)$/.test(s ?? "")) return ALLOW;
  if (g === "workflow" && /^(view|list)$/.test(s ?? "")) return ALLOW;
  if (g === "auth" && s === "status") return ALLOW;
  if (!g || /^(status|search|browse|--version|help|version)$/.test(g)) return ALLOW;
  return ask("gh-mutation", `gh ${g} ${s ?? ""} can change remote state; requires approval.`);
}

function classifyStripe(args) {
  const a = args.map((x) => x.toLowerCase());
  if (a.some((x) => x === "--live" || /^--?api-?key(=|$)/.test(x) || x === "login")) return deny("stripe-live", "Stripe live mode, API keys and login are not permitted for agents.");
  const sub = a.find((x) => !x.startsWith("-")) ?? "";
  if (/^(help|version|samples|fixtures)$/.test(sub) || a.length === 1 && /^(--version|-v|--help)$/.test(a[0])) return ALLOW;
  if (/^(listen|trigger)$/.test(sub)) return ask("stripe-test", "Confirm Stripe test mode and synthetic records before proceeding.");
  return ask("stripe-mutation", `stripe ${sub} may change Stripe state; requires approval.`);
}

function classifyNpm(name, args) {
  const a = args.map((x) => x.toLowerCase());
  const sub = a.find((x) => !x.startsWith("-")) ?? "";
  if (/^(publish|unpublish|deprecate|login|logout|adduser|token|access|owner|dist-tag|team|org|set-script)$/.test(sub))
    return ask("npm-registry-write", `${name} ${sub} changes registry state or credentials; requires approval.`);
  if (sub === "run" || sub === "run-script") {
    const script = a.filter((x) => !x.startsWith("-"))[1] ?? "";
    if (/^(migrations:|projection:apply|questions:publish|questions:blueprints-seed|e2e:seed|scoring:bootstrap|content:answer-writer:bootstrap|exam-writer:bootstrap)/.test(script))
      return ask("npm-script-writes-db", `npm run ${script} writes to whichever database .env resolves to; confirm DEV identity first.`);
  }
  return ALLOW;
}

const SECRET_PATH_SAFE = /^(ls|dir|stat|test|\[|\[\[|get-childitem|gci)$/;
const FILE_MUTATION = /^(?:cp|copy|copy-item|mv|move|move-item|rm|del|remove-item|rmdir|mkdir|touch|tee|tee-object|sed|set-content|add-content|out-file|sc|ac|ni|new-item)$/;
const INTERPRETER = /^(?:node|python|python3|py|ruby|perl|deno|bun|tsx)$/;
const VERCEL_READ = /^(?:list_teams|list_projects|list_deployments|get_project|get_deployment|search_documentation)$/;
const PLAYWRIGHT_LOCAL = /^(?:browser_navigate|browser_navigate_back|browser_snapshot|browser_click|browser_type|browser_fill_form|browser_select_option|browser_press_key|browser_hover|browser_resize|browser_take_screenshot|browser_wait_for|browser_close)$/;

function classifySql(args) {
  // libpq defaults, connection strings and override options require review.
  if (args.length === 1 && /^postgres(?:ql)?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\/[\w-]+$/i.test(args[0])) return ALLOW;
  return ask("sql-connection", "Verify the effective connection is local or DEV before using a SQL client.");
}

/* -------------------------------------------------------------- orchestrator */

function evaluateCommand(command, ctx, ps, depth = 0) {
  if (depth > MAX_DEPTH) return ask("nesting-depth", "Command nesting is too deep to classify safely.");
  if (command.length > MAX_COMMAND) return ask("too-long", "Command is too long to classify safely.");

  const results = [];

  // 1. whole-string checks (apply even inside quotes, heredocs and inline code)
  if (mentionsProdRef(command)) return deny("prod-ref", "The production Supabase project reference is strictly off-limits (including quoted, split or reversed forms).");
  if (SECRET_LITERAL.test(command)) results.push(deny("secret-literal", "A credential-shaped literal appears in the command; refusing (value not shown)."));
  if (SECRET_VAR_READ.test(command)) results.push(deny("secret-var-read", "Reading secret-bearing environment variables is not permitted."));
  if (ENV_DUMP.test(command)) results.push(deny("env-dump", "Dumping the environment can expose secrets."));
  if (/\bsupabase\.co\b|pooler\.supabase\.com/i.test(command)) {
    // a hosted endpoint other than DEV is handled by classifyUrls below; bare host strings ask
    if (!command.toLowerCase().includes(DEV_REF) && !/https?:\/\//i.test(command)) results.push(ask("supabase-host-string", "Hosted Supabase host referenced without the explicit DEV ref; requires approval."));
  }

  const body = stripHeredocs(command);
  const { outer, inner } = extractSubstitutions(body);
  for (const sub of inner) results.push(evaluateCommand(sub, ctx, ps, depth + 1));
  const segs = tokenize(outer, ps);

  const sensitiveVerb = /\b(push|merge|deploy|promote|rollback|publish|migrat\w*|prod(uction)?|linked|supabase|vercel|stripe|gh|psql|secret|token)\b/i;

  for (const seg of segs) {
    // bare environment dumps (env, set, export -p, declare -x ...) expose every secret
    {
      const w0 = baseName(seg.words[0]);
      const rest0 = seg.words.slice(1);
      const flagsOnly = rest0.every((x) => x.startsWith("-"));
      if (
        ((w0 === "env" || w0 === "printenv") && flagsOnly) ||
        (w0 === "set" && rest0.length === 0) ||
        (w0 === "export" && (rest0.length === 0 || (rest0.length === 1 && /^-[a-z]*p[a-z]*$/.test(rest0[0])))) ||
        ((w0 === "declare" || w0 === "typeset") && (rest0.length === 0 || (flagsOnly && rest0.some((x) => /^-[a-z]*[px]/.test(x)))))
      )
        results.push(deny("env-dump", "Dumping the environment can expose secrets."));
    }
    const { name, args, argDyn, dynamicName } = resolveCommand(seg.words, seg.dyn);
    if (!name && !dynamicName) continue;

    // recursive deletes aimed at the repository itself or a filesystem root
    if (/^(rm|del|rmdir|rd|remove-item|ri)$/.test(name) && args.some((x) => /^-{1,2}(r|rf|fr|recurse|force)$/i.test(x) || /^\/[sq]$/i.test(x))) {
      if (args.some((x) => /^(\.git\/?|\/|~\/?|\*|\.\/?|\.\.\/?|[A-Za-z]:[\\/]?)$/.test(x)))
        results.push(deny("rm-destructive", "Recursive delete of the repository metadata, working directory or a filesystem root is refused."));
    }
    if (dynamicName) {
      results.push(ask("dynamic-command-name", "The command name is built from a variable or substitution; cannot be classified."));
      continue;
    }
    const joined = args.join(" ");
    const segHasDyn = argDyn.some(Boolean);

    // secret files
    let nextIsRedirectTarget = false;
    for (const arg of args) {
      const redirect = /^(?:\d*)[<>]+(.*)$/.exec(arg);
      const target = nextIsRedirectTarget ? arg : redirect?.[1] || arg.replace(/^.*[<>]/, "");
      const writes = FILE_MUTATION.test(name) || nextIsRedirectTarget || redirect !== null || target !== arg;
      if (writes && isProtectedConfig(target)) {
        results.push(ask("protected-config", "Editing the safety controls or deployment configuration requires approval."));
      }
      if (writes && isSecretPath(target) && !isProjectMcpPath(target, ctx.cwd)) {
        results.push(deny("secret-path", "Redirecting or mutating a credential file is forbidden."));
      }
      if (writes && varsDynamic(target)) results.push(ask("dynamic-path", "Confirm the resolved write destination."));
      nextIsRedirectTarget = Boolean(redirect && !redirect[1]);
    }
    const touchesSecret = [name, ...args].some((w) => isSecretPath(w) && !isProjectMcpPath(w, ctx.cwd));
    if (touchesSecret && !SECRET_PATH_SAFE.test(name)) {
      if (!(name === "git" && /^(status|check-ignore|ls-files|diff --stat)/.test(joined.toLowerCase()))) {
        results.push(deny("secret-path", "Reading, copying or staging credential files (.env*, secrets.json, keys) is not permitted."));
      }
    }

    // inline interpreters / shells
    if (/^(bash|sh|zsh|dash|ksh|fish|wsl|cmd|powershell|pwsh)$/.test(name)) {
      const isPS = name === "powershell" || name === "pwsh";
      const lower = args.map((x) => x.toLowerCase());
      const enc = lower.findIndex((x) => /^-(e|ec|enc|encodedcommand)$/.test(x));
      if (enc !== -1 && args[enc + 1]) {
        try {
          const raw = args[enc + 1];
          const bytes = Buffer.from(raw, "base64");
          if (!raw || bytes.length % 2 || bytes.toString("base64") !== raw) throw new Error("invalid encoding");
          const decoded = bytes.toString("utf16le");
          results.push(evaluateCommand(decoded, ctx, true, depth + 1));
        } catch {
          results.push(ask("encoded-command", "Encoded command could not be decoded."));
        }
        continue;
      }
      const ci = lower.findIndex((x) => (isPS ? /^-(c|command)$/ : name === "cmd" ? /^\/(c|k)$/ : /^-[a-z]*c$/).test(x));
      if (ci !== -1) {
        const innerCmd = args.slice(ci + 1).join(" ");
        results.push(evaluateCommand(innerCmd, ctx, isPS, depth + 1));
      } else if (args.every((x) => /^-[a-z]*$/i.test(x) || x === "-") && name !== "cmd") {
        results.push(ask("shell-stdin", `${name} with no script reads commands from stdin; cannot be classified.`));
      } else {
        results.push(ask("shell-script", "Review the shell script or launcher before executing it."));
      }
      continue;
    }
    if (/^(eval|iex|invoke-expression)$/.test(name)) {
      results.push(ask("eval", `${name} executes a dynamically built string; cannot be classified.`));
      continue;
    }
    if (INTERPRETER.test(name) && !(args.length === 1 && /^(?:--version|-v|-V|--help)$/.test(args[0]))) {
      const testGate = name === "node" && joined === "--test .agents/scripts/safety-gate.test.mjs";
      if (!testGate) results.push(ask("interpreter-code", "Review interpreted code and its inputs before executing it."));
    }
    if (/^(alias|set-alias|new-alias|sal|nal|source|invoke-command|icm|start-process|saps)$/.test(name)) {
      results.push(ask("shell-indirection", "Aliases, shell setup and launchers can change what executes."));
    }
    if (name === "codex" && !/^(--version|-V|login status|--help)$/.test(joined)) {
      results.push(deny("codex-input", "Use the project codex-review skill with a screened snapshot."));
    }
    if (/^(ssh|scp|sftp|rsync)$/.test(name)) results.push(ask("remote-shell", `${name} reaches an external host; requires approval.`));

    // tool classifiers
    switch (name) {
      case "git":
        results.push(classifyGit(args, argDyn, ctx));
        if (ctx.pending) results.push(...ctx.pending.splice(0));
        break;
      case "gh":
        results.push(classifyGh(args, argDyn));
        break;
      case "vercel":
      case "vc":
        results.push(classifyVercel(args, argDyn));
        break;
      case "supabase":
        results.push(classifySupabase(args, argDyn));
        break;
      case "stripe":
        results.push(classifyStripe(args));
        break;
      case "npm":
      case "pnpm":
      case "yarn":
      case "bun":
        results.push(classifyNpm(name, args));
        break;
      case "psql":
      case "pg_dump":
      case "pg_restore":
      case "pgcli":
      case "pg_dumpall":
      case "createdb":
      case "dropdb":
      case "dropuser":
        results.push(classifySql(args));
        break;
      case "curl":
      case "wget":
      case "http":
      case "https":
      case "iwr":
      case "irm":
      case "invoke-webrequest":
      case "invoke-restmethod": {
        const mutating = args.some((x) => /^(-x(post|put|patch|delete)|--request=(post|put|patch|delete))$/i.test(x)) ||
          args.some((x) => /^(-x|--request|-method)$/i.test(x) && /^(post|put|patch|delete)$/i.test(args[args.indexOf(x) + 1] ?? "")) ||
          args.some((x) => /^(-d|--data.*|-f|--form|-t|--upload-file|-body|--json)$/i.test(x));
        results.push(classifyUrls(args, mutating));
        break;
      }
      default:
        if (!/^(set|export|echo|write-output|printf|pwd|get-location|cd|set-location|ls|dir|get-childitem|gci|cat|type|get-content|gc|grep|rg|find|head|tail|sort|wc|stat|test|\[|\[\[|mkdir|touch|cp|copy-item|mv|move-item|rm|del|remove-item|rmdir|node|python|python3|py|codex|true|false)$/.test(name)) {
          results.push(ask("unknown-command", "Confirm the executable and its effect before using a command outside the normal development tool set."));
        }
        break;
    }

    // indirect references: dynamic arguments to a sensitive tool, or a sensitive verb with a dynamic arg
    if (segHasDyn && /^(git|gh|vercel|vc|supabase|stripe|psql|pg_dump|curl|wget|iwr|irm|npm|pnpm|yarn|node|python|python3|bash|sh)$/.test(name) && sensitiveVerb.test(joined)) {
      results.push(ask("dynamic-args", "Sensitive command has variable/substituted arguments (indirect reference); cannot be classified."));
    }
  }

  return worst(results);
}

function evaluatePathTool(toolName, input, cwd) {
  const results = [];
  const keys = ["file_path", "path", "notebook_path", "glob", "pattern", "TargetFile", "AbsolutePath", "SearchPath", "DirectoryPath", "target_file"];
  const writeTool = /^(edit|write|multiedit|notebookedit|write_to_file|replace_in_file|replace_file_content|multi_replace_file_content|apply_patch)$/i.test(toolName);
  for (const k of keys) {
    const v = input?.[k];
    if (typeof v !== "string" || !v) continue;
    if (mentionsProdRef(v)) results.push(deny("prod-ref", "Production Supabase reference in a path argument."));
    if (k !== "pattern" && isSecretPath(v) && !isProjectMcpPath(v, cwd)) results.push(deny("secret-path", "Credential files (.env*, secrets.json, keys) cannot be read or written by agents."));
    if (writeTool && isProtectedConfig(v)) results.push(ask("protected-config", "Editing the safety controls themselves requires approval."));
  }
  return worst(results);
}

function evaluateMcp(tool, input) {
  const [, server, operation] = tool.split("__");
  if (server === "claude_ai_Vercel") {
    if (!VERCEL_READ.test(operation)) return deny("mcp-vercel-read-only", "Only allowlisted Vercel read operations are permitted.");
  } else if (server === "mindmosaic-playwright") {
    if (!PLAYWRIGHT_LOCAL.test(operation)) return deny("mcp-playwright-local", "Only reviewed browser operations on a local fixture are permitted.");
    if (operation === "browser_navigate" &&
      (typeof input.url !== "string" || !/^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(input.url))) {
      return deny("mcp-playwright-local", "Use Playwright against a local app with synthetic data.");
    }
  } else if (server !== "mindmosaic-context7" || !/^(?:resolve-library-id|query-docs)$/.test(operation)) {
    return deny("mcp-unapproved", "This connector or operation is outside the MindMosaic project policy.");
  }
  let text;
  try {
    text = JSON.stringify(input ?? {});
  } catch {
    return deny("mcp-unserialisable", "MCP tool input could not be inspected.");
  }
  if (mentionsProdRef(text)) return deny("prod-ref", "Production Supabase reference in MCP tool arguments.");
  if (SECRET_LITERAL.test(text)) return deny("secret-literal", "Credential-shaped literal in MCP tool arguments (value not shown).");
  return ALLOW;
}

/* --------------------------------------------------------------- entrypoint */

function parsePayload(raw) {
  const p = JSON.parse(raw);
  if (!p || typeof p !== "object" || Array.isArray(p)) throw new Error("payload is not an object");
  if (typeof p.tool_name === "string" && p.tool_input && typeof p.tool_input === "object") {
    return { kind: "claude", tool: p.tool_name, input: p.tool_input, cwd: typeof p.cwd === "string" ? p.cwd : undefined };
  }
  if (p.toolCall && typeof p.toolCall === "object" && typeof p.toolCall.name === "string" && p.toolCall.args && typeof p.toolCall.args === "object") {
    const a = p.toolCall.args;
    return { kind: "agy", tool: p.toolCall.name, input: a, cwd: typeof a.Cwd === "string" ? a.Cwd : Array.isArray(p.workspacePaths) ? p.workspacePaths[0] : undefined };
  }
  if (p.preToolUse && typeof p.preToolUse === "object" && typeof p.preToolUse.toolName === "string") {
    const params = p.preToolUse.parameters && typeof p.preToolUse.parameters === "object" ? p.preToolUse.parameters : {};
    return { kind: "cline", tool: p.preToolUse.toolName, input: params, cwd: undefined };
  }
  throw new Error("unrecognised hook payload shape");
}

function decide(p) {
  const t = p.tool;
  const ctx = { cwd: p.cwd, forcedBranch: null };
  const isShell = p.kind === "claude" ? /^(bash|powershell)$/i.test(t) : p.kind === "cline" ? /^execute_command$/i.test(t) : /^run_command$/i.test(t);
  if (isShell) {
    const cmd = p.kind === "agy" ? p.input.CommandLine : p.input.command;
    if (typeof cmd !== "string" || cmd.trim() === "") return deny("malformed-command", "Shell tool call has no command string.");
    return evaluateCommand(cmd, ctx, /^powershell$/i.test(t) || p.kind === "cline"); // Cline on Windows runs PowerShell
  }
  if (/^mcp__/i.test(t)) return evaluateMcp(t, p.input);
  if (/^skill$/i.test(t) && /^codex:/i.test(p.input.skill ?? "")) {
    return deny("codex-invocation", "Use the human-invoked /codex-review skill and screened snapshot.");
  }
  if (/^webfetch$/i.test(t) && /(?:supabase\.co|vercel\.com\/api|api\.stripe\.com)/i.test(p.input.url ?? "")) {
    return deny("web-sensitive-endpoint", "Use the authorized development workflow for hosted endpoints.");
  }
  return evaluatePathTool(t, p.input, p.cwd);
}

function render(kind, d) {
  if (kind === "cline") return JSON.stringify({ cancel: d.decision !== "allow", contextModification: "", errorMessage: d.decision === "allow" ? "" : d.reason });
  if (kind === "agy") {
    const decision = d.decision === "ask" ? "force_ask" : d.decision;
    return JSON.stringify(d.decision === "allow" ? { decision } : { decision, reason: d.reason });
  }
  if (d.decision === "allow") return ""; // no decision: normal permission flow still applies
  return JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: d.decision, permissionDecisionReason: d.reason },
  });
}

function audit(kind, tool, d) {
  const file = process.env.MM_SAFETY_GATE_LOG;
  if (!file) return;
  try {
    fs.appendFileSync(file, JSON.stringify({ ts: new Date().toISOString(), kind, tool, decision: d.decision, rule: d.rule }) + "\n");
  } catch {
    /* logging must never change the decision */
  }
}

function failClosed(why) {
  const reason = `MindMosaic safety gate [fail-closed]: ${why}`;
  process.stderr.write(reason + "\n");
  // Print both dialects so whichever host runs us sees a deny; exit 2 is Claude Code's blocking code.
  process.stdout.write(
    JSON.stringify({
      decision: "deny",
      reason,
      cancel: true,
      errorMessage: reason,
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
    }),
  );
  process.exit(2);
}

function main() {
  let raw;
  try {
    raw = fs.readFileSync(0, "utf8");
  } catch (e) {
    return failClosed(`could not read hook input (${e?.code ?? "error"})`);
  }
  if (!raw || !raw.trim()) return failClosed("empty hook input");
  if (raw.length > MAX_INPUT) return failClosed("hook input too large");
  let p;
  try {
    p = parsePayload(raw);
  } catch {
    return failClosed("malformed hook input");
  }
  let d;
  try {
    d = decide(p);
  } catch {
    return failClosed("internal error while classifying");
  }
  audit(p.kind, p.tool, d);
  const out = render(p.kind, d);
  if (out) process.stdout.write(out);
  if (d.decision === "deny") process.stderr.write(d.reason + "\n");
  process.exit(0);
}

if (process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase()) main();

export { evaluateCommand, decide, parsePayload, render };
