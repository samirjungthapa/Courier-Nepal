const { body, validationResult, param } = require("express-validator");

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

async function initPayment(req, res) {
  requireValidation(req);
  const models = req.app.get("models");
  const { Payment, Parcel } = models;

  const { parcelId, provider, amount } = req.body;
  const parcel = await Parcel.findByPk(parcelId);
  if (!parcel) return res.status(404).json({ message: "Parcel not found" });
  if (req.user.role === "USER" && parcel.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const payment = await Payment.create({
    parcelId: parcel.id,
    userId: req.user.id,
    provider,
    amount,
    status: "PENDING",
  });

  // Integration note:
  // Real eSewa/Khalti flow would redirect user and receive callbacks.
  // For MVP we return a placeholder to keep the flow working.
  return res.status(201).json({
    paymentId: payment.id,
    provider: payment.provider,
    amount: payment.amount,
    redirectUrl: null,
  });
}

async function verifyPayment(req, res) {
  requireValidation(req);
  const models = req.app.get("models");
  const { Payment, ParcelEvent } = models;

  const { paymentId, status, providerTransactionId, receiptCode } = req.body;

  const payment = await Payment.findByPk(paymentId);
  if (!payment) return res.status(404).json({ message: "Payment not found" });

  payment.status = status;
  payment.providerTransactionId = providerTransactionId || null;
  payment.receiptCode = receiptCode || null;
  await payment.save();

  // If payment success, optionally emit a parcel event for admin visibility.
  if (status === "SUCCESS") {
    await ParcelEvent.create({
      parcelId: payment.parcelId,
      updatedByUserId: req.user.id,
      status: "PICKED",
      metadata: { paymentId: payment.id, provider: payment.provider, amount: Number(payment.amount) },
    });
  }

  return res.json({ message: "Payment verified", paymentId: payment.id });
}

async function getPaymentById(req, res) {
  const models = req.app.get("models");
  const { Payment } = models;

  const payment = await Payment.findByPk(req.params.id);
  if (!payment) return res.status(404).json({ message: "Payment not found" });

  // Basic authz: owner user can view; admin/staff can view too.
  const role = req.user.role;
  if (role === "USER" && payment.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({ payment });
}

const initPaymentValidators = [
  body("parcelId").isInt().withMessage("parcelId is required"),
  body("provider").isIn(["ESEWA", "KHALTI"]).withMessage("provider must be ESEWA or KHALTI"),
  body("amount").isNumeric().withMessage("amount must be numeric"),
];

const verifyPaymentValidators = [
  body("paymentId").isInt().withMessage("paymentId is required"),
  body("status").isIn(["SUCCESS", "FAILED"]).withMessage("status must be SUCCESS or FAILED"),
  body("providerTransactionId").optional().isString(),
  body("receiptCode").optional().isString(),
];

const getPaymentValidators = [param("id").isInt().withMessage("id must be integer")];

module.exports = {
  initPayment,
  verifyPayment,
  getPaymentById,
  initPaymentValidators,
  verifyPaymentValidators,
  getPaymentValidators,
};

