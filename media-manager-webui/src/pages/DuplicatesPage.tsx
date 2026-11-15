import { useEffect, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { MediaApi } from "../api.js";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { selectApiSettings } from "../app/selectors.js";
import { DuplicatePairCard } from "../features/duplicates/DuplicatePairCard.js";
import {
  fetchDuplicates,
  setThreshold,
} from "../features/duplicates/duplicatesSlice.js";

export function DuplicatesPage() {
  const dispatch = useAppDispatch();
  const connection = useAppSelector(selectApiSettings);
  const { pairs, hasMore, threshold, loading, error } = useAppSelector((state) => state.duplicates);
  const api = useMemo(() => new MediaApi(connection.apiUrl, connection.token), [connection.apiUrl, connection.token]);
  const load = () => dispatch(fetchDuplicates({ ...connection, threshold }));

  useEffect(() => {
    void load();
  }, [connection, dispatch, threshold]);

  return (
    <Stack spacing={3} sx={{ height: "100%", overflowY: "auto", pr: 1 }}>
      <Box>
        <Typography variant="h4">Duplicates</Typography>
        <Typography color="text.secondary">Review visually similar photos before deciding what to keep.</Typography>
      </Box>
      <Paper variant="outlined">
        <Stack spacing={2} sx={{ p: 3 }}>
          <Box>
            <Typography gutterBottom>Similarity threshold</Typography>
            <Slider
              value={threshold}
              min={0.5}
              max={1}
              step={0.01}
              onChange={(_event, value) => dispatch(setThreshold(value as number))}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
            />
          </Box>
          <Button startIcon={<RefreshRoundedIcon />} onClick={() => void load()}>Re-evaluate</Button>
        </Stack>
      </Paper>
      {loading ? (
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <CircularProgress />
          <Typography color="text.secondary">Comparing perceptual hashes...</Typography>
        </Stack>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {!loading && !error && pairs.length === 0 ? (
        <Alert severity="info">No near-duplicates found at this threshold.</Alert>
      ) : null}
      {!loading && !error && hasMore ? (
        <Alert severity="info">
          Showing the first 49 unresolved pairs. Resolve this batch, then click Re-evaluate for the next batch.
        </Alert>
      ) : null}
      {pairs.map((pair) => (
        <DuplicatePairCard
          key={`${pair.left.fileHash}-${pair.right.fileHash}`}
          api={api}
          pair={pair}
        />
      ))}
    </Stack>
  );
}
