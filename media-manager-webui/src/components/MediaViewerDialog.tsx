import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { MediaRecord } from "../../../src/shared/api-types.js";
import type { MediaApi } from "../api.js";
import { useMediaImage } from "../hooks/use-media-image.js";
import { theme } from "../theme.js";
import { MediaDetails } from "./MediaDetails.js";
import { MediaOrganizationControls } from "./MediaOrganizationControls.js";
import { RenameMediaControl } from "./RenameMediaControl.js";

interface MediaViewerDialogProps {
  api: MediaApi;
  media: MediaRecord | null;
  onClose: () => void;
}

export function MediaViewerDialog({ api, media, onClose }: MediaViewerDialogProps) {
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const imageUrl = useMediaImage(api, media?.fileHash ?? null);

  return (
    <Dialog open={media !== null} onClose={onClose} fullWidth fullScreen={fullScreen} maxWidth="lg">
      <DialogTitle>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" component="span" noWrap>
            {media?.title ?? media?.fileName}
          </Typography>
          <IconButton aria-label="Close media details" onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {media ? (
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box component="img" src={imageUrl ?? undefined} alt={media.description ?? media.fileName} width="100%" />
              {!imageUrl ? <Skeleton variant="rectangular" height={420} /> : null}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={3}>
                <MediaDetails media={media} />
                <MediaOrganizationControls media={media} />
                <RenameMediaControl media={media} />
              </Stack>
            </Grid>
          </Grid>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
