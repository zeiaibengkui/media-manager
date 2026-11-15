import {
  Alert,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { ScanJob } from "../../../../src/shared/api-types.js";

const MAX_LOG_LINES = 500;

export function ScanProgress({ job }: { job: ScanJob | null }) {
  if (!job) return null;
  const running = job.status === "queued" || job.status === "running";
  const events = job.events.slice(-MAX_LOG_LINES);
  return (
    <Paper variant="outlined">
      <Stack spacing={2} sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Scan job</Typography>
          <Chip label={job.status} color={job.status === "failed" ? "error" : job.status === "completed" ? "success" : "primary"} />
        </Stack>
        {running ? <LinearProgress /> : null}
        {job.summary ? (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Chip label={`${job.summary.scanned} scanned`} />
            <Chip label={`${job.summary.created} created`} />
            <Chip label={`${job.summary.exactDuplicates} exact duplicates`} />
            <Chip label={`${job.summary.nearDuplicateMatches} near matches`} />
            <Chip label={`${job.summary.failed} failed`} color={job.summary.failed ? "error" : "default"} />
          </Stack>
        ) : null}
        {job.error ? <Alert severity="error">{job.error}</Alert> : null}
        <Divider />
        <Typography variant="subtitle1">Activity</Typography>
        <List dense>
          {events.map((event, index) => (
            <ListItem key={`${event.type}-${index}`}>
              <ListItemText primary={event.message} />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Paper>
  );
}
