import {
  Button,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import type { ScanJob } from "../../../../src/shared/api-types.js";

interface Props {
  jobIds: string[];
  jobs: Record<string, ScanJob>;
  activeJobId?: string;
  onStop: (jobId: string) => void;
  onRetry: (jobId: string) => void;
}

export function ScanJobList({ jobIds, jobs, activeJobId, onStop, onRetry }: Props) {
  if (jobIds.length === 0) return null;
  return (
    <Paper variant="outlined">
      <Typography variant="h6" sx={{ px: 2, pt: 2 }}>Scan jobs</Typography>
      <List>
        {jobIds.map((jobId) => {
          const job = jobs[jobId];
          const active = job?.status === "queued" || job?.status === "running";
          return (
            <ListItem key={jobId} disablePadding>
              <ListItemButton
                component={Link}
                to={`/scan/${jobId}`}
                selected={jobId === activeJobId}
              >
                <ListItemText primary={jobId} secondary={job?.status ?? "Loading"} />
              </ListItemButton>
              {job ? <Chip size="small" label={job.status} /> : null}
              {active ? (
                <Button size="small" color="error" onClick={() => onStop(jobId)}>Stop</Button>
              ) : job ? (
                <Button size="small" onClick={() => onRetry(jobId)}>Retry</Button>
              ) : null}
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
}
