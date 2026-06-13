const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const env = require("./config/env");
const { sequelize } = require("./database/sequelize");
const { initModels } = require("./models");

const authRoutes = require("./routes/authRoutes");
const parcelRoutes = require("./routes/parcelRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const aiRoutes = require("./routes/aiRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Initialize models once; controllers access them via `req.app.get("models")`.
const models = initModels(sequelize);
app.set("models", models);

app.use(helmet());
const corsOrigin = env.CORS_ORIGIN || "*";
app.use(
  cors({
    origin: corsOrigin,
    // Browsers disallow credentials with '*' origin; only enable when explicitly configured.
    credentials: Boolean(env.CORS_ORIGIN),
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/parcels", parcelRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const payload = { message: err.message || "Internal Server Error" };
  if (err.errors) payload.errors = err.errors;
  if (env.NODE_ENV === "development") payload.stack = err.stack;
  return res.status(statusCode).json(payload);
});

module.exports = app;

