const jwt = require("jsonwebtoken");

const validateToken = (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ isValid: false, message: "Unauthorized" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ isValid: false, message: "Unauthorized" });
  }
};

module.exports = { validateToken };
