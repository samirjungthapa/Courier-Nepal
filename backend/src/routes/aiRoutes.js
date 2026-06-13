const express = require("express");
const router = express.Router();

const aiController = require("../controllers/aiController");

router.post("/ask", ...aiController.askValidators, aiController.ask);

module.exports = router;

