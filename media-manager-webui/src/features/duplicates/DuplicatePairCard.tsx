import {
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { DuplicatePair } from "../../../../src/shared/api-types.js";
import type { MediaApi } from "../../api.js";
import { DuplicateImage } from "./DuplicateImage.js";
import { DuplicateResolutionActions } from "./DuplicateResolutionActions.js";

export function DuplicatePairCard({ api, pair }: { api: MediaApi; pair: DuplicatePair }) {
  return (
    <Card sx={{ flexShrink: 0 }}>
      <Grid container>
        <Grid size={{ xs: 12, sm: 5 }}>
          <DuplicateImage api={api} media={pair.left} />
          <CardContent><Typography variant="body2" noWrap>{pair.left.fileName}</Typography></CardContent>
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <Stack spacing={1} sx={{ alignItems: "center", justifyContent: "center", p: 2 }}>
            <Typography variant="h5">{Math.round(pair.similarity * 100)}%</Typography>
            <LinearProgress variant="determinate" value={pair.similarity * 100} />
            <Typography color="text.secondary" variant="caption">visual similarity</Typography>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <DuplicateImage api={api} media={pair.right} />
          <CardContent><Typography variant="body2" noWrap>{pair.right.fileName}</Typography></CardContent>
        </Grid>
      </Grid>
      <DuplicateResolutionActions pair={pair} />
    </Card>
  );
}
