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
  const [points, setPoints] = useState(380);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemedVoucher, setRedeemedVoucher] = useState<string | null>(null);

  // Carbon footprint logic: 0.45 kg saved per KG of parcel thanks to green electric routing
  const totalWeight = parcels.reduce((sum, p) => sum + (p.weightKg || 1.5), 0);
  const carbonSaved = (totalWeight * 0.45).toFixed(2);

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
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className="dark-card-sm" style={{ background: "rgba(6, 182, 212, 0.08)", borderColor: "rgba(6, 182, 212, 0.2)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>💎</span>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--cyan)", textTransform: "uppercase" }}>Loyalty Rewards</div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>{points} Points</div>
            </div>
          </div>
          <button
            onClick={() => setShowRedeemModal(true)}
            className="btn-primary"
            style={{ padding: "8px 14px", fontSize: "12px", background: "var(--gradient-primary)", border: "none" }}
          >
            Redeem
          </button>
        </div>
      </div>

      {redeemedVoucher && (
        <div style={{ 
          background: "rgba(16, 185, 129, 0.15)", 
          border: "1px solid rgba(16, 185, 129, 0.3)", 
          padding: "12px 16px", 
          borderRadius: "8px", 
          color: "#fff", 
          marginBottom: "20px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          fontSize: "14px"
        }}>
          <span>🎉 Voucher Redeemed! Use code <strong style={{ color: "var(--accent)" }}>{redeemedVoucher}</strong> for a discount on your next shipment.</span>
          <button 
            onClick={() => setRedeemedVoucher(null)} 
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
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
          <span style={{ fontSize: "28px" }}>🌱</span>
          <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Green CO₂ Saved</span>
          <h3 style={{ fontSize: "28px", color: "var(--accent)" }}>{carbonSaved} kg</h3>
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

      {/* Wholesaler Batch Manifest Dispatch Uploader */}
      <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.45)", border: "1px solid rgba(255,255,255,0.04)", padding: "24px", marginBottom: "36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "16px", color: "#fff", fontFamily: "Poppins" }}>Wholesale Batch Manifest Dispatch</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "2px" }}>Upload a CSV manifest to register multiple client consignments simultaneously.</p>
          </div>
          <span style={{ fontSize: "11px", color: "var(--cyan)", background: "rgba(6, 182, 212, 0.08)", padding: "4px 8px", borderRadius: "4px", fontWeight: 700 }}>
            Gold Merchant Tier Enabled
          </span>
        </div>

        <div style={{
          border: "2px dashed rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "32px",
          textAlign: "center",
          background: "rgba(7, 10, 19, 0.3)",
          cursor: "pointer",
          transition: "border-color 0.2s",
        }}
        onClick={() => {
          // Simulate CSV import
          const csvTemplate = `ReceiverName,ReceiverPhone,ReceiverAddress,ReceiverCity,Weight\nSamir Jung,9801234567,Lakeside,Pokhara,2.5\nAnkit Thapa,9841234567,New Road,Kathmandu,1.2\nSujal Shrestha,9851234567,Main Road,Biratnagar,4.0`;
          const confirmUpload = window.confirm(`Simulating CSV upload with following manifest:\n\n${csvTemplate}\n\nProceed to batch dispatch?`);
          if (confirmUpload) {
            alert("🚀 Manifest processed! 3 new shipments successfully registered in the logistics dispatch system.");
            fetchParcels();
          }
        }}
        >
          <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>📤</span>
          <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>Click to upload batch manifest (.csv / .xls)</span>
          <p style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>Max file size 5MB. Supports standard receiver name, phone, address, city, weight columns.</p>
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

      {/* Redeem Rewards Modal */}
      {showRedeemModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(6px)"
        }}>
          <div className="dark-card" style={{ maxWidth: "450px", width: "90%", padding: "28px", border: "1px solid rgba(255,255,255,0.08)", background: "#0e1326", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <h3 style={{ color: "#fff", marginBottom: "12px", fontFamily: "Poppins" }}>Redeem Loyalty Points</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>
              Exchange your reward points for exclusive shipping discounts. Your balance: <strong style={{ color: "var(--cyan)" }}>{points} Points</strong>
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>10% Off Single Shipment</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Cost: 100 Points</div>
                </div>
                <button 
                  disabled={points < 100}
                  onClick={() => {
                    setPoints(prev => prev - 100);
                    setRedeemedVoucher("NEPAL-ECO-10");
                    setShowRedeemModal(false);
                  }}
                  className="btn-primary"
                  style={{ padding: "6px 12px", fontSize: "11px", border: "none" }}
                >
                  Redeem
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>25% Off Single Shipment</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Cost: 250 Points</div>
                </div>
                <button 
                  disabled={points < 250}
                  onClick={() => {
                    setPoints(prev => prev - 250);
                    setRedeemedVoucher("NEPAL-ECO-25");
                    setShowRedeemModal(false);
                  }}
                  className="btn-primary"
                  style={{ padding: "6px 12px", fontSize: "11px", border: "none" }}
                >
                  Redeem
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button 
                onClick={() => setShowRedeemModal(false)}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
