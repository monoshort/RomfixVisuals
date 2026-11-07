#!/usr/bin/env node
const { compareHostReports, assessDeployment } = require("../lib/host-sync");
const { planPreviewDispatch } = require("../lib/dispatch-payload");
const { syncProductionHosts } = require("../lib/production-sync");

const SHA = "b4267f17bb5cb2654dcc727de2942518a9203815";
const OTHER = "7b99928000000000000000000000000000000000";

function must(cond, message) {
  if (!cond) {
    console.error("FAIL " + message);
    process.exitCode = 1;
  } else {
    console.log("OK   " + message);
  }
}

function page(extra) {
  return Object.assign(
    {
      origin: "https://example.test",
      status: 200,
      etag: "etag",
      fingerprint: "app.js?v=20261104-druklaag",
      versionStatus: 200,
      commit: SHA,
    },
    extra
  );
}

const login = page({
  status: 401,
  etag: "login",
  fingerprint: "",
  versionStatus: 200,
  commit: SHA,
});
const loginErrors = compareHostReports(
  [login, Object.assign({}, login, { origin: "https://other.test" })],
  { requireCommit: true, expectedCommit: SHA }
);
must(loginErrors.some(function (e) { return e.indexOf("HTML-status is niet 200") >= 0; }), "gelijke foutpagina's falen");
must(loginErrors.some(function (e) { return e.indexOf("JS-fingerprint") >= 0; }), "lege fingerprint faalt");

const cssOnly = page({ fingerprint: "styles.css?v=1" });
must(
  compareHostReports([cssOnly, Object.assign({}, cssOnly, { origin: "b" })], { requireCommit: true }).some(function (e) {
    return e.indexOf("JS-fingerprint") >= 0;
  }),
  "alleen CSS is geen JS-fingerprint"
);

const foreignJs = page({ fingerprint: "https://vercel.com/login.js" });
must(
  compareHostReports([foreignJs, Object.assign({}, foreignJs, { origin: "b" })], { requireCommit: true }).length > 0,
  "login-JS zonder app.js faalt"
);

const noVersion = page({ versionStatus: 404, commit: null });
must(
  compareHostReports([noVersion, Object.assign({}, noVersion, { origin: "b" })], { requireCommit: true }).some(function (e) {
    return e.indexOf("/api/version is niet 200") >= 0;
  }),
  "version 404 faalt bij --require-commit"
);

const emptyCommit = page({ versionStatus: 200, commit: null });
must(
  compareHostReports([emptyCommit, Object.assign({}, emptyCommit, { origin: "b" })], { requireCommit: true }).some(function (e) {
    return e.indexOf("commit ontbreekt") >= 0;
  }),
  "version 200 zonder commit faalt"
);

const drifted = compareHostReports(
  [page({ origin: "a", commit: SHA }), page({ origin: "b", commit: OTHER })],
  { requireCommit: true, expectedCommit: SHA }
);
must(drifted.some(function (e) { return e.indexOf("verschilt") >= 0 || e.indexOf("EXPECTED_COMMIT") >= 0; }), "andere commit faalt");

const halfDown = compareHostReports(
  [page({ origin: "a", status: 200 }), page({ origin: "b", status: 500 })],
  { requireCommit: true, expectedCommit: SHA }
);
must(halfDown.some(function (e) { return e.indexOf("niet 200") >= 0; }), "één host niet-200 faalt");

const good = compareHostReports(
  [page({ origin: "a" }), page({ origin: "b" })],
  { requireCommit: true, expectedCommit: SHA }
);
must(good.length === 0, "gelijke 200-hosts met commit slagen");

must(
  assessDeployment({ status: 401, fingerprint: "", versionStatus: 200, commit: SHA }, SHA).length > 0,
  "preview-login faalt"
);
must(assessDeployment(page(), SHA).length === 0, "preview met app.js en commit slaagt");

