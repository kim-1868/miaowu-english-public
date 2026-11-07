// Dependency-free local preview, bound to 127.0.0.1; never connects to D1.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8" };
const port = Number(process.env.PORT || 4173);

createServer(async (req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405); res.end(); return; }
  let path;
  try { path = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch { res.writeHead(400); res.end(); return; }
  if (path === "/") path = "/showcase/index.html";
  if (!/^\/(?:showcase|public)\/[A-Za-z0-9/_.-]+$/.test(path) || path.includes("..")) {
    res.writeHead(403); res.end(); return;
  }
  const target = resolve(root, path.slice(1));
  if (!target.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
  try {
    const metadata = await stat(target);
    if (!metadata.isFile()) throw Error("Not a file");
    const data = await readFile(target);
    res.writeHead(200, { "content-type": types[extname(target)] || "application/octet-stream", "cache-control": "no-store", "x-content-type-options": "nosniff" });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch { res.writeHead(404); res.end("Not found"); }
}).listen(port, "127.0.0.1", () => {
  console.log("Public UI showcase: http://127.0.0.1:" + port + "/");
});
