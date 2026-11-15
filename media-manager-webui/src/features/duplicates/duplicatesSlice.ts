import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  DuplicatesResponse,
  DuplicatePair,
  ResolveDuplicateRequest,
  ResolveDuplicateResponse,
} from "../../../../src/shared/api-types.js";
import { MediaApi } from "../../api.js";
import type { ApiSettings } from "../../api.js";

export interface DuplicatesRequest extends ApiSettings {
  threshold: number;
}

interface ResolvePayload {
  connection: ApiSettings;
  request: ResolveDuplicateRequest;
}

interface DuplicatesState {
  pairs: DuplicatePair[];
  hasMore: boolean;
  threshold: number;
  loading: boolean;
  error: string | null;
}

const initialState: DuplicatesState = {
  pairs: [],
  hasMore: false,
  threshold: 0.9,
  loading: false,
  error: null,
};

export const fetchDuplicates = createAsyncThunk<DuplicatesResponse, DuplicatesRequest>(
  "duplicates/fetch",
  async ({ apiUrl, token, threshold }) =>
    new MediaApi(apiUrl, token).duplicates(threshold),
);

export const resolveDuplicate = createAsyncThunk<
  ResolveDuplicateResponse & { leftHash: string; rightHash: string },
  ResolvePayload
>("duplicates/resolve", async ({ connection, request }) => {
  const result = await new MediaApi(connection.apiUrl, connection.token)
    .resolveDuplicate(request);
  return { ...result, leftHash: request.leftHash, rightHash: request.rightHash };
});

const duplicatesSlice = createSlice({
  name: "duplicates",
  initialState,
  reducers: {
    setThreshold(state, action: { payload: number }) {
      state.threshold = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDuplicates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDuplicates.fulfilled, (state, action) => {
        state.loading = false;
        state.pairs = action.payload.candidates;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchDuplicates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Unable to load duplicates";
      })
      .addCase(resolveDuplicate.fulfilled, (state, action) => {
        state.pairs = state.pairs.filter((pair) =>
          !(
            (pair.left.fileHash === action.payload.leftHash &&
              pair.right.fileHash === action.payload.rightHash) ||
            (pair.left.fileHash === action.payload.rightHash &&
              pair.right.fileHash === action.payload.leftHash)
          ),
        );
      })
      .addCase(resolveDuplicate.rejected, (state, action) => {
        state.error = action.error.message ?? "Unable to resolve duplicate";
      });
  },
});

export const { setThreshold } = duplicatesSlice.actions;
export const duplicatesReducer = duplicatesSlice.reducer;
