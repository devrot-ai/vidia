import { getRecording, parseReplayId, snapshotAt, virtualOffsets } from "@/lib/replay";

/** GET /api/v1/missions/{id}/patch — the selected attempt's patch as text/x-patch. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ref = parseReplayId(id);
  const rec = ref && getRecording(ref.recordingId);
  if (!ref || !rec) {
    return Response.json({ detail: "mission not found" }, { status: 404 });
  }
  const offsets = virtualOffsets(rec);
  const snap = snapshotAt(rec, offsets, Date.now() - ref.startMs);
  const selected = rec.attempts.find((a) => a.selected);
  if (!selected || !(snap.done || rec.mission.status === "VERIFIED")) {
    return Response.json({ detail: "no verified patch for this mission" }, { status: 404 });
  }
  return new Response(selected.patch, {
    headers: {
      "Content-Type": "text/x-patch",
      "Content-Disposition": `attachment; filename="archon-${id}.patch"`,
    },
  });
}
