import { useEffect, useState, useRef } from "react";
import { http } from "../api/http";
import StatusBadge from "../components/ui/StatusBadge";
import { playBeep, playChime, playScribble, playSweep } from "../utils/audio";

type ParcelData = any;

export default function DeliveryStaffDashboardPage() {
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Signature pad states
  const [activeSignId, setActiveSignId] = useState<number | null>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Scanned verified parcels for EcoVan loading simulation
  const [scannedIds, setScannedIds] = useState<number[]>([]);

  // Driver Route Optimization Canvas states
  const driverRouteCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [driverRoutePath, setDriverRoutePath] = useState<string[]>([]);
  const [optimizingDriverRoute, setOptimizingDriverRoute] = useState(false);

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
      setScannedIds(prev => prev.includes(match.id) ? prev : [...prev, match.id]);
      playBeep();
    } else {
      setScanResult("❌ Scanner Error: Parcel ID not found in dispatch manifest.");
    }
  };

  // Canvas drawing functions for Signature Pad (Mouse)
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
    playScribble();
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
    if (Math.random() < 0.15) playScribble();
  };

  // Canvas drawing functions for Signature Pad (Touch Screen)
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    setIsDrawing(true);
    playScribble();
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
    if (Math.random() < 0.15) playScribble();
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
    updateStatus(parcelId, "DELIVERED");
    setActiveSignId(null);
    playChime();
    alert(`✍️ Delivery Signature registered successfully for Parcel #${parcelId}!`);
  };

  // Driver route canvas drawing hook
  useEffect(() => {
    if (!driverRouteCanvasRef.current) return;
    const canvas = driverRouteCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = 400);
    const height = (canvas.height = 180);

    const hubs: Record<string, { x: number; y: number }> = {
      Kathmandu: { x: 200, y: 90 },
      Lalitpur: { x: 220, y: 110 },
      Hetauda: { x: 180, y: 140 },
      Birgunj: { x: 170, y: 165 },
      Pokhara: { x: 120, y: 70 },
      Butwal: { x: 90, y: 110 },
      Nepalgunj: { x: 40, y: 60 },
      Biratnagar: { x: 350, y: 140 },
      Itahari: { x: 330, y: 110 },
    };

    // Draw map background
    ctx.clearRect(0, 0, width, height);

    // Draw all background nodes
    Object.keys(hubs).forEach((name) => {
      const hub = hubs[name];
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw connections
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 1;
    const keys = Object.keys(hubs);
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const dist = Math.hypot(hubs[keys[i]].x - hubs[keys[j]].x, hubs[keys[i]].y - hubs[keys[j]].y);
        if (dist < 100) {
          ctx.beginPath(); ctx.moveTo(hubs[keys[i]].x, hubs[keys[i]].y); ctx.lineTo(hubs[keys[j]].x, hubs[keys[j]].y); ctx.stroke();
        }
      }
    }

    // Identify active delivery points (receiver cities of active dispatches)
    const activeCities = Array.from(new Set(
      parcels
        .filter(p => p.status !== "DELIVERED" && p.receiverCity)
        .map(p => p.receiverCity)
    )) as string[];

    // Plot active destination hubs
    activeCities.forEach((city) => {
      const hub = hubs[city];
      if (hub) {
        // Red glowing pulse
        ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
        ctx.beginPath(); ctx.arc(hub.x, hub.y, 16, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = "var(--error)";
        ctx.beginPath(); ctx.arc(hub.x, hub.y, 6, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = "var(--text-secondary)";
        ctx.font = "8px monospace";
        ctx.fillText(city, hub.x - 20, hub.y - 10);
      }
    });

    // Draw optimized sequence path
    if (driverRoutePath.length > 1) {
      ctx.strokeStyle = "var(--accent)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const firstHub = hubs[driverRoutePath[0]];
      if (firstHub) ctx.moveTo(firstHub.x, firstHub.y);
      for (let i = 1; i < driverRoutePath.length; i++) {
        const hub = hubs[driverRoutePath[i]];
        if (hub) ctx.lineTo(hub.x, hub.y);
      }
      ctx.stroke();

      // Draw sequence numbers
      driverRoutePath.forEach((city, index) => {
        const hub = hubs[city];
        if (hub) {
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(hub.x, hub.y, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#000";
          ctx.font = "bold 8px sans-serif";
          ctx.fillText(String(index + 1), hub.x - 3, hub.y + 3);
        }
      });
    }
  }, [parcels, driverRoutePath]);

  const handleOptimizeDriverRoute = () => {
    setOptimizingDriverRoute(true);
    setTimeout(() => {
      // Find receiver cities of all active parcels
      const cities = Array.from(new Set(
        parcels
          .filter(p => p.status !== "DELIVERED" && p.receiverCity)
          .map(p => p.receiverCity)
      )) as string[];

      // Formulate path: start from Kathmandu, then append other cities
      const path = ["Kathmandu", ...cities];
      setDriverRoutePath(path);
      setOptimizingDriverRoute(false);
      playSweep();
    }, 1000);
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

      {/* Driver Operations Console Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px", marginBottom: "36px" }}>
        
        {/* Card 1: Scanner */}
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

        {/* Card 2: EcoVan Cargo Loader */}
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.5)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>🚐 EcoVan Container Loading visualizer</h3>
            <span style={{ fontSize: "10px", color: "var(--cyan)", background: "rgba(6, 182, 212, 0.08)", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
              {scannedIds.length}/8 Slots Loaded
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Allocations and container weights are adjusted in real-time as dispatches verify.</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", background: "rgba(7, 10, 19, 0.4)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((slotIdx) => {
              const isLoaded = scannedIds.length >= slotIdx;
              return (
                <div 
                  key={slotIdx} 
                  style={{ 
                    height: "45px", 
                    borderRadius: "6px", 
                    background: isLoaded ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))" : "rgba(255,255,255,0.02)", 
                    border: isLoaded ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255,255,255,0.04)", 
                    display: "flex", 
                    flexDirection: "column",
                    alignItems: "center", 
                    justifyContent: "center",
                    gap: "2px",
                    transition: "all 0.3s ease"
                  }}
                >
                  <span style={{ fontSize: "8px", color: "var(--text-muted)" }}>Slot {slotIdx}</span>
                  <span style={{ fontSize: "12px" }}>{isLoaded ? "📦" : "⬜"}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Driver Sequence Optimizer Map */}
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.5)", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>🗺️ Dispatch Sequence Map</h3>
            <button
              onClick={handleOptimizeDriverRoute}
              disabled={optimizingDriverRoute}
              className="btn-primary"
              style={{ background: "var(--gradient-primary)", border: "none", fontSize: "10px", padding: "6px 12px" }}
            >
              {optimizingDriverRoute ? "Analyzing..." : "Optimize Path"}
            </button>
          </div>
          <div style={{ background: "#070a13", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.04)", overflow: "hidden" }}>
            <canvas ref={driverRouteCanvasRef} style={{ display: "block" }} />
          </div>
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
                        onTouchStart={startDrawingTouch}
                        onTouchMove={drawTouch}
                        onTouchEnd={stopDrawing}
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
