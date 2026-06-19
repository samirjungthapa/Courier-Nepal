import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { http } from "../api/http";

type ChatItem = { id: string; from: "user" | "assistant"; text: string };

export default function AiAssistantPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "route" | "predict">("chat");

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

  // Tab 3: Predictor State
  const [weight, setWeight] = useState("1.5");
  const [volume, setVolume] = useState("Medium");
  const [fragile, setFragile] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [predictionResult, setPredictionResult] = useState<{ cost: number; days: number } | null>(null);

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
      const res = await http.post("/api/ai/ask", { question: q });
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

        // Draw active pulsars on optimized route cities
        optimizedPath.forEach((name) => {
          const hub = hubs[name];
          ctx.fillStyle = "var(--cyan)";
          ctx.beginPath();
          ctx.arc(hub.x, hub.y, 5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    };

    drawMap();
  }, [activeTab, optimizedPath]);

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
  };

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

          {/* Canvas map viewer */}
          <div className="dark-card" style={{ display: "flex", flexDirection: "column", gap: "16px", background: "rgba(15, 23, 42, 0.5)", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", alignSelf: "flex-start" }}>Interactive Hub Network Map</h3>
            <div style={{ background: "#070a13", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.04)", overflow: "hidden" }}>
              <canvas ref={routeCanvasRef} style={{ display: "block" }} />
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

          {/* Results dashboard display */}
          <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.5)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px" }}>
            {predictionResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--cyan)", textTransform: "uppercase" }}>Predicted Pricing</span>
                  <div style={{ fontSize: "40px", fontWeight: 800, color: "#fff", marginTop: "4px" }}>NPR {predictionResult.cost}</div>
                </div>
                <div style={{ textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>Estimated Delivery Delay</span>
                  <div style={{ fontSize: "36px", fontWeight: 800, color: "#fff", marginTop: "4px" }}>{predictionResult.days} Business Days</div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                <span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>🤖</span>
                <h3>Awaiting Input Parameters</h3>
                <p style={{ fontSize: "12px", marginTop: "6px" }}>Configure weight and priorities, then tap the predictor button.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