function payload(extra) {
  return Object.assign(
    {
      project: { name: "romfix-visuals", id: "prj_test" },
      environment: "preview",
      git: { ref: "feature", sha: SHA, shortSha: "b4267f1" },
      url: "https://romfix-visuals-preview.vercel.app",
      id: "dpl_test",
      state: { type: "success" },
    },
    extra
  );
}

const preview = planPreviewDispatch(payload(), "vercel.deployment.success");
must(preview.action === "check" && preview.expectedCommit === SHA, "preview controleert alleen de deployment-URL");

const production = planPreviewDispatch(payload({ environment: "production" }), "vercel.deployment.success");
must(production.action === "skip", "productie-event vergelijkt de hosts hier niet");

const missing = planPreviewDispatch(payload({ git: { ref: "feature", shortSha: "b4267f1" } }), "vercel.deployment.success");
must(missing.action === "fail", "payload zonder git.sha faalt");

const targetOnly = planPreviewDispatch({ target: "production", url: "https://example.test" }, "vercel.deployment.success");
must(targetOnly.action === "fail" && targetOnly.errors.some(function (e) { return e.indexOf("environment") >= 0; }), "verzonnen target vervangt environment niet");

const badState = planPreviewDispatch(payload({ state: { type: "ready" } }), "vercel.deployment.success");
must(badState.action === "fail", "state.type moet success zijn");

async function runSync() {
  let hostReads = 0;
  let masterReads = 0;
  const sleeps = [];
  const skipped = await syncProductionHosts({
    targetSha: SHA,
    attempts: 3,
    delayMs: 20,
    sleep: function (ms) { sleeps.push(ms); return Promise.resolve(); },
    readMaster: function () { masterReads += 1; return Promise.resolve(OTHER); },
    readHosts: function () { hostReads += 1; return Promise.resolve([page(), page({ origin: "b" })]); },
  });
  must(skipped.ok && skipped.skipped && hostReads === 0, "oudere run stopt als master verder is");

  let attempt = 0;
  const sleeps2 = [];
  const ready = await syncProductionHosts({
    targetSha: SHA,
    attempts: 3,
    delayMs: 5,
    sleep: function (ms) { sleeps2.push(ms); return Promise.resolve(); },
    readMaster: function () { return Promise.resolve(SHA); },
    readHosts: function () {
      attempt += 1;
      if (attempt < 3) return Promise.resolve([page({ versionStatus: 404, commit: null }), page({ origin: "b", versionStatus: 404, commit: null })]);
      return Promise.resolve([page({ origin: "a" }), page({ origin: "b" })]);
    },
  });
  must(ready.ok && ready.attempt === 3 && sleeps2.length === 2, "propagation wacht begrensd tot de commit er is");

  let calls = 0;
  const gaveUp = await syncProductionHosts({
    targetSha: SHA,
    attempts: 2,
    delayMs: 0,
    readMaster: function () { return Promise.resolve(SHA); },
    readHosts: function () {
      calls += 1;
      return Promise.resolve([page({ origin: "a", commit: OTHER }), page({ origin: "b", commit: OTHER })]);
    },
  });
  must(!gaveUp.ok && calls === 2, "andere commit terwijl master gelijk blijft faalt na de limiet");

  let masterPhase = 0;
  const followed = await syncProductionHosts({
    targetSha: SHA,
    attempts: 2,
    delayMs: 0,
    readMaster: function () {
      masterPhase += 1;
      return Promise.resolve(masterPhase === 1 ? SHA : OTHER);
    },
    readHosts: function () {
      return Promise.resolve([page({ origin: "a", commit: OTHER }), page({ origin: "b", commit: OTHER })]);
    },
  });
  must(followed.ok && followed.skipped, "hosts op een nieuwere master zijn geen drift");
}

runSync().then(function () {
  if (process.exitCode) process.exit(process.exitCode);
}).catch(function (err) {
  console.error(err);
  process.exit(1);
});
