# ARCHON — Sessions and Decision Log

> Running journal for the build. Each session records what was done, what was decided and why, what blocked, and what is next. Architectural Decision Records (ADRs) live here and are numbered once; superseded ADRs are marked, not deleted.

---

## Session 0 — September 11, 2026 (afternoon): Research and first specification

**Done**
1. Read the Devpost overview, rules, and resources pages. Recorded tracks, prizes, dates, judging criteria, and credits in [../info.md](../info.md).
2. Created the repository skeleton, Apache 2.0 license, [CONTRIBUTING.md](../../CONTRIBUTING.md), [SECURITY.md](../../SECURITY.md).
3. Wrote the first versions of [../problem+solution.md](../problem+solution.md), [PRD.md](PRD.md), [DESIGN.md](DESIGN.md), [AGENTS.md](AGENTS.md), [PLAN.md](PLAN.md), [TESTING.md](TESTING.md), and [../prior-art.md](../prior-art.md).

---

## Session 1 — September 11, 2026 (evening): Audit and correction

**Done**
1. Full audit of every document against the live Devpost pages, Nebius Token Factory docs, Sandboxes docs, NVIDIA model cards, and current vendor pricing.
2. Corrected every model ID to the real Token Factory identifiers. Removed references to the 2024 Llama-3.1-Nemotron-70B model.
3. Rewrote the sandbox design around Token Factory Sandboxes and `contree-sdk` instead of a self-managed Docker design.
4. Removed false completion claims from the README checklist and PLAN milestones. Nothing in `1.platform/` exists yet and the docs now say so.
5. Cut scope (ADR-005). Replaced unsourced statistics with sourced pricing. Removed self-scoring and hype language.
6. Added `.gitignore`, removed a stray empty directory, filled empty READMEs, created [../../2.submission/FEEDBACK.md](../../2.submission/FEEDBACK.md).
7. Fixed absolute `file:///` links that were broken on GitHub.

**Blockers**
- Sandboxes beta access not yet requested. This is the first task of Session 2.
- Nemotron 3 Nano exact model ID not yet confirmed against `GET /v1/models`.
- Nebius list price for Ultra taken from a third-party catalog; needs confirmation on the Token Factory pricing page.

**Next**
1. Request Sandboxes beta access. Claim both $25 credits.
2. Run `GET /v1/models?verbose=true`, record IDs and prices in `pricing.json`.
3. Week 1 spike per [PLAN.md](PLAN.md): FastAPI scaffold, one Nemotron call, one sandbox run.

---

## Session 2 — September 11, 2026 (night): Server build

**Done**
1. Scaffolded `1.platform/server`: FastAPI app, typed settings, SQLite store, event bus, SSE endpoint with `Last-Event-ID` resume.
2. Installed and introspected `contree-sdk` 0.3.6. The docs lag the package: `Contree(token=, base_url=)` also needs `NEBIUS_PROJECT_ID`; `image.run(shell=, timeout=, files=, disposable=False)` creates fork points; results expose `exit_code`, `stdout`, `stderr`, `cost`, and the new image `uuid`. `ContreeBackend` is written against the real API.
3. Three sandbox backends behind one protocol: `contree` (Token Factory Sandboxes), `local` (development only, copy-on-fork directories, refused in production), `fake` (scripted, for tests).
4. Mission runner implementing the full state machine: provision, baseline, Tavily grounding, Ultra diagnose-and-patch, N candidates on N forks, scoring (no pass-to-pass regressions first), reviewer, spend cap, abort, failure report, recording.
5. Migration mission: ripgrep scan, model mapping from `pricing.json`, cost estimate, model-level parity sample with the honest caveat.
6. Roles: researcher, engineer (with `files_to_read` rounds), reviewer (deterministic safety checks then Super), compactor, narrator.
7. Test parsing: JUnit XML written inside the sandbox, text fallback. Found and fixed the `pytest -q` gap where passing tests were not counted.
8. 43 unit tests, ruff and mypy strict clean, GitHub Actions CI. Golden runner (`tests/golden/run.py`) proves the loop end to end on the local backend with a scripted model.
9. Three fixture repositories for the golden set: `broken_pydantic_v2` (4 of 6 tests fail, reference patch fixes all 6), `openai_chat_service`, `anthropic_summarizer`.
10. Client cockpit built (`1.platform/client`, Next.js 16, Zustand, Monaco, xterm) and verified in the browser against the live server: replay of the recorded local run renders the reasoning stream, per-attempt terminal tabs, reviewer verdict, per-model token totals, Monaco diff, and patch download. Fixed a duplicate-tab reducer bug found in that walkthrough.
11. Development launch configs: `1.platform/server/scripts/dev.sh` (offline backends by default) and `.claude/launch.json`. Dev server uses port 8010 because 8000 was taken on this machine.

