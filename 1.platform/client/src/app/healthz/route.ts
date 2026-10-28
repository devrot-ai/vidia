import { listRecordingMetas } from "@/demo-data/recordings";

/** Mirrors the FastAPI /healthz contract for the hosted demo. */
export async function GET() {
  return Response.json({
    ok: true,
    env: "production",
    sandbox_backend: "recorded (Token Factory Sandbox runs)",
    llm_backend: "demo",
    models: {
      ultra: "nvidia/Nemotron-3-Ultra-550b-a55b",
      super: "nvidia/nemotron-3-super-120b-a12b",
      nano: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
    },
    live_mode_requires_token: false,
    running_missions: 0,
    tracing: false,
    tracing_project: null,
    max_iterations: 5,
    candidates_per_iteration: 2,
    config_problems: [],
    recordings: listRecordingMetas().length,
  });
}
