import {
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

interface SettingsRowProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsRow({ title, description, children }: SettingsRowProps) {
  return (
    <Grid container spacing={3} sx={{ alignItems: "center", py: 2 }}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Typography>{title}</Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : null}
      </Grid>
      <Grid size={{ xs: 12, md: 7 }}>
        <Stack direction="row" sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}>
          {children}
        </Stack>
      </Grid>
    </Grid>
  );
}
