const express = require("express");
const userController = require("../controllers/userController");
const authenticateJWT = require("../middleware/authenticateJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

// GET /api/users
router.get(
  "/",
  authenticateJWT,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  userController.listUsers
);

// POST /api/users/:id/ban
router.post(
  "/:id/ban",
  authenticateJWT,
  authorizeRoles("SUPER_ADMIN"),
  userController.banUser
);

// POST /api/users/:id/unban
router.post(
  "/:id/unban",
  authenticateJWT,
  authorizeRoles("SUPER_ADMIN"),
  userController.unbanUser
);

module.exports = router;
