const { execFileSync } = require("child_process");
const path = require("path");

function readGitSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: path.join(__dirname, ".."),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch (e) {
    return null;
  }
}

function sourceVersion() {
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || readGitSha() || null;
  return {
    commit: commit || null,
    ref: process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
    env: process.env.VERCEL_ENV || "local",
    project: "romfix-visuals",
    host: process.env.VERCEL_URL || null,
  };
}

function versionHeaders(body) {
  let commit = null;
  try {
    commit = JSON.parse(body).commit || null;
  } catch (e) {
    commit = null;
  }
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
  if (commit) headers["X-Romfix-Commit"] = commit;
  return headers;
}

module.exports = { sourceVersion, versionHeaders };
