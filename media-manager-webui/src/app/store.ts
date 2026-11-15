import { configureStore } from "@reduxjs/toolkit";
import { albumsReducer } from "../features/albums/albumsSlice.js";
import { duplicatesReducer } from "../features/duplicates/duplicatesSlice.js";
import { healthReducer } from "../features/health/healthSlice.js";
import { mediaReducer } from "../features/media/mediaSlice.js";
import { scanReducer } from "../features/scan/scanSlice.js";
import { settingsReducer } from "../features/settings/settingsSlice.js";
import { uiReducer } from "../features/ui/uiSlice.js";

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    health: healthReducer,
    albums: albumsReducer,
    media: mediaReducer,
    duplicates: duplicatesReducer,
    scan: scanReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
