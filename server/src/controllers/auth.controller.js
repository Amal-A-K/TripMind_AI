/**
 * Auth Controller
 *
 * Handles user registration and login.
 * Keeps business logic minimal — delegates heavy lifting to the model.
 */

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// ─── Register ────────────────────────────────────────────────────────────────
// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Basic input validation
    if (!name || !email || !password) {
      const error = new Error("Name, email, and password are required");
      error.statusCode = 400;
      return next(error);
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("An account with this email already exists");
      error.statusCode = 409;
      return next(error);
    }

    // Password is hashed automatically by the User model pre-save hook
    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      return next(error);
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      return next(error);
    }

    // Compare entered password with hashed password via model method
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      const error = new Error("Email is required");
      error.statusCode = 400;
      return next(error);
    }

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User not found with this email");
      error.statusCode = 404;
      return next(error);
    }

    // Get reset token (updates user fields inside)
    const resetToken = user.getResetPasswordToken();

    // Save user state (bypass validation for password requirements)
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/reset-password/${resetToken}`;

    // For demo/assignment purposes, log the reset URL in console instead of sending email
    console.log("\n========================================================");
    console.log("             PASSWORD RESET REQUEST RECEIVED            ");
    console.log("========================================================");
    console.log(`User Email: ${email}`);
    console.log(`Reset URL:  ${resetUrl}`);
    console.log("========================================================\n");

    res.status(200).json({
      success: true,
      message: "Password reset link generated and logged to console",
      // Optional: return token in response for easier API testing in assignment
      resetToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
import crypto from "crypto";

export const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      const error = new Error("New password is required");
      error.statusCode = 400;
      return next(error);
    }

    if (password.length < 6) {
      const error = new Error("Password must be at least 6 characters");
      error.statusCode = 400;
      return next(error);
    }

    // Hash token from URL params to compare with DB
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      const error = new Error("Invalid or expired reset token");
      error.statusCode = 400;
      return next(error);
    }

    // Set new password (will be hashed automatically by userSchema pre-save hook)
    user.password = password;

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Current User ────────────────────────────────────────────────────────
// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};
