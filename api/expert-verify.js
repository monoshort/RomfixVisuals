const EXPERT_PASSWORD = process.env.ROMFIX_EXPERT_PASSWORD || "Romfix123!";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  try {
    const data = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
    const ok = String(data.password || "") === EXPERT_PASSWORD;
    res.status(ok ? 200 : 401).json({ ok: ok });
  } catch (e) {
    const code = e && e.message === "body_too_large" ? 413 : 400;
    res.status(code).json({ ok: false });
  }
};