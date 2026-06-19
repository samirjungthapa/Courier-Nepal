import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "../store/store";
import { http } from "../api/http";
import StatusBadge from "../components/ui/StatusBadge";

type ParcelData = any;

export default function UserDashboardPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Simulated Loyalty Rewards Points
  const [points] = useState(380);

  async function fetchParcels() {
    setLoading(true);
    try {
      const res = await http.get("/api/parcels/history");
      setParcels(res.data.parcels.slice(0, 4)); // top 4
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load parcels");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchParcels();
  }, []);

  // Simulate PDF Invoice download
  const handleDownloadInvoice = (parcelId: number) => {
    alert(`📥 PDF Invoice generated for Parcel #${parcelId}. Initializing print download...`);
  };

  return (
    <div className="page-inner" style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
        <div>
          <h1 className="page-heading" style={{ fontFamily: "Poppins" }}>Welcome back, {user?.name}!</h1>
          <p className="page-subheading" style={{ marginBottom: 0 }}>Monitor active dispatches, rewards, and print receipts.</p>
        </div>
        
        {/* Loyalty badge */}
        <div className="dark-card-sm" style={{ background: "rgba(6, 182, 212, 0.08)", borderColor: "rgba(6, 182, 212, 0.2)", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>💎</span>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--cyan)", textTransform: "uppercase" }}>Loyalty Rewards</div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>{points} Points</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.4)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "28px" }}>📦</span>
          <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Total Shipments</span>
          <h3 style={{ fontSize: "28px", color: "#fff" }}>{parcels.length}</h3>
        </div>
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.4)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "28px" }}>⏱️</span>
          <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>In Transit</span>
          <h3 style={{ fontSize: "28px", color: "#fff" }}>
            {parcels.filter(p => p.status === "IN_TRANSIT" || p.status === "OUT_FOR_DELIVERY").length}
          </h3>
        </div>
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.4)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "28px" }}>✅</span>
          <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Delivered</span>
          <h3 style={{ fontSize: "28px", color: "#fff" }}>
            {parcels.filter(p => p.status === "DELIVERED").length}
          </h3>
        </div>
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.4)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "28px" }}>🔥</span>
          <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Account Tier</span>
          <h3 style={{ fontSize: "18px", color: "var(--cyan)", fontWeight: 700, marginTop: "8px" }}>Gold Merchant</h3>
        </div>
      </div>

      {/* Main Grid: Performance Analytics Chart & Quick Links */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "28px", marginBottom: "36px" }}>
        {/* Analytics SVG Chart */}
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.5)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>📈 Delivery Performance Trend</h3>
          
          <div style={{ padding: "10px 0" }}>
            <svg viewBox="0 0 500 150" style={{ width: "100%", height: "130px", overflow: "visible" }}>
              {/* Grid lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

              {/* Area under the line */}
              <path
                d="M 20 130 Q 120 40 240 70 T 480 30 L 480 130 Z"
                fill="url(#gradient-chart)"
                opacity="0.15"
              />

              {/* Smooth Spline Curve */}
              <path
                d="M 20 130 Q 120 40 240 70 T 480 30"
                fill="none"
                stroke="var(--cyan)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Markers */}
              <circle cx="120" cy="85" r="5" fill="#fff" stroke="var(--cyan)" strokeWidth="2" />
              <circle cx="240" cy="70" r="5" fill="#fff" stroke="var(--cyan)" strokeWidth="2" />
              <circle cx="480" cy="30" r="6" fill="var(--cyan)" />

              {/* Text labels */}
              <text x="20" y="148" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">Feb</text>
              <text x="120" y="148" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">Mar</text>
              <text x="240" y="148" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">Apr</text>
              <text x="360" y="148" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">May</text>
              <text x="460" y="148" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">Active</text>

              {/* Definition */}
              <defs>
                <linearGradient id="gradient-chart" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--cyan)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Quick Operations panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Link to="/create" className="dark-card" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "20px", background: "rgba(15, 23, 42, 0.4)", transition: "all 0.2s" }}>
            <span style={{ fontSize: "28px" }}>📦</span>
            <div>
              <h4 style={{ color: "#fff", fontSize: "14px", fontWeight: 700 }}>Schedule Pickup</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "11px" }}>Doorstep courier collection</p>
            </div>
          </Link>

          <Link to="/track" className="dark-card" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "20px", background: "rgba(15, 23, 42, 0.4)", transition: "all 0.2s" }}>
            <span style={{ fontSize: "28px" }}>🛰️</span>
            <div>
              <h4 style={{ color: "#fff", fontSize: "14px", fontWeight: 700 }}>Track Parcel</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "11px" }}>Real-time GPS status</p>
            </div>
          </Link>

          <Link to="/ai" className="dark-card" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "20px", background: "rgba(15, 23, 42, 0.4)", transition: "all 0.2s" }}>
            <span style={{ fontSize: "28px" }}>🤖</span>
            <div>
              <h4 style={{ color: "#fff", fontSize: "14px", fontWeight: 700 }}>AI Assistant</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "11px" }}>Logistics copilot tools</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Shipments List */}
      <div>
        <h2 style={{ fontSize: "18px", color: "#fff", marginBottom: "16px", fontFamily: "Poppins" }}>Recent Shipments</h2>
        
        {loading && <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading active list...</div>}
        {error && <div className="alert-error">{error}</div>}

        {parcels.length === 0 && !loading && (
          <div className="dark-card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <p style={{ color: "var(--text-secondary)" }}>No recent courier parcels registered on your profile.</p>
            <Link to="/create" className="btn-primary" style={{ marginTop: "16px", background: "var(--gradient-primary)", border: "none" }}>Start Shipping</Link>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {parcels.map((p) => (
            <div key={p.id} className="order-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="order-id-value" style={{ fontSize: "16px", color: "#fff" }}>Parcel #{p.id}</span>
                  <span style={{ fontSize: "11px", color: "var(--cyan)", background: "rgba(6, 182, 212, 0.08)", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                    {p.parcelType || "Standard"}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Receiver: <strong style={{ color: "#fff" }}>{p.receiverName}</strong> · Phone: {p.receiverPhone}
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <button
                  onClick={() => handleDownloadInvoice(p.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  title="Export invoice details to print"
                >
                  📄 Receipt
                </button>
                <StatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </div>

        {parcels.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Link to="/history" style={{ color: "var(--primary)", fontWeight: 600, fontSize: "13px" }}>View entire shipping history →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
