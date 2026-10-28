import {
  CONNECTION_BUDGET_MS,
  KEEPALIVE_FRAME,
  STREAM_OPEN_FRAME,
  dueEvents,
  getRecording,
  parseReplayId,
  sseFrame,
  totalDurationMs,
  virtualOffsets,
} from "@/lib/replay";

// The stream self-closes before the platform kills it; EventSource reconnects
// with Last-Event-ID and the next invocation resumes from the same virtual clock.
export const maxDuration = 60;

const KEEPALIVE_MS = 15_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GET /api/v1/missions/{id}/events — the SSE replay stream.
 *
 * The replay id encodes the wall-clock start and the recording id, so the
 * timeline is a pure function of (recording, now, last-event-id): stateless
 * serverless invocations agree on what is due, and a dropped connection
 * resumes exactly where it left off.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ref = parseReplayId(id);
  const rec = ref && getRecording(ref.recordingId);
  if (!ref || !rec) {
    return Response.json({ detail: "mission not found" }, { status: 404 });
  }

  const lastHeader = request.headers.get("last-event-id") ?? request.headers.get("Last-Event-ID");
  const afterIndex = Number.parseInt(lastHeader ?? "0", 10); // 1-based id == index + 1
  const resumeIndex = Number.isFinite(afterIndex) && afterIndex > 0 ? afterIndex : 0;

  const offsets = virtualOffsets(rec);
  const total = totalDurationMs(offsets);
  const deadline = Date.now() + CONNECTION_BUDGET_MS;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(STREAM_OPEN_FRAME);
      let lastEmitted = resumeIndex; // count of events delivered (id space)
      let idleSince = Date.now();
      try {
        while (true) {
          const now = Date.now();
          const elapsed = now - ref.startMs;
          const due = dueEvents(rec, offsets, elapsed, lastEmitted);
          if (due.length > 0) {
            for (const { index, event } of due) {
              controller.enqueue(sseFrame(index + 1, event.kind, event.payload));
              lastEmitted = index + 1;
            }
            idleSince = now;
          }
          if (lastEmitted >= rec.events.length) {
            break; // terminal event sent; the client closes on `done`
          }
          if (now >= deadline) {
            controller.close(); // budget spent; EventSource reconnects with Last-Event-ID
            return;
          }
          if (now - idleSince >= KEEPALIVE_MS) {
            controller.enqueue(KEEPALIVE_FRAME);
            idleSince = now;
          }
          const nextOffset = offsets[lastEmitted] ?? total;
          const waitMs = Math.max(50, Math.min(1_000, nextOffset - (Date.now() - ref.startMs)));
          await sleep(waitMs);
        }
        controller.close();
      } catch {
        // client disconnected mid-flight; nothing to clean up
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
