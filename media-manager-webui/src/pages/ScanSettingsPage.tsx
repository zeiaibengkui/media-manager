import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Divider,
  Paper,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  MAX_SCAN_CONCURRENCY,
  type PersistedSettings,
} from "../../../src/shared/api-types.js";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { saveSettings } from "../features/settings/settingsSlice.js";
import { SettingsRow } from "../features/settings/SettingsRow.js";

export function ScanSettingsPage() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((store) => store.settings);
  const connection = { apiUrl: state.apiUrl, token: state.token };
  const [draft, setDraft] = useState<PersistedSettings>(state.scanDefaults);

  useEffect(() => {
    setDraft(state.scanDefaults);
  }, [state.scanDefaults]);

  const update = (values: Partial<PersistedSettings>): void => {
    setDraft((current) => ({ ...current, ...values }));
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5">Scan defaults</Typography>
        <Button
          variant="contained"
          disabled={state.saving}
          onClick={() => void dispatch(saveSettings({ connection, settings: draft }))}
        >
          {state.saving ? "Saving..." : "Save"}
        </Button>
      </Stack>
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      <Paper variant="outlined">
        <Stack divider={<Divider flexItem />} sx={{ px: 3 }}>
          <SettingsRow title="AI prompt" description="Controls generated titles and descriptions.">
            <TextField size="small" multiline minRows={2} value={draft.aiPrompt} onChange={(event) => update({ aiPrompt: event.target.value })} sx={{ width: 420 }} />
          </SettingsRow>
          <SettingsRow title="Skip AI" description="Do not generate titles or descriptions.">
            <Switch checked={draft.skipAi} onChange={(event) => update({ skipAi: event.target.checked })} />
          </SettingsRow>
          <SettingsRow title="Skip EXIF" description="Do not extract photo metadata.">
            <Switch checked={draft.skipExif} onChange={(event) => update({ skipExif: event.target.checked })} />
          </SettingsRow>
          <SettingsRow title="Parallel processing" description={`${draft.concurrency} files at a time`}>
            <Slider value={draft.concurrency} min={1} max={MAX_SCAN_CONCURRENCY} step={1} onChange={(_event, value) => update({ concurrency: value as number })} valueLabelDisplay="auto" sx={{ width: 320 }} />
          </SettingsRow>
          <SettingsRow title="Near-duplicate threshold" description={`${Math.round(draft.nearThreshold * 100)}%`}>
            <Slider value={draft.nearThreshold} min={0.5} max={1} step={0.01} onChange={(_event, value) => update({ nearThreshold: value as number })} valueLabelDisplay="auto" sx={{ width: 320 }} />
          </SettingsRow>
        </Stack>
      </Paper>
    </Stack>
  );
}
