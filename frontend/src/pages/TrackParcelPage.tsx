import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import type { AppDispatch, RootState } from "../store/store";
import { clearTracking, trackParcel } from "../features/parcels/parcelSlice";
import DarkStatusBadge from "../components/ui/StatusBadge";

const statusOrder: Record<string, number> = {
  PICKED: 1,
  IN_TRANSIT: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
};

export default function TrackParcelPage() {
  const dispatch = useDispatch<AppDispatch>();
  const parcels = useSelector((s: RootState) => s.parcels);
  const [searchParams] = useSearchParams();

  const [parcelId, setParcelId] = useState(searchParams.get("id") || "");

  const currentStatusIndex = useMemo(() => {
    const status = parcels.tracking?.status;
    if (!status) return 0;
    return statusOrder[status] || 0;
  }, [parcels.tracking?.status]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    dispatch(clearTracking());
    const id = Number(parcelId);
    if (!Number.isInteger(id) || id <= 0) return;
    await dispatch(trackParcel(id)).unwrap().catch(() => {});
  }

  return (
    <div className="page-inner-narrow">
      <h1 className="page-heading">Track Parcel</h1>
      <p className="page-subheading">Enter your parcel ID to view its live status and timeline.</p>

      {/* Search form */}
      <div className="dark-card" style={{ marginBottom: "24px" }}>
        <form onSubmit={onSubmit} className="track-form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" htmlFor="parcelId">Parcel ID</label>
            <input
              id="parcelId"
              className="form-input"
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              placeholder="e.g. 12"
              inputMode="numeric"
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={parcels.status === "loading"}
            style={{ alignSelf: "flex-end", whiteSpace: "nowrap" }}
          >
            {parcels.status === "loading" ? "Tracking…" : "🔍 Track"}
          </button>
        </form>
      </div>

      {parcels.error && (
        <div className="alert-error">{parcels.error}</div>
      )}

      {parcels.tracking && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Info card */}
          <div className="dark-card">
            <div className="parcel-info-grid">
              <div className="parcel-info-item">
                <div className="parcel-info-label">Parcel ID</div>
                <div className="parcel-info-value">#{parcels.tracking.parcelId}</div>
              </div>
              <div className="parcel-info-item">
                <div className="parcel-info-label">Current Status</div>
                <div style={{ marginTop: "6px" }}>
                  <DarkStatusBadge status={parcels.tracking.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="dark-card">
            <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>
              Status Timeline
            </h2>
            <div className="status-timeline">
              {parcels.tracking.events.map((ev, idx) => {
                const active = statusOrder[ev.status] <= currentStatusIndex;
                const isLast = idx === parcels.tracking!.events.length - 1;
                return (
                  <div
                    key={ev.id}
                    className={`timeline-item${active ? " active-tl" : ""}`}
                    style={{ paddingBottom: isLast ? 0 : undefined }}
                  >
                    <div className={`timeline-dot${active ? " active" : ""}`}>
                      {active ? "✓" : ""}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-status">{ev.status.replace(/_/g, " ")}</div>
                      <div className="timeline-time">
                        {new Date(ev.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
