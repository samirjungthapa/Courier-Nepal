import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "../store/store";
import { fetchOrderHistory } from "../features/parcels/parcelSlice";
import StatusBadge from "../components/ui/StatusBadge";

export default function OrderHistoryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const parcelsState = useSelector((s: RootState) => s.parcels);

  useEffect(() => {
    dispatch(fetchOrderHistory());
  }, [dispatch]);

  return (
    <div className="page-inner">
      <div style={{ marginBottom: "28px" }}>
        <h1 className="page-heading">Order History</h1>
        <p className="page-subheading">Your parcels, delivery statuses, and payment receipts.</p>
      </div>

      {parcelsState.historyStatus === "loading" && (
        <div className="dark-card" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
          <div className="loading-row" style={{ justifyContent: "center" }}>
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
          <div style={{ marginTop: "12px", fontSize: "14px" }}>Loading your orders…</div>
        </div>
      )}

      {parcelsState.historyError && (
        <div className="alert-error">{parcelsState.historyError}</div>
      )}

      {parcelsState.history && parcelsState.history.length === 0 && (
        <div className="dark-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "14px" }}>📦</div>
          <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "6px" }}>No orders yet</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            Schedule your first pickup to get started.
          </div>
        </div>
      )}

      {parcelsState.history && parcelsState.history.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {parcelsState.history.map((p) => {
            const latestPayment = p.payments?.[0];
            const receiptReady = latestPayment?.status === "SUCCESS" && !!latestPayment?.receiptCode;

            return (
              <div key={p.id} className="order-card">
                <div className="order-head">
                  <div>
                    <div className="order-id-label">Parcel ID</div>
                    <div className="order-id-value">#{p.id}</div>
                    <div className="order-receiver">
                      To: <strong>{p.receiverName}</strong> · {p.receiverPhone}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {p.receiverAddressLine1}{p.receiverCity ? `, ${p.receiverCity}` : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                    <StatusBadge status={p.status} />
                    {receiptReady ? (
                      <div className="receipt-box">
                        <div className="receipt-label">Receipt Code</div>
                        <div className="receipt-code">{latestPayment.receiptCode}</div>
                        <div className="receipt-meta">{latestPayment.provider} · NPR {latestPayment.amount}</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {latestPayment ? `Payment: ${latestPayment.status}` : "Payment not initiated"}
                      </div>
                    )}
                  </div>
                </div>

                {p.events.length > 0 && (
                  <div>
                    <div className="order-events-title">Timeline</div>
                    {p.events.map((ev) => (
                      <div key={ev.id} className="order-event">
                        <div style={{ fontWeight: 600, fontSize: "13px" }}>{ev.status.replace(/_/g, " ")}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {new Date(ev.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {p.events.length === 0 && (
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px" }}>No events yet.</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
