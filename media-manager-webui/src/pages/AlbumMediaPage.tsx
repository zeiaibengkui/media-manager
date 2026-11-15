import { useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { selectApiSettings } from "../app/selectors.js";
import { fetchAlbums } from "../features/albums/albumsSlice.js";
import { LibraryPage } from "./LibraryPage.js";

export function AlbumMediaPage() {
  const { albumId = "" } = useParams();
  const dispatch = useAppDispatch();
  const connection = useAppSelector(selectApiSettings);
  const album = useAppSelector((state) =>
    state.albums.items.find((item) => item.id === albumId),
  );

  useEffect(() => {
    void dispatch(fetchAlbums(connection));
  }, [connection, dispatch]);

  const navigate = useNavigate();
  return (
    <Stack spacing={2} sx={{ height: "100%", minHeight: 0 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/albums")}>
          Albums
        </Button>
        <Typography variant="h5" noWrap>{album?.name ?? "Album"}</Typography>
      </Stack>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <LibraryPage albumId={albumId} />
      </Box>
    </Stack>
  );
}
