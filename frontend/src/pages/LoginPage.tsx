import { useState } from "react";
import type { FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";

import type { AppDispatch, RootState } from "../store/store";
import { login } from "../features/auth/authSlice";

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const auth = useSelector((s: RootState) => s.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await dispatch(login({ email, password })).unwrap();
      const role = res.user.role;
      if (role === "SUPER_ADMIN") navigate("/super-admin-dashboard");
      else if (role === "ADMIN") navigate("/admin-dashboard");
      else if (role === "DELIVERY_STAFF") navigate("/delivery-staff-dashboard");
      else navigate("/dashboard");
    } catch (err: any) {
      const msg = typeof err === "string" ? err : (err?.message || "Login failed");
      setFormError(msg);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <span style={{ color: "var(--accent)" }}>●</span> Courier Nepal
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your account to continue.</p>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label" htmlFor="password">Password</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: "12px", color: "var(--accent)" }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {formError && <div className="alert-error">{formError}</div>}

          <button
            type="submit"
            disabled={auth.status === "loading"}
            className="btn-primary"
            style={{ width: "100%", marginTop: "4px" }}
          >
            {auth.status === "loading" ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
