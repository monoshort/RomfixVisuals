const { sourceVersion, versionHeaders } = require("../lib/source-version");

module.exports = function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).json({ ok: false });
    return;
  }
  const body = sourceVersion();
  const headers = versionHeaders(JSON.stringify(body));
  Object.keys(headers).forEach(function (key) {
    res.setHeader(key, headers[key]);
  });
  if (req.method === "HEAD") {
    res.status(200).end();
    return;
  }
  res.status(200).json(body);
};
