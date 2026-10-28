import { getRecording, parseReplayId } from "@/lib/replay";

/**
 * POST /api/v1/missions/{id}/abort — replay missions cannot be aborted.
 *
 * Replays are deterministic streams of recorded events; there is nothing to
 * stop and nothing to spend. Returns the state so the UI can explain itself.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ref = parseReplayId(id);
  const rec = ref && getRecording(ref.recordingId);
  if (!ref || !rec) {
    return Response.json({ detail: "mission not found" }, { status: 404 });
  }
  return Response.json({
    aborted: false,
    detail: "replays are recorded missions and cannot be aborted; close the tab to stop watching",
  });
}
