/**
 * Compare public host reports. A missing version endpoint on both hosts is
 * allowed only when the HTML fingerprint and etag still match. One host
 * reporting a commit while the other does not is a failed sync.
 */
function compareHostReports(reports) {
  const errors = [];
  if (!reports || reports.length < 2) {
    errors.push("minstens twee hosts nodig");
    return errors;
  }
  const etags = reports.map(function (r) {
    return r.etag || "";
  });
  if (new Set(etags).size > 1) errors.push("etag van index.html verschilt");
  const fingerprints = reports.map(function (r) {
    return r.fingerprint || "";
  });
  if (new Set(fingerprints).size > 1) errors.push("scriptversie in index.html verschilt");
  const commits = reports.map(function (r) {
    return r.commit || null;
  });
  const present = commits.filter(Boolean);
  if (present.length !== 0 && present.length !== commits.length) {
    errors.push("bronversie ontbreekt op een van de hosts");
  }
  if (present.length === commits.length && new Set(present).size > 1) {
    errors.push("commit verschilt tussen hosts");
  }
  return errors;
}

function htmlFingerprint(html) {
  const refs = [];
  const re = /(?:src|href)="([^"]+\.(?:js|css)(?:\?[^"]*)?)"/g;
  let match;
  while ((match = re.exec(html))) refs.push(match[1]);
  refs.sort();
  return refs.join("|");
}

module.exports = { compareHostReports, htmlFingerprint };
