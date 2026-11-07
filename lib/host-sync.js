/**
 * Vergelijk openbare hosts. HTML moet 200 zijn en een niet-lege JS-fingerprint
 * van deze app bevatten. Met requireCommit moet /api/version ook 200 zijn
 * en een commit teruggeven. Gelijke fout- of loginpagina's zijn daarmee geen succes.
 */
function isJsFingerprint(fingerprint) {
  if (typeof fingerprint !== "string" || !fingerprint.trim()) return false;
  return fingerprint.split("|").some(function (part) {
    return /(^|\/)app\.js(\?|$)/.test(part.trim());
  });
}

function hostLabel(report, index) {
  return report && report.origin ? report.origin : "host " + (index + 1);
}

function compareHostReports(reports, options) {
  const opts = options || {};
  const errors = [];
  if (!reports || reports.length < 2) {
    errors.push("minstens twee hosts nodig");
    return errors;
  }
  reports.forEach(function (report, index) {
    const label = hostLabel(report, index);
    if (!report || report.status !== 200) errors.push(label + ": HTML-status is niet 200");
    if (!report || !isJsFingerprint(report.fingerprint)) {
      errors.push(label + ": geen JS-fingerprint van app.js");
    }
    if (opts.requireCommit) {
      if (!report || report.versionStatus !== 200) errors.push(label + ": /api/version is niet 200");
      if (!report || !report.commit) errors.push(label + ": commit ontbreekt");
    }
  });
  const etags = reports.map(function (report) {
    return (report && report.etag) || "";
  });
  if (new Set(etags).size > 1) errors.push("etag van index.html verschilt");
  const fingerprints = reports.map(function (report) {
    return (report && report.fingerprint) || "";
  });
  if (new Set(fingerprints).size > 1) errors.push("scriptversie in index.html verschilt");
  const commits = reports.map(function (report) {
    return report && report.commit ? String(report.commit).toLowerCase() : "";
  });
  const present = commits.filter(Boolean);
  if (!opts.requireCommit && present.length !== 0 && present.length !== commits.length) {
    errors.push("bronversie ontbreekt op een van de hosts");
  }
  if (present.length === commits.length && new Set(present).size > 1) {
    errors.push("commit verschilt tussen hosts");
  }
  if (opts.expectedCommit) {
    const expected = String(opts.expectedCommit).toLowerCase();
    commits.forEach(function (commit, index) {
      if (commit !== expected) errors.push(hostLabel(reports[index], index) + ": commit wijkt af van EXPECTED_COMMIT");
    });
  }
  return errors;
}

function htmlFingerprint(html) {
  const refs = [];
  const re = /(?:src|href)="([^"]+\.(?:js|css)(?:\?[^"]*)?)"/g;
  let match;
  while ((match = re.exec(String(html || "")))) refs.push(match[1]);
  refs.sort();
  return refs.join("|");
}

function assessDeployment(report, expectedCommit) {
  const errors = [];
  if (!report || report.status !== 200) errors.push("deployment HTML is niet 200");
  if (!report || !isJsFingerprint(report.fingerprint)) errors.push("deployment heeft geen JS-fingerprint van app.js");
  if (!report || report.versionStatus !== 200) errors.push("deployment /api/version is niet 200");
  if (!report || !report.commit) errors.push("deployment commit ontbreekt");
  if (expectedCommit && report && String(report.commit || "").toLowerCase() !== String(expectedCommit).toLowerCase()) {
    errors.push("deployment commit wijkt af van EXPECTED_COMMIT");
  }
  return errors;
}

module.exports = { isJsFingerprint, compareHostReports, htmlFingerprint, assessDeployment };
