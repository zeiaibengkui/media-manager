import { useEffect, useState } from "react";

export function useProgressiveItems<T>(
  items: T[],
  pageSize = 80,
  resetKey = "",
): {
  visibleItems: T[];
  sentinelRef: (element: HTMLElement | null) => void;
  hasMore: boolean;
  atEnd: boolean;
  loadMore: () => void;
} {
  const [count, setCount] = useState(pageSize);
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setCount(pageSize);
  }, [pageSize, resetKey]);

  useEffect(() => {
    if (!sentinel || count >= items.length) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setCount((current) => Math.min(items.length, current + pageSize));
      }
    }, { rootMargin: "600px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [count, items.length, pageSize, sentinel]);

  return {
    visibleItems: items.slice(0, count),
    sentinelRef: setSentinel,
    hasMore: count < items.length,
    atEnd: count >= items.length,
    loadMore: () => setCount((current) => Math.min(items.length, current + pageSize)),
  };
}