**Decisions**
- ADR-008: the supervisor is deterministic code, not a model. Super narrates optionally. See AGENTS.md 2.1.
- ADR-009: test results come from a JUnit report produced inside the sandbox, never from parsing terminal text alone.

**Blockers**
- Sandboxes beta access requested; `ContreeBackend` is untested against the live API until it arrives.
- No `NEBIUS_API_KEY` or `TAVILY_API_KEY` in this environment; live integration tests are written and skip cleanly.

**Next**
1. When keys arrive: `pytest tests/integration -q`, then `python -m tests.golden.run --fixture broken_pydantic_v2 --llm nebius --backend local --record`.
2. When Sandboxes access arrives: run the week-1 gate test in `tests/integration/test_live.py`, then pick 10 SWE-bench Verified instances and fill `tests/golden/instances.json`.
3. Live-stream terminal lines from Sandboxes operations instead of emitting them after each command completes.

---

## Session 3 — September 12, 2026: Keys, Tavily CLI, LangSmith tracing

**Done**
1. Nebius Builders application accepted. `.env` populated with `TAVILY_API_KEY` and `LANGSMITH_API_KEY` (Nebius key and project id still pending).
2. Followed Tavily's agent-setup skill: Tavily CLI 0.1.8 installed and authenticated with the project key, eight Tavily agent skills installed globally for Claude Code, live search verified through the CLI and through `tests/integration/test_live.py::test_tavily_search`.
3. Installed the LangSmith skills (`langsmith-trace`, `langsmith-dataset`, `langsmith-evaluator`) and the `langsmith` CLI globally. Verified the key against the LangSmith API.
4. Added tracing per the `langsmith-trace` skill: `wrap_openai` on the Nebius client, `@traceable` spans on every role, sandbox operation, Tavily search, and the mission root, with input/output scrubbing. Key-gated; six unit tests.

5. First live Nebius calls. Verified the real model IDs and prices from `GET /v1/models?verbose=true`: Ultra `nvidia/Nemotron-3-Ultra-550b-a55b` $1/$3, Super `nvidia/nemotron-3-super-120b-a12b` $0.30/$0.90, Nano `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` $0.06/$0.24, plus `nvidia/Nemotron-3_5-Lightning` at Nano prices with 1M context. Corrected every ID in code and docs; `pricing.json` now marks Nebius prices verified.
6. Found that Nemotron 3 reasons before answering and can return empty `content` when the budget is small. Added `enable_thinking` control per task (on for patch synthesis, off elsewhere) and a retry that doubles the budget when reasoning is truncated.
7. Sandboxes: authentication works, but the key has no Sandboxes permissions yet (all `false` in `whoami`). Beta access still needs to be granted for the project.
8. The pasted `NEBIUS_API_KEY` was a short-lived IAM token (expiry within hours). A long-lived Token Factory API key is required.

**Decisions**
- ADR-011: thinking is a per-task routing decision, not a global switch. Ultra thinks for patches; Super and Nano answer directly for research, review, and compaction.
- ADR-010: LangSmith tracing is in scope after all, as an optional key-gated layer. ADR-005's cut still applies to LangSmith as a required dependency: without the key nothing changes.

**Blockers**
- Need a long-lived Token Factory API key in `.env` (the current value is a short-lived IAM token).
- Sandboxes beta permissions not yet granted for `NEBIUS_PROJECT_ID`.

---

## Session 4 — September 12, 2026 (afternoon): Sandboxes live, first real Nemotron mission

**Done**
1. Sandboxes beta enabled. Week-1 gate passed against the real API: spawn `python:3.12-slim`, fork isolation, `apt-get install git`, `git clone psf/requests`, `pip install -e .`, pytest exit 0 inside the VM, about 30 seconds end to end.
2. Provisioning installs git first when the base image lacks it.
3. First real Nemotron mission (Ultra + Super + Nano, Tavily, LangSmith) on `broken_pydantic_v2` via the local backend: FAILED after 5 iterations, $0.07. Ultra's diagnosis and fix description were right every time; its unified diffs never applied, and the loop fed back only "git apply failed", so it repeated itself.
4. ADR-012: candidates are exact search-and-replace edits applied by the executor; git produces the diff. Precise apply errors are fed back to the engineer. 8 new unit tests.
5. Confirmed the Sandboxes `whoami` expiry is a derived session token, not the API key.
6. Reran the mission with edit-based candidates: **VERIFIED in 1 iteration, 35 s, $0.017.** Three Tavily queries synthesized by Super from the real error signatures, Ultra's edits applied first time, 6/6 tests, reviewer approved. Recording kept as `live-broken_pydantic_v2-nemotron-local.json`.

