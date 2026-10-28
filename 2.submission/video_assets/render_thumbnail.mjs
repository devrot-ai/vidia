import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 });
await page.goto("file://" + path.join(__dirname, "thumbnail.html"));
await page.screenshot({ path: path.join(__dirname, "thumbnail.png") });
await browser.close();
console.log("wrote thumbnail.png");
