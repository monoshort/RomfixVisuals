#!/usr/bin/env node
/**
 * Controleert één Vercel-deployment-URL, niet de productie-aliassen.
 * Aliassen worden pas na review door de parent gezet.
 */
const { htmlFingerprint } = require("../lib/host-sync");

const target = (process.env.TARGET_URL || "").replace(/\/$/, "");
const expected = (process.env.EXPECTED_COMMIT || "").trim();

async function main() {
  if (!target) {
    console.error("TARGET_URL ontbreekt");
    process.exit(1);
  }
  const page = await fetch(target + "/", { redirect: "follow" });
  const html = await page.text();
  const ver = await fetch(target + "/api/version", { redirect: "follow" });
  const body = ver.ok ? await ver.json() : null;
  const commit = body && body.commit ? String(body.commit) : "";
  const summary = {
    url: target,
    pageStatus: page.status,
    versionStatus: ver.status,
    commit: commit || null,
    expectedCommit: expected || null,
    fingerprint: htmlFingerprint(html),
  };
  const errors = [];
  if (page.status !== 200) errors.push("deployment geeft geen HTML");
  if (!ver.ok || !commit) errors.push("deployment heeft geen /api/version commit");
  if (expected && commit && commit !== expected) errors.push("commit wijkt af van de git-sha");
  summary.ok = errors.length === 0;
  summary.errors = errors;
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exit(1);
}

main().catch(function (err) {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
