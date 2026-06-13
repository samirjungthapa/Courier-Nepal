/**
 * Mailer utility.
 *
 * In development (or when SMTP is not configured), emails are logged to the
 * console so you can copy the reset link without needing a real mail server.
 *
 * In production, install `nodemailer` (`npm i nodemailer`) and set the SMTP_*
 * env vars to enable real delivery.
 */

const env = require("../config/env");

/**
 * Send a password-reset email.
 * @param {string} toEmail  - Recipient email address
 * @param {string} resetUrl - Full reset URL (e.g. http://localhost:5173/reset-password?token=xxx)
 */
async function sendResetEmail(toEmail, resetUrl) {
  const subject = "Courier Nepal – Reset Your Password";
  const text = `
You requested a password reset for your Courier Nepal account.

Click the link below to choose a new password (valid for 15 minutes):

${resetUrl}

If you didn't request this, simply ignore this email – your password will not change.
`.trim();

  // ── SMTP mode ─────────────────────────────────────────────────────────────
  if (env.SMTP_HOST && env.SMTP_USER) {
    try {
      // Lazy-require so the app doesn't fail to start when nodemailer isn't installed.
      // Run `npm i nodemailer` in the backend folder to enable SMTP delivery.
      const nodemailer = require("nodemailer"); // eslint-disable-line
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: toEmail,
        subject,
        text,
      });
      console.log(`[mailer] Reset email sent to ${toEmail}`);
    } catch (err) {
      console.error("[mailer] SMTP error:", err.message);
      // Fallback: still log the URL so dev can complete the flow
      _logDevReset(toEmail, resetUrl);
    }
    return;
  }

  // ── Dev / no-SMTP fallback ─────────────────────────────────────────────────
  _logDevReset(toEmail, resetUrl);
}

function _logDevReset(email, url) {
  /* eslint-disable no-console */
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║          PASSWORD RESET (dev mode)               ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  To     : ${email}`);
  console.log(`║  Link   : ${url}`);
  console.log("╚══════════════════════════════════════════════════╝\n");
  /* eslint-enable no-console */
}

module.exports = { sendResetEmail };
