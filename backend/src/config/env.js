const dotenv = require("dotenv");

// Load environment variables from .env (if present)
dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),

  JWT_SECRET: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  // Separate short-lived secret for password-reset tokens
  RESET_SECRET: process.env.RESET_SECRET || "dev-reset-secret-change-me",
  RESET_EXPIRES_IN: process.env.RESET_EXPIRES_IN || "15m",

  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_NAME: process.env.DB_NAME || "courier_db",
  DB_USER: process.env.DB_USER || "root",
  DB_PASS: process.env.DB_PASS || "",
  DB_DIALECT: process.env.DB_DIALECT || "mysql",
  SQLITE_STORAGE: process.env.SQLITE_STORAGE || "./dev.sqlite",
  DB_SYNC: process.env.DB_SYNC === "true",

  CORS_ORIGIN: process.env.CORS_ORIGIN || "",

  // Email / SMTP (optional — when not set, tokens are logged to console in dev)
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@couriernepal.com",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
};

module.exports = env;

