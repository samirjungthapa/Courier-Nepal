import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../store/store";

export default function ProfilePage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="page-inner">
        <div className="alert-error">You must be logged in to view your profile.</div>
      </div>
    );
  }

  function onBackToDashboard() {
    const role = user!.role;
    if (role === "SUPER_ADMIN") navigate("/super-admin-dashboard");
    else if (role === "ADMIN") navigate("/admin-dashboard");
    else if (role === "DELIVERY_STAFF") navigate("/delivery-staff-dashboard");
    else navigate("/dashboard");
  }

  return (
    <div className="page-inner-narrow">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px" }}>
        <div>
          <h1 className="page-heading">Your Profile</h1>
          <p className="page-subheading">Manage your personal information and account settings.</p>
        </div>
        <button className="btn-secondary" onClick={onBackToDashboard} style={{ marginBottom: "28px", fontSize: "13px", padding: "8px 16px" }}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="dark-card" style={{ padding: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "32px" }}>
          <div style={{ 
            width: "80px", 
            height: "80px", 
            borderRadius: "50%", 
            background: "linear-gradient(135deg, var(--accent), #ff7e5f)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            fontWeight: 700,
            color: "#fff",
            boxShadow: "0 4px 12px rgba(229, 62, 62, 0.3)"
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "24px" }}>{user.name}</h2>
            <div style={{ marginTop: "6px" }}>
               <span className={`role-tag role-${user.role.toLowerCase()}`} style={{ fontSize: "12px", padding: "4px 10px" }}>
                  {user.role.replace("_", " ")}
               </span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: "24px" }}>
          <div style={{ paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
              Full Name
            </label>
            <div style={{ fontSize: "16px", fontWeight: 500 }}>{user.name}</div>
          </div>

          <div style={{ paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
              Email Address
            </label>
            <div style={{ fontSize: "16px", fontWeight: 500 }}>{user.email}</div>
          </div>

          <div style={{ paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
              Phone Number
            </label>
            <div style={{ fontSize: "16px", fontWeight: 500 }}>{user.phone || "Not provided"}</div>
          </div>

          <div style={{ paddingBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
              System Access
            </label>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
               Authenticated as <strong>{user.role}</strong>. Permissions are automatically managed based on your role.
            </div>
          </div>
        </div>

        <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
          <button className="btn-primary" disabled style={{ opacity: 0.6 }}>Edit Profile</button>
          <button className="btn-secondary" disabled style={{ opacity: 0.6 }}>Reset Password</button>
        </div>
      </div>
    </div>
  );
}
