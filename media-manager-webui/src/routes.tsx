import { lazy, Suspense } from "react";
import { CircularProgress, Stack } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";
import { App } from "./App.js";
import { AlbumMediaPage } from "./pages/AlbumMediaPage.js";
import { AlbumsPage } from "./pages/AlbumsPage.js";
import { DuplicatesPage } from "./pages/DuplicatesPage.js";
import { LibraryPage } from "./pages/LibraryPage.js";
import { ScanPage } from "./pages/ScanPage.js";
import { ScanSettingsPage } from "./pages/ScanSettingsPage.js";
import { ServerSettingsPage } from "./pages/ServerSettingsPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";

const MapPage = lazy(() =>
  import("./pages/MapPage.js").then((module) => ({ default: module.MapPage })),
);

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<App />}>
        <Route index element={<Navigate to="/photos" replace />} />
        <Route path="/photos" element={<LibraryPage />} />
        <Route path="/favorites" element={<LibraryPage favoriteOnly />} />
        <Route path="/albums" element={<AlbumsPage />} />
        <Route path="/albums/:albumId" element={<AlbumMediaPage />} />
        <Route path="/duplicates" element={<DuplicatesPage />} />
        <Route
          path="/map"
          element={(
            <Suspense fallback={<Stack sx={{ alignItems: "center", py: 8 }}><CircularProgress /></Stack>}>
              <MapPage />
            </Suspense>
          )}
        />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/scan/:jobId" element={<ScanPage />} />
        <Route path="/settings" element={<SettingsPage />}>
          <Route index element={<Navigate to="server" replace />} />
          <Route path="server" element={<ServerSettingsPage />} />
          <Route path="scan" element={<ScanSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/photos" replace />} />
      </Route>
    </Routes>
  );
}
