const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_jwt_secret_key';

// Middleware to protect routes
const staffAuthMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.staff = decoded; // Attach the decoded token to the request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = staffAuthMiddleware;
