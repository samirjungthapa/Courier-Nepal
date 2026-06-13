import { useState } from "react";
import type { FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import type { AppDispatch, RootState } from "../store/store";
import { forgotPassword } from "../features/auth/authSlice";

export default function ForgotPasswordPage() {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((s: RootState) => s.auth);

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await dispatch(forgotPassword({ email })).unwrap();
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <span style={{ color: "var(--accent)" }}>●</span> Courier Nepal
        </div>

        {sent ? (
          /* ── Success state ── */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📬</div>
            <h1 className="auth-title">Check your inbox</h1>
            <p className="auth-sub" style={{ marginBottom: "24px" }}>
              If <strong>{email}</strong> is registered, we've sent a password-reset
              link. It expires in <strong>15 minutes</strong>.
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Don't see it? Check your spam folder or{" "}
              <button
                style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "13px", padding: 0 }}
                onClick={() => setSent(false)}
              >
                try again
              </button>
              .
            </p>
            <div className="auth-footer" style={{ marginTop: "24px" }}>
              <Link to="/login">← Back to login</Link>
            </div>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-sub">
              Enter the email you used to register and we'll send you a reset link.
            </p>

            <form onSubmit={onSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="fp-email">Email address</label>
                <input
                  id="fp-email"
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              {error && <div className="alert-error">{error}</div>}

              <button
                type="submit"
                disabled={auth.status === "loading"}
                className="btn-primary"
                style={{ width: "100%", marginTop: "4px" }}
              >
                {auth.status === "loading" ? "Sending…" : "Send Reset Link"}
              </button>
            </form>

            <div className="auth-footer">
              <Link to="/login">← Back to login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
