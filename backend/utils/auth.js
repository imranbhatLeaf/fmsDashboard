const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "Unauthorized. Missing token." });
    
    const token = header.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized. Malformed token." });
    
    const user = await User.findOne({ sessionToken: token });
    if (!user) return res.status(401).json({ message: "Unauthorized. Session expired or logged in elsewhere." });
    
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden. Insufficient permissions." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
