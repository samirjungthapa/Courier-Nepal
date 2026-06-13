const express = require("express");
const router = express.Router();

const authenticateJWT = require("../middleware/authenticateJWT");
const {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
} = require("../controllers/authController");

router.post("/register", registerValidators, register);
router.post("/login", loginValidators, login);
router.get("/me", authenticateJWT, me);
router.post("/forgot-password", forgotPasswordValidators, forgotPassword);
router.post("/reset-password", resetPasswordValidators, resetPassword);

module.exports = router;
