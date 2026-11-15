import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { HealthResponse } from "../../../../src/shared/api-types.js";
import { MediaApi } from "../../api.js";
import type { ApiSettings } from "../../api.js";

interface HealthState {
  status: "checking" | "connected" | "offline";
  label: string;
}

const initialState: HealthState = {
  status: "checking",
  label: "Checking server",
};

export const fetchHealth = createAsyncThunk<HealthResponse, ApiSettings>(
  "health/fetch",
  async (connection) => new MediaApi(connection.apiUrl, connection.token).health(),
);

const healthSlice = createSlice({
  name: "health",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealth.pending, (state) => {
        state.status = "checking";
      })
      .addCase(fetchHealth.fulfilled, (state, action) => {
        state.status = "connected";
        state.label = `${action.payload.service} ${action.payload.version}`;
      })
      .addCase(fetchHealth.rejected, (state) => {
        state.status = "offline";
        state.label = "Server offline";
      });
  },
});

export const healthReducer = healthSlice.reducer;
