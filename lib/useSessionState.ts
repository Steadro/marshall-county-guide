import { useCallback, useSyncExternalStore } from "react";

/**
 * useState backed by sessionStorage, restored **synchronously** on mount.
 *
 * Why synchronous: when a user clicks into a collection page and hits Back, the
 * homepage's browse component re-mounts client-side. If it came back with its
 * default tab, the pane would change height and the browser's scroll restoration
 * would land at the wrong pixel ("before the section"). On a client-side mount
 * useSyncExternalStore reads the saved value in the first render, so scroll
 * restoration lands where the user left off.
 *
 * On a full page load it hydrates with `fallback` (what the server rendered) and
 * then switches to the saved value, so there's no hydration mismatch.
 *
 * Scoped to the tab session (sessionStorage), so it persists across in-session
 * navigation but a brand-new visit starts on the default. Falls back to memory
 * when storage is blocked (private mode, disabled cookies).
 */
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readStored(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

export function useSessionState<T extends string>(
  key: string,
  fallback: T,
  isValid?: (v: string) => boolean,
) {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      const saved = readStored(key);
      return saved && (!isValid || isValid(saved)) ? (saved as T) : fallback;
    },
    () => fallback,
  );

  const set = useCallback(
    (v: T) => {
      memory.set(key, v);
      try {
        window.sessionStorage.setItem(key, v);
      } catch {
        // storage blocked: the in-memory copy still drives this session
      }
      listeners.forEach((l) => l());
    },
    [key],
  );

  return [value, set] as const;
}
