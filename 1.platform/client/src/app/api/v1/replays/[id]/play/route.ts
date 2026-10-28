import { buildReplayId, getRecording } from "@/lib/replay";

/**
 * POST /api/v1/replays/{id}/play — start a replay.
 *
 * The mission id encodes the start time and recording id, so no state is kept
 * between this call and the event stream (or across connection drops).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!getRecording(id)) {
    return Response.json({ detail: "recording not found" }, { status: 404 });
  }
  const speed = Number(new URL(request.url).searchParams.get("speed") ?? 1);
  // The demo streams at real-ish pacing regardless; speed is accepted for API parity.
  void speed;
  const missionId = buildReplayId(id);
  return Response.json(
    { id: missionId, status: "PENDING", stream: `/api/v1/missions/${missionId}/events` },
    { status: 202 }
  );
}
