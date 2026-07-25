import { useMemo, useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import type { AppDispatch, RootState } from "../store/store";
import { clearTracking, trackParcel } from "../features/parcels/parcelSlice";
import DarkStatusBadge from "../components/ui/StatusBadge";

const statusOrder: Record<string, number> = {
  PENDING_PICKUP: 0,
  PICKED: 1,
  IN_TRANSIT: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
};

const statusTimelineNodes = [
  { status: "PENDING_PICKUP", title: "Order Received", desc: "Dispatch team registered shipment" },
  { status: "PICKED", title: "Parcel Picked Up", desc: "Collected by local courier agent" },
  { status: "IN_TRANSIT", title: "Sorting Center / In Transit", desc: "Routed through hub terminal" },
  { status: "OUT_FOR_DELIVERY", title: "Out For Delivery", desc: "On the way to destination address" },
  { status: "DELIVERED", title: "Delivered Successfully", desc: "Handover signed by receiver" },
];

export default function TrackParcelPage() {
  const dispatch = useDispatch<AppDispatch>();
  const parcels = useSelector((s: RootState) => s.parcels);
  const [searchParams] = useSearchParams();

  const [parcelId, setParcelId] = useState(searchParams.get("id") || "");
  const [alertType, setAlertType] = useState<"none" | "email" | "sms" | "both">("none");
  const [notificationLog, setNotificationLog] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger search on mount if ID is in query params
  useEffect(() => {
    const queryId = searchParams.get("id");
    if (queryId) {
      const id = Number(queryId.replace("#", "").trim());
      if (Number.isInteger(id) && id > 0) {
        dispatch(clearTracking());
        dispatch(trackParcel(id)).unwrap().catch(() => {});
      }
    }
  }, [searchParams, dispatch]);

  const currentStatusIndex = useMemo(() => {
    const status = parcels.tracking?.status;
    if (!status) return 0;
    return statusOrder[status] ?? 0;
  }, [parcels.tracking?.status]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch(clearTracking());
    const id = Number(parcelId.replace("#", "").trim());
    if (!Number.isInteger(id) || id <= 0) return;
    await dispatch(trackParcel(id)).unwrap().catch(() => {});
  }

  // Draw Live GPS Route Simulation
  useEffect(() => {
    if (!parcels.tracking || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = 200);

    const citiesCoords: Record<string, { x: number; y: number }> = {
      "Kathmandu": { x: 0.58, y: 0.52 },
      "Lalitpur": { x: 0.60, y: 0.58 },
      "Bhaktapur": { x: 0.64, y: 0.53 },
      "Pokhara": { x: 0.45, y: 0.40 },
      "Chitwan": { x: 0.49, y: 0.68 },
      "Hetauda": { x: 0.56, y: 0.72 },
      "Biratnagar": { x: 0.88, y: 0.80 },
      "Birgunj": { x: 0.54, y: 0.85 },
      "Butwal": { x: 0.35, y: 0.58 },
      "Itahari": { x: 0.84, y: 0.74 },
      "Nepalgunj": { x: 0.22, y: 0.46 },
      "Dhangadhi": { x: 0.10, y: 0.36 },
      "Jumla": { x: 0.26, y: 0.26 },
      "Mustang": { x: 0.42, y: 0.22 },
    };

    const pickupCity = parcels.tracking?.pickupCity || "Kathmandu";
    const receiverCity = parcels.tracking?.receiverCity || "Pokhara";

    const startCoord = citiesCoords[pickupCity] || citiesCoords["Kathmandu"];
    const endCoord = citiesCoords[receiverCity] || citiesCoords["Pokhara"];

    const startX = width * startCoord.x;
    const startY = height * startCoord.y;
    const endX = width * endCoord.x;
    const endY = height * endCoord.y;

    let carProgress = 0;
    const targetProgress = currentStatusIndex / 4; // 0 to 1

    const drawTrack = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw all hubs as small dots in background
      Object.entries(citiesCoords).forEach(([name, coord]) => {
        const hx = width * coord.x;
        const hy = height * coord.y;
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(name, hx, hy - 8);
      });

      // Draw route path line background
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Draw completed route path line (accent glow)
      if (carProgress > 0) {
        ctx.strokeStyle = "var(--cyan)";
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "var(--cyan)";
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + (endX - startX) * carProgress, startY + (endY - startY) * carProgress);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw pulse ring at current package location
      const vehicleX = startX + (endX - startX) * carProgress;
      const vehicleY = startY + (endY - startY) * carProgress;

      const ringPulse = 12 + Math.sin(Date.now() * 0.005) * 4;
      ctx.fillStyle = "rgba(6, 182, 212, 0.15)";
      ctx.beginPath();
      ctx.arc(vehicleX, vehicleY, ringPulse, 0, Math.PI * 2);
      ctx.fill();

      // Draw start and end station highlights
      ctx.fillStyle = "var(--accent)";
      ctx.beginPath();
      ctx.arc(startX, startY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = currentStatusIndex === 4 ? "var(--cyan)" : "#ef4444";
      ctx.beginPath();
      ctx.arc(endX, endY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Move delivery transport vehicle indicator (ease into position)
      if (carProgress < targetProgress) {
        carProgress += 0.01;
        if (carProgress > targetProgress) carProgress = targetProgress;
      } else if (carProgress > targetProgress) {
        carProgress -= 0.01;
        if (carProgress < targetProgress) carProgress = targetProgress;
      }

      // Draw vehicle icon
      ctx.fillStyle = "#fff";
      ctx.font = "20px Inter";
      ctx.textAlign = "center";
      ctx.fillText(currentStatusIndex === 4 ? "🎁" : "🚚", vehicleX, vehicleY - 14);

      animId = requestAnimationFrame(drawTrack);
    };

    drawTrack();
    return () => cancelAnimationFrame(animId);
  }, [parcels.tracking, currentStatusIndex]);

  // Handle opting into SMS/Email alerts simulation
  const handleAlertOptIn = (type: "email" | "sms" | "both") => {
    setAlertType(type);
    const trackingNo = parcels.tracking?.parcelId || parcelId;
    const logs: string[] = [];
    if (type === "email" || type === "both") {
      logs.push(`📧 Subscribed user@example.com to tracking alerts for #${trackingNo}`);
    }
    if (type === "sms" || type === "both") {
      logs.push(`📱 Subscribed phone +977-980****** to SMS updates for #${trackingNo}`);
    }
    setNotificationLog((prev) => [...logs, ...prev]);
  };

  return (
    <div className="page-inner" style={{ maxWidth: "1000px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 className="page-heading" style={{ fontFamily: "Poppins" }}>Real-Time Tracking Console</h1>
        <p className="page-subheading">View accurate GPS coordinates, estimated dispatch timelines, and opt into automatic SMS/email updates.</p>
      </div>

      {parcels.tracking && (
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.55)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "28px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div>
            <span className="parcel-info-label">Shipment ID</span>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>#{parcels.tracking.parcelId}</div>
          </div>
          <div>
            <span className="parcel-info-label">Current Node</span>
            <div style={{ marginTop: "4px" }}>
              <DarkStatusBadge status={parcels.tracking.status} />
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "28px" }}>
        {/* Left column: Search and timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Tracking Search Input Card */}
          <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.5)" }}>
            <form onSubmit={onSubmit} className="track-form-row" style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="parcelId">Enter Parcel ID</label>
                <input
                  id="parcelId"
                  className="form-input"
                  value={parcelId}
                  onChange={(e) => setParcelId(e.target.value)}
                  placeholder="e.g. 1"
                  inputMode="numeric"
                  style={{ background: "rgba(7, 10, 19, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={parcels.status === "loading"}
                style={{ background: "var(--gradient-primary)", padding: "12px 24px", borderRadius: "8px", border: "none" }}
              >
                {parcels.status === "loading" ? "Tracing Hubs…" : "Track live"}
              </button>
            </form>

            {parcels.error && (
              <div className="alert-error" style={{ marginTop: "16px" }}>{parcels.error}</div>
            )}
          </div>

          {/* Timeline Nodes */}
          {parcels.tracking && (
            <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.5)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📋</span> Shipment Status Timeline
              </h3>
              
              <div className="status-timeline">
                {statusTimelineNodes.map((node, idx) => {
                  const nodeOrderValue = statusOrder[node.status];
                  const active = nodeOrderValue <= currentStatusIndex;
                  const isLast = idx === statusTimelineNodes.length - 1;

                  // Find event matching this node status to show timestamp
                  const matchEvent = parcels.tracking?.events.find(e => e.status === node.status);

                  return (
                    <div
                      key={node.status}
                      className={`timeline-item${active ? " active-tl" : ""}`}
                      style={{ paddingBottom: isLast ? 0 : "24px" }}
                    >
                      <div className={`timeline-dot${active ? " active" : ""}`} style={{ fontSize: "11px", fontWeight: 700 }}>
                        {active ? "✓" : ""}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-status" style={{ color: active ? "#fff" : "var(--text-muted)", fontSize: "14px" }}>
                          {node.title}
                        </div>
                        <div style={{ color: active ? "var(--text-secondary)" : "var(--text-muted)", fontSize: "12px", marginTop: "2px" }}>
                          {node.desc}
                        </div>
                        {matchEvent && (
                          <div className="timeline-time" style={{ color: "var(--cyan)", fontSize: "11px", marginTop: "4px" }}>
                            ⏱️ {new Date(matchEvent.createdAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column: GPS Map Canvas, Hub logs & simulator alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {parcels.tracking ? (
            <>
              {/* GPS Live visualizer */}
              <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.5)", overflow: "hidden", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>🛰️ Live Route GPS Simulator</h3>
                  <span style={{ fontSize: "12px", color: "var(--cyan)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                    <span className="loading-dot" style={{ width: "6px", height: "6px", background: "var(--cyan)", animation: "bounce 1s infinite" }} />
                    Active Connection
                  </span>
                </div>

                <div style={{ background: "#070a13", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <canvas ref={canvasRef} style={{ display: "block", width: "100%" }} />
                </div>

                <div className="parcel-info-grid" style={{ marginBottom: 0, gap: "12px" }}>
                  <div className="dark-card-sm" style={{ background: "rgba(7, 10, 19, 0.3)" }}>
                    <span className="parcel-info-label">Current Transit Station</span>
                    <div style={{ color: "#fff", fontWeight: 700, marginTop: "4px" }}>
                      {parcels.tracking.status === "DELIVERED" ? "Delivered Endpoint" : parcels.tracking.status === "OUT_FOR_DELIVERY" ? "Destination Address Hub" : "Kathmandu Sort Hub"}
                    </div>
                  </div>
                  <div className="dark-card-sm" style={{ background: "rgba(7, 10, 19, 0.3)" }}>
                    <span className="parcel-info-label">Estimated Delivery</span>
                    <div style={{ color: "var(--cyan)", fontWeight: 700, marginTop: "4px" }}>
                      {parcels.tracking.status === "DELIVERED" ? "Completed" : "Within 24-48 Hours"}
                    </div>
                  </div>
                </div>

                {/* Courier Agent Profile Card */}
                <div style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "10px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "8px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "var(--gradient-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "#fff"
                    }}>
                      RT
                    </div>
                    <div>
                      <div style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>Rabin Thapa</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>★ 4.9 · Bajaj Pulsar (BA-2-PA-8989)</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => alert("💬 Simulating live courier agent chat channel...")} 
                    className="btn-secondary" 
                    style={{ padding: "6px 12px", fontSize: "11px", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    Message Agent
                  </button>
                </div>
              </div>

              {/* Alert setup options */}
              <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.5)" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>🔔 SMS &amp; Email Dispatch Alerts</h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>Receive real-time push logs simulated on your client terminal when the courier moves between hubs.</p>

                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, padding: "8px", fontSize: "12px", borderColor: alertType === "email" ? "var(--cyan)" : undefined }}
                    onClick={() => handleAlertOptIn("email")}
                  >
                    Email Alerts
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, padding: "8px", fontSize: "12px", borderColor: alertType === "sms" ? "var(--cyan)" : undefined }}
                    onClick={() => handleAlertOptIn("sms")}
                  >
                    SMS Alerts
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, padding: "8px", fontSize: "12px", background: "var(--gradient-primary)" }}
                    onClick={() => handleAlertOptIn("both")}
                  >
                    Subscribe Both
                  </button>
                </div>

                {notificationLog.length > 0 && (
                  <div style={{ background: "#070a13", borderRadius: "10px", padding: "12px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "110px", overflowY: "auto" }}>
                    {notificationLog.map((logStr, idx) => (
                      <div key={idx} style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                        {logStr}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.3)", borderStyle: "dashed", minHeight: "300px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px" }}>
              <span style={{ fontSize: "48px", marginBottom: "16px" }}>🛰️</span>
              <h3 style={{ fontSize: "16px", color: "#fff", fontWeight: 700 }}>Awaiting Tracking Query</h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "260px", marginTop: "8px" }}>Enter a valid numeric parcel index above (e.g. 1) to retrieve full status maps and timelines.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
