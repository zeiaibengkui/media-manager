import {
  AppBar,
  Box,
  Chip,
  IconButton,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { selectApiSettings } from "../app/selectors.js";
import { fetchMedia } from "../features/media/mediaSlice.js";
import { setQuery } from "../features/ui/uiSlice.js";
import { ThemeModeMenu } from "./ThemeModeMenu.js";

export function AppHeader() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectApiSettings);
  const query = useAppSelector((state) => state.ui.query);
  const health = useAppSelector((state) => state.health);
  const favoriteOnly = location.pathname === "/favorites";
  const albumMatch = /^\/albums\/([^/]+)$/.exec(location.pathname);
  const albumId = albumMatch?.[1] ? decodeURIComponent(albumMatch[1]) : undefined;
  const libraryView =
    location.pathname === "/photos" ||
    location.pathname === "/favorites" ||
    location.pathname === "/albums" ||
    Boolean(albumId);

  return (
    <AppBar position="static" color="inherit" elevation={0}>
      <Toolbar>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mr: desktop ? 4 : 1 }}>
          <PhotoLibraryRoundedIcon color="primary" />
          {desktop ? <Typography variant="h6">Media Manager</Typography> : null}
          {libraryView ? (
            <Tooltip title="Refresh photos">
              <IconButton
                aria-label="Refresh photos"
                onClick={() => void dispatch(fetchMedia({
                  connection: settings,
                  ...(favoriteOnly ? { favoriteOnly } : {}),
                  ...(albumId ? { albumId } : {}),
                }))}
              >
                <RefreshRoundedIcon />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
        <Box sx={{ flexGrow: 1, maxWidth: 720 }}>
          {libraryView ? (
            <TextField
              value={query}
              onChange={(event) => dispatch(setQuery(event.target.value))}
              placeholder="Search your photos"
              variant="filled"
              size="small"
              fullWidth
              slotProps={{
                input: {
                  disableUnderline: true,
                  startAdornment: <SearchRoundedIcon color="action" />,
                },
              }}
            />
          ) : null}
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", ml: 1 }}>
          {desktop ? (
            <Chip
              size="small"
              label={health.label}
              color={health.status === "connected" ? "success" : health.status === "offline" ? "error" : "default"}
              variant={health.status === "connected" ? "filled" : "outlined"}
            />
          ) : null}
          <ThemeModeMenu />
          <Tooltip title="Settings">
            <IconButton aria-label="Open settings" onClick={() => navigate("/settings")}>
              <SettingsRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
