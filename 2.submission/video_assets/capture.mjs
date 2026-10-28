// node capture.mjs
// Captures screenshots + screen-recording video for the ARCHON demo video shot list.
// Free, local, no paid service: uses Playwright's bundled Chromium.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = path.join(__dirname, "shots");
const VIDEO_DIR = path.join(__dirname, "video");
const BASE_URL = "https://archon-cockpit.vercel.app";

await mkdir(SHOTS_DIR, { recursive: true });
await mkdir(VIDEO_DIR, { recursive: true });

const browser = await chromium.launch();

// Recorded-runs list order is fixed by the app (verified by manual inspection):
// 0 anthropic_summarizer, 1 broken_pydantic_v2, 2 openai_chat_service,
// 3 psf__requests-1142, 4 -1766, 5 -1921, 6 -2317, 7 -2931, 8 -5414
async function playRecordedRun(page, label, buttonIndex, timeoutMs) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const playButtons = page.getByRole("button", { name: "Play", exact: true });
  await playButtons.nth(buttonIndex).waitFor({ state: "visible", timeout: 15000 });
  await page.screenshot({ path: path.join(SHOTS_DIR, "02_home.png") });

  const playButton = playButtons.nth(buttonIndex);
  await playButton.scrollIntoViewIfNeeded();
  await playButton.click();
  await page.waitForURL((u) => u.pathname.startsWith("/missions/"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  const url = page.url();
  if (!url.toLowerCase().includes(label.toLowerCase())) {
    throw new Error(`Expected "${label}" in URL after clicking Play, got ${url}`);
  }
  console.log(`Confirmed replay URL for ${label}: ${url}`);

  // Fixed-duration capture: run the full recorded mission length (no early-exit
  // heuristic — "Verified" appears in unrelated labels like "SWE-bench Verified"
  // and false-triggered an early stop in an earlier version of this script).
  const start = Date.now();
  let frame = 0;
  while (Date.now() - start < timeoutMs) {
    await page.waitForTimeout(5000);
    frame += 1;
    await page.screenshot({
      path: path.join(SHOTS_DIR, `${label}_frame_${String(frame).padStart(2, "0")}.png`),
    });
  }
}

// --- Segment A: main mission replay (psf__requests-1142) ---
{
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();
  await playRecordedRun(page, "psf__requests-1142", 3, 65_000);
  await page.close();
  await context.close();
  console.log("Captured main mission replay (video + frames).");
}

// --- Segment B: migration replay (openai_chat_service) ---
{
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();
  await playRecordedRun(page, "openai_chat_service", 2, 95_000);
  await page.close();
  await context.close();
  console.log("Captured migration replay (video + frames).");
}

// --- Segment C: static shots (repo page) ---
{
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto("https://github.com/CodeWithEugene/Archon", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(SHOTS_DIR, "07_github_repo.png") });
  await page.close();
  console.log("Captured GitHub repo page.");
}

await browser.close();
console.log("Done. Screenshots in ./shots, videos in ./video");
