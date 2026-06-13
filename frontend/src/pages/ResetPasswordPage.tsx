import { useState } from "react";
import type { FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import type { AppDispatch, RootState } from "../store/store";
import { resetPassword } from "../features/auth/authSlice";

export default function ResetPasswordPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const auth = useSelector((s: RootState) => s.auth);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If no token in URL, show error immediately
  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h1 className="auth-title">Invalid Link</h1>
          <p className="auth-sub">This reset link is missing or malformed.</p>
          <div className="auth-footer">
            <Link to="/forgot-password">Request a new one</Link>
          </div>
        </div>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      await dispatch(resetPassword({ token, password })).unwrap();
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err?.message || "Could not reset password. The link may have expired.");
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <span style={{ color: "var(--accent)" }}>●</span> Courier Nepal
        </div>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h1 className="auth-title">Password updated!</h1>
            <p className="auth-sub">
              Your password has been changed successfully.
              Redirecting you to login…
            </p>
            <div className="auth-footer" style={{ marginTop: "20px" }}>
              <Link to="/login">Go to login now →</Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="auth-title">Set new password</h1>
            <p className="auth-sub">
              Enter a strong new password for your account.
            </p>

            <form onSubmit={onSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="rp-password">New Password</label>
                <input
                  id="rp-password"
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rp-confirm">Confirm Password</label>
                <input
                  id="rp-confirm"
                  className="form-input"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Same password again"
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Password strength hint */}
              {password && (
                <div style={{
                  fontSize: "12px",
                  color: password.length >= 8 ? "#4ade80" : "var(--text-muted)"
                }}>
                  {password.length >= 8 ? "✓ Minimum length met" : `${8 - password.length} more characters needed`}
                </div>
              )}

              {error && <div className="alert-error">{error}</div>}

              <button
                type="submit"
                disabled={auth.status === "loading"}
                className="btn-primary"
                style={{ width: "100%", marginTop: "4px" }}
              >
                {auth.status === "loading" ? "Updating…" : "Update Password"}
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
