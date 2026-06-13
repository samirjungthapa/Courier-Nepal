import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { http } from "../api/http";

type ChatItem = { id: string; from: "user" | "assistant"; text: string };

export default function AiAssistantPage() {
  const [question, setQuestion] = useState("");
  const [items, setItems] = useState<ChatItem[]>([
    {
      id: "welcome",
      from: "assistant",
      text: "Hi! 👋 I'm your Courier Nepal assistant. Ask me about parcel tracking, pickup scheduling, or payments (eSewa / Khalti).",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items, loading]);

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
      const answer = res.data?.answer || "No answer available.";
      const assistantItem: ChatItem = { id: `${Date.now()}-a`, from: "assistant", text: answer };
      setItems((prev) => [...prev, assistantItem]);
    } catch (err: any) {
      setError(err?.response?.data?.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-inner-narrow">
      <h1 className="page-heading">AI Assistant</h1>
      <p className="page-subheading">Ask anything about courier operations, tracking, or payments.</p>

      {error && <div className="alert-error">{error}</div>}

      <div className="dark-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Chat window */}
        <div className="chat-window">
          {items.map((it) => (
            <div
              key={it.id}
              className={`chat-bubble ${it.from === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}
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

        {/* Input bar */}
        <div style={{ padding: "16px", borderTop: "1px solid var(--border)" }}>
          <form onSubmit={onAsk} className="chat-input-row">
            <input
              className="chat-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How do I track my parcel?"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="btn-primary"
              style={{ whiteSpace: "nowrap" }}
            >
              {loading ? "…" : "Send ↑"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
