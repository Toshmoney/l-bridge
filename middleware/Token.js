const jwt = require("jsonwebtoken");

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: "30d" } // long-lived
  );

  return { accessToken, refreshToken };
};
module.exports = { generateTokens };