/**
 * Stateless replay engine for the hosted demo.
 *
 * A replay id is `rp_<startEpochMs>_<nonce>_<recordingId>`. Everything the
 * stream needs is encoded in the id: given the wall clock, any serverless
 * invocation can recompute which recorded events are due — so an SSE connection
 * can be dropped by a function timeout and resumed with Last-Event-ID without
 * any shared state.
 */

import { getRecording, listRecordingMetas } from "@/demo-data/recordings";
import type { DemoRecording } from "@/demo-data/types";

/** Mirror of the Python recorder's pacing: gaps clamped to [40ms, 1.5s]. */
const MIN_GAP_MS = 40;
const MAX_GAP_MS = 1_500;
/** Longest a full replay may take, so a 5-iteration mission still fits a few connections. */
const TARGET_MAX_TOTAL_MS = 220_000;
/** Self-close a connection before the platform kills it; EventSource reconnects. */
export const CONNECTION_BUDGET_MS = 45_000;

export interface ReplayRef {
  startMs: number;
  recordingId: string;
}

export function buildReplayId(recordingId: string): string {
  const nonce = Math.random().toString(36).slice(2, 8);
  return `rp_${Date.now()}_${nonce}_${recordingId}`;
}

export function parseReplayId(missionId: string): ReplayRef | null {
  if (!missionId.startsWith("rp_")) return null;
  const parts = missionId.slice(3).split("_");
  if (parts.length < 3) return null;
  const startMs = Number(parts[0]);
  if (!Number.isFinite(startMs) || startMs <= 0) return null;
  return { startMs, recordingId: parts.slice(2).join("_") };
}

/**
 * Virtual emission offsets (ms from replay start) for each event, in recording
 * order. Deterministic from the recording alone, so every connection agrees.
 */
export function virtualOffsets(rec: DemoRecording): number[] {
  const times = rec.events.map((e) => Date.parse(e.ts)).filter((t) => Number.isFinite(t));
  const offsets: number[] = [];
  let acc = 0;
  for (let i = 0; i < rec.events.length; i++) {
    if (i > 0) {
      const gap = Math.min(MAX_GAP_MS, Math.max(MIN_GAP_MS, times[i] - times[i - 1]));
      acc += gap;
    }
    offsets.push(acc);
  }
  const scale = acc > TARGET_MAX_TOTAL_MS ? TARGET_MAX_TOTAL_MS / acc : 1;
  return offsets.map((o) => o * scale);
}

export function totalDurationMs(offsets: number[]): number {
  return offsets.length > 0 ? offsets[offsets.length - 1] : 0;
}

export interface MissionSnapshot {
  status: string;
  iteration: number;
  /** Usage aggregated per model from the usage events emitted so far. */
  usage: Array<{ model: string; prompt_tokens: number; completion_tokens: number; cost_usd: number }>;
  spendUsd: number;
  done: boolean;
}

/** Derive the mission state at `elapsedMs` by folding the events that are due. */
export function snapshotAt(rec: DemoRecording, offsets: number[], elapsedMs: number): MissionSnapshot {
  const byModel = new Map<string, { model: string; prompt_tokens: number; completion_tokens: number; cost_usd: number }>();
  let status = "PENDING";
  let iteration = 0;
  let done = false;
  for (let i = 0; i < rec.events.length; i++) {
    if (offsets[i] > elapsedMs) break;
    const e = rec.events[i];
    if (e.kind === "status") {
      status = String(e.payload.status ?? status);
      iteration = Number(e.payload.iteration ?? iteration);
    } else if (e.kind === "usage") {
      const model = String(e.payload.model ?? "unknown");
      const row = byModel.get(model) ?? { model, prompt_tokens: 0, completion_tokens: 0, cost_usd: 0 };
      row.prompt_tokens += Number(e.payload.prompt_tokens ?? 0);
      row.completion_tokens += Number(e.payload.completion_tokens ?? 0);
      row.cost_usd += Number(e.payload.cost_usd ?? 0);
      byModel.set(model, row);
    } else if (e.kind === "done") {
      done = true;
      status = String(e.payload.status ?? status);
      iteration = Number(e.payload.iterations ?? iteration);
    }
  }
  const usage = [...byModel.values()];
  return {
    status,
    iteration,
    usage,
    spendUsd: usage.reduce((acc, u) => acc + u.cost_usd, 0),
    done,
  };
}

/** The events due at `elapsedMs`, strictly after `afterIndex` (0-based). */
export function dueEvents(rec: DemoRecording, offsets: number[], elapsedMs: number, afterIndex: number) {
  const due: Array<{ index: number; event: DemoRecording["events"][number] }> = [];
  for (let i = Math.max(0, afterIndex); i < rec.events.length; i++) {
    if (offsets[i] > elapsedMs) break;
    due.push({ index: i, event: rec.events[i] });
  }
  return due;
}

export function sseFrame(id: number, kind: string, payload: unknown): Uint8Array {
  return new TextEncoder().encode(`id: ${id}\nevent: ${kind}\ndata: ${JSON.stringify(payload)}\n\n`);
}

export const KEEPALIVE_FRAME = new TextEncoder().encode(": keepalive\n\n");
export const STREAM_OPEN_FRAME = new TextEncoder().encode(": archon stream\n\n");

export { getRecording, listRecordingMetas };
