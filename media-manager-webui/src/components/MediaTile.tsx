import { useEffect, useState } from "react";
import {
  Box,
  Fade,
  Skeleton,
} from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import type { MediaRecord } from "../../../src/shared/api-types.js";
import type { MediaApi } from "../api.js";
import { useLazyMediaImage } from "../hooks/use-lazy-media-image.js";

interface MediaTileProps {
  api: MediaApi;
  media: MediaRecord;
  width: number;
  height: number;
  scrollRoot: HTMLElement | null;
  onOpen: (media: MediaRecord) => void;
}

export function MediaTile({ api, media, width, height, scrollRoot, onOpen }: MediaTileProps) {
  const [imageRef, imageUrl] = useLazyMediaImage(api, media.fileHash, scrollRoot);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [imageUrl]);

  return (
    <Box
      component="button"
      ref={imageRef}
      type="button"
      title={media.title ?? media.fileName}
      aria-label={`Open ${media.fileName}`}
      onClick={() => onOpen(media)}
      sx={{
        position: "relative",
        width,
        height,
        flexShrink: 0,
        border: 0,
        p: 0,
        overflow: "hidden",
        cursor: "pointer",
        bgcolor: "action.hover",
      }}
    >
      {imageUrl ? (
        <Fade in={loaded} timeout={450}>
          <Box
            component="img"
            src={imageUrl}
            alt={media.description ?? media.fileName}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </Fade>
      ) : (
        <Skeleton variant="rectangular" width="100%" height="100%" />
      )}
      {media.favorite ? (
        <FavoriteRoundedIcon
          aria-label="Favorite"
          color="error"
          fontSize="small"
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            p: 0.25,
            borderRadius: "50%",
            bgcolor: "background.paper",
            boxShadow: 1,
          }}
        />
      ) : null}
    </Box>
  );
}
