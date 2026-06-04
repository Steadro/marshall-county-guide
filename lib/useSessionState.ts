import { useCallback, useState } from "react";

/**
 * useState backed by sessionStorage, restored **synchronously** on mount.
 *
 * Why synchronous: when a user clicks into a collection page and hits Back, the
 * homepage's browse component re-mounts client-side. If it came back with its
 * default tab, the pane would change height and the browser's scroll restoration
 * would land at the wrong pixel ("before the section"). Restoring the saved value
 * in the useState initializer means the first render already has the right layout,
 * so scroll restoration lands where the user left off — and the tab they were on
 * is still selected.
 *
 * Scoped to the tab session (sessionStorage), so it persists across in-session
 * navigation but a brand-new visit starts on the default.
 */
export function useSessionState<T extends string>(
  key: string,
  fallback: T,
  isValid?: (v: string) => boolean,
) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return fallback;
    const saved = window.sessionStorage.getItem(key);
    return saved && (!isValid || isValid(saved)) ? (saved as T) : fallback;
  });

  const set = useCallback(
    (v: T) => {
      setValue(v);
      if (typeof window !== "undefined") window.sessionStorage.setItem(key, v);
    },
    [key],
  );

  return [value, set] as const;
}
