import { useState } from "react";
import type { FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import type { AppDispatch, RootState } from "../store/store";
import { register } from "../features/auth/authSlice";

export default function RegisterPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const auth = useSelector((s: RootState) => s.auth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "DELIVERY_STAFF">("USER");
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await dispatch(register({ name, email, phone: phone || undefined, password, role })).unwrap();
      const userRole = res.user.role;
      if (userRole === "DELIVERY_STAFF") navigate("/delivery-staff-dashboard");
      else navigate("/dashboard");
    } catch (err: any) {
      const msg = typeof err === "string" ? err : (err?.message || "Registration failed");
      setFormError(msg);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <span style={{ color: "var(--accent)" }}>●</span> Courier Nepal
        </div>

        <h1 className="auth-title">Create an account</h1>
        <p className="auth-sub">Join thousands of users delivering across Nepal.</p>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          </div>

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
            <label className="form-label" htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX"
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
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
            <label className="form-label" htmlFor="role">Join As</label>
            <select
              id="role"
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value as "USER" | "DELIVERY_STAFF")}
              required
            >
              <option value="USER">Customer / Sender</option>
              <option value="DELIVERY_STAFF">Delivery Personnel</option>
            </select>
          </div>

          {formError && <div className="alert-error">{formError}</div>}

          <button
            type="submit"
            disabled={auth.status === "loading"}
            className="btn-primary"
            style={{ width: "100%", marginTop: "12px" }}
          >
            {auth.status === "loading" ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
