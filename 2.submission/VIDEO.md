# Demo Video — Script and Production Guide

> Target: **under 3:00** (script timed at ~2:40). Public YouTube link goes into the Devpost form.
> Hard requirements from the hackathon rules: spoken audio walkthrough, architecture and functionality explained, **explicit mentions of Nebius Token Factory and NVIDIA Nemotron**, no copyrighted background music.
> Voice: **Kenyan male, Nairobi English accent** — warm, confident, engineer-to-engineer.

---

## 1. The script (timed)

**[0:00–0:14] HOOK — over a shot of a red CI run**

> "Your test suite just went red. A dependency broke overnight. Someone has to read the traceback, find the changelog, patch it, and re-run the tests. What if an agent did all of that — and proved it worked?"

**[0:14–0:32] WHAT IT IS — over the cockpit home page**

> "This is ARCHON. It takes a broken repository, reproduces the failure inside a Nebius Token Factory Sandbox, researches the error on the live web with Tavily, and asks NVIDIA's Nemotron models to diagnose and patch it. Every step streams to this cockpit in real time."

**[0:32–1:12] THE LOOP, LIVE — screen recording of the `psf__requests-1142` replay**

> "Watch a real mission. This is a verified SWE-bench instance. ARCHON boots the preloaded sandbox and applies the instance's test patch. The baseline reproduces one failing test. Nemotron 3 Super synthesizes Tavily search queries from the error signature — you can see the queries and result counts here. Then Nemotron 3 Ultra reads the source and produces a root cause plus two candidate fixes."

**[1:12–1:45] FORK-PER-CANDIDATE — point at the two terminal tabs**

> "Each candidate runs on its own fork of the sandbox — two parallel sandboxes, isolated from each other. No rollback: the losing fork is simply dropped. This one keeps every previously passing test green and fixes the failure. Nemotron 3 Super reviews the winning patch — no deleted tests, no unrelated changes, no secrets — and approves. The verified diff lands here, with a downloadable patch and a git-apply command."

**[1:45–2:10] THE NUMBERS — over the summary bar + LangSmith trace link**

> "One iteration, forty-nine seconds, three cents of inference. Every model call, sandbox run, and search is a span in LangSmith. On the golden dataset, ARCHON resolved six of six SWE-bench Verified instances inside real Token Factory Sandboxes, for sixty-seven cents total — and it reports the failures honestly on the repository."

**[2:10–2:32] MIGRATION — over a migration recording**

> "The same loop migrates codebases off closed providers. ARCHON scans for OpenAI and Anthropic client calls, rewrites them to point at Nebius Token Factory with Nemotron models, verifies with the repository's own tests plus a parity sample, and prices the move from a dated price table. Open models on open infrastructure, for a fraction of the cost."

**[2:32–2:45] CLOSE — over the GitHub repo**

> "ARCHON is open source, Apache 2.0. Clone it, run it, watch it fix your broken repository. The link is below."

*Total: ~2 minutes 45 seconds. If you need trim room, tighten the numbers section first.*

### Words the rules require you to say (checklist)

- [ ] "Nebius Token Factory" — said at 0:14, 2:10 (twice)
- [ ] "Token Factory Sandbox(es)" — 0:14, 1:12
- [ ] "NVIDIA" / "Nemotron" — 0:14, 0:47 ("Nemotron 3 Super"), 0:58 ("Nemotron 3 Ultra")
- [ ] Spoken audio walkthrough of architecture and functionality — the whole script

---

## 2. Shot list

| # | Time | What's on screen | Where it comes from |
| :-- | :-- | :-- | :-- |
| 1 | 0:00 | A red CI log / failing tests (any repo, 3–4 s) | The cockpit terminal on a failing mission, or your own CI screenshot |
| 2 | 0:14 | Home page: mission form + replay list | https://archon-cockpit.vercel.app |
| 3 | 0:32 | **Main footage:** Play `psf__requests-1142`, record the cockpit | The demo, playing the 1142 recording |
| 4 | 1:12 | Hover/click between the two attempt tabs (a_xx) | Same recording, when candidates run |
| 5 | 1:45 | Summary bar totals; click the Langsmith "View trace" link | Same recording, at done |
| 6 | 2:10 | A migration replay (openai_chat_service or anthropic_summarizer) | The demo, migration recording |
| 7 | 2:32 | github.com/CodeWithEugene/Archon repo page | Browser |

