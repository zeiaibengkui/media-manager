import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PhotoAlbumRoundedIcon from "@mui/icons-material/PhotoAlbumRounded";
import { useNavigate } from "react-router-dom";
import type { AlbumRecord } from "../../../src/shared/api-types.js";
import { MediaApi } from "../api.js";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { selectApiSettings } from "../app/selectors.js";
import { CreateAlbumDialog } from "../components/CreateAlbumDialog.js";
import { fetchAlbums } from "../features/albums/albumsSlice.js";
import { useMediaImage } from "../hooks/use-media-image.js";

function AlbumCard({
  api,
  album,
  onOpen,
}: {
  api: MediaApi;
  album: AlbumRecord;
  onOpen: () => void;
}) {
  const coverUrl = useMediaImage(api, album.coverFileHash);
  return (
    <Card>
      <CardActionArea onClick={onOpen}>
        {coverUrl ? (
          <CardMedia component="img" image={coverUrl} alt="" height={180} />
        ) : (
          <Box sx={{ height: 180, display: "grid", placeItems: "center", bgcolor: "action.hover" }}>
            <PhotoAlbumRoundedIcon color="disabled" sx={{ fontSize: 56 }} />
          </Box>
        )}
        <CardContent>
          <Typography variant="h6" noWrap>{album.name}</Typography>
          <Typography color="text.secondary" variant="body2">
            {album.itemCount} {album.itemCount === 1 ? "photo" : "photos"}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export function AlbumsPage() {
  const dispatch = useAppDispatch();
  const connection = useAppSelector(selectApiSettings);
  const { items, loading, error } = useAppSelector((state) => state.albums);
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const api = useMemo(
    () => new MediaApi(connection.apiUrl, connection.token),
    [connection.apiUrl, connection.token],
  );

  useEffect(() => {
    void dispatch(fetchAlbums(connection));
  }, [connection, dispatch]);

  return (
    <Stack spacing={3} sx={{ height: "100%", overflowY: "auto", pr: 1 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h4">Albums</Typography>
          <Typography color="text.secondary">Curate photos into separate collections.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>
          Create album
        </Button>
      </Stack>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading && items.length === 0 ? (
        <Stack sx={{ alignItems: "center", py: 8 }}><CircularProgress /></Stack>
      ) : null}
      {!loading && items.length === 0 ? (
        <Alert severity="info">Create an album, then add photos from the photo details view.</Alert>
      ) : null}
      <Grid container spacing={3}>
        {items.map((album) => (
          <Grid key={album.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <AlbumCard api={api} album={album} onOpen={() => navigate(`/albums/${album.id}`)} />
          </Grid>
        ))}
      </Grid>
      <CreateAlbumDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(album) => navigate(`/albums/${album.id}`)}
      />
    </Stack>
  );
}
