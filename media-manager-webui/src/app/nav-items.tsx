import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import PhotoAlbumRoundedIcon from "@mui/icons-material/PhotoAlbumRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import type { ReactElement } from "react";

export interface NavItem {
  path: string;
  label: string;
  icon: ReactElement;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/photos", label: "Photos", icon: <PhotoLibraryRoundedIcon /> },
  { path: "/favorites", label: "Favorites", icon: <FavoriteRoundedIcon /> },
  { path: "/albums", label: "Albums", icon: <PhotoAlbumRoundedIcon /> },
  { path: "/duplicates", label: "Duplicates", icon: <ContentCopyRoundedIcon /> },
  { path: "/map", label: "Map", icon: <MapRoundedIcon /> },
  { path: "/scan", label: "Scan", icon: <PlayCircleOutlineRoundedIcon /> },
  { path: "/settings", label: "Settings", icon: <SettingsRoundedIcon /> },
];
