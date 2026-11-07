const { compareHostReports } = require("./host-sync");

const MAX_ATTEMPTS = 20;

function sha(value) {
  const text = String(value || "").trim().toLowerCase();
  return /^[0-9a-f]{40}$/.test(text) ? text : "";
}

/**
 * Alleen de huidige master-tip wordt vergeleken. Een oudere run die een
 * nieuwere master ziet, stopt zonder drift te melden. Die nieuwere commit
 * heeft een eigen run.
 */
function judgeMasterAttempt(input) {
  const target = sha(input && input.targetSha);
  const master = sha(input && input.masterSha);
  if (!target) return { action: "fail", errors: ["doelcommit ontbreekt"] };
  if (!master) return { action: "fail", errors: ["master-tip ontbreekt"] };
  if (target !== master) {
    return { action: "skip", reason: "master is verder dan deze run", masterSha: master, targetSha: target };
  }
  const reports = (input && input.reports) || [];
  const errors = compareHostReports(reports, { requireCommit: true, expectedCommit: target });
  if (!errors.length) return { action: "ok", masterSha: master, targetSha: target };
  const commits = reports.map(function (report) {
    return report && report.commit ? String(report.commit).toLowerCase() : "";
  });
  const agreed = commits.length === reports.length && commits.every(Boolean) && new Set(commits).size === 1;
  if (agreed && commits[0] !== target) {
    return { action: "moved", hostCommit: commits[0], errors: errors, masterSha: master, targetSha: target };
  }
  return { action: "retry", errors: errors, masterSha: master, targetSha: target };
}

async function syncProductionHosts(options) {
  const attempts = Math.max(1, Math.min(Number(options.attempts) || 1, MAX_ATTEMPTS));
  const delayMs = Math.max(0, Number(options.delayMs) || 0);
  const sleep = options.sleep || function (ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  };
  let target = sha(options.targetSha);
  let last = { ok: false, errors: ["geen poging"], attempt: 0, attempts: attempts };
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const masterSha = sha(await options.readMaster());
    if (!target) target = masterSha;
    let verdict = judgeMasterAttempt({ targetSha: target, masterSha: masterSha, reports: [] });
    if (verdict.action === "skip" || verdict.action === "fail") {
      return {
        ok: verdict.action === "skip",
        skipped: verdict.action === "skip",
        reason: verdict.reason || "",
        errors: verdict.errors || [],
        attempt: attempt,
        attempts: attempts,
        masterSha: masterSha,
        targetSha: target,
      };
    }
    const reports = await options.readHosts();
    verdict = judgeMasterAttempt({ targetSha: target, masterSha: masterSha, reports: reports });
    if (verdict.action === "moved") {
      const again = sha(await options.readMaster());
      if (again && again === verdict.hostCommit) {
        return {
          ok: true,
          skipped: true,
          reason: "hosts staan al op een nieuwere master",
          errors: [],
          attempt: attempt,
          attempts: attempts,
          masterSha: again,
          targetSha: target,
          hosts: reports,
        };
      }
      verdict = { action: "retry", errors: verdict.errors };
    }
    last = {
      ok: verdict.action === "ok",
      skipped: false,
      reason: "",
      errors: verdict.errors || [],
      attempt: attempt,
      attempts: attempts,
      masterSha: masterSha,
      targetSha: target,
      hosts: reports,
    };
    if (last.ok || attempt === attempts) return last;
    if (delayMs) await sleep(delayMs);
  }
  return last;
}

module.exports = { sha, judgeMasterAttempt, syncProductionHosts, MAX_ATTEMPTS };
