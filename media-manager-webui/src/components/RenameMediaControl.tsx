import { useEffect, useState } from "react";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import type { MediaRecord } from "../../../src/shared/api-types.js";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { selectApiSettings } from "../app/selectors.js";
import { renameMedia } from "../features/media/mediaSlice.js";

export function RenameMediaControl({ media }: { media: MediaRecord }) {
  const dispatch = useAppDispatch();
  const connection = useAppSelector(selectApiSettings);
  const [fileName, setFileName] = useState(media.fileName);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    setFileName(media.fileName);
    setError(null);
  }, [media]);

  const rename = async (): Promise<void> => {
    setRenaming(true);
    setError(null);
    try {
      await dispatch(renameMedia({
        connection,
        fileHash: media.fileHash,
        fileName: fileName.trim(),
      })).unwrap();
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "Unable to rename file");
    } finally {
      setRenaming(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Rename local file</Typography>
      <TextField
        label="File name"
        value={fileName}
        onChange={(event) => setFileName(event.target.value)}
        helperText="The file stays in its current directory and must keep its extension."
        fullWidth
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Button
        variant="outlined"
        disabled={renaming || !fileName.trim() || fileName.trim() === media.fileName}
        onClick={() => void rename()}
      >
        {renaming ? "Renaming..." : "Rename file"}
      </Button>
    </Stack>
  );
}
