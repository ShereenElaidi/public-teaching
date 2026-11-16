// Run the UI regression checks (tests/ui.html) in headless Chrome, in real time, and print the results.
//   node tests/run-ui.mjs            (from math223/set08-gram-schmidt/; Node ≥ 22 and Google Chrome, nothing to install)
//   CHROME=/path/to/chrome node tests/run-ui.mjs
// The logic checks run without a browser:  node --test tests/
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));            // the repository root
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg",
  ".mp4": "video/mp4", ".ttf": "font/ttf", ".woff2": "font/woff2", ".woff": "font/woff", ".svg": "image/svg+xml", ".json": "application/json" };

// a tiny static server, bound to localhost only
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  try {
    const body = await readFile(join(root, path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/math223/set08-gram-schmidt/tests/ui.html`;

const profile = await mkdtemp(join(tmpdir(), "gs-ui-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--user-data-dir=${profile}`,
  "--window-size=1400,1000", "--remote-debugging-port=0", url], { stdio: ["ignore", "ignore", "pipe"] });
const wsUrl = await new Promise((resolve, reject) => {
  let buf = "";
  chrome.stderr.on("data", (d) => { buf += d; const m = /DevTools listening on (ws:\/\/\S+)/.exec(buf); if (m) resolve(m[1]); });
  chrome.on("exit", () => reject(new Error("Chrome exited before it was ready")));
});
const port = new URL(wsUrl).port;
const page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
const evaluate = (expression) => new Promise((r) => {
  pending.set(++id, (res) => r(res && res.result ? res.result.value : undefined));
  ws.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression, returnByValue: true } }));
});

let title = "";
const deadline = Date.now() + 240000;
while (Date.now() < deadline && !/^(PASS|FAIL)/.test(title)) {
  await new Promise((r) => setTimeout(r, 1000));
  title = (await evaluate("document.title")) || "";
}
const rows = (await evaluate(`[...document.querySelectorAll("#results div")].map((d) => (d.className === "pass" ? "  ok   " : "  FAIL ") + d.textContent)`)) || [];
console.log(rows.join("\n"));
console.log(title || "no result (timed out)");

ws.close(); chrome.kill(); server.close();
await new Promise((r) => setTimeout(r, 300));
await rm(profile, { recursive: true, force: true });
process.exit(/^PASS/.test(title) ? 0 : 1);
