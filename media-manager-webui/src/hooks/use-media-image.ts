import { useEffect, useState } from "react";
import type { MediaApi } from "../api.js";

export function useMediaImage(
  api: MediaApi,
  fileHash: string | null,
): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileHash) {
      setUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    void api.mediaBlob(fileHash).then((blob) => {
      if (cancelled) {
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => {
      if (!cancelled) {
        setUrl(null);
      }
    });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [api, fileHash]);

  return url;
}
