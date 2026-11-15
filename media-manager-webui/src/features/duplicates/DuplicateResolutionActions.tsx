import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import type {
  DuplicatePair,
  MediaReference,
} from "../../../../src/shared/api-types.js";
import { useAppDispatch, useAppSelector } from "../../app/hooks.js";
import { selectApiSettings } from "../../app/selectors.js";
import { resolveDuplicate } from "./duplicatesSlice.js";

interface Props {
  pair: DuplicatePair;
}

export function DuplicateResolutionActions({ pair }: Props) {
  const dispatch = useAppDispatch();
  const connection = useAppSelector(selectApiSettings);
  const [selected, setSelected] = useState<MediaReference | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolve = async (
    request: Parameters<typeof resolveDuplicate>[0]["request"],
  ): Promise<void> => {
    setError(null);
    try {
      await dispatch(resolveDuplicate({ connection, request })).unwrap();
      setSelected(null);
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : "Unable to resolve duplicate");
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ justifyContent: "center", py: 2 }}>
        <Button
          variant="contained"
          onClick={() => void resolve({
            leftHash: pair.left.fileHash,
            rightHash: pair.right.fileHash,
            action: "keep-both",
          })}
        >
          Keep both
        </Button>
        <Button color="error" onClick={() => setSelected(pair.left)}>Remove left file</Button>
        <Button color="error" onClick={() => setSelected(pair.right)}>Remove right file</Button>
      </Stack>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Dialog open={selected !== null} onClose={() => setSelected(null)}>
        <DialogTitle>Remove local file?</DialogTitle>
        <DialogContent>
          <Typography>This will permanently remove:</Typography>
          <Typography variant="body2" color="text.secondary">{selected?.filePath}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => selected && void resolve({
              leftHash: pair.left.fileHash,
              rightHash: pair.right.fileHash,
              action: "remove-one",
              removeHash: selected.fileHash,
              removeFilePath: selected.filePath,
            })}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
