#!/usr/bin/env node
/**
 * Generates the credentials for the DEDICATED synthetic manual-testing Parent and stores them outside the repository.
 *
 *   node scripts/hosted-acceptance/prepare-manual-credentials.mjs [--rotate] [--dir <folder>]
 *
 * - Writes <dir>/manual-family.env (default C:/tmp/manual-family) with MANUAL_PARENT_EMAIL, MANUAL_PARENT_PASSWORD,
 *   MANUAL_PIN_1, MANUAL_PIN_2. Random, CSPRNG-generated. The file is restricted to the current OS user (icacls on
 *   Windows, chmod 600 elsewhere). Nothing is printed except the file path; nothing touches Supabase.
 * - Refuses to overwrite an existing file unless --rotate is given (a rotation then needs the seed to be re-run with
 *   MANUAL_ALLOW_PASSWORD_RESET=1 so an existing account's password is only ever changed on purpose).
 * - The account is a synthetic `mm-manual-*@example.com` identity. It is never the owner's personal account.
 *
 * Use it:  node --env-file=<dir>/manual-family.env scripts/hosted-acceptance/run.mjs <preview-url> -- e2e/hosted/m-manual-test-family.spec.ts
 *          (with HOSTED_SEED_MANUAL=1).  The generated file is never committed (it lives outside the repository).
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const rotate = args.includes("--rotate");
const dirIdx = args.indexOf("--dir");
const dir = path.resolve(dirIdx === -1 ? "C:/tmp/manual-family" : args[dirIdx + 1]);
const repoRoot = path.resolve(".");
if (dir.startsWith(repoRoot + path.sep) || dir === repoRoot) {
  console.error("ABORT: the credential folder must be outside the repository");
  process.exit(2);
}
const file = path.join(dir, "manual-family.env");
if (fs.existsSync(file) && !rotate) {
  console.error(`Credential file already exists: ${file}\nRe-run with --rotate to replace it (existing credentials will stop matching the DEV account until re-seeded).`);
  process.exit(3);
}

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const randomString = (n) => Array.from(crypto.randomBytes(n), (b) => alphabet[b % alphabet.length]).join("");
const sixDigits = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
// 24 random chars plus one of each class so password policy checks (upper, lower, digit, symbol) always pass.
const password = `${randomString(24)}-Aa9!`;

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
  file,
  [
    "# DEV manual-testing synthetic Parent. Secret. Never commit, paste or share in chat.",
    "MANUAL_PARENT_EMAIL=mm-manual-beta-parent@example.com",
    `MANUAL_PARENT_PASSWORD=${password}`,
    `MANUAL_PIN_1=${sixDigits()}`,
    `MANUAL_PIN_2=${sixDigits()}`,
    "",
  ].join("\n"),
  { mode: 0o600 },
);
try {
  if (process.platform === "win32") {
    const user = process.env.USERNAME;
    execFileSync("icacls", [file, "/inheritance:r", "/grant:r", `${user}:F`], { stdio: "ignore" });
  } else {
    fs.chmodSync(file, 0o600);
  }
} catch {
  console.error("WARNING: could not restrict file permissions; restrict it manually.");
}
console.log(`Wrote ${file} (values not shown). Open it yourself to read the Parent password.`);
