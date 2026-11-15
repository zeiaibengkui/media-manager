import { useState } from "react";
import {
  Box,
  Button,
  FormControlLabel,
  Paper,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import {
  MAX_SCAN_CONCURRENCY,
  type PersistedSettings,
  type ScanRequest,
} from "../../../../src/shared/api-types.js";

interface ScanFormProps {
  defaults: PersistedSettings;
  starting: boolean;
  onStart: (request: ScanRequest) => void;
}

export function ScanForm({ defaults, starting, onStart }: ScanFormProps) {
  const [path, setPath] = useState("");
  const [skipAi, setSkipAi] = useState(defaults.skipAi);
  const [skipExif, setSkipExif] = useState(defaults.skipExif);
  const [threshold, setThreshold] = useState(defaults.nearThreshold);
  const [concurrency, setConcurrency] = useState(defaults.concurrency);
  const [aiPrompt, setAiPrompt] = useState(defaults.aiPrompt);

  const start = (): void => {
    if (!path.trim()) return;
    onStart({
      path: path.trim(),
      skipAi,
      skipExif,
      nearThreshold: threshold,
      concurrency,
      aiPrompt,
    });
  };

  return (
    <Paper variant="outlined">
      <Stack spacing={3} sx={{ p: 3 }}>
        <TextField
          label="Photo directory"
          placeholder="/path/to/photos"
          value={path}
          onChange={(event) => setPath(event.target.value)}
          helperText="Use a path available to the Media Manager server."
          fullWidth
        />
        <TextField
          label="AI title and description prompt"
          value={aiPrompt}
          onChange={(event) => setAiPrompt(event.target.value)}
          helperText="AI returns both a title and description. Clear the field to use the server default."
          disabled={skipAi}
          multiline
          minRows={2}
          fullWidth
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
          <FormControlLabel
            control={<Switch checked={skipAi} onChange={(event) => setSkipAi(event.target.checked)} />}
            label="Skip AI"
          />
          <FormControlLabel
            control={<Switch checked={skipExif} onChange={(event) => setSkipExif(event.target.checked)} />}
            label="Skip EXIF"
          />
        </Stack>
        <Box>
          <Typography gutterBottom>Near-duplicate threshold</Typography>
          <Slider value={threshold} min={0.5} max={1} step={0.01} onChange={(_event, value) => setThreshold(value as number)} valueLabelDisplay="auto" valueLabelFormat={(value) => `${Math.round(value * 100)}%`} />
        </Box>
        <Box>
          <Typography gutterBottom>Parallel processing: {concurrency} files</Typography>
          <Slider value={concurrency} min={1} max={MAX_SCAN_CONCURRENCY} step={1} marks={[{ value: 1, label: "1" }, { value: 10, label: "10" }, { value: 20, label: "20" }]} onChange={(_event, value) => setConcurrency(value as number)} valueLabelDisplay="auto" />
        </Box>
        <Box>
          <Button variant="contained" size="large" startIcon={<PlayArrowRoundedIcon />} disabled={!path.trim() || starting} onClick={start}>
            {starting ? "Scanning..." : "Start scan"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
