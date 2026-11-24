import { MemoryGuardStore, type GuardStore } from "@/lib/security/guard-store";

/** A memory store that presents itself as the shared (Redis) store, so hosted fail-closed rules are satisfied. */
export function sharedMemoryStore(clock?: () => number): GuardStore & { reset(): void } {
  const inner = new MemoryGuardStore(clock);
  return Object.assign(Object.create(inner) as MemoryGuardStore, { kind: "redis" as unknown as "memory" }) as unknown as GuardStore & { reset(): void };
}

/** A shared store whose every command fails, as during a Redis outage. */
export function downStore(): GuardStore {
  const fail = async () => { throw new Error("guard store unavailable"); };
  return { kind: "redis", hit: fail, claim: fail, get: fail };
}
