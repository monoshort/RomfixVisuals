#!/usr/bin/env node
const { compareHostReports, htmlFingerprint } = require("../lib/host-sync");

const hosts = (process.env.ROMFIX_HOSTS || "https://romfix-visuals.vercel.app,https://romls-visuals.vercel.app")
  .split(",")
  .map(function (h) {
    return h.trim().replace(/\/$/, "");
  })
  .filter(Boolean);
const requireCommit = process.argv.indexOf("--require-commit") >= 0;
const expected = process.env.EXPECTED_COMMIT || "";

function header(res, name) {
  return res.headers.get(name) || res.headers.get(name.toLowerCase()) || "";
}

async function readHost(origin) {
  const page = await fetch(origin + "/", { redirect: "follow" });
  const html = await page.text();
  const versionUrl = origin + "/api/version";
  let commit = null;
  let versionStatus = 0;
  try {
    const ver = await fetch(versionUrl, { redirect: "follow" });
    versionStatus = ver.status;
    if (ver.ok) {
      const data = await ver.json();
      commit = data && data.commit ? String(data.commit) : null;
    }
  } catch (e) {
    versionStatus = 0;
  }
  return {
    origin: origin,
    status: page.status,
    etag: header(page, "etag"),
    fingerprint: htmlFingerprint(html),
    commit: commit,
    versionStatus: versionStatus,
  };
}

async function main() {
  const reports = [];
  for (let i = 0; i < hosts.length; i++) reports.push(await readHost(hosts[i]));
  const errors = compareHostReports(reports);
  if (requireCommit && reports.some(function (r) { return !r.commit; })) {
    errors.push("commit ontbreekt terwijl --require-commit gezet is");
  }
  if (expected && reports.some(function (r) { return r.commit && r.commit !== expected; })) {
    errors.push("commit wijkt af van EXPECTED_COMMIT");
  }
  const summary = {
    ok: errors.length === 0,
    requireCommit: requireCommit,
    expectedCommit: expected || null,
    errors: errors,
    hosts: reports,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exit(1);
}

main().catch(function (err) {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
