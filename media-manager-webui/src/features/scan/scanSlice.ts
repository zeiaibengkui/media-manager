import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  ScanJob,
  ScanJobListResponse,
  ScanRequest,
} from "../../../../src/shared/api-types.js";
import { MediaApi } from "../../api.js";
import type { ApiSettings } from "../../api.js";

interface StartScanPayload {
  connection: ApiSettings;
  request: ScanRequest;
}

interface JobActionPayload {
  connection: ApiSettings;
  jobId: string;
}

interface ScanState {
  job: ScanJob | null;
  jobs: Record<string, ScanJob>;
  jobIds: string[];
  listLoading: boolean;
  listError: string | null;
  starting: boolean;
  error: string | null;
}

const initialState: ScanState = {
  job: null,
  jobs: {},
  jobIds: [],
  listLoading: false,
  listError: null,
  starting: false,
  error: null,
};

const MAX_LOG_LINES = 500;

export const startScan = createAsyncThunk<ScanJob, StartScanPayload>(
  "scan/start",
  async ({ connection, request }, { dispatch }) => {
    const api = new MediaApi(connection.apiUrl, connection.token);
    const job = await api.startScan(request);
    dispatch(setJob(job));
    return job;
  },
);

export const fetchScanJobs = createAsyncThunk<ScanJobListResponse, ApiSettings>(
  "scan/fetchJobs",
  async (connection) => new MediaApi(connection.apiUrl, connection.token).scanJobs(),
);

export const stopScan = createAsyncThunk<ScanJob, JobActionPayload>(
  "scan/stop",
  async ({ connection, jobId }, { dispatch }) => {
    const job = await new MediaApi(connection.apiUrl, connection.token).stopScan(jobId);
    dispatch(setJob(job));
    return job;
  },
);

export const retryScan = createAsyncThunk<ScanJob, JobActionPayload>(
  "scan/retry",
  async ({ connection, jobId }, { dispatch }) => {
    const job = await new MediaApi(connection.apiUrl, connection.token).retryScan(jobId);
    dispatch(setJob(job));
    return job;
  },
);

const scanSlice = createSlice({
  name: "scan",
  initialState,
  reducers: {
    setJob(state, action: { payload: ScanJob }) {
      const job = {
        ...action.payload,
        events: action.payload.events.slice(-MAX_LOG_LINES),
      };
      state.job = job;
      state.jobs[job.id] = job;
      state.jobIds = [job.id, ...state.jobIds.filter((id) => id !== job.id)];
    },
    resetScan(state) {
      state.job = null;
      state.jobs = {};
      state.jobIds = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startScan.pending, (state) => {
        state.starting = true;
        state.error = null;
      })
      .addCase(startScan.fulfilled, (state) => {
        state.starting = false;
      })
      .addCase(startScan.rejected, (state, action) => {
        state.starting = false;
        state.error = action.error.message ?? "Scan failed";
      })
      .addCase(fetchScanJobs.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchScanJobs.fulfilled, (state, action) => {
        state.listLoading = false;
        const jobs = action.payload.items.map((summary) => ({
          ...summary,
          events: state.jobs[summary.id]?.events ?? [],
        }));
        state.jobs = Object.fromEntries(jobs.map((job) => [job.id, job]));
        state.jobIds = jobs.map((job) => job.id);
      })
      .addCase(fetchScanJobs.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.error.message ?? "Unable to load scan jobs";
      })
      .addCase(stopScan.rejected, (state, action) => {
        state.error = action.error.message ?? "Unable to stop scan job";
      })
      .addCase(retryScan.rejected, (state, action) => {
        state.error = action.error.message ?? "Unable to retry scan job";
      });
  },
});

export const { setJob, resetScan } = scanSlice.actions;
export const scanReducer = scanSlice.reducer;
