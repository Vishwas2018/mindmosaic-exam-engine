import { lstat, realpath } from "node:fs/promises";
import { dirname, join } from "node:path";

export async function privatePath(input: string): Promise<string> {
  const actual = await realpath(input);
  for (let current = actual; ; current = dirname(current)) {
    const gitEntry = await lstat(join(current, ".git")).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
      return null;
    });
    if (gitEntry) throw new Error("Git worktrees are prohibited as private input locations");
    if (dirname(current) === current) break;
  }
  return actual;
}
