const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");

function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing Bearer token" });
  }

  const token = auth.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, jwtConfig.secret);
    req.user = {
      id: Number(payload.sub),
      role: payload.role,
      email: payload.email,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = authenticateJWT;

