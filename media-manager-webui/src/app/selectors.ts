import { createSelector } from "@reduxjs/toolkit";
import type { ApiSettings } from "../api.js";
import type { RootState } from "./store.js";

export const selectApiSettings = createSelector(
  [(state: RootState) => state.settings.apiUrl, (state: RootState) => state.settings.token],
  (apiUrl, token): ApiSettings => ({ apiUrl, token }),
);
