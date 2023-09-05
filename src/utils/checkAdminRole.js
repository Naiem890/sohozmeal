const checkAdminRole = (req, res, next) => {
  const user = req.user; // Assuming your user object is stored in req.user

  if (user && user.role === "admin") {
    // User is an admin, proceed to the next middleware/route handler
    next();
  } else {
    // User is not an admin, send a forbidden response
    res.status(403).json({ message: "Access denied. You are not an admin." });
  }
};

module.exports = { checkAdminRole };
