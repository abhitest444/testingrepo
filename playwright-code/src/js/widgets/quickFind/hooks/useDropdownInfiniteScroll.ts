import { useCallback, useEffect, useRef } from 'react';

/**
 * Shared infinite-scroll wiring for QuickFind dropdowns.
 *
 * Centralises the listbox-scroll plumbing used by Class/Location/Service/
 * Customer/TeamMember dropdowns so behaviour stays identical across STE and
 * WTE (where many rows render the same dropdown side-by-side).
 *
 * Why the lookup is indirect:
 * The underlying `@ids-ts/dropdown-typeahead` renders its listbox via
 * `@ids-ts/position` + `@ids-ts/portal`, which mounts the menu under
 * `document.body` — NOT inside our wrapper `<div>`. So `containerRef`'s
 * subtree never contains the listbox. To still scope to *this* dropdown, we:
 *   1. Find the trigger element inside `containerRef` — it carries
 *      `aria-controls="<menuId>"`.
 *   2. Resolve that id via `document.getElementById` to reach the portaled
 *      listbox.
 * This avoids the old `document.querySelector('[role="listbox"]')` race where
 * multiple WTE rows would steal each other's listbox.
 *
 * Other design notes:
 * - The DOM scroll handler reads `hasMore` / `loading` / `loadMore` from a
 *   ref refreshed every render. The listener itself has stable `[]` deps so
 *   it does not detach/reattach on every state change — important in WTE
 *   where state churns frequently.
 * - We poll for the listbox via a body-level MutationObserver because the
 *   portaled listbox mounts outside our container; we still scope correctly
 *   via `aria-controls`, but we need to *notice* it appearing somewhere on
 *   the page. When it unmounts (dropdown closed), we drop our ref so the
 *   next open re-attaches.
 */
export function useDropdownInfiniteScroll({
  containerRef,
  hasMore,
  loading,
  loadMore,
  threshold = 0.8,
}: {
  containerRef: React.RefObject<HTMLElement>;
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
  /** Fire loadMore when scrollPercentage exceeds this. Defaults to 0.8. */
  threshold?: number;
}) {
  const menuRef = useRef<HTMLElement | null>(null);
  const stateRef = useRef({ hasMore, loading, loadMore, threshold });
  stateRef.current = { hasMore, loading, loadMore, threshold };

  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollHeight === 0) return;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    const {
      hasMore: latestHasMore,
      loading: latestLoading,
      loadMore: latestLoadMore,
      threshold: latestThreshold,
    } = stateRef.current;
    if (scrollPercentage > latestThreshold && latestHasMore && !latestLoading) {
      latestLoadMore();
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const findMenuForThisDropdown = (): HTMLElement | null => {
      // The trigger lives inside our container and points to the portaled
      // listbox via aria-controls.
      const trigger = container.querySelector('[aria-controls]');
      const menuId = trigger?.getAttribute('aria-controls');
      if (!menuId) return null;
      return document.getElementById(menuId);
    };

    const attach = () => {
      const menuElement = findMenuForThisDropdown();
      if (menuElement && menuRef.current !== menuElement) {
        if (menuRef.current) {
          menuRef.current.removeEventListener('scroll', handleScroll);
        }
        menuRef.current = menuElement;
        menuElement.addEventListener('scroll', handleScroll);
      } else if (!menuElement && menuRef.current) {
        // Listbox was removed (dropdown closed) — drop the ref so the next
        // open re-attaches to the freshly mounted listbox.
        menuRef.current.removeEventListener('scroll', handleScroll);
        menuRef.current = null;
      }
    };

    attach();
    // Observe body because the listbox is portaled there, not into our
    // container. Cheap subtree observe on childList is fine — only fires
    // when nodes mount/unmount, and we resolve scope via aria-controls.
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (menuRef.current) {
        menuRef.current.removeEventListener('scroll', handleScroll);
        menuRef.current = null;
      }
    };
  }, [containerRef, handleScroll]);
}
