import { SWE_INSTANCES } from "@/demo-data/instances";

/** GET /api/v1/swe-instances — catalog for the mission-form dropdown. */
export async function GET() {
  return Response.json(SWE_INSTANCES);
}
