import { useEffect } from "react";
import {
  Box,
  Container,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./app/hooks.js";
import { fetchHealth } from "./features/health/healthSlice.js";
import { fetchSettings } from "./features/settings/settingsSlice.js";
import { AppHeader } from "./layout/AppHeader.js";
import { DesktopNav } from "./layout/DesktopNav.js";
import { MobileNav } from "./layout/MobileNav.js";

export function App() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const dispatch = useAppDispatch();
  const apiUrl = useAppSelector((state) => state.settings.apiUrl);
  const token = useAppSelector((state) => state.settings.token);

  useEffect(() => {
    const connection = { apiUrl, token };
    void dispatch(fetchSettings(connection));
    void dispatch(fetchHealth(connection));
    const interval = window.setInterval(() => {
      void dispatch(fetchHealth(connection));
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [apiUrl, dispatch, token]);

  return (
    <Box sx={{ height: "100vh", overflow: "hidden", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      <AppHeader />
      {!desktop ? <MobileNav /> : null}
      <Stack direction={desktop ? "row" : "column"} sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
        {desktop ? <DesktopNav /> : null}
        <Box component="main" sx={{ flexGrow: 1, minWidth: 0, minHeight: 0, overflow: "hidden" }}>
          <Container maxWidth="xl" sx={{ height: "100%" }}>
            <Box sx={{ height: "100%", py: desktop ? 3 : 2 }}>
              <Outlet />
            </Box>
          </Container>
        </Box>
      </Stack>
    </Box>
  );
}
