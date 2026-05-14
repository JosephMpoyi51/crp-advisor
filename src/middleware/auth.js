const jwt = require("jsonwebtoken");

function signAdmin(admin) {
  return jwt.sign({ id: admin.id || 1, email: admin.email, role: "admin" }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "12h" });
}

function requireAdmin(req, res, next) {
  const token = req.cookies.admin_token || (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Authentification requise" });

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    return next();
  } catch {
    return res.status(401).json({ error: "Session admin invalide" });
  }
}

module.exports = { signAdmin, requireAdmin };
