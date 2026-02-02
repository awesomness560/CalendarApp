/**
 * Vercel serverless: get new access token using refresh token.
 * POST body: { refresh_token: string }
 * Returns: { access_token, expires_in } or { error }
 */
const TOKEN_URL = "https://oauth2.googleapis.com/token";

function cors(res, origin) {
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (req.method === "OPTIONS") {
    cors(res, origin);
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    cors(res, origin);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    cors(res, origin);
    return res.status(500).json({ error: "Server missing Google OAuth config" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    cors(res, origin);
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { refresh_token } = body;
  if (!refresh_token) {
    cors(res, origin);
    return res.status(400).json({ error: "Missing refresh_token" });
  }

  const params = new URLSearchParams({
    refresh_token,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      cors(res, origin);
      return res.status(tokenRes.status).json({
        error: data.error_description || data.error || "Refresh failed",
      });
    }

    cors(res, origin);
    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in ?? 3600,
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    cors(res, origin);
    return res.status(500).json({ error: "Refresh failed" });
  }
}
