const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token tidak ditemukan. Silakan login kembali." });
  }

  try {
    const secret = process.env.JWT_SECRET || "dev-secret";
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Sesi tidak valid atau telah berakhir. Silakan login kembali." });
  }
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    const role = req.user?.role || "owner";
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Akses ditolak untuk role ini." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