7. SWE-bench Verified support: `tests/golden/fetch_swe.py` pulls instance metadata from Hugging Face; the runner starts from the preloaded `swebench/...` catalog image, applies the instance test patch, runs only the instance's FAIL_TO_PASS and PASS_TO_PASS ids under `conda activate testbed`, and hands the problem statement to the engineer. Six `psf/requests` instances loaded.
8. Two more real-API findings fixed: the Sandboxes shell is `/bin/sh` (conda activation silently no-ops there, so the backend now runs through bash when present), and the engineer had been constructed before the per-instance `/testbed` sandbox service was swapped in, so its file reads went to `/work/repo`. The engineer now also receives the repository file list, the failing test source, and close-match hints for wrong paths.
9. **`psf__requests-1142` RESOLVED in a Token Factory Sandbox: 1 iteration, 49 s, $0.032.** Recording kept as `swe-psf__requests-1142-sandbox-nemotron.json`.

10. Batch of five more instances: 1921 VERIFIED (1 iteration, $0.05), 2931 VERIFIED (5 iterations, $0.26); 2317 and 1766 failed on an engineer loop bug (re-requesting files it already had until the round limit); 5414 failed because the SWE-bench dataset stores two parametrized ids truncated at a space, pytest aborted with exit 4, zero tests ran, and every attempt was judged against nothing.
11. Fixes: normalized dedupe of requested files with a hard "no more reading" stop, line-range reads (`path:START-END`), 150 KB excerpt cap; truncated ids dropped from the test command and instance-scoped judging (FAIL_TO_PASS must pass, PASS_TO_PASS must not break, prefix matching) so unrelated failures in the same file no longer block resolution; fail fast when a baseline runs zero tests.
12. CI red on `main`: when the repo dir became configurable, clone and patch commands used absolute paths that the development local backend does not map. Made relative; the slow local-backend test passes again. Also `git add -A -- . ':!.venv'` errored on the gitignored in-repo venv; now `git add -A`.
13. Repository renamed to `CodeWithEugene/Archon` and made public. References and the git remote updated.
15. Subproject missions: `subdir` on mission create scopes install, tests, file list, excerpts, and edits to a directory inside the repository (monorepos). The Pydantic fixture inside this repository is the test case. First scoped run still failed because Ultra paraphrased the source instead of copying it (invented fields); the edit-mismatch report now quotes the real file text at the mismatch point, sources are placed before the file list in the prompt, and fixture answer keys (`solution.patch`, `EXPECTED_FIX.md`) are hidden from the file list.
16. `psf__requests-2317`: the run has network-bound tests that hang inside the sandbox; the 15-minute command limit was hit. `pytest-timeout` is now installed on the fly with `--timeout=30 --timeout-method=signal`.
17. `psf__requests-2317` VERIFIED with the signal-based per-test timeout (2 iterations, $0.21). **Six of six SWE-bench Verified instances resolved inside Token Factory Sandboxes.**
14. Reruns after the fixes: 1766 VERIFIED (1 iteration, $0.037), 5414 VERIFIED (1 iteration, $0.075). Five of six instances resolved. Two more resilience fixes from the reruns: Ultra sometimes drops the leading `1.` of a path and sometimes writes its reasoning into `content` until the token ceiling; paths now resolve by unique suffix, truncated non-JSON replies retry with a larger budget and then with thinking off, and a non-JSON engineer turn costs one iteration instead of the mission.

**Decisions**
- ADR-012: no model-written unified diffs. Edits in, `git diff` out.
- ADR-014: resolution for SWE-bench missions is judged on the instance's FAIL_TO_PASS and PASS_TO_PASS ids with prefix matching, never on the process exit code, because the dataset contains truncated ids and the test files contain unrelated network-dependent tests.
- ADR-013: SWE-bench missions follow the harness exactly: apply the test patch first, run only the instance's own test ids, judge on fail-to-pass and pass-to-pass.

---

## Session 5 — September 23, 2026: Hardening, the hosted demo, and honest migrations

