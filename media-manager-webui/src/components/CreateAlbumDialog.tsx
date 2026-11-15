import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import type { AlbumRecord } from "../../../src/shared/api-types.js";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { selectApiSettings } from "../app/selectors.js";
import { createAlbum } from "../features/albums/albumsSlice.js";

interface CreateAlbumDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (album: AlbumRecord) => void | Promise<void>;
}

export function CreateAlbumDialog({ open, onClose, onCreated }: CreateAlbumDialogProps) {
  const dispatch = useAppDispatch();
  const connection = useAppSelector(selectApiSettings);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setError(null);
    }
  }, [open]);

  const create = async (): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      const album = await dispatch(createAlbum({ connection, name: name.trim() })).unwrap();
      await onCreated?.(album);
      onClose();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create album");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Create album</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Album name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={Boolean(error)}
          helperText={error ?? "Album names must be unique."}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button disabled={submitting} onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={submitting || !name.trim()}
          onClick={() => void create()}
        >
          {submitting ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
