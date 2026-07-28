"use client";

import { useCallback, useState } from "react";

import { preventDuplicateActiveSession } from "./guard";
import type { ActiveSession } from "./types";

export interface UseActiveSessionOptions {
  onResume: () => void;
  onAbandon: () => void;
}

export interface UseActiveSessionResult {
  canStartNewSession: boolean;
  isAbandonConfirmOpen: boolean;
  resume: () => void;
  requestAbandon: () => void;
  confirmAbandon: () => void;
  cancelAbandon: () => void;
}

export function useActiveSession(
  session: ActiveSession | null | undefined,
  { onResume, onAbandon }: UseActiveSessionOptions,
): UseActiveSessionResult {
  const [isAbandonConfirmOpen, setAbandonConfirmOpen] = useState(false);

  const resume = useCallback(() => {
    onResume();
  }, [onResume]);

  const requestAbandon = useCallback(() => {
    setAbandonConfirmOpen(true);
  }, []);

  const cancelAbandon = useCallback(() => {
    setAbandonConfirmOpen(false);
  }, []);

  const confirmAbandon = useCallback(() => {
    setAbandonConfirmOpen(false);
    onAbandon();
  }, [onAbandon]);

  return {
    canStartNewSession: preventDuplicateActiveSession(session),
    isAbandonConfirmOpen,
    resume,
    requestAbandon,
    confirmAbandon,
    cancelAbandon,
  };
}