**Done**
1. Audit and hardening pass. Fixed the dev-only `LocalBackend` hermeticity bug (`bash -lc` executed the developer's shell profile inside "sandbox" runs, so dotfiles output polluted captured stdout and broke a unit test on machines with chatty profiles; now `bash --noprofile --norc -c`). The full unit suite passes locally again (the CI runner had masked the bug with a clean profile).
2. Public-API hardening for the judging window: aborting a mission now requires the demo token (previously anyone could enumerate mission ids via the public list endpoint and kill live missions); the mission-listing endpoint was removed (it exposed other users' hints and targets; the cockpit never used it); replay playback is rate-limited per IP (12/hour) and capped globally (30 concurrent) so the free demo cannot be flooded; the rate-limit counter dicts no longer grow without bound; the Tavily query cache is capped at 128 entries.
3. Memory: `EventBus.forget()` existed but was never called — every mission's full event history stayed in RAM for the process lifetime. Live missions now free their history after recording (late subscribers fall back to the persisted SQLite log), and replay playback frees its history at completion. Unit tests assert against the store's durable log instead of the bus.
4. Cockpit: the iteration denominator now comes from `/healthz` instead of the hardcoded 5, so a server configured with a different cap renders correctly.
5. **Hosted public demo: [archon-cockpit.vercel.app](https://archon-cockpit.vercel.app)** (ADR-016). The Next.js app gained a stateless replay server under `src/app/api/` implementing the same REST + SSE contract as the FastAPI orchestrator, but streaming **recorded** golden-dataset missions: replay ids encode the start time and recording id, so any serverless invocation recomputes the stream position from wall clock plus `Last-Event-ID`, and connections that hit the function-duration limit resume transparently. `npm run gen:demo` regenerates the dataset from the server's recordings. Live missions answer 503 with a pointer to the self-hosted orchestrator. Verified end to end on the deployed URL: list, play, progressive SSE streaming, virtual-time mission detail (spend accrues), diff, patch download, late-joiner fast-forward, Last-Event-ID resume.
6. **Migration gate (ADR-015).** The first live migration runs exposed a false positive: both fixtures came back "VERIFIED" with patches that never touched the client (a 2-line test-name change; a dependency swap in `pyproject.toml`) — mocked tests stay green when the client was never rewritten. Migrations are now complete only when a post-patch ripgrep scan finds no Anthropic client constructions and no closed-provider model literals in source files; otherwise the exact residuals are fed to the next engineer call. Unit test added; suite 66 green, ruff and mypy strict clean.
7. Migration fixtures re-run live on Nemotron with the gate. `openai_chat_service`: **VERIFIED, 1 iteration, 75 s, $0.016** — the patch genuinely rewrites `chatsvc/client.py` to `OpenAI(base_url=os.getenv("NEBIUS_BASE_URL", ...), api_key=os.getenv("NEBIUS_API_KEY"))` with `DEFAULT_MODEL = "nvidia/Nemotron-3-Ultra-550b-a55b"`, and updates the test to assert the env-based construction. `anthropic_summarizer`: FAILED after 5 iterations ($0.13) — every iteration produced one green-but-shallow candidate (rejected by the gate) and one aggressive-but-broken candidate (the full Messages-API-to-chat-completions translation, plus the Anthropic-shaped test fakes, did not land in budget); retried once at 8 iterations.
8. Video script and production guide written ([../../2.submission/VIDEO.md](../../2.submission/VIDEO.md)): timed 2:45 narration, shot list over the deployed demo, Kenyan-male voice direction (ElevenLabs voice library / PlayHT en-KE / Descript Overdub clone), and the rules checklist (Nebius + Nemotron named aloud, no copyrighted audio, under 3:00, public on YouTube).

**Decisions**
- ADR-015: a migration mission resolves only when the post-patch scan finds no closed-provider client code. Green mocked tests alone prove nothing.
- ADR-016: the public demo is the cockpit with a stateless replay server on Vercel; live missions stay on the self-hosted FastAPI orchestrator.

**Blockers**
- The `subdir`/monorepo limitation stands (unchanged this session).
- Web search was unavailable this session (tool quota), so the voice-tool recommendations in VIDEO.md could not be verified against today's catalogs; preview before committing.

**Next**
1. Record the video from VIDEO.md; upload publicly; paste the link into the Devpost draft and the README.
2. Widen the golden set with instances from other repos (django, sympy, astropy, flask) and report the results honestly either way.
3. Decide the city-affiliation field; finalize the Devpost description from `problem+solution.md`.
4. Uptime monitor on `/healthz` for the judging window (Dec 1 to Dec 15).

---

## Architectural Decision Records

### ADR-001: Track selection
- **Decision:** Track 1, Coding and Agentic Engineering. One track only.
- **Rationale:** The track description names agents that write, run, and test code in Token Factory Sandboxes. The rules allow exactly one track per project; the earlier note about "secondary eligibility" for Track 2 was incorrect and is withdrawn.

### ADR-002: Model routing by tier (revised in Session 1)
- **Decision:**
  - `nvidia/Nemotron-3-Ultra-550b-a55b`: diagnosis and patch generation, once per iteration.
  - `nvidia/nemotron-3-super-120b-a12b`: supervisor, researcher, reviewer.
  - `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`: log compaction and test-output parsing. Confirm ID.
- **Rationale:** Super is positioned by NVIDIA for orchestration and tool use; putting the supervisor on Ultra contradicted that and quadrupled cost. Development runs override Ultra to Super.
- **Supersedes:** the Session 0 version that placed four roles on Ultra and referenced Llama-3.1-Nemotron-70B.

### ADR-003: Tavily grounding inside the loop
- **Decision:** Call Tavily before the first patch attempt in every mission, with a 10-second timeout, and continue without grounding on failure.
- **Rationale:** Breaking changes are usually newer than training data. Grounding is also the qualifying condition for the Best Use of Tavily award.

### ADR-015: Migration completeness is structural, not test-based
- **Decision:** A MIGRATION mission resolves only when, after the patch, a repository scan finds no Anthropic client constructions and no closed-provider model literals in source files. Green tests alone do not resolve it. Residual matches are quoted back to the engineer on the next iteration.
- **Rationale:** The first live migration runs were false positives: with the provider client mocked, a patch that never touched the client kept the suite green (a two-line test edit; a `pyproject.toml` dependency swap). The structural scan is the only signal the mocking cannot fake. The OpenAI SDK itself is the target shape, so `openai` imports and constructions are expected post-migration.
- **Session:** 5.

### ADR-016: The public demo is a stateless replay server
- **Decision:** The hosted demo deploys the cockpit with replay-only route handlers on Vercel. Replay ids encode the start time and recording id; the SSE stream position is a pure function of wall clock and `Last-Event-ID`, so serverless duration limits are invisible (the browser's EventSource reconnects and resumes). `POST /api/v1/missions` answers 503 with a pointer to the self-hosted orchestrator.
- **Rationale:** ADR-006 made replay the default so the demo cannot be drained. A stateless replay engine makes it also deployable on serverless infrastructure with zero credentials, zero spend, and no sleeping free tier. Live missions need the long-running FastAPI process by design and stay self-hosted.
- **Session:** 5.
- **Supersedes:** the PLAN week-5 note "server on Railway or Nebius Serverless" for the demo tier; self-hosting remains the way to run live missions.

### ADR-004: Execution in Token Factory Sandboxes via `contree-sdk` (revised in Session 1)
- **Decision:** All repository code runs in Nebius-hosted Sandboxes. One fork per candidate patch. No rollback; losing forks are dropped.
- **Rationale:** Sandboxes are the product the track names, they are VM-isolated, they ship SWE-bench Verified environments, and forking is the natural fit for best-of-N repair. A self-managed Docker design would have been more work and less aligned.
- **Supersedes:** the Session 0 "Docker/microVM with memory caps" decision.

### ADR-005: Scope cut
- **Decision:** Two mission types (bug healing, migration). Cut: dependency-modernization mode, Tree-sitter indexing, vector index, LangSmith, GitHub PR dispatch with user tokens, TypeScript migration (stretch only).
- **Rationale:** One developer, seven weeks, $50 of inference credit. The cut list and gates are in [PLAN.md](PLAN.md).

### ADR-006: Replay mode for the public demo
- **Decision:** The public demo defaults to replaying recorded golden-dataset missions. Live mode requires a bearer token and a per-mission spend cap.
- **Rationale:** The demo must stay up through December 15 on a small credit budget, and an unauthenticated endpoint that spends Ultra tokens would be drained.

### ADR-008: Deterministic supervisor
- **Decision:** Mission control flow is code. Models are called only inside roles (research, patch, review, compaction, optional narration).
- **Rationale:** Cheaper, testable offline with fakes, and every decision is explainable from the state machine.

### ADR-009: JUnit for test results
- **Decision:** Test commands get `--junitxml` appended when they are pytest, and the report is read back from the result image. Terminal text is a fallback.
- **Rationale:** `pytest -q` hides PASSED lines and the decorated summary; text parsing under-counted passing tests in the first real run.

### ADR-007: Honest metrics
- **Decision:** No fixed cost-saving percentage in docs or UI. Estimates are computed from `pricing.json` with its date shown. Golden-dataset results are reported as the actual resolved count.
- **Rationale:** Judges are engineers. Sourced estimates are more persuasive than round numbers.

---

## Template

```markdown
## Session N — YYYY-MM-DD: Title

**Done**
1.

**Decisions**
- ADR-00X: ...

**Blockers**
-

**Next**
1.
```
