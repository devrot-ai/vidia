import { getRecording, parseReplayId, snapshotAt, virtualOffsets } from "@/lib/replay";

/**
 * GET /api/v1/missions/{id}/diff — the selected attempt's diff.
 *
 * Returns the recorded files once the replay has reached the review approval;
 * before that the diff is empty, exactly like a live mission.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ref = parseReplayId(id);
  const rec = ref && getRecording(ref.recordingId);
  if (!ref || !rec) {
    return Response.json({ detail: "mission not found" }, { status: 404 });
  }
  const offsets = virtualOffsets(rec);
  const snap = snapshotAt(rec, offsets, Date.now() - ref.startMs);
  const hasPatch = rec.mission.diff.length > 0 && (snap.done || rec.mission.status === "VERIFIED");
  return Response.json(hasPatch ? rec.mission.diff : []);
}
