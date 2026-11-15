import { Grid, Stack, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import { SettingsNav } from "../features/settings/SettingsNav.js";

export function SettingsPage() {
  return (
    <Stack spacing={3} sx={{ height: "100%", overflow: "hidden" }}>
      <Typography variant="h4">Settings</Typography>
      <Grid container spacing={4} sx={{ flexGrow: 1, minHeight: 0 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <SettingsNav />
        </Grid>
        <Grid size={{ xs: 12, md: 9 }} sx={{ height: "100%", overflowY: "auto", pr: 1 }}>
          <Outlet />
        </Grid>
      </Grid>
    </Stack>
  );
}