Recording notes:

- Play the `psf__requests-1142` recording **before** you start narrating, so the full run is cached; then restart it when you hit record. Cursor on the reasoning stream as it scrolls; click attempt tabs at the fork moment; scroll the diff at the end. Deliberate mouse movement reads better than none.
- Record at 1920×1080, 30 fps minimum. Hide bookmarks bar. Full-screen the browser.
- If you need a second take of a section, replays are deterministic: the same recording plays the same way every time.

---

## 3. The voice — Kenyan male

The most authentic option is **your own voice**: record the narration yourself in a quiet room (phone voice memo is fine), and either use it directly or clone it once with **Descript Overdub** so you can fix individual words without re-recording.

If you want a different narrator, use a synthetic Kenyan-accented voice:

1. **ElevenLabs** (best quality). In the Voice Library search "Kenyan" and filter **Male + English** — pick a warm, mid-30s voice; preview the script's first two lines in each before choosing. Alternatively use **Voice Design** and describe: *"a Kenyan man in his mid-thirties, Nairobi accent, warm and confident, speaking like a software engineer explaining his product, measured pace."* The free tier is enough for a 3-minute script at 11Labs' character counts only if the script is short — the Starter plan (~$5) covers it comfortably.
2. **PlayHT** explicitly lists `en-KE` (Kenyan English) voices with male options, and charges per character.
3. **Camb.ai** specializes in accent fidelity (African accents) if ElevenLabs/PlayHT previews disappoint.

*These tools' catalogs change monthly — I could not verify today's voice list live, so preview before committing.*

Voice direction for the narrator (applies to any voice, including your own):

- Pace: measured, ~150 words per minute. Kenyan English pronunciation is clear and rhythmic — don't over-articulate.
- "Nemotron" = **NEM-oh-tron**. "Nebius" = **NEB-ee-us**. "SWE-bench" = **swee-bench**.
- Tones: confident on the hook, relaxed on the loop, proud on the numbers, warm on the close.
- Pause half a second after "ARCHON" the first time.

---

## 4. Production steps

1. **Capture the screen** (OBS Studio is free and reliable; QuickTime's "New Screen Recording" works too).
   - Open https://archon-cockpit.vercel.app, play the `psf__requests-1142` recording once to warm it, hit record, play it again, drive the mouse per the shot list. Record the migration replay after (~60 s of footage).
2. **Generate the narration** (ElevenLabs / PlayHT / Descript) from the script above; export as a single WAV/MP3.
3. **Edit** (Descript or CapCut, both free):
   - Lay the voice track first; cut the screen footage to match its pace.
   - Add 3 text overlays, 1.5 s each, when first said aloud: `Nebius Token Factory` (0:14), `NVIDIA Nemotron 3` (0:32), `fork per candidate` (1:12).
   - The rules prohibit **copyrighted** background audio. Either no music, or a track from YouTube's own Audio Library (free, cleared).
   - Normalize voice to around −14 LUFS; trim silence below 0.3 s.
4. **Export**: 1080p, H.264, target under 3:00 including any intro frame. One title frame "ARCHON — autonomous, sandbox-verified repair" for 2 s is fine and helps the thumbnail.
5. **Upload to YouTube**, visibility **Public** (judges must open it without an account), paste the link into `2.submission/README.md` and the Devpost form.

---

## 5. Optional: automated capture

If you'd rather not drive the browser manually, this Playwright script records the mission page while the replay streams (requires `npx playwright install chromium` once):

```js
// scripts/record-demo.mjs — node scripts/record-demo.mjs <mission-page-url>
import { chromium } from "playwright";

const url = process.argv[2] ?? "https://archon-cockpit.vercel.app/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: "recordings" } });
await page.goto(url);
await page.waitForTimeout(90_000); // watch the mission; adjust to taste
await page.close(); // video is finalized on close
await browser.close();
```

The manual route with OBS gives better cursor acting; the automated route is a fallback.
