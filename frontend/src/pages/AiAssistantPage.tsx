import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { http } from "../api/http";
import { playBeep, playSweep } from "../utils/audio";

type ChatItem = { id: string; from: "user" | "assistant"; text: string };

export default function AiAssistantPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "route" | "predict">("chat");

  // User and Parcel context for AI assistant
  const user = useSelector((s: RootState) => s.auth.user);
  const [userParcels, setUserParcels] = useState<any[]>([]);

  useEffect(() => {
    async function loadParcels() {
      try {
        const res = await http.get("/api/parcels/history");
        setUserParcels(res.data.parcels || []);
      } catch (e) {
        console.warn("Failed to load user parcels context:", e);
      }
    }
    loadParcels();
  }, []);

  // Tab 1: Chat State
  const [question, setQuestion] = useState("");
  const [items, setItems] = useState<ChatItem[]>([
    {
      id: "welcome",
      from: "assistant",
      text: "Hi! 👋 I'm your AI Logistics Assistant. Ask me about parcel tracking, route mapping, customs procedures, or how to verify payment receipts.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tab 2: Route Optimizer State
  const [routeFrom, setRouteFrom] = useState("Kathmandu");
  const [routeTo, setRouteTo] = useState("Nepalgunj");
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedPath, setOptimizedPath] = useState<string[]>([]);
  const [optTime, setOptTime] = useState("");
  const routeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time Vehicle Routing Animation State
  const [animProgress, setAnimProgress] = useState(0);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);

  // Tab 3: Predictor State
  const [weight, setWeight] = useState("1.5");
  const [volume, setVolume] = useState("Medium");
  const [fragile, setFragile] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [predictionResult, setPredictionResult] = useState<{ cost: number; days: number } | null>(null);
  
  // 3D Box Simulator canvas reference and rotation angle
  const boxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const angleRef = useRef(0);

  // Voice Search Mock
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items, loading]);

  // Handle Chat Ask
  async function onAsk(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setError(null);
    setLoading(true);

    const userItem: ChatItem = { id: `${Date.now()}-u`, from: "user", text: q };
    setItems((prev) => [...prev, userItem]);
    setQuestion("");

    try {
      const res = await http.post("/api/ai/ask", { question: q, context: { user, parcels: userParcels } });
      const answer = res.data?.answer || "I'm processing your shipment data, please try again.";
      const assistantItem: ChatItem = { id: `${Date.now()}-a`, from: "assistant", text: answer };
      setItems((prev) => [...prev, assistantItem]);
    } catch (err: any) {
      setError(err?.response?.data?.message || "AI model offline. Using offline dispatch database.");
      // Fallback response
      setTimeout(() => {
        const assistantItem: ChatItem = {
          id: `${Date.now()}-a`,
          from: "assistant",
          text: `[Offline Mode] Received query: "${q}". Standard logistics hubs in Nepal are active. For tracking questions, check the Live Tracking tab.`,
        };
        setItems((prev) => [...prev, assistantItem]);
        setLoading(false);
      }, 800);
      return;
    }
    setLoading(false);
  }

  // Trigger Mock Voice Search
  const startVoiceSearch = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setQuestion("Where is package ID #1 right now?");
    }, 2000);
  };

  // Route Optimizer Drawing Canvas logic
  useEffect(() => {
    if (activeTab !== "route" || !routeCanvasRef.current) return;
    const canvas = routeCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = 460);
    const height = (canvas.height = 280);

    const hubs: Record<string, { x: number; y: number }> = {
      Kathmandu: { x: 230, y: 140 },
      Lalitpur: { x: 245, y: 155 },
      Hetauda: { x: 220, y: 190 },
      Birgunj: { x: 210, y: 225 },
      Pokhara: { x: 160, y: 110 },
      Butwal: { x: 130, y: 160 },
      Nepalgunj: { x: 60, y: 90 },
      Dhangadhi: { x: 30, y: 60 },
      Biratnagar: { x: 390, y: 200 },
      Itahari: { x: 380, y: 175 },
    };

    const drawMap = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw all hubs
      Object.keys(hubs).forEach((name) => {
        const hub = hubs[name];
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(99, 102, 241, 0.3)";
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "var(--text-muted)";
        ctx.font = "9px monospace";
        ctx.fillText(name, hub.x - 24, hub.y - 12);
      });

      // Draw connections
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      const hubList = Object.keys(hubs);
      for (let i = 0; i < hubList.length; i++) {
        for (let j = i + 1; j < hubList.length; j++) {
          const dist = Math.hypot(hubs[hubList[i]].x - hubs[hubList[j]].x, hubs[hubList[i]].y - hubs[hubList[j]].y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(hubs[hubList[i]].x, hubs[hubList[i]].y);
            ctx.lineTo(hubs[hubList[j]].x, hubs[hubList[j]].y);
            ctx.stroke();
          }
        }
      }

      // Draw optimized route if computed
      if (optimizedPath.length > 1) {
        ctx.strokeStyle = "var(--cyan)";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "var(--cyan)";
        ctx.beginPath();
        ctx.moveTo(hubs[optimizedPath[0]].x, hubs[optimizedPath[0]].y);
        for (let i = 1; i < optimizedPath.length; i++) {
          ctx.lineTo(hubs[optimizedPath[i]].x, hubs[optimizedPath[i]].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw active pulsars on optimized route hubs
        optimizedPath.forEach((name) => {
          const hub = hubs[name];
          ctx.fillStyle = "var(--cyan)";
          ctx.beginPath();
          ctx.arc(hub.x, hub.y, 5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw Animated Vehicle (Truck / Drone) traversing the route
        const seg = Math.floor(animProgress);
        const frac = animProgress - seg;
        
        let vx = 0;
        let vy = 0;

        if (seg >= optimizedPath.length - 1) {
          const finalHub = hubs[optimizedPath[optimizedPath.length - 1]];
          vx = finalHub.x;
          vy = finalHub.y;
        } else {
          const h1 = hubs[optimizedPath[seg]];
          const h2 = hubs[optimizedPath[seg + 1]];
          vx = h1.x + (h2.x - h1.x) * frac;
          vy = h1.y + (h2.y - h1.y) * frac;
        }

        // Draw glowing vehicle marker
        ctx.fillStyle = "var(--accent)";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "var(--accent)";
        ctx.beginPath();
        ctx.arc(vx, vy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw vehicle emoji inside
        ctx.fillStyle = "#fff";
        ctx.font = "10px sans-serif";
        ctx.fillText("🚚", vx - 6, vy + 3);
      }
    };

    drawMap();
  }, [activeTab, optimizedPath, animProgress]);

  // Telemetry animation sequence runner when optimizedPath changes
  useEffect(() => {
    if (optimizedPath.length <= 1) return;
    setAnimProgress(0);
    setTelemetryLogs([`[0.0s] 🛰️ Initializing green electric routing dispatch from ${optimizedPath[0]}...`]);

    let start: number | null = null;
    const durationPerSegment = 1000; // 1s per segment
    const totalSegments = optimizedPath.length - 1;
    const totalDuration = totalSegments * durationPerSegment;

    let reqId: number;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progressFraction = Math.min(totalSegments, (elapsed / totalDuration) * totalSegments);

      setAnimProgress(progressFraction);

      // Add telemetry logs dynamically
      const currentSegment = Math.floor(progressFraction);
      const secondsVal = (elapsed / 1000).toFixed(1);
      
      setTelemetryLogs(prev => {
        const lastHubLogged = optimizedPath[currentSegment];
        const newMsg = `[${secondsVal}s] 🚚 Reached checkpoint: ${lastHubLogged} Hub`;
        if (!prev.includes(newMsg) && currentSegment > 0) {
          return [...prev, newMsg];
        }
        return prev;
      });

      if (progressFraction < totalSegments) {
        reqId = requestAnimationFrame(animate);
      } else {
        const finalSecs = (totalDuration / 1000).toFixed(1);
        setTelemetryLogs(prev => {
          const completionMsg = `[${finalSecs}s] ✅ Cargo successfully arrived at destination hub: ${optimizedPath[optimizedPath.length - 1]}!`;
          if (!prev.includes(completionMsg)) {
            return [...prev, completionMsg];
          }
          return prev;
        });
      }
    };

    reqId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqId);
  }, [optimizedPath]);

  // Run route optimization algorithm simulation
  const handleOptimizeRoute = () => {
    setOptimizing(true);
    setOptimizedPath([]);
    
    setTimeout(() => {
      // Setup simple path depending on cities
      let path = [routeFrom];
      if (routeFrom === routeTo) {
        path = [routeFrom];
      } else if (routeFrom === "Kathmandu" && routeTo === "Nepalgunj") {
        path = ["Kathmandu", "Pokhara", "Butwal", "Nepalgunj"];
      } else if (routeFrom === "Kathmandu" && routeTo === "Biratnagar") {
        path = ["Kathmandu", "Hetauda", "Itahari", "Biratnagar"];
      } else if (routeFrom === "Pokhara" && routeTo === "Biratnagar") {
        path = ["Pokhara", "Kathmandu", "Hetauda", "Biratnagar"];
      } else {
        path = [routeFrom, "Kathmandu", routeTo];
      }

      setOptimizedPath(path);
      setOptTime(`${(1.2 + Math.random() * 0.9).toFixed(1)} hours (saved ${Math.floor(20 + Math.random() * 20)}% transit delay)`);
      setOptimizing(false);
      playSweep();
    }, 1200);
  };

  // Predict Delivery Cost & Time
  const handlePredictDetails = () => {
    const baseCost = 150;
    const wt = parseFloat(weight) || 1.0;
    const insSurcharge = insurance ? 80 : 0;
    const fragileSurcharge = fragile ? 50 : 0;
    const calculatedCost = Math.round(baseCost + wt * 40 + insSurcharge + fragileSurcharge);

    let days = 2;
    if (wt > 10) days += 1;
    if (fragile) days += 0.5;

    setPredictionResult({
      cost: calculatedCost,
      days: Math.max(1, Math.round(days)),
    });
    playBeep();
  };

  // 3D wireframe box generator hook
  useEffect(() => {
    if (activeTab !== "predict" || !boxCanvasRef.current) return;
    const canvas = boxCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 200;

    let reqId: number;

    const drawBox = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      angleRef.current += 0.012; // Rotate
      const angle = angleRef.current;

      // Volumetric box sizing based on volume type
      let w = 55, h = 55, d = 55;
      if (volume === "Small") {
        w = 80; h = 8; d = 50;
      } else if (volume === "Medium") {
        w = 60; h = 50; d = 60;
      } else if (volume === "Large") {
        w = 100; h = 75; d = 85;
      }

      // Weight expands volume slightly for visual aesthetic
      const wtScale = Math.min(1.4, Math.max(0.8, parseFloat(weight) ? Math.log10(parseFloat(weight) + 1.2) * 1.1 : 1.0));
      w *= wtScale;
      h *= wtScale;
      d *= wtScale;

      const halfW = w / 2;
      const halfH = h / 2;
      const halfD = d / 2;

      const vertices = [
        { x: -halfW, y: -halfH, z: -halfD },
        { x: halfW, y: -halfH, z: -halfD },
        { x: halfW, y: halfH, z: -halfD },
        { x: -halfW, y: halfH, z: -halfD },
        { x: -halfW, y: -halfH, z: halfD },
        { x: halfW, y: -halfH, z: halfD },
        { x: halfW, y: halfH, z: halfD },
        { x: -halfW, y: halfH, z: halfD }
      ];

      const rotated = vertices.map(v => {
        // Rotate Y
        let x1 = v.x * Math.cos(angle) - v.z * Math.sin(angle);
        let z1 = v.x * Math.sin(angle) + v.z * Math.cos(angle);
        // Rotate X
        let y2 = v.y * Math.cos(0.35) - z1 * Math.sin(0.35);
        let z2 = v.y * Math.sin(0.35) + z1 * Math.cos(0.35);

        const distance = 250;
        const scale = distance / (distance + z2);
        return {
          x: canvas.width / 2 + x1 * scale,
          y: canvas.height / 2 + y2 * scale
        };
      });

      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];

      // Draw futuristic grid background
      ctx.strokeStyle = "rgba(6, 182, 212, 0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 25) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 25) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // Draw wireframe
      ctx.strokeStyle = "var(--cyan)";
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "var(--cyan)";
      
      edges.forEach(([u, v]) => {
        ctx.beginPath();
        ctx.moveTo(rotated[u].x, rotated[u].y);
        ctx.lineTo(rotated[v].x, rotated[v].y);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // Dimension CAD labels
      ctx.fillStyle = "var(--text-muted)";
      ctx.font = "9px monospace";
      ctx.fillText(`L: ${w.toFixed(0)}mm`, 8, canvas.height - 30);
      ctx.fillText(`W: ${d.toFixed(0)}mm`, 8, canvas.height - 18);
      ctx.fillText(`H: ${h.toFixed(0)}mm`, 8, canvas.height - 6);

      reqId = requestAnimationFrame(drawBox);
    };

    drawBox();
    return () => cancelAnimationFrame(reqId);
  }, [activeTab, volume, weight]);

  return (
    <div className="page-inner" style={{ maxWidth: "900px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 className="page-heading" style={{ fontFamily: "Poppins" }}>AI Logistics Copilot</h1>
        <p className="page-subheading">Harness automated machine learning classifiers for routing, pricing, and immediate customer responses.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", background: "rgba(15, 23, 42, 0.4)", padding: "4px", borderRadius: "10px", marginBottom: "28px" }}>
        <button
          onClick={() => setActiveTab("chat")}
          style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "8px", background: activeTab === "chat" ? "rgba(255,255,255,0.06)" : "transparent", color: activeTab === "chat" ? "#fff" : "var(--text-muted)" }}
        >
          💬 AI Support Chatbot
        </button>
        <button
          onClick={() => setActiveTab("route")}
          style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "8px", background: activeTab === "route" ? "rgba(255,255,255,0.06)" : "transparent", color: activeTab === "route" ? "#fff" : "var(--text-muted)" }}
        >
          🛰️ AI Route Optimizer
        </button>
        <button
          onClick={() => setActiveTab("predict")}
          style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "8px", background: activeTab === "predict" ? "rgba(255,255,255,0.06)" : "transparent", color: activeTab === "predict" ? "#fff" : "var(--text-muted)" }}
        >
          📈 AI Delivery Predictor
        </button>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: "20px" }}>{error}</div>}

      {/* Tab content 1: Chatbot */}
      {activeTab === "chat" && (
        <div className="dark-card" style={{ padding: 0, background: "rgba(15, 23, 42, 0.55)", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div className="chat-window" style={{ background: "transparent", border: "none", minHeight: "350px", maxHeight: "450px" }}>
            {items.map((it) => (
              <div
                key={it.id}
                className={`chat-bubble ${it.from === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}
                style={{ padding: "12px 16px", borderRadius: "14px" }}
              >
                {it.text}
              </div>
            ))}

            {loading && (
              <div className="chat-bubble chat-bubble-assistant">
                <div className="loading-row">
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "12px 16px", background: "rgba(15, 23, 42, 0.15)", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
            {[
              "Where is parcel ID #1?",
              "How to schedule a pickup?",
              "How to earn reward points?",
              "What payment options exist?"
            ].map((pText) => (
              <button
                key={pText}
                type="button"
                disabled={loading}
                onClick={async () => {
                  setError(null);
                  setLoading(true);
                  const userItem: ChatItem = { id: `${Date.now()}-u`, from: "user", text: pText };
                  setItems((prev) => [...prev, userItem]);
                  try {
                    const res = await http.post("/api/ai/ask", { question: pText, context: { user, parcels: userParcels } });
                    const answer = res.data?.answer || "I'm processing your shipment data, please try again.";
                    const assistantItem: ChatItem = { id: `${Date.now()}-a`, from: "assistant", text: answer };
                    setItems((prev) => [...prev, assistantItem]);
                  } catch (err: any) {
                    setTimeout(() => {
                      const assistantItem: ChatItem = {
                        id: `${Date.now()}-a`,
                        from: "assistant",
                        text: `[AI Assistant] For tracking queries, please check the 'Track Parcel' tab. For scheduling pickups, check 'Schedule Pickup'.`,
                      };
                      setItems((prev) => [...prev, assistantItem]);
                      setLoading(false);
                    }, 500);
                    return;
                  }
                  setLoading(false);
                }}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "20px",
                  padding: "6px 12px",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {pText}
              </button>
            ))}
          </div>

          {/* Chat input box */}
          <div style={{ padding: "16px", borderTop: "1px solid var(--border)", background: "rgba(7, 10, 19, 0.3)" }}>
            <form onSubmit={onAsk} className="chat-input-row">
              <button
                type="button"
                onClick={startVoiceSearch}
                className="btn-secondary"
                style={{ padding: "12px", borderRadius: "10px", borderColor: isRecording ? "var(--error)" : undefined }}
                title="Voice Search Simulation"
              >
                {isRecording ? "🔴 Rec..." : "🎙️ Speak"}
              </button>
              <input
                className="chat-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about rates, dispatch timelines, eSewa credentials..."
                disabled={loading}
                style={{ background: "rgba(7, 10, 19, 0.6)", borderRadius: "10px", padding: "12px 16px" }}
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="btn-primary"
                style={{ background: "var(--gradient-primary)", padding: "12px 24px", borderRadius: "10px", border: "none" }}
              >
                {loading ? "Thinking..." : "Query AI"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab content 2: Route Optimizer */}
      {activeTab === "route" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "28px" }}>
          {/* Controls */}
          <div className="dark-card" style={{ display: "flex", flexDirection: "column", gap: "16px", background: "rgba(15, 23, 42, 0.5)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>Configure Route Paths</h3>
            
            <div className="form-group">
              <label className="form-label">Pickup Hub</label>
              <select className="form-input" value={routeFrom} onChange={(e) => setRouteFrom(e.target.value)}>
                <option value="Kathmandu">Kathmandu sorting center</option>
                <option value="Pokhara">Pokhara subhub</option>
                <option value="Butwal">Butwal logistics hub</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Destination Hub</label>
              <select className="form-input" value={routeTo} onChange={(e) => setRouteTo(e.target.value)}>
                <option value="Nepalgunj">Nepalgunj station</option>
                <option value="Biratnagar">Biratnagar terminal</option>
                <option value="Dhangadhi">Dhangadhi terminal</option>
              </select>
            </div>

            <button
              onClick={handleOptimizeRoute}
              disabled={optimizing}
              className="btn-primary"
              style={{ background: "var(--gradient-primary)", marginTop: "8px", padding: "12px", border: "none" }}
            >
              {optimizing ? "Running Dijkstra AI..." : "Compute Shortest Route"}
            </button>

            {optimizedPath.length > 0 && (
              <div style={{ background: "rgba(6, 182, 212, 0.05)", border: "1px solid rgba(6, 182, 212, 0.2)", borderRadius: "10px", padding: "14px", marginTop: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--cyan)", textTransform: "uppercase" }}>Optimization Output</span>
                <div style={{ fontSize: "13px", color: "#fff", fontWeight: 600, marginTop: "6px" }}>
                  Route: {optimizedPath.join(" ➔ ")}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Est. Duration: {optTime}
                </div>
              </div>
            )}
          </div>

          {/* Canvas map viewer & Telemetry Console */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="dark-card" style={{ display: "flex", flexDirection: "column", gap: "16px", background: "rgba(15, 23, 42, 0.5)", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", alignSelf: "flex-start" }}>Interactive Hub Network Map</h3>
              <div style={{ background: "#070a13", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.04)", overflow: "hidden" }}>
                <canvas ref={routeCanvasRef} style={{ display: "block" }} />
              </div>
            </div>

            {/* Real-time telemetry console */}
            <div className="dark-card" style={{ background: "rgba(7, 10, 19, 0.6)", border: "1px solid rgba(255, 255, 255, 0.06)", fontFamily: "monospace", padding: "16px", borderRadius: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)" }}>📡 LIVE TELEMETRY FEED</span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Electric Route Dispatch</span>
              </div>
              <div style={{ minHeight: "100px", maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", color: "#10b981" }}>
                {telemetryLogs.length === 0 ? (
                  <span style={{ color: "var(--text-muted)" }}>Awaiting Dijkstra computation routing sequence...</span>
                ) : (
                  telemetryLogs.map((log, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "8px" }}>
                      <span>&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab content 3: Cost/Time Predictor */}
      {activeTab === "predict" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "28px" }}>
          {/* Form */}
          <div className="dark-card" style={{ display: "flex", flexDirection: "column", gap: "16px", background: "rgba(15, 23, 42, 0.5)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>Calculate AI Estimations</h3>

            <div className="form-group">
              <label className="form-label">Parcel Weight (kg)</label>
              <input
                className="form-input"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 2.5"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Package Volume Size</label>
              <select className="form-input" value={volume} onChange={(e) => setVolume(e.target.value)}>
                <option value="Small">Small envelope / document</option>
                <option value="Medium">Medium box (under 30cm)</option>
                <option value="Large">Large cargo box</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "4px 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={fragile}
                  onChange={(e) => setFragile(e.target.checked)}
                />
                Fragile shipment handling required (+surcharge)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={insurance}
                  onChange={(e) => setInsurance(e.target.checked)}
                />
                Enable comprehensive transit insurance cover
              </label>
            </div>

            <button
              onClick={handlePredictDetails}
              className="btn-primary"
              style={{ background: "var(--gradient-primary)", padding: "12px", border: "none", borderRadius: "8px" }}
            >
              Analyze with Predictor model
            </button>
          </div>

          {/* Results dashboard display & 3D Box Simulator */}
          <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.5)", display: "flex", flexDirection: "column", gap: "20px", padding: "30px", alignItems: "center" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#fff", alignSelf: "flex-start" }}>📦 Volumetric 3D Package Simulator</h3>
            <div style={{ background: "#070a13", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.04)", overflow: "hidden", width: "100%", display: "flex", justifyContent: "center" }}>
              <canvas ref={boxCanvasRef} style={{ display: "block" }} />
            </div>

            {predictionResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--cyan)", textTransform: "uppercase" }}>Predicted Pricing</span>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "#fff", marginTop: "4px" }}>NPR {predictionResult.cost}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>Est. Transit Time</span>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "#fff", marginTop: "4px" }}>{predictionResult.days} Days</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-muted)", width: "100%", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <p style={{ fontSize: "11px" }}>Awaiting input configuration for pricing & transit estimation.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
