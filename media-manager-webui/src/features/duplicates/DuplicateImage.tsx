import { CardMedia, Skeleton } from "@mui/material";
import type { MediaReference } from "../../../../src/shared/api-types.js";
import type { MediaApi } from "../../api.js";
import { useMediaImage } from "../../hooks/use-media-image.js";

export function DuplicateImage({ api, media }: { api: MediaApi; media: MediaReference }) {
  const imageUrl = useMediaImage(api, media.fileHash);
  if (!imageUrl) return <Skeleton variant="rectangular" height={210} />;
  return <CardMedia component="img" image={imageUrl} alt={media.fileName} height="210" />;
}
