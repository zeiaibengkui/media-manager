import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    query: "",
  },
  reducers: {
    setQuery(state, action: { payload: string }) {
      state.query = action.payload;
    },
  },
});

export const { setQuery } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
