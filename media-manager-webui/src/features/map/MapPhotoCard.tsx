import {
  CardMedia,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { MediaApi } from "../../api.js";
import { useMediaImage } from "../../hooks/use-media-image.js";
import type { PhotoPointProperties } from "./photo-features.js";

interface Props {
  api: MediaApi;
  photo: PhotoPointProperties;
  onClose: () => void;
}

export function MapPhotoCard({ api, photo, onClose }: Props) {
  const imageUrl = useMediaImage(api, photo.fileHash);

  return (
    <Paper elevation={6} sx={{ width: 300, overflow: "hidden" }}>
      {imageUrl ? (
        <CardMedia component="img" image={imageUrl} alt={photo.title} height="180" />
      ) : (
        <Skeleton variant="rectangular" height={180} />
      )}
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", p: 2 }}>
        <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>{photo.title}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>{photo.fileName}</Typography>
        </Stack>
        <IconButton size="small" aria-label="Close photo details" onClick={onClose}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Paper>
  );
}
