/**
 * Tiny zero-dependency static server for previewing the `out/` export.
 * Usage: node scripts/serve-static.mjs [port] [directory]
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.argv[2] ?? 4173);
const root = process.argv[3] ?? join(process.cwd(), "out");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";

    const filePath = normalize(join(root, pathname));
    if (!filePath.startsWith(normalize(root))) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    let target = filePath;
    try {
      const info = await stat(target);
      if (info.isDirectory()) target = join(target, "index.html");
    } catch {
      // Fall through to the SPA-style file lookup below.
    }

    let body = await readFile(target);
    let type = MIME[extname(target).toLowerCase()] ?? "application/octet-stream";

    // Static export with trailingSlash: try `path/index.html` if missing.
    if (!String(req.url ?? "").endsWith("/") && type === "application/octet-stream") {
      try {
        body = await readFile(join(target, "index.html"));
        type = MIME[".html"];
      } catch {
        // Keep the original 404.
      }
    }

    res.writeHead(200, { "content-type": type });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Serving ${root} on http://localhost:${port}`);
});
