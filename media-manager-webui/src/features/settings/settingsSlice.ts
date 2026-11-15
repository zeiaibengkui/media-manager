import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  PersistedSettings,
} from "../../../../src/shared/api-types.js";
import { MediaApi } from "../../api.js";
import type { ApiSettings } from "../../api.js";
import { defaultSettings } from "../../settings.js";
import type { AppSettings } from "../../settings.js";

interface SettingsState extends AppSettings {
  loading: boolean;
  saving: boolean;
  error: string | null;
}

interface SaveSettingsPayload {
  connection: ApiSettings;
  settings: PersistedSettings;
}

const initial = defaultSettings();
const initialState: SettingsState = {
  ...initial,
  loading: false,
  saving: false,
  error: null,
};

export const fetchSettings = createAsyncThunk<
  PersistedSettings,
  ApiSettings
>("settings/fetch", async (connection) => {
  return new MediaApi(connection.apiUrl, connection.token).settings();
});

export const saveSettings = createAsyncThunk<
  PersistedSettings,
  SaveSettingsPayload
>("settings/save", async ({ connection, settings }) => {
  return new MediaApi(connection.apiUrl, connection.token).saveSettings(settings);
});

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setConnection(state, action: { payload: ApiSettings }) {
      state.apiUrl = action.payload.apiUrl;
      state.token = action.payload.token;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.scanDefaults = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Unable to load settings";
      })
      .addCase(saveSettings.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.saving = false;
        state.scanDefaults = action.payload;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "Unable to save settings";
      });
  },
});

export const { setConnection } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
