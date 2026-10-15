"use client";

import type { ComponentProps } from "react";

/**
 * Plain <a> for "/#section" links: the browser's own fragment jump moves
 * keyboard focus into the section, where Next's <Link> only scrolls. A
 * same-page jump leaves the new history entry's state null, though, and Next's
 * router ignores null-state entries on Back/Forward (the previous route stays
 * on screen), so copy over the router state of the entry we jumped from.
 */
export function HashLink(props: ComponentProps<"a">) {
  return (
    <a
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        const state = history.state;
        // The jump itself runs synchronously after this handler, so it has
        // landed by now; a cross-page load leaves history.state untouched.
        setTimeout(() => {
          if (history.state === null) history.replaceState(state, "");
        });
      }}
    />
  );
}
