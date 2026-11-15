import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import type { MediaRecord } from "../../../src/shared/api-types.js";

function formatBytes(value: string): string {
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return value;
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function MediaDetails({ media }: { media: MediaRecord }) {
  return (
    <>
      <Box>
        <Typography variant="h6" gutterBottom>Details</Typography>
        <List dense disablePadding>
          <ListItem disablePadding><ListItemText primary="Dimensions" secondary={`${media.width} × ${media.height}`} /></ListItem>
          <ListItem disablePadding><ListItemText primary="File size" secondary={formatBytes(media.sizeBytes)} /></ListItem>
          <ListItem disablePadding><ListItemText primary="Type" secondary={media.mimeType} /></ListItem>
          <ListItem disablePadding>
            <ListItemText
              primary="SHA-256"
              secondary={media.fileHash}
              slotProps={{ secondary: { sx: { wordBreak: "break-all" } } }}
            />
          </ListItem>
        </List>
      </Box>
      <Box>
        <Typography variant="h6" gutterBottom>AI title</Typography>
        <Typography color="text.secondary">{media.title ?? "No AI title available."}</Typography>
      </Box>
      <Box>
        <Typography variant="h6" gutterBottom>Description</Typography>
        <Typography color="text.secondary">{media.description ?? "No AI description available."}</Typography>
      </Box>
      <Box>
        <Typography variant="h6" gutterBottom>Organization</Typography>
        <Typography color="text.secondary">
          Category: {media.category ?? "None"}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Favorite: {media.favorite ? "Yes" : "No"}
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 1 }}>
          {media.tags.length
            ? media.tags.map((tag) => <Chip key={tag} label={tag} size="small" />)
            : <Typography color="text.secondary">No tags</Typography>}
        </Stack>
      </Box>
      <Box>
        <Typography variant="h6" gutterBottom>Location</Typography>
        <List dense disablePadding>
          {media.paths.map((path) => (
            <ListItem key={path.id} disablePadding>
              <ListItemText primary={path.fileName} secondary={path.filePath} />
            </ListItem>
          ))}
        </List>
      </Box>
      {media.exif ? (
        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Typography>EXIF metadata</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="pre" variant="caption">{JSON.stringify(media.exif, null, 2)}</Typography>
          </AccordionDetails>
        </Accordion>
      ) : null}
    </>
  );
}
