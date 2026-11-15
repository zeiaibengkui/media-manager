import { randomUUID } from "node:crypto";
import type {
  ScanEvent,
  ScanJob,
  ScanRequest,
} from "../shared/api-types.js";
import {
  createScanJob,
  findScanJob,
  listScanJobs,
  markInterruptedJobs,
  updateScanJob,
} from "./db/scan-job-repo.js";
import { scanDirectory } from "./scanner.js";
const MAX_EVENTS = 500;

export class ScanJobActionError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
export class ScanJobManager {
  private readonly jobs = new Map<string, ScanJob>();
  private readonly queue: string[] = [];
  private readonly controllers = new Map<string, AbortController>();
  private running = false;
  private ready: Promise<void> | null = null;

  private async initialize(): Promise<void> {
    await markInterruptedJobs();
    for (const job of await listScanJobs()) {
      this.jobs.set(job.id, job);
    }
  }

  private async ensureReady(): Promise<void> {
    this.ready ??= this.initialize();
    await this.ready;
  }

  async start(request: ScanRequest, retryOf: string | null = null): Promise<ScanJob> {
    await this.ensureReady();
    const now = new Date().toISOString();
    const job: ScanJob = {
      id: randomUUID(),
      status: "queued",
      request,
      summary: null,
      events: [],
      error: null,
      retryOf,
      createdAt: now,
      updatedAt: now,
    };
    await createScanJob(job);
    this.jobs.set(job.id, job);
    this.queue.push(job.id);
    void this.drain().catch((error: unknown) => {
      console.error("Scan job queue failed:", error);
    });
    return job;
  }

  async get(id: string): Promise<ScanJob | undefined> {
    await this.ensureReady();
    return this.jobs.get(id) ?? await findScanJob(id) ?? undefined;
  }

  async list(): Promise<ScanJob[]> {
    await this.ensureReady();
    return [...this.jobs.values()].sort(
      (left, right) => right.createdAt.localeCompare(left.createdAt),
    );
  }

  async stop(id: string): Promise<ScanJob> {
    const job = await this.get(id);
    if (!job) {
      throw new ScanJobActionError(404, "SCAN_NOT_FOUND", "Scan job not found");
    }
    if (["completed", "failed", "stopped"].includes(job.status)) {
      return job;
    }
    const queueIndex = this.queue.indexOf(id);
    if (queueIndex >= 0) this.queue.splice(queueIndex, 1);
    this.controllers.get(id)?.abort();
    job.status = "stopped";
    job.updatedAt = new Date().toISOString();
    await updateScanJob(job);
    return job;
  }

  async retry(id: string): Promise<ScanJob> {
    const job = await this.get(id);
    if (!job) {
      throw new ScanJobActionError(404, "SCAN_NOT_FOUND", "Scan job not found");
    }
    if (!["completed", "failed", "stopped"].includes(job.status)) {
      throw new ScanJobActionError(409, "SCAN_ACTIVE", "Only finished jobs can be retried");
    }
    return this.start(job.request, job.id);
  }

  private addEvent(job: ScanJob, event: ScanEvent): void {
    job.events.push(event);
    if (job.events.length > MAX_EVENTS) job.events = job.events.slice(-MAX_EVENTS);
    job.updatedAt = new Date().toISOString();
  }

  private async run(job: ScanJob): Promise<void> {
    const controller = new AbortController();
    this.controllers.set(job.id, controller);
    job.status = "running";
    job.updatedAt = new Date().toISOString();
    await updateScanJob(job);
    try {
      job.summary = await scanDirectory(job.request, (event) => this.addEvent(job, event), controller.signal);
      job.status = "completed";
    } catch (error) {
      job.status = controller.signal.aborted ? "stopped" : "failed";
      job.error = controller.signal.aborted ? null : errorMessage(error);
      if (job.error) this.addEvent(job, { type: "warning", message: job.error });
    } finally {
      this.controllers.delete(job.id);
      job.updatedAt = new Date().toISOString();
      await updateScanJob(job);
    }
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (this.queue.length > 0) {
        const job = this.jobs.get(this.queue.shift() as string);
        if (job?.status === "queued") await this.run(job);
      }
    } finally {
      this.running = false;
    }
  }
}
