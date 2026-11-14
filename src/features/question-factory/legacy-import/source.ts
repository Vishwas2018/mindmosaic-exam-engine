import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { gitSourceSchema } from "../provenance/legacy-import";
import type { z } from "zod";

export type GitSource = z.infer<typeof gitSourceSchema>;
export interface LegacySourceReader { read(source: GitSource): Promise<Buffer> }
export const sha256 = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");

/** Reads immutable Git objects only. Never reads working-tree content or executes source files. */
export class GitLegacySourceReader implements LegacySourceReader {
  private readonly cache = new Map<string, Buffer>();
  private readonly commits = new Set<string>();
  private originRepository: string | undefined;
  constructor(private readonly repositoryRoot: string) {}
  async read(untrusted: GitSource): Promise<Buffer> {
    const source = gitSourceSchema.parse(untrusted);
    const cacheKey = JSON.stringify(source);
    const cached = this.cache.get(cacheKey);
    if (cached) return Buffer.from(cached);
    const git = (...args: string[]) => execFileSync("git", ["-C", this.repositoryRoot, ...args], { stdio: ["ignore", "pipe", "ignore"] });
    if (!this.originRepository) {
      const remote = git("config", "--get", "remote.origin.url").toString("utf8").trim();
      const match = /^(?:https:\/\/github\.com\/|git@github\.com:)([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?$/.exec(remote);
      if (!match) throw new Error("unsupported_source_repository");
      this.originRepository = match[1].toLowerCase();
    }
    if (this.originRepository !== source.repository.toLowerCase()) throw new Error("source_repository_mismatch");
    if (!this.commits.has(source.commit)) {
      if (git("cat-file", "-t", source.commit).toString("utf8").trim() !== "commit") throw new Error("source_commit_mismatch");
      this.commits.add(source.commit);
    }
    const bytes = git("cat-file", "blob", `${source.commit}:${source.path}`);
    const blob = createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
    if (blob !== source.blob) throw new Error("source_blob_mismatch");
    if (sha256(bytes) !== source.sha256) throw new Error("source_sha256_mismatch");
    this.cache.set(cacheKey, Buffer.from(bytes));
    return bytes;
  }
}
