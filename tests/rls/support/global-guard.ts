import { assertSingleLocalTarget } from "./db-target";

/**
 * vitest `globalSetup` for the RLS project. Runs once, in the parent process, before any worker starts and so
 * before any test file is even loaded. It only parses URLs; a bad target stops the whole run with a clear message
 * and an exit code that vitest reports as a failure.
 */
export default function setup(): void {
  const target = assertSingleLocalTarget();
  console.log(`RLS database target: ${target.host}:${target.port} (all database variables agree, all local)`);
}
