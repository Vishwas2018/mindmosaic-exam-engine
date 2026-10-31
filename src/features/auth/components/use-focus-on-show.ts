import { useEffect, useRef } from "react";

/**
 * Moves keyboard and screen-reader focus to an element when a screen swaps to a state the user did not ask for
 * (an expired link, a failed verification). Without it focus stays on <body> and the new heading is never announced.
 * The element needs tabIndex={-1} so it can take programmatic focus without joining the Tab order.
 */
export function useFocusOnShow<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (active) ref.current?.focus();
  }, [active]);
  return ref;
}
