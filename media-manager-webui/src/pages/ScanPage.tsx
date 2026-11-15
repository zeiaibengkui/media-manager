import { useEffect, useRef, useState } from "react";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { MediaApi } from "../api.js";
import { useAppDispatch, useAppSelector } from "../app/hooks.js";
import { selectApiSettings } from "../app/selectors.js";
import { fetchMedia } from "../features/media/mediaSlice.js";
import { ScanForm } from "../features/scan/ScanForm.js";
import { ScanJobList } from "../features/scan/ScanJobList.js";
import { ScanProgress } from "../features/scan/ScanProgress.js";
import {
  fetchScanJobs,
  retryScan,
  setJob,
  startScan,
  stopScan,
} from "../features/scan/scanSlice.js";

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function ScanPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const connection = useAppSelector(selectApiSettings);
  const defaults = useAppSelector((state) => state.settings.scanDefaults);
  const {
    job,
    jobs,
    jobIds,
    starting,
    error,
    listLoading,
    listError,
  } = useAppSelector((state) => state.scan);
  const [pollError, setPollError] = useState<string | null>(null);
  const handledJob = useRef<string | null>(null);
  const activeJob = jobId ? jobs[jobId] ?? null : job;

  useEffect(() => {
    void dispatch(fetchScanJobs(connection));
    const interval = window.setInterval(() => {
      void dispatch(fetchScanJobs(connection));
    }, 3_000);
    return () => window.clearInterval(interval);
  }, [connection, dispatch]);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    const api = new MediaApi(connection.apiUrl, connection.token);

    const poll = async (): Promise<void> => {
      try {
        let next = await api.scanJob(jobId);
        while (!cancelled) {
          dispatch(setJob(next));
          setPollError(null);
          if (next.status === "completed" || next.status === "failed") return;
          await delay(700);
          next = await api.scanJob(jobId);
        }
      } catch (cause) {
        if (!cancelled) {
          setPollError(cause instanceof Error ? cause.message : "Unable to load scan job");
        }
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [connection, dispatch, jobId]);

  useEffect(() => {
    if (activeJob?.status === "completed" && handledJob.current !== activeJob.id) {
      handledJob.current = activeJob.id;
      void dispatch(fetchMedia({ connection }));
    }
  }, [activeJob, connection, dispatch]);

  const start = async (request: Parameters<typeof startScan>[0]["request"]): Promise<void> => {
    try {
      const created = await dispatch(startScan({ connection, request })).unwrap();
      navigate(`/scan/${created.id}`);
    } catch {
      // The rejected thunk populates the shared scan error.
    }
  };

  const stop = async (targetId: string): Promise<void> => {
    try {
      await dispatch(stopScan({ connection, jobId: targetId })).unwrap();
    } catch {
      // The rejected thunk populates the shared scan error.
    }
  };

  const retry = async (targetId: string): Promise<void> => {
    try {
      const created = await dispatch(retryScan({ connection, jobId: targetId })).unwrap();
      navigate(`/scan/${created.id}`);
    } catch {
      // The rejected thunk populates the shared scan error.
    }
  };

  return (
    <Stack spacing={3} sx={{ height: "100%", overflowY: "auto", pr: 1 }}>
      <Box>
        <Typography variant="h4">Scan</Typography>
        <Typography color="text.secondary">
          Ask the local server to import a photo directory.
        </Typography>
      </Box>
      {error || pollError || listError ? (
        <Alert severity="error">{error ?? pollError ?? listError}</Alert>
      ) : null}
      {listLoading ? <Typography color="text.secondary">Loading scan jobs...</Typography> : null}
      <ScanJobList
        jobIds={jobIds}
        jobs={jobs}
        activeJobId={jobId}
        onStop={(id) => void stop(id)}
        onRetry={(id) => void retry(id)}
      />
      <ScanForm defaults={defaults} starting={starting} onStart={(request) => void start(request)} />
      <ScanProgress job={activeJob} />
    </Stack>
  );
}
