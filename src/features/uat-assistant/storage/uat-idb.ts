import {
  mergeImportedIssues,
  type UatDraftState,
  type UatIssue,
  type UatTestSession,
} from "./storage-types";

const DB_NAME = "mindmosaic_uat_assistant_v1";
const DB_VERSION = 1;
const STORE_ISSUES = "issues";
const STORE_DRAFTS = "drafts";
const STORE_META = "meta";
const ACTIVE_SESSION_KEY = "active-test-session";
const CHANGE_EVENT = "mm-uat-issues-changed";

// In-memory fallback used only in environments where IndexedDB is unavailable (e.g. certain headless unit harnesses).
const memoryIssues = new Map<string, UatIssue>();
let memoryDraft: UatDraftState | null = null;
let memorySession: UatTestSession | null = null;

function isIndexedDbSupported(): boolean {
  return typeof indexedDB !== "undefined" && indexedDB !== null;
}

function emitChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
  if (typeof BroadcastChannel !== "undefined") {
    try {
      const channel = new BroadcastChannel(CHANGE_EVENT);
      channel.postMessage({ updatedAt: Date.now() });
      channel.close();
    } catch {
      // Ignore BroadcastChannel unavailability in restricted sandboxes.
    }
  }
}

export function subscribeToUatStoreChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(CHANGE_EVENT, handler);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    try {
      channel = new BroadcastChannel(CHANGE_EVENT);
      channel.onmessage = handler;
    } catch {
      channel = null;
    }
  }

  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    channel?.close();
  };
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_ISSUES)) {
          const issuesStore = db.createObjectStore(STORE_ISSUES, { keyPath: "id" });
          issuesStore.createIndex("status", "status", { unique: false });
          issuesStore.createIndex("createdAt", "createdAt", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
          db.createObjectStore(STORE_DRAFTS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error ?? new Error("Failed to open IndexedDB"));
      };
    } catch (err) {
      dbPromise = null;
      reject(err);
    }
  });
  return dbPromise;
}

function runTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  op: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = op(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error(`IndexedDB ${storeName} operation failed`));
      }),
  );
}

export async function listUatIssues(): Promise<UatIssue[]> {
  if (!isIndexedDbSupported()) {
    return Array.from(memoryIssues.values()).sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  }
  try {
    const items = await runTx<UatIssue[]>(STORE_ISSUES, "readonly", (store) => store.getAll());
    return [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    return Array.from(memoryIssues.values()).sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  }
}

export async function getUatIssue(id: string): Promise<UatIssue | null> {
  if (!isIndexedDbSupported()) {
    return memoryIssues.get(id) ?? null;
  }
  try {
    const found = await runTx<UatIssue | undefined>(STORE_ISSUES, "readonly", (store) => store.get(id));
    return found ?? null;
  } catch {
    return memoryIssues.get(id) ?? null;
  }
}

export async function saveUatIssue(issue: UatIssue): Promise<void> {
  memoryIssues.set(issue.id, issue);
  if (isIndexedDbSupported()) {
    try {
      await runTx(STORE_ISSUES, "readwrite", (store) => store.put(issue));
    } catch {
      // Memory fallback already holds the item so current session work is safe.
    }
  }
  emitChange();
}

export async function deleteUatIssue(id: string): Promise<void> {
  memoryIssues.delete(id);
  if (isIndexedDbSupported()) {
    try {
      await runTx(STORE_ISSUES, "readwrite", (store) => store.delete(id));
    } catch {
      // Ignore if IndexedDB write unavailable.
    }
  }
  emitChange();
}

export async function importUatIssues(
  incoming: readonly UatIssue[],
): Promise<{ total: number; added: number; updated: number }> {
  const existing = await listUatIssues();
  const { merged, added, updated } = mergeImportedIssues(existing, incoming);

  memoryIssues.clear();
  for (const item of merged) {
    memoryIssues.set(item.id, item);
  }

  if (isIndexedDbSupported()) {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_ISSUES, "readwrite");
        const store = tx.objectStore(STORE_ISSUES);
        for (const item of merged) {
          store.put(item);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("Failed to import issues into IndexedDB"));
      });
    } catch {
      // Memory fallback already updated.
    }
  }

  emitChange();
  return { total: merged.length, added, updated };
}

export async function getUatDraft(): Promise<UatDraftState | null> {
  if (!isIndexedDbSupported()) return memoryDraft;
  try {
    const draft = await runTx<UatDraftState | undefined>(STORE_DRAFTS, "readonly", (store) =>
      store.get("active-draft"),
    );
    return draft ?? null;
  } catch {
    return memoryDraft;
  }
}

export async function saveUatDraft(draft: UatDraftState): Promise<void> {
  memoryDraft = draft;
  if (isIndexedDbSupported()) {
    try {
      await runTx(STORE_DRAFTS, "readwrite", (store) => store.put(draft));
    } catch {
      // Ignore fallback.
    }
  }
}

export async function clearUatDraft(): Promise<void> {
  memoryDraft = null;
  if (isIndexedDbSupported()) {
    try {
      await runTx(STORE_DRAFTS, "readwrite", (store) => store.delete("active-draft"));
    } catch {
      // Ignore fallback.
    }
  }
}

function createFreshSession(customLabel?: string): UatTestSession {
  const now = new Date();
  const dateCompact = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const id = `UAT-${dateCompact}-${suffix}`;
  const label =
    customLabel?.trim() ||
    `DEV Pass · ${now.toLocaleDateString("en-AU", { day: "2-digit", month: "short" })} ${now.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  return { id, label, startedAt: now.toISOString() };
}

export async function getOrCreateUatTestSession(): Promise<UatTestSession> {
  if (!isIndexedDbSupported()) {
    if (!memorySession) memorySession = createFreshSession();
    return memorySession;
  }
  try {
    const record = await runTx<{ key: string; session: UatTestSession } | undefined>(
      STORE_META,
      "readonly",
      (store) => store.get(ACTIVE_SESSION_KEY),
    );
    if (record?.session) {
      memorySession = record.session;
      return record.session;
    }
    const created = createFreshSession();
    memorySession = created;
    await runTx(STORE_META, "readwrite", (store) => store.put({ key: ACTIVE_SESSION_KEY, session: created }));
    return created;
  } catch {
    if (!memorySession) memorySession = createFreshSession();
    return memorySession;
  }
}

export async function startNewUatTestSession(label?: string): Promise<UatTestSession> {
  const created = createFreshSession(label);
  memorySession = created;
  if (isIndexedDbSupported()) {
    try {
      await runTx(STORE_META, "readwrite", (store) =>
        store.put({ key: ACTIVE_SESSION_KEY, session: created }),
      );
    } catch {
      // Memory fallback holds session.
    }
  }
  emitChange();
  return created;
}

/** Used in unit tests to reset fallback state cleanly between cases. */
export async function resetUatStoreForTests(): Promise<void> {
  memoryIssues.clear();
  memoryDraft = null;
  memorySession = null;
  if (isIndexedDbSupported()) {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve) => {
        const tx = db.transaction([STORE_ISSUES, STORE_DRAFTS, STORE_META], "readwrite");
        tx.objectStore(STORE_ISSUES).clear();
        tx.objectStore(STORE_DRAFTS).clear();
        tx.objectStore(STORE_META).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // Ignore if unavailable.
    }
  }
}
