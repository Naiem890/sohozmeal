const jwt = require("jsonwebtoken");

const invalidTokens = [];

const invalidateToken = (token) => {
  invalidTokens.push(token);
};
// Custom middleware for JWT token validation
const validateToken = (req, res, next) => {
  // Get the JWT token from the cookie (you should replace "yourCookieName" with your cookie name)
  const token = req.cookies._auth;
  // console.log("token", token);
  if (!token) {
    // Token is missing, return unauthorized
    return res.status(401).json({ isValid: false, message: "Unauthorized" });
  }

  if (invalidTokens.includes(token)) {
    return res.status(401).json({ isValid: false, message: "Unauthorized" });
  }

  try {
    // Verify the token using your secret key
    // eslint-disable-next-line no-undef
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded token to the request for use in route handlers
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.log(error);
    // Token is invalid or expired
    return res.status(401).json({ isValid: false, message: "Unauthorized" });
  }
};

module.exports = { validateToken, invalidateToken };
