import { listRecordingMetas } from "@/demo-data/recordings";

/** GET /api/v1/replays — the recorded golden-dataset runs. */
export async function GET() {
  return Response.json(listRecordingMetas());
}
