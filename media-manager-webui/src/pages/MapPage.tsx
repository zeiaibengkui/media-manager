import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { selectApiSettings } from "../app/selectors.js";
import { MediaApi } from "../api.js";
import { fetchMedia } from "../features/media/mediaSlice.js";
import { buildPhotoFeatures } from "../features/map/photo-features.js";
import type { PhotoPointProperties } from "../features/map/photo-features.js";
import { MapCanvas } from "../features/map/MapCanvas.js";
import { MapPhotoCard } from "../features/map/MapPhotoCard.js";

export function MapPage() {
  const dispatch = useAppDispatch();
  const connection = useAppSelector(selectApiSettings);
  const { items, loading, loadingMore, hasMore, nextCursor, error } = useAppSelector(
    (state) => state.media,
  );
  const features = useMemo(() => buildPhotoFeatures(items), [items]);
  const api = useMemo(
    () => new MediaApi(connection.apiUrl, connection.token),
    [connection.apiUrl, connection.token],
  );
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoPointProperties | null>(null);

  useEffect(() => {
    void dispatch(fetchMedia({ connection }));
  }, [connection, dispatch]);

  useEffect(() => {
    if (!hasMore || !nextCursor || loadingMore || error) return;
    void dispatch(fetchMedia({
      connection,
      cursor: nextCursor,
      append: true,
    }));
  }, [connection, dispatch, error, hasMore, loadingMore, nextCursor]);

  return (
    <Stack spacing={2} sx={{ height: "100%", overflow: "hidden" }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h4">Map</Typography>
          <Typography color="text.secondary">
            Photos with GPS metadata from the current library.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Chip label={`${features.features.length} located`} />
          {loadingMore ? <CircularProgress size={20} /> : null}
        </Stack>
      </Stack>
      {loading && items.length === 0 ? <CircularProgress /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box sx={{ flexGrow: 1, minHeight: 0, position: "relative" }}>
        <MapCanvas data={features} onPhotoSelect={setSelectedPhoto} />
        {selectedPhoto ? (
          <Box sx={{ position: "absolute", top: 16, left: 16, zIndex: 2 }}>
            <MapPhotoCard
              api={api}
              photo={selectedPhoto}
              onClose={() => setSelectedPhoto(null)}
            />
          </Box>
        ) : null}
      </Box>
    </Stack>
  );
}
