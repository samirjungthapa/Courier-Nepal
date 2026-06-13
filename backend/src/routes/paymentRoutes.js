const express = require("express");
const router = express.Router();

const authenticateJWT = require("../middleware/authenticateJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const paymentController = require("../controllers/paymentController");

router.post(
  "/init",
  authenticateJWT,
  paymentController.initPaymentValidators,
  paymentController.initPayment
);

router.post(
  "/verify",
  authenticateJWT,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  paymentController.verifyPaymentValidators,
  paymentController.verifyPayment
);

router.get(
  "/:id",
  authenticateJWT,
  paymentController.getPaymentValidators,
  paymentController.getPaymentById
);

module.exports = router;

