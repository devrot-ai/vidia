import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("file://" + path.join(__dirname, "onepager.html"));
await page.pdf({
  path: path.join(__dirname, "ARCHON_judges_onepager.pdf"),
  width: "816px",
  height: "1056px",
  printBackground: true,
  margin: { top: "0", bottom: "0", left: "0", right: "0" },
});
await browser.close();
console.log("wrote ARCHON_judges_onepager.pdf");
