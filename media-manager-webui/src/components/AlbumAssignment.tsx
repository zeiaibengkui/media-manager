import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import type { AlbumRecord, MediaRecord } from "../../../src/shared/api-types.js";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { selectApiSettings } from "../app/selectors.js";
import { fetchAlbums } from "../features/albums/albumsSlice.js";
import {
  addMediaToAlbum,
  removeMediaFromAlbum,
} from "../features/media/mediaSlice.js";
import { CreateAlbumDialog } from "./CreateAlbumDialog.js";

export function AlbumAssignment({ media }: { media: MediaRecord }) {
  const dispatch = useAppDispatch();
  const connection = useAppSelector(selectApiSettings);
  const albums = useAppSelector((state) => state.albums.items);
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assigned = new Set(media.albums.map((album) => album.id));
  const available = albums.filter((album) => !assigned.has(album.id));

  useEffect(() => {
    void dispatch(fetchAlbums(connection));
  }, [connection, dispatch]);

  const add = async (album: AlbumRecord): Promise<void> => {
    setPending(true);
    setError(null);
    try {
      await dispatch(addMediaToAlbum({
        connection,
        fileHash: media.fileHash,
        albumId: album.id,
      })).unwrap();
      void dispatch(fetchAlbums(connection));
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Unable to add to album");
    } finally {
      setPending(false);
    }
  };

  const remove = async (albumId: string): Promise<void> => {
    setPending(true);
    setError(null);
    try {
      await dispatch(removeMediaFromAlbum({
        connection,
        fileHash: media.fileHash,
        albumId,
      })).unwrap();
      void dispatch(fetchAlbums(connection));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove from album");
    } finally {
      setPending(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="subtitle1">Albums</Typography>
        <Button startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
          Create
        </Button>
      </Stack>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        {media.albums.length ? media.albums.map((album) => (
          <Chip
            key={album.id}
            label={album.name}
            disabled={pending}
            onDelete={() => void remove(album.id)}
          />
        )) : <Typography color="text.secondary">Not in an album yet.</Typography>}
      </Stack>
      <Autocomplete
        value={null}
        options={available}
        getOptionLabel={(album) => album.name}
        disabled={pending}
        onChange={(_, album) => {
          if (album) void add(album);
        }}
        renderInput={(params) => <TextField {...params} label="Add to album" />}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <CreateAlbumDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(album) => add(album)}
      />
    </Stack>
  );
}
