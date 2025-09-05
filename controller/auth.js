const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const { validationResult } = require('express-validator');
const crypto = require("crypto");
const User = require('../models/User');
const { generateTokens } = require('../middleware/Token');

const frontendUrl = process.env.frontendUrl
const register = async (req, res) => {
  try {
        
    if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
    }
    const { name, email, password, role } = req.body;

    if (!name || !password || !email) {
      return res.status(400).json({ error: "all fields required!", success:false });
    }

    if(role && !["client", "lawyer", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified", success:false });
    }

    if(role === "admin") {
      return res.status(403).json({ error: "Cannot register as admin", success:false });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long", success:false });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ error: "Invalid email format", success: false });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists", success:false, user: existingUser });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // remove the password
    const { password: _, ...userData } = newUser.toObject();

    return res.status(201).json({ message: "User created successfully", token, user: userData, success : true });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ error: "Internal Server Error", success:false });
  }
};


const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required", success: false });
    }

    const userDetails = await User.findOne({ email: email.toLowerCase() });
    if (!userDetails) {
      return res.status(404).json({ error: "User not found", success: false });
    }

    const isPasswordValid = await bcrypt.compare(password, userDetails.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password", success: false });
    }

    const { accessToken, refreshToken } = generateTokens(userDetails);

    userDetails.refreshToken = refreshToken;
    await userDetails.save();

    // remove password before sending back
    const { password: _, refreshToken: __, ...user } = userDetails.toObject();

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user,
      success: true
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal Server Error", success: false });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required", success: false });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({ message: "If this email exists, a reset link has been sent", success: true });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetToken = hashedToken;
    user.resetExpires = Date.now() + 3600000;
    await user.save();

    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}&email=${email}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset Request",
      text: `Click the link below to reset your password:\n\n${resetLink}\n\nThis link is valid for 1 hour.\n`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "If this email exists, a reset link has been sent", success: true });

  } catch (error) {
    console.error("Error in password reset request:", error);
    res.status(500).json({ error: "Internal Server Error", success: false });
  }
};


const resetPassword = async (req, res) => {
  try {
     const { token, email } = req.query;
    const {newPassword } = req.body;
    if (!email || !token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Email, token, and new password (min 6 chars) are required", success: false });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetToken: hashedToken,
      resetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token", success: false });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();

    const jwtToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ message: "Password has been reset successfully", token: jwtToken, success: true });

  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Internal Server Error", success: false });
  }
};


const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required", success: false });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user with this refresh token
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: "Invalid refresh token", success: false });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
      success: true
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(403).json({ error: "Invalid or expired refresh token", success: false });
  }
};


const logout = async (req, res) => {
  try {
    const { userId } = req.body; 
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.status(200).json({ message: "Logged out successfully", success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", success: false });
  }
};

const profile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password -resetToken -resetExpires -refreshToken');
    if (!user) {
      return res.status(404).json({ error: "User not found", success: false });
    }
    res.status(200).json({ user, success: true });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Internal Server Error", success: false });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) {
      if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ error: "Invalid email format", success: false });
      }
      updates.email = email.toLowerCase();
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password -resetToken -resetExpires -refreshToken');
    res.status(200).json({ user: updatedUser, success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal Server Error", success: false });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Current and new password (min 6 chars) are required", success: false });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found", success: false });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect", success: false });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.status(200).json({ message: "Password changed successfully", success: true });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal Server Error", success: false });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name && !email) {
      return res.status(400).json({ error: "Name or email is required to search", success: false });
    }
    const query = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (email) {
      query.email = email.toLowerCase();
    }
    const users = await User.find(query).select('name email role createdAt');
    if(users.length === 0) {
      return res.status(404).json({ error: "No users found", success: false });
    }
    res.status(200).json({ users, success: true });
  } catch (error) {
    console.error("Error fetching public profiles:", error);
    res.status(500).json({ error: "Internal Server Error", success: false });
  }
};




module.exports = {
  register,
  login,
  requestPasswordReset,
  resetPassword,
  refreshAccessToken,
  logout,
  profile,
  updateProfile,
  changePassword,
  getPublicProfile
};
