import { useEffect, useState } from "react";
import type { MediaApi } from "../api.js";

export function useLazyMediaImage(
  api: MediaApi,
  fileHash: string,
  root: HTMLElement | null,
): [(element: HTMLElement | null) => void, string | null] {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!element || shouldLoad) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShouldLoad(true);
        observer.disconnect();
      }
    }, { root, rootMargin: "500px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, root, shouldLoad]);

  useEffect(() => {
    if (!shouldLoad) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    void api.mediaBlob(fileHash).then((blob) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => {
      if (!cancelled) setUrl(null);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [api, fileHash, shouldLoad]);

  return [setElement, url];
}
