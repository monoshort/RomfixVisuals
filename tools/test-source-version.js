#!/usr/bin/env node
const { spawn } = require("child_process");
const { execFileSync } = require("child_process");
const path = require("path");

const port = 4174;
const root = path.join(__dirname, "..");
const expected = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();

function fail(message) {
  console.error("FAIL " + message);
  process.exit(1);
}

const child = spawn(process.execPath, ["server.js"], {
  cwd: root,
  env: Object.assign({}, process.env, { PORT: String(port) }),
  stdio: ["ignore", "pipe", "pipe"],
});

let settled = false;
function finish(code) {
  if (settled) return;
  settled = true;
  child.kill();
  process.exit(code);
}

child.on("exit", function (code) {
  if (!settled) fail("server stopte voortijdig (" + code + ")");
});

async function waitForServer() {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch("http://127.0.0.1:" + port + "/api/version");
      if (res.ok) return res;
    } catch (e) {}
    await new Promise(function (r) {
      setTimeout(r, 100);
    });
  }
  fail("lokale /api/version kwam niet op");
}

waitForServer()
  .then(async function (res) {
    const commitHeader = res.headers.get("x-romfix-commit");
    const body = await res.json();
    if (body.commit !== expected) fail("commit " + body.commit + " != " + expected);
    if (commitHeader !== expected) fail("header " + commitHeader);
    if (body.project !== "romfix-visuals") fail("project");
    if (res.headers.get("cache-control") !== "no-store") fail("cache");
    console.log("OK   lokale bronversie " + body.commit);
    finish(0);
  })
  .catch(function (err) {
    console.error(err);
    finish(1);
  });
