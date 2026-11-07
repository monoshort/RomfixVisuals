/**
 * Payload van vercel/repository-dispatch, status-event:
 * project.name, project.id, environment, git.ref, git.sha, git.shortSha,
 * url, id, state.type, optioneel alias[].
 * environment onderscheidt preview van production. Er is geen target-veld.
 */
function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function validateStatusPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, errors: ["client_payload is geen object"] };
  }
  const project = payload.project;
  if (!project || typeof project !== "object" || Array.isArray(project)) errors.push("project ontbreekt");
  else {
    if (!text(project.name)) errors.push("project.name ontbreekt");
    if (!text(project.id)) errors.push("project.id ontbreekt");
  }
  if (!text(payload.environment)) errors.push("environment ontbreekt");
  const git = payload.git;
  if (!git || typeof git !== "object" || Array.isArray(git)) errors.push("git ontbreekt");
  else {
    if (!text(git.ref)) errors.push("git.ref ontbreekt");
    if (!/^[0-9a-f]{40}$/i.test(text(git.sha))) errors.push("git.sha is geen commit");
    if (!text(git.shortSha)) errors.push("git.shortSha ontbreekt");
  }
  if (!/^https:\/\//i.test(text(payload.url))) errors.push("url ontbreekt");
  if (!text(payload.id)) errors.push("id ontbreekt");
  if (!payload.state || typeof payload.state !== "object" || !text(payload.state.type)) {
    errors.push("state.type ontbreekt");
  }
  if (payload.alias != null && (!Array.isArray(payload.alias) || payload.alias.some(function (item) { return typeof item !== "string"; }))) {
    errors.push("alias is geen lijst van strings");
  }
  if (errors.length) return { ok: false, errors: errors };
  return {
    ok: true,
    errors: [],
    environment: text(payload.environment),
    sha: text(payload.git.sha).toLowerCase(),
    url: text(payload.url).replace(/\/$/, ""),
    id: text(payload.id),
    projectName: text(payload.project.name),
    stateType: text(payload.state.type),
  };
}

function planPreviewDispatch(payload, eventAction) {
  const parsed = validateStatusPayload(payload);
  if (!parsed.ok) return { action: "fail", errors: parsed.errors };
  if (eventAction && eventAction !== "vercel.deployment.success") {
    return { action: "fail", errors: ["alleen vercel.deployment.success hoort bij deze controle"] };
  }
  if (parsed.stateType !== "success") {
    return { action: "fail", errors: ["state.type hoort success te zijn"] };
  }
  if (parsed.projectName !== "romfix-visuals") {
    return { action: "skip", reason: "ander Vercel-project" };
  }
  if (parsed.environment === "production") {
    return { action: "skip", reason: "productiehosts horen bij host-sync, niet bij de previewcontrole" };
  }
  if (parsed.environment !== "preview") {
    return { action: "fail", errors: ["environment is niet preview of production"] };
  }
  return { action: "check", url: parsed.url, expectedCommit: parsed.sha };
}

module.exports = { validateStatusPayload, planPreviewDispatch };
