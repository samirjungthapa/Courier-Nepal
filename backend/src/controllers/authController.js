const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");
const env = require("../config/env");
const { sendResetEmail } = require("../utils/mailer");

// Shared helpers 

function requireValidation(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({ field: e.path, msg: e.msg }));
    const err = new Error("Validation failed");
    err.statusCode = 400;
    err.errors = errors;
    throw err;
  }
}

function makeError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// Register 

async function register(req, res, next) {
  try {
    requireValidation(req);
    const { name, email, phone, password, role } = req.body;
    const { User } = req.app.get("models");

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // Only allow specific roles during registration
    const userRole = (role === "DELIVERY_STAFF") ? "DELIVERY_STAFF" : "USER";

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      phone: phone || null,
      passwordHash,
      role: userRole,
    });

    const token = jwt.sign(
      { role: user.role, email: user.email },
      jwtConfig.secret,
      { subject: String(user.id), expiresIn: jwtConfig.expiresIn }
    );

    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isBanned: user.isBanned },
    });
  } catch (err) {
    return next(err);
  }
}

//  Login 

async function login(req, res, next) {
  try {
    requireValidation(req);
    const { email, password } = req.body;
    const { User } = req.app.get("models");

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`[AUTH] Login failed: User not found (${email})`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isBanned) {
      console.log(`[AUTH] Forbidden: User is banned (${email})`);
      return res.status(403).json({ message: "Your account has been banned. Please contact support." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.log(`[AUTH] Login failed: Password mismatch (${email})`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { role: user.role, email: user.email },
      jwtConfig.secret,
      { subject: String(user.id), expiresIn: jwtConfig.expiresIn }
    );

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isBanned: user.isBanned },
    });
  } catch (err) {
    return next(err);
  }
}

// Me 
async function me(req, res, next) {
  try {
    const { User } = req.app.get("models");
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "phone", "role", "isBanned"],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned." });
    }

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

// Forgot Password 
// POST /api/auth/forgot-password  { email }
// Issues a short-lived JWT reset token. The token encodes the user's id and
// their CURRENT password hash — so the link is automatically invalidated
// once the password is changed (one-time use).

async function forgotPassword(req, res, next) {
  try {
    requireValidation(req);
    const { email } = req.body;
    const { User } = req.app.get("models");

    const user = await User.findOne({ where: { email } });

    // Always return 200 to prevent user enumeration.
    if (!user) {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    // Sign a reset token that includes a fingerprint of the current password
    // so the link becomes invalid once the password changes.
    const resetToken = jwt.sign(
      { pwdHash: user.passwordHash.slice(-8) },  // partial hash fingerprint
      env.RESET_SECRET,
      { subject: String(user.id), expiresIn: env.RESET_EXPIRES_IN }
    );

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendResetEmail(user.email, resetUrl);

    return res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    return next(err);
  }
}

// Reset Password 
// POST /api/auth/reset-password  { token, password }

async function resetPassword(req, res, next) {
  try {
    requireValidation(req);
    const { token, password } = req.body;
    const { User } = req.app.get("models");

    let payload;
    try {
      payload = jwt.verify(token, env.RESET_SECRET);
    } catch {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    const userId = Number(payload.sub);
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    // Validate fingerprint — ensures token can only be used once
    if (user.passwordHash.slice(-8) !== payload.pwdHash) {
      return res.status(400).json({ message: "Reset link has already been used." });
    }

    const newHash = await bcrypt.hash(password, 12);
    user.passwordHash = newHash;
    await user.save();

    return res.json({ message: "Password updated successfully. You can now log in." });
  } catch (err) {
    return next(err);
  }
}

// Validators 
const registerValidators = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("phone").optional().isString().isLength({ min: 7, max: 30 }),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role").optional().isIn(["USER", "DELIVERY_STAFF"]).withMessage("Invalid role"),
];

const loginValidators = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isString().notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidators = [
  body("email").isEmail().withMessage("Valid email is required"),
];

const resetPasswordValidators = [
  body("token").notEmpty().withMessage("Token is required"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

module.exports = {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
};
