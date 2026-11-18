import { useEffect, useRef } from "react";

/**
 * Moves keyboard and screen-reader focus to an element when a screen swaps to a state the user did not ask for
 * (an expired link, a failed verification, or an error alert).
 * Without it, focus stays on <body> and the new heading/message is never announced.
 * The element needs tabIndex={-1} so it can take programmatic focus without joining the Tab order.
 * Focuses once per active activation so subsequent typing does not lose focus.
 */
export function useFocusOnShow<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);
  const hasFocused = useRef(false);

  useEffect(() => {
    if (active && !hasFocused.current) {
      ref.current?.focus();
      hasFocused.current = true;
    }
    if (!active) {
      hasFocused.current = false;
    }
  }, [active]);

  return ref;
}
