/**
 * Rejects any absolute local path or path-traversal attempt in
 * `sourcePath`. Provenance must record a repository-relative or otherwise
 * sanitised source identifier — never an absolute local user path (per the
 * Mission 2 unsafe-content report's private-path finding).
 */
const WINDOWS_ABSOLUTE_PATH = /^[A-Za-z]:[\\/]/;
const POSIX_ABSOLUTE_PATH = /^\//;
const UNC_PATH = /^\\\\/;

export function isAbsoluteOrUnsafeSourcePath(sourcePath: string): boolean {
  if (sourcePath.trim().length === 0) return true;
  if (WINDOWS_ABSOLUTE_PATH.test(sourcePath)) return true;
  if (UNC_PATH.test(sourcePath)) return true;
  if (POSIX_ABSOLUTE_PATH.test(sourcePath)) return true;
  const segments = sourcePath.split(/[\\/]/);
  if (segments.some((segment) => segment === "..")) return true;
  return false;
}
