const { body, validationResult } = require("express-validator");

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

function answerForQuestion(question) {
  const q = (question || "").toLowerCase();

  if (q.includes("track") || q.includes("tracking") || q.includes("where is")) {
    return "To track your parcel, open your order history and select the parcel. You will see its live status timeline: Picked → In Transit → Out for Delivery → Delivered.";
  }

  if (q.includes("pickup") || q.includes("schedule")) {
    return "You can schedule doorstep pickup when creating a parcel. After pickup is completed, the system updates the status automatically for tracking.";
  }

  if (q.includes("payment") || q.includes("esewa") || q.includes("khalti")) {
    return "Payments are handled online using eSewa or Khalti. After payment verification, the receipt and payment status appear in your order history.";
  }

  return "I can help with parcel tracking, pickup scheduling, and payments. Ask about 'tracking', 'pickup', or 'payment'.";
}

async function ask(req, res) {
  requireValidation(req);
  const question = req.body.question;
  const answer = answerForQuestion(question);
  return res.json({ answer });
}

const askValidators = [body("question").trim().isLength({ min: 1, max: 600 }).withMessage("question is required")];

module.exports = { ask, askValidators };

