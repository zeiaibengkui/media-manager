import type { MediaApi } from "../api.js";
import { useAppSelector } from "../app/hooks.js";
import { MediaViewerDialog } from "./MediaViewerDialog.js";

interface WrapperProps {
  api: MediaApi;
  fileHash: string | null;
  onClose: () => void;
}

export function MediaViewerDialogWrapper({ api, fileHash, onClose }: WrapperProps) {
  const media = useAppSelector((state) =>
    state.media.items.find((item) => item.fileHash === fileHash) ?? null,
  );
  return <MediaViewerDialog api={api} media={media} onClose={onClose} />;
}
