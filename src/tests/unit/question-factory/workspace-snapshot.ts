/**
 * Shared test utility: a COMPLETE, link-safe recursive workspace snapshot.
 *
 * Uses `lstat` (never `stat`) so links are captured as links rather than
 * silently followed, and records for every entry:
 * - `D <path> m<mode>`               — real directories (including empty
 *                                       and hidden ones such as `.locks`,
 *                                       `.processing`, `.quarantine-reports`);
 * - `F <path> <sha256> m<mode>`      — regular files with their exact bytes;
 * - `L <path> -> <target> m<mode>`   — symbolic links AND Windows junctions
 *                                       (Node exposes junctions as symlinks
 *                                       to `lstat`), with the `readlink`
 *                                       target; never followed, so a link
 *                                       into a parent directory can neither
 *                                       loop the walk nor let it escape the
 *                                       workspace roots;
 * - `O <path> m<mode>`               — any other entry kind (fifo, socket…).
 *
 * The entry-type letter plus mode makes replacement of a link by a file or
 * directory (or vice versa) visible even when names are unchanged.
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export async function snapshotWorkspace(roots: readonly string[]): Promise<string> {
  const lines: string[] = [];

  async function walk(dir: string): Promise<void> {
    let names: string[];
    try {
      names = await fs.readdir(dir);
    } catch {
      return; // root does not exist (yet) — recorded by its absence
    }
    for (const name of names.sort()) {
      const fullPath = path.join(dir, name);
      const stats = await fs.lstat(fullPath);
      const mode = `m${(stats.mode & 0o777).toString(8)}`;
      if (stats.isSymbolicLink()) {
        let target = "<unreadable>";
        try {
          target = await fs.readlink(fullPath);
        } catch {
          // keep the sentinel — the entry itself is still recorded
        }
        lines.push(`L ${fullPath} -> ${target} ${mode}`);
        continue; // never follow links
      }
      if (stats.isDirectory()) {
        lines.push(`D ${fullPath} ${mode}`);
        await walk(fullPath);
        continue;
      }
      if (stats.isFile()) {
        const digest = createHash("sha256").update(await fs.readFile(fullPath)).digest("hex");
        lines.push(`F ${fullPath} ${digest} ${mode}`);
        continue;
      }
      lines.push(`O ${fullPath} ${mode}`);
    }
  }

  for (const root of roots) {
    // The root line itself, so a root that appears/disappears is visible.
    try {
      const stats = await fs.lstat(root);
      lines.push(`R ${root} ${stats.isDirectory() ? "dir" : "other"}`);
    } catch {
      lines.push(`R ${root} absent`);
      continue;
    }
    await walk(root);
  }
  return lines.join("\n");
}
