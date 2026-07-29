import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OfflineStatusPill } from "@/features/offline";
import { useOfflineQueue } from "@/features/offline/useOfflineQueue";

describe("OfflineStatusPill", () => {
  it("renders a distinct label per status", () => {
    const { rerender } = render(<OfflineStatusPill status="online" />);
    expect(screen.getByRole("status")).toHaveTextContent("Online");

    rerender(<OfflineStatusPill status="offline" pendingCount={2} />);
    expect(screen.getByRole("status")).toHaveTextContent("Offline — 2 answers waiting to sync");

    rerender(<OfflineStatusPill status="syncing" />);
    expect(screen.getByRole("status")).toHaveTextContent("Syncing");

    rerender(<OfflineStatusPill status="synced" />);
    expect(screen.getByRole("status")).toHaveTextContent("All answers synced");
  });
});

describe("useOfflineQueue", () => {
  function setup(overrides: Partial<Parameters<typeof useOfflineQueue>[0]> = {}) {
    let online = true;
    let connectivityListener: ((online: boolean) => void) | null = null;
    const syncItem = vi.fn(async () => {});

    const hook = renderHook(() =>
      useOfflineQueue<{ answer: string }>({
        syncItem,
        getIsOnline: () => online,
        subscribeToConnectivity: (onChange) => {
          connectivityListener = onChange;
          return () => {
            connectivityListener = null;
          };
        },
        ...overrides,
      }),
    );

    return {
      hook,
      syncItem,
      setOnline: (value: boolean) => {
        online = value;
      },
      triggerConnectivityChange: (value: boolean) => connectivityListener?.(value),
    };
  }

  it("starts online when getIsOnline reports true", () => {
    const { hook } = setup();
    expect(hook.result.current.status).toBe("online");
    expect(hook.result.current.pendingCount).toBe(0);
  });

  it("enqueues an item and flushes it successfully when online", async () => {
    const { hook, syncItem } = setup();

    act(() => {
      hook.result.current.enqueue({ answer: "42" });
    });
    expect(hook.result.current.pendingCount).toBe(1);

    await act(async () => {
      await hook.result.current.flush();
    });

    expect(syncItem).toHaveBeenCalledTimes(1);
    expect(hook.result.current.queue).toHaveLength(0);
    expect(hook.result.current.status).toBe("synced");
  });

  it("keeps a failed item queued and reports a non-synced status", async () => {
    const syncItem = vi.fn(async () => {
      throw new Error("network down");
    });
    const { hook } = setup({ syncItem });

    act(() => {
      hook.result.current.enqueue({ answer: "42" });
    });
    await act(async () => {
      await hook.result.current.flush();
    });

    expect(hook.result.current.queue).toHaveLength(1);
    expect(hook.result.current.queue[0].status).toBe("failed");
    expect(hook.result.current.status).toBe("online");
  });

  it("does not attempt to sync while offline", async () => {
    const { hook, syncItem, setOnline } = setup();
    setOnline(false);

    act(() => {
      hook.result.current.enqueue({ answer: "42" });
    });
    await act(async () => {
      await hook.result.current.flush();
    });

    expect(syncItem).not.toHaveBeenCalled();
    expect(hook.result.current.status).toBe("offline");
    expect(hook.result.current.pendingCount).toBe(1);
  });

  it("auto-flushes queued items when connectivity is regained", async () => {
    const { hook, syncItem, setOnline, triggerConnectivityChange } = setup();
    setOnline(false);

    act(() => {
      hook.result.current.enqueue({ answer: "offline-answer" });
    });

    setOnline(true);
    act(() => {
      triggerConnectivityChange(true);
    });

    await waitFor(() => expect(syncItem).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(hook.result.current.queue).toHaveLength(0));
  });

  it("retries a single failed item on demand", async () => {
    let shouldFail = true;
    const syncItem = vi.fn(async () => {
      if (shouldFail) throw new Error("still down");
    });
    const { hook } = setup({ syncItem });

    act(() => {
      hook.result.current.enqueue({ answer: "retry-me" });
    });
    await act(async () => {
      await hook.result.current.flush();
    });
    expect(hook.result.current.queue[0].status).toBe("failed");

    shouldFail = false;
    const id = hook.result.current.queue[0].id;
    await act(async () => {
      await hook.result.current.retry(id);
    });

    expect(hook.result.current.queue).toHaveLength(0);
    expect(hook.result.current.status).toBe("synced");
  });
});
