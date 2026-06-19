import { useEffect, useState, useRef } from "react";
import { http } from "../api/http";
import StatusBadge from "../components/ui/StatusBadge";

type ParcelData = any;

export default function DeliveryStaffDashboardPage() {
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Signature pad states
  const [activeSignId, setActiveSignId] = useState<number | null>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // QR / Barcode Scanner Mock State
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Driver Metrics
  const [earnings] = useState(4850); // NPR

  async function fetchParcels() {
    setLoading(true);
    try {
      const res = await http.get("/api/parcels/history");
      setParcels(res.data.parcels);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load parcels");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchParcels();
  }, []);

  async function updateStatus(id: number, status: string) {
    try {
      await http.patch(`/api/parcels/${id}/status`, { status });
      fetchParcels();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update status");
    }
  }

  async function updateAssignment(id: number, status: "ACCEPTED" | "REJECTED") {
    try {
      await http.patch(`/api/parcels/${id}/assignment-status`, { status });
      fetchParcels();
    } catch (err: any) {
      alert(err?.response?.data?.message || `Failed to ${status.toLowerCase()} assignment`);
    }
  }

  async function addRemarks(id: number, remarks: string) {
    try {
      await http.patch(`/api/parcels/${id}/remarks`, { remarks });
      fetchParcels();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to add remarks");
    }
  }

  // Barcode scanner simulator
  const handleSimulateScan = () => {
    if (!scanInput) return;
    const match = parcels.find(p => String(p.id) === scanInput);
    if (match) {
      setScanResult(`✅ Verified Parcel ID #${match.id}: Handover to ${match.receiverName} in ${match.receiverCity}.`);
    } else {
      setScanResult("❌ Scanner Error: Parcel ID not found in dispatch manifest.");
    }
  };

  // Canvas drawing functions for Signature Pad
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = (parcelId: number) => {
    alert(`✍️ Delivery Signature registered successfully for Parcel #${parcelId}!`);
    updateStatus(parcelId, "DELIVERED");
    setActiveSignId(null);
  };

  return (
    <div className="page-inner" style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <span className="hero-badge" style={{ background: "rgba(6, 182, 212, 0.1)", color: "var(--cyan)", border: "1px solid rgba(6, 182, 212, 0.2)" }}>Driver Operations</span>
        <h1 className="page-heading" style={{ fontFamily: "Poppins", marginTop: "8px" }}>Dispatch &amp; Delivery Driver Portal</h1>
        <p className="page-subheading">Acknowledge assignments, scan package barcodes, optimize courier transit routes, and verify delivery signatures.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.4)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "28px" }}>📋</span>
          <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>My Dispatch Load</span>
          <h3 style={{ fontSize: "28px", color: "#fff" }}>{parcels.length} Active</h3>
        </div>
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.4)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "28px" }}>💰</span>
          <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Commission Earnings</span>
          <h3 style={{ fontSize: "28px", color: "var(--cyan)" }}>NPR {earnings}</h3>
        </div>
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.4)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "28px" }}>🚗</span>
          <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Assigned Vehicle</span>
          <h3 style={{ fontSize: "18px", color: "#fff", fontWeight: 700, marginTop: "8px" }}>EcoVan #NP-482</h3>
        </div>
      </div>

      {/* Barcode Scanner simulator */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px", marginBottom: "36px" }}>
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.5)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>📷 Digital QR / Barcode Scanner</h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Verify and accept parcels in your container instantly by scanning their logistics IDs.</p>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              className="form-input"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Type or scan parcel ID..."
              style={{ background: "rgba(7, 10, 19, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
            />
            <button
              onClick={handleSimulateScan}
              className="btn-primary"
              style={{ background: "var(--gradient-primary)", padding: "10px 20px", border: "none", borderRadius: "8px" }}
            >
              Verify Scan
            </button>
          </div>

          {scanResult && (
            <div style={{ padding: "12px", borderRadius: "10px", fontSize: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff" }}>
              {scanResult}
            </div>
          )}
        </div>
      </div>

      {/* Manifest Tasks List */}
      <h2 style={{ fontSize: "18px", color: "#fff", marginBottom: "16px", fontFamily: "Poppins" }}>Dispatch Manifest Log</h2>

      {loading && <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>Awaiting server files...</div>}
      {error && <div className="alert-error">{error}</div>}

      {parcels.length === 0 && !loading && (
        <div className="dark-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: "var(--text-secondary)" }}>No active dispatches or pickups are assigned to you.</p>
        </div>
      )}

      {parcels.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {parcels.map((p) => {
            const isPending = p.assignmentStatus === "PENDING";
            const isRejected = p.assignmentStatus === "REJECTED";
            
            return (
              <div
                key={p.id}
                className="order-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  background: "rgba(15, 23, 42, 0.45)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  padding: "24px",
                  opacity: isRejected ? 0.6 : 1
                }}
              >
                <div className="order-head" style={{ marginBottom: 0 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="order-id-value" style={{ fontSize: "18px", color: "#fff" }}>Parcel #{p.id}</span>
                      <span style={{ fontSize: "11px", color: "var(--cyan)", background: "rgba(6, 182, 212, 0.08)", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                        {p.parcelType || "Standard"}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "14px" }}>
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
                        <span style={{ fontWeight: 700, color: "var(--cyan)" }}>📍 Pickup Hub Address</span><br/>
                        Sender: {p.customer?.name} ({p.customer?.phone})<br/>
                        {p.pickupAddressLine1}, {p.pickupCity}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.7" }}>
                        <span style={{ fontWeight: 700, color: "var(--primary)" }}>📍 Dropoff Hub Address</span><br/>
                        Receiver: {p.receiverName} ({p.receiverPhone})<br/>
                        {p.receiverAddressLine1}, {p.receiverCity}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
                    <StatusBadge status={p.status} />
                    
                    {!isPending && !isRejected && (
                      <select
                        className="form-input"
                        style={{ fontSize: "12px", padding: "8px 12px", width: "160px", background: "rgba(7,10,19,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
                        value={p.status}
                        onChange={(e) => updateStatus(p.id, e.target.value)}
                      >
                        <option value="PENDING_PICKUP">Pending Pickup</option>
                        <option value="PICKED">Picked Up</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                        <option value="DELIVERED">Delivered</option>
                      </select>
                    )}

                    {isPending && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                        <button className="btn-primary" onClick={() => updateAssignment(p.id, "ACCEPTED")} style={{ padding: "8px 16px", fontSize: "12px", background: "var(--accent)" }}>Accept</button>
                        <button className="btn-secondary" onClick={() => updateAssignment(p.id, "REJECTED")} style={{ padding: "8px 16px", fontSize: "12px" }}>Reject</button>
                      </div>
                    )}

                    {isRejected && (
                      <span style={{ color: "var(--error)", fontWeight: 700, fontSize: "13px" }}>Declined</span>
                    )}
                  </div>
                </div>

                {!isPending && !isRejected && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <input
                      type="text"
                      placeholder="Add delivery remarks (e.g. Left with security guard)"
                      className="form-input"
                      style={{ fontSize: "12px", padding: "8px 12px", width: "300px", background: "rgba(7,10,19,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
                      defaultValue={p.deliveryRemarks || ""}
                      onBlur={(e) => {
                        if (e.target.value !== p.deliveryRemarks) addRemarks(p.id, e.target.value);
                      }}
                    />

                    {p.status === "OUT_FOR_DELIVERY" && (
                      <button
                        className="btn-primary"
                        style={{ padding: "8px 16px", fontSize: "12px", background: "var(--gradient-primary)" }}
                        onClick={() => setActiveSignId(p.id)}
                      >
                        ✍️ Collect Delivery Signature
                      </button>
                    )}
                  </div>
                )}

                {/* Draw Signature Pad Modal dialog inline */}
                {activeSignId === p.id && (
                  <div style={{ background: "rgba(7,10,19,0.9)", border: "1px solid rgba(255,255,255,0.08)", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px", maxWidth: "420px" }}>
                    <h4 style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>Collect Digital Handover Signature</h4>
                    <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", overflow: "hidden", height: "130px" }}>
                      <canvas
                        ref={sigCanvasRef}
                        width="380"
                        height="130"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        style={{ display: "block", cursor: "crosshair" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={clearSignature}>Clear</button>
                      <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px", background: "var(--accent)" }} onClick={() => saveSignature(p.id)}>Submit Proof</button>
                      <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", border: "none" }} onClick={() => setActiveSignId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
