import { getRecording, parseReplayId, snapshotAt, virtualOffsets } from "@/lib/replay";

/**
 * GET /api/v1/missions/{id} — mission detail (attempts + usage).
 *
 * Replay ids carry their start time, so the snapshot reflects "now" in the
 * replay's virtual timeline: an early fetch shows PENDING, a late one VERIFIED.
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
  return Response.json({
    id,
    type: rec.mission.type,
    repo_url: rec.mission.repo_url,
    git_ref: rec.mission.git_ref,
    test_command: rec.mission.test_command,
    swe_instance_id: rec.mission.swe_instance_id,
    status: snap.status,
    iteration: snap.iteration,
    spend_usd: snap.spendUsd,
    created_at: rec.mission.created_at,
    // Attempts (and their patches) only exist for the viewer once the replay has
    // produced them; before that the cockpit builds its tabs from live events.
    attempts: snap.done ? rec.attempts : [],
    usage: snap.usage,
  });
}
