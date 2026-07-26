import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "../store/store";
import { http } from "../api/http";
import StatusBadge from "../components/ui/StatusBadge";
import { playChime } from "../utils/audio";

type ParcelData = any;

/**
 * UserDashboardPage renders customer KPIs including carbon offset milestones,
 * active parcel dispatches, loyalty rewards redemptions, and print invoice templates.
 */
export default function UserDashboardPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Simulated Loyalty Rewards Points
  const [points, setPoints] = useState(380);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemedVoucher, setRedeemedVoucher] = useState<string | null>(null);

  // Active invoice details modal state
  const [activeInvoiceParcel, setActiveInvoiceParcel] = useState<ParcelData | null>(null);
  // Carbon milestones details drawer/modal state
  const [showCarbonDetails, setShowCarbonDetails] = useState(false);

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

  // Set active invoice parcel for rendering the interactive receipt modal
  const handleDownloadInvoice = (parcelId: number) => {
    const selected = parcels.find(p => p.id === parcelId);
    if (selected) {
      setActiveInvoiceParcel(selected);
    } else {
      // Fallback fallback if not in the sliced list
      setActiveInvoiceParcel({ id: parcelId, receiverName: "Valued Receiver", receiverPhone: "N/A", receiverAddressLine1: "Transit Point", status: "PENDING_PICKUP", weightKg: 1.5 });
    }
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
        <div 
          onClick={() => setShowCarbonDetails(true)}
          className="dark-card" 
          style={{ 
            background: "rgba(15, 23, 42, 0.4)", 
            display: "flex", 
            flexDirection: "column", 
            gap: "6px",
            cursor: "pointer",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            boxShadow: "0 0 15px rgba(16, 185, 129, 0.05)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(16, 185, 129, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.2)";
            e.currentTarget.style.boxShadow = "0 0 15px rgba(16, 185, 129, 0.05)";
          }}
        >
          <span style={{ fontSize: "28px" }}>🌱</span>
          <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Green CO₂ Saved</span>
          <h3 style={{ fontSize: "28px", color: "var(--accent)" }}>{carbonSaved} kg</h3>
          <span style={{ fontSize: "9px", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", marginTop: "2px" }}>View Milestones ➔</span>
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
                    playChime();
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
                    playChime();
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
      {/* Premium Carbon Footprint Milestones Modal */}
      {showCarbonDetails && (() => {
        const carbonVal = parseFloat(carbonSaved);
        let tierName = "Eco Sprout";
        let target = 5.0;
        let prevTarget = 0.0;
        let badgeEmoji = "🌱";
        let tierColor = "#10B981";
        let nextTier = "Green Partner";
        
        if (carbonVal >= 30) {
          tierName = "Forest Guardian";
          target = 100.0;
          prevTarget = 30.0;
          badgeEmoji = "🌳";
          tierColor = "#059669";
          nextTier = "Max Level Reached";
        } else if (carbonVal >= 15) {
          tierName = "Carbon Hero";
          target = 30.0;
          prevTarget = 15.0;
          badgeEmoji = "🌿";
          tierColor = "#06b6d4";
          nextTier = "Forest Guardian";
        } else if (carbonVal >= 5) {
          tierName = "Green Partner";
          target = 15.0;
          prevTarget = 5.0;
          badgeEmoji = "🍃";
          tierColor = "#a855f7";
          nextTier = "Carbon Hero";
        }
        
        const progressPercentage = Math.min(100, Math.max(0, ((carbonVal - prevTarget) / (target - prevTarget)) * 100));

        return (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000,
            backdropFilter: "blur(8px)"
          }}>
            <div className="dark-card" style={{ maxWidth: "520px", width: "95%", padding: "32px", border: "1px solid rgba(16, 185, 129, 0.3)", background: "#080c18", boxShadow: "0 25px 50px rgba(0,0,0,0.6)", borderRadius: "16px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase" }}>🌱 Green Eco-Registry</span>
                <button onClick={() => setShowCarbonDetails(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "18px" }}>✕</button>
              </div>

              {/* Animated Tree SVG */}
              <div style={{ height: "150px", display: "flex", justifyContent: "center", alignItems: "center", position: "relative", marginBottom: "16px" }}>
                <svg viewBox="0 0 100 100" style={{ width: "120px", height: "120px", overflow: "visible" }}>
                  <defs>
                    <linearGradient id="trunk-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#78350f" />
                      <stop offset="100%" stopColor="#451a03" />
                    </linearGradient>
                    <linearGradient id="leaf-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={tierColor} />
                      <stop offset="100%" stopColor="#064e3b" />
                    </linearGradient>
                  </defs>
                  
                  {/* Soil/Ground */}
                  <ellipse cx="50" cy="90" rx="35" ry="6" fill="#1e293b" />
                  
                  {/* Trunk - thicker or taller based on carbon offset */}
                  <path 
                    d={`M 46 90 L 48 55 Q 50 ${40 - Math.min(15, carbonVal)} 52 55 L 54 90 Z`} 
                    fill="url(#trunk-grad)" 
                  />
                  
                  {/* Growing Foliage SVG Groups based on Carbon offset */}
                  <circle cx="50" cy={50 - Math.min(10, carbonVal)} r={Math.min(25, 12 + carbonVal * 0.5)} fill="url(#leaf-grad)" opacity="0.85" />
                  {carbonVal >= 5 && <circle cx="38" cy={45 - Math.min(10, carbonVal)} r="12" fill="url(#leaf-grad)" opacity="0.9" />}
                  {carbonVal >= 15 && <circle cx="62" cy={45 - Math.min(10, carbonVal)} r="12" fill="url(#leaf-grad)" opacity="0.9" />}
                  {carbonVal >= 30 && <circle cx="50" cy={30 - Math.min(10, carbonVal)} r="14" fill="#10B981" opacity="0.95" />}
                  
                  {/* Glow Ring */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke={tierColor} strokeDasharray="3, 3" strokeWidth="1" opacity="0.4" className="animate-spin" style={{ transformOrigin: "center" }} />
                </svg>

                {/* Badge Emoji Overlay */}
                <div style={{ position: "absolute", bottom: "10px", right: "180px", background: "#0e1326", border: `2px solid ${tierColor}`, borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                  {badgeEmoji}
                </div>
              </div>

              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>{tierName}</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>
                You have prevented <strong style={{ color: "var(--accent)" }}>{carbonSaved} kg</strong> of carbon emissions from entering Nepal's atmosphere!
              </p>

              {/* Progress Bar */}
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", height: "8px", position: "relative", marginBottom: "8px", overflow: "hidden" }}>
                <div style={{ width: `${progressPercentage}%`, background: `linear-gradient(90deg, ${tierColor}, var(--accent))`, height: "100%", borderRadius: "10px", transition: "width 1s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "24px" }}>
                <span>{prevTarget.toFixed(1)} kg</span>
                <span>Next Milestone: <strong style={{ color: "#fff" }}>{nextTier}</strong> ({target.toFixed(1)} kg)</span>
              </div>

              <div style={{ background: "rgba(6, 182, 212, 0.04)", border: "1px solid rgba(6, 182, 212, 0.15)", borderRadius: "8px", padding: "12px", textAlign: "left", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "24px" }}>
                🍃 <strong>Did you know?</strong> Every shipment scheduled via our green electric routing saves approximately <strong>0.45 kg of CO₂</strong> per kilogram of cargo, compared to traditional diesel dispatches.
              </div>

              <button 
                onClick={() => {
                  alert(`📜 Generating Eco-Merchant Offset Certificate for ${user?.name || "Member"}.`);
                }}
                className="btn-primary" 
                style={{ width: "100%", background: `linear-gradient(135deg, ${tierColor}, var(--accent))`, border: "none", padding: "12px" }}
              >
                Claim Digital Offset Badge
              </button>
            </div>
          </div>
        );
      })()}

      {/* Premium Digital Invoice Preview Modal */}
      {activeInvoiceParcel && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.85)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(6px)"
        }}>
          <div className="dark-card" style={{ maxWidth: "560px", width: "95%", padding: "28px", border: "1px solid rgba(255,255,255,0.08)", background: "#ffffff", color: "#1e293b", boxShadow: "0 25px 50px rgba(0,0,0,0.5)", borderRadius: "12px" }}>
            
            {/* Header / Invoice Branding */}
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #f1f5f9", paddingBottom: "16px", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "18px", color: "#0f172a", fontFamily: "Poppins", fontWeight: 800, margin: 0 }}>COURIER NEPAL</h3>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Dispatch Receipt Invoice</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "12px", color: "#0f172a", fontWeight: 700, display: "block" }}>Invoice #{activeInvoiceParcel.id}</span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Date: {new Date(activeInvoiceParcel.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Address Columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "12px", marginBottom: "20px" }}>
              <div>
                <span style={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "10px", display: "block", marginBottom: "4px" }}>Sender Details</span>
                <strong style={{ color: "#0f172a" }}>{user?.name || "Registered Merchant"}</strong>
                <div style={{ color: "#475569", marginTop: "2px" }}>Phone: {user?.phone || "+977-98XXXXXXXX"}</div>
                <div style={{ color: "#475569" }}>Tier: Gold Level Merchant</div>
              </div>
              <div>
                <span style={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "10px", display: "block", marginBottom: "4px" }}>Consignment To</span>
                <strong style={{ color: "#0f172a" }}>{activeInvoiceParcel.receiverName}</strong>
                <div style={{ color: "#475569", marginTop: "2px" }}>Phone: {activeInvoiceParcel.receiverPhone}</div>
                <div style={{ color: "#475569" }}>Address: {activeInvoiceParcel.receiverAddressLine1}, {activeInvoiceParcel.receiverCity || "Nepal Hub"}</div>
              </div>
            </div>

            {/* Consignment Itemization Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "20px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ textAlign: "left", padding: "8px", color: "#475569" }}>Description</th>
                  <th style={{ textAlign: "center", padding: "8px", color: "#475569" }}>Weight</th>
                  <th style={{ textAlign: "right", padding: "8px", color: "#475569" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 8px" }}>
                    <strong style={{ color: "#0f172a" }}>{activeInvoiceParcel.parcelType || "Standard Dispatch"}</strong>
                    <div style={{ fontSize: "10px", color: "#64748b" }}>Status: {activeInvoiceParcel.status}</div>
                  </td>
                  <td style={{ textAlign: "center", padding: "10px 8px" }}>{activeInvoiceParcel.weightKg || 1.5} kg</td>
                  <td style={{ textAlign: "right", padding: "10px 8px", fontWeight: 600 }}>NPR {150 + Math.round((activeInvoiceParcel.weightKg || 1.5) * 40)}</td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ padding: "8px", textAlign: "right", color: "#64748b" }}>Green Routing Rebate:</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#10b981", fontWeight: 600 }}>-NPR 20</td>
                </tr>
                <tr style={{ borderTop: "2px solid #e2e8f0", fontWeight: 800 }}>
                  <td colSpan={2} style={{ padding: "10px 8px", textAlign: "right", color: "#0f172a" }}>Grand Total:</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#0f172a", fontSize: "14px" }}>
                    NPR {130 + Math.round((activeInvoiceParcel.weightKg || 1.5) * 40)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Footer QR barcode representation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {/* Simulated QR Code using CSS grid */}
                <div style={{ width: "42px", height: "42px", background: "#0f172a", padding: "4px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "2px" }}>
                  {[1,0,1,1,0, 0,1,0,0,1, 1,0,1,1,1, 0,1,1,0,0, 1,0,0,1,1].map((val, idx) => (
                    <div key={idx} style={{ background: val ? "#fff" : "#0f172a" }} />
                  ))}
                </div>
                <div>
                  <span style={{ fontSize: "9px", color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, display: "inline-block", marginBottom: "4px" }}>
                    🌱 VERIFIED CARBON OFFSET
                  </span>
                  <div style={{ fontSize: "9px", color: "#64748b" }}>Scan code to track dispatch routing live.</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => window.print()}
                  className="btn-primary" 
                  style={{ background: "#0f172a", color: "#fff", border: "none", padding: "8px 16px", fontSize: "12px", cursor: "pointer", borderRadius: "6px" }}
                >
                  🖨️ Print Receipt
                </button>
                <button 
                  onClick={() => setActiveInvoiceParcel(null)}
                  className="btn-secondary" 
                  style={{ borderColor: "#cbd5e1", color: "#64748b", padding: "8px 16px", fontSize: "12px", cursor: "pointer", borderRadius: "6px" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
