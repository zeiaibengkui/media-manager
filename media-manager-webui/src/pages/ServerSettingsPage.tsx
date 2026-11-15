import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MediaApi } from "../api.js";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { selectApiSettings } from "../app/selectors.js";
import { SettingsRow } from "../features/settings/SettingsRow.js";
import { setConnection } from "../features/settings/settingsSlice.js";

export function ServerSettingsPage() {
  const dispatch = useAppDispatch();
  const saved = useAppSelector(selectApiSettings);
  const [apiUrl, setApiUrl] = useState(saved.apiUrl);
  const [token, setToken] = useState(saved.token);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setApiUrl(saved.apiUrl);
    setToken(saved.token);
  }, [saved.apiUrl, saved.token]);

  const connection = { apiUrl, token };
  const test = async (): Promise<void> => {
    setStatus(null);
    setError(null);
    try {
      const health = await new MediaApi(apiUrl, token).health();
      setStatus(`${health.service} ${health.version} is reachable.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connection failed");
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5">Server connection</Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={() => void test()}>Test connection</Button>
          <Button variant="contained" onClick={() => dispatch(setConnection(connection))}>Apply</Button>
        </Stack>
      </Stack>
      {status ? <Alert severity="success">{status}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Paper variant="outlined">
        <Stack divider={<Divider flexItem />} sx={{ px: 3 }}>
          <SettingsRow title="API base URL" description="Leave blank to use the Vite proxy.">
            <TextField size="small" value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} sx={{ width: 360 }} />
          </SettingsRow>
          <SettingsRow title="Bearer token" description="Kept in memory only.">
            <TextField size="small" type="password" value={token} onChange={(event) => setToken(event.target.value)} sx={{ width: 360 }} />
          </SettingsRow>
        </Stack>
      </Paper>
    </Stack>
  );
}
