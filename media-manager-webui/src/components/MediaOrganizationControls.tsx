import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import type { MediaRecord } from "../../../src/shared/api-types.js";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { selectApiSettings } from "../app/selectors.js";
import { updateMedia } from "../features/media/mediaSlice.js";
import { AlbumAssignment } from "./AlbumAssignment.js";

export function MediaOrganizationControls({ media }: { media: MediaRecord }) {
  const dispatch = useAppDispatch();
  const connection = useAppSelector(selectApiSettings);
  const library = useAppSelector((state) => state.media.items);
  const [category, setCategory] = useState(media.category ?? "");
  const [tags, setTags] = useState(media.tags);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const categories = useMemo(
    () => [...new Set(library.flatMap((item) => item.category ? [item.category] : []))],
    [library],
  );
  const tagOptions = useMemo(
    () => [...new Set(library.flatMap((item) => item.tags))],
    [library],
  );
  const savedTagKey = media.tags.join("\0");

  useEffect(() => {
    setCategory(media.category ?? "");
    setTags(media.tags);
    setError(null);
  }, [media.fileHash, media.category, savedTagKey]);

  const save = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await dispatch(updateMedia({
        connection,
        fileHash: media.fileHash,
        patch: { category: category.trim() || null, tags },
      })).unwrap();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save details");
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = async (): Promise<void> => {
    setError(null);
    try {
      await dispatch(updateMedia({
        connection,
        fileHash: media.fileHash,
        patch: { favorite: !media.favorite },
      })).unwrap();
    } catch (favoriteError) {
      setError(favoriteError instanceof Error ? favoriteError.message : "Unable to update favorite");
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="h6">Organize</Typography>
        <Tooltip title={media.favorite ? "Remove from favorites" : "Add to favorites"}>
          <IconButton
            color={media.favorite ? "error" : "default"}
            aria-label={media.favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={() => void toggleFavorite()}
          >
            {media.favorite ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
          </IconButton>
        </Tooltip>
      </Stack>
      <Autocomplete
        freeSolo
        options={categories}
        value={category || null}
        onChange={(_, value) => setCategory(value ?? "")}
        onInputChange={(_, value) => setCategory(value)}
        renderInput={(params) => <TextField {...params} label="Category" />}
      />
      <Autocomplete
        multiple
        freeSolo
        options={tagOptions}
        value={tags}
        onChange={(_, value) => setTags(value)}
        renderInput={(params) => <TextField {...params} label="Tags" placeholder="Add a tag" />}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Button variant="outlined" disabled={saving} onClick={() => void save()}>
        {saving ? "Saving..." : "Save tags and category"}
      </Button>
      <Divider />
      <AlbumAssignment media={media} />
    </Stack>
  );
}
