#!/usr/bin/env node
const { assessDeployment, htmlFingerprint } = require("../lib/host-sync");
const { planPreviewDispatch } = require("../lib/dispatch-payload");

async function readDeployment(origin) {
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
    fingerprint: htmlFingerprint(html),
    commit: commit,
    versionStatus: versionStatus,
  };
}

async function checkUrl(url, expected) {
  const report = await readDeployment(url);
  const errors = assessDeployment(report, expected);
  return { ok: errors.length === 0, errors: errors, url: url, expectedCommit: expected || null, deployment: report };
}

async function main() {
  const eventName = process.env.EVENT_NAME || "";
  if (eventName === "repository_dispatch") {
    let payload = null;
    try {
      payload = JSON.parse(process.env.CLIENT_PAYLOAD || "");
    } catch (e) {
      payload = null;
    }
    const plan = planPreviewDispatch(payload, process.env.EVENT_ACTION || "vercel.deployment.success");
    if (plan.action === "fail") {
      console.log(JSON.stringify({ ok: false, errors: plan.errors }, null, 2));
      process.exit(1);
    }
    if (plan.action === "skip") {
      console.log(JSON.stringify({ ok: true, skipped: true, reason: plan.reason }, null, 2));
      return;
    }
    const summary = await checkUrl(plan.url, plan.expectedCommit);
    console.log(JSON.stringify(summary, null, 2));
    if (!summary.ok) process.exit(1);
    return;
  }

  const target = (process.env.TARGET_URL || "").replace(/\/$/, "");
  const expected = (process.env.EXPECTED_COMMIT || "").trim();
  if (!target) {
    console.error("TARGET_URL ontbreekt");
    process.exit(1);
  }
  const summary = await checkUrl(target, expected);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exit(1);
}

if (require.main === module) {
  main().catch(function (err) {
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  });
}

module.exports = { checkUrl };
