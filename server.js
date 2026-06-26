const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "public");
const port = 5173;
const MAX_BODY_BYTES = 4096;
const EXPERT_PASSWORD = process.env.ROMFIX_EXPERT_PASSWORD || "Romfix123!";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function readBody(req) {
  return new Promise(function (resolve, reject) {
    let body = "";
    let size = 0;
    req.on("data", function (chunk) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("body_too_large"));
        return;
      }
      body += chunk;
    });
    req.on("end", function () {
      resolve(body);
    });
    req.on("error", reject);
  });
}

function safeFilePath(urlPath) {
  const rel = path.posix
    .normalize(urlPath)
    .replace(/^(\.\.\/)+/, "")
    .replace(/^\//, "");
  const file = path.resolve(root, ...rel.split("/").filter(Boolean));
  if (file !== root && !file.startsWith(root + path.sep)) return null;
  return file;
}

http
  .createServer(async function (req, res) {
    const url = req.url === "/" ? "/index.html" : req.url.split("?")[0];

    if (url === "/api/expert-verify" && req.method === "POST") {
      try {
        const raw = await readBody(req);
        const data = JSON.parse(raw || "{}");
        const ok = String(data.password || "") === EXPERT_PASSWORD;
        res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: ok }));
      } catch (e) {
        const code = e && e.message === "body_too_large" ? 413 : 400;
        res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false }));
      }
      return;
    }

    const file = safeFilePath(url);
    if (!file) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path.extname(file);
      const headers = {
        "Content-Type": types[ext] || "application/octet-stream",
      };
      if (ext === ".html" || ext === ".js" || ext === ".css") {
        headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
        headers.Pragma = "no-cache";
      }
      res.writeHead(200, headers);
      res.end(data);
    });
  })
  .listen(port, function () {
    console.log("RomfixVisuals: http://localhost:" + port);
  });