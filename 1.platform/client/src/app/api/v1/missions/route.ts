/**
 * POST /api/v1/missions — live missions.
 *
 * Not available on the hosted demo: live missions spend Nebius credits and run
 * for minutes inside a long-lived FastAPI process, which serverless functions
 * cannot host. Point NEXT_PUBLIC_ARCHON_API at a self-hosted orchestrator to go
 * live, or clone the repo and run the server locally.
 */
export async function POST() {
  return Response.json(
    {
      detail:
        "Live missions run on the self-hosted FastAPI orchestrator with Nebius credentials. " +
        "This hosted demo serves recorded missions — play one from the home page, or clone " +
        "the repository to run live missions locally.",
    },
    { status: 503 }
  );
}
