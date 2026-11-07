#!/usr/bin/env node
const { compareHostReports, htmlFingerprint } = require("../lib/host-sync");
const { syncProductionHosts } = require("../lib/production-sync");

const hosts = (process.env.ROMFIX_HOSTS || "https://romfix-visuals.vercel.app,https://romls-visuals.vercel.app")
  .split(",")
  .map(function (item) { return item.trim().replace(/\/$/, ""); })
  .filter(Boolean);
const requireCommit = process.argv.indexOf("--require-commit") >= 0;
const followMaster = process.argv.indexOf("--follow-master") >= 0;
const expected = process.env.EXPECTED_COMMIT || process.env.TARGET_SHA || "";

function header(res, name) {
  return res.headers.get(name) || "";
}

async function readHost(origin) {
  const page = await fetch(origin + "/", { redirect: "follow" });
  const html = await page.text();
  let commit = null;
  let versionStatus = 0;
  try {
    const ver = await fetch(origin + "/api/version", { redirect: "follow" });
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

async function readHosts() {
  const reports = [];
  for (let i = 0; i < hosts.length; i++) reports.push(await readHost(hosts[i]));
  return reports;
}

async function readMasterSha() {
  if (process.env.MASTER_SHA) return process.env.MASTER_SHA;
  const repo = process.env.GITHUB_REPOSITORY || "monoshort/RomfixVisuals";
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "romfix-host-sync" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = "Bearer " + process.env.GITHUB_TOKEN;
  const res = await fetch("https://api.github.com/repos/" + repo + "/commits/master", { headers: headers });
  if (!res.ok) throw new Error("master-tip niet leesbaar (" + res.status + ")");
  const data = await res.json();
  return data && data.sha ? data.sha : "";
}

async function main() {
  if (followMaster) {
    const summary = await syncProductionHosts({
      targetSha: expected,
      attempts: process.env.HOST_SYNC_ATTEMPTS || 15,
      delayMs: process.env.HOST_SYNC_DELAY_MS || 20000,
      readMaster: readMasterSha,
      readHosts: readHosts,
    });
    console.log(JSON.stringify(summary, null, 2));
    if (!summary.ok) process.exit(1);
    return;
  }
  const reports = await readHosts();
  const errors = compareHostReports(reports, {
    requireCommit: requireCommit,
    expectedCommit: expected || null,
  });
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

if (require.main === module) {
  main().catch(function (err) {
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  });
}

module.exports = { readHost, readHosts };
