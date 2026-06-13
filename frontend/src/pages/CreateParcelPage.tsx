import { useState } from "react";
import type { FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../store/store";
import { createParcel } from "../features/parcels/parcelSlice";

export default function CreateParcelPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const auth = useSelector((s: RootState) => s.auth);
  const parcels = useSelector((s: RootState) => s.parcels);

  const [pickupScheduledAt, setPickupScheduledAt] = useState("");
  const [pickupAddressLine1, setPickupAddressLine1] = useState("");
  const [pickupAddressLine2, setPickupAddressLine2] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddressLine1, setReceiverAddressLine1] = useState("");
  const [receiverAddressLine2, setReceiverAddressLine2] = useState("");
  const [receiverCity, setReceiverCity] = useState("");
  const [parcelType, setParcelType] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await dispatch(
        createParcel({
          pickupScheduledAt: pickupScheduledAt || null,
          pickupAddressLine1,
          pickupAddressLine2: pickupAddressLine2 || null,
          pickupCity: pickupCity || null,
          receiverName,
          receiverPhone,
          receiverAddressLine1,
          receiverAddressLine2: receiverAddressLine2 || null,
          receiverCity: receiverCity || null,
          parcelType: parcelType || null,
          weightKg: weightKg ? Number(weightKg) : null,
          notes: notes || null,
        })
      ).unwrap();
      navigate("/history");
    } catch (err: any) {
      setFormError(err?.message || parcels.createError || "Failed to create parcel");
    }
  }

  return (
    <div className="page-inner-medium">
      <h1 className="page-heading">Schedule Doorstep Pickup</h1>
      <p className="page-subheading">Fill in parcel and receiver details to create your order.</p>

      {formError && <div className="alert-error">{formError}</div>}

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* General */}
        <div className="dark-card">
          <div className="form-section-title">General Info</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="pickupScheduledAt">Pickup Date / Time (optional)</label>
              <input
                id="pickupScheduledAt"
                type="datetime-local"
                className="form-input"
                value={pickupScheduledAt}
                onChange={(e) => setPickupScheduledAt(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="parcelType">Parcel Type (optional)</label>
              <input
                id="parcelType"
                className="form-input"
                value={parcelType}
                onChange={(e) => setParcelType(e.target.value)}
                placeholder="Documents, Electronics…"
              />
            </div>
          </div>
        </div>

        {/* Pickup */}
        <div className="dark-card">
          <div className="form-section-title">📍 Pickup Details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="pickupAddressLine1">Address Line 1 *</label>
              <input
                id="pickupAddressLine1"
                className="form-input"
                value={pickupAddressLine1}
                onChange={(e) => setPickupAddressLine1(e.target.value)}
                required
              />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="pickupAddressLine2">Address Line 2 (optional)</label>
                <input
                  id="pickupAddressLine2"
                  className="form-input"
                  value={pickupAddressLine2}
                  onChange={(e) => setPickupAddressLine2(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pickupCity">City (optional)</label>
                <input
                  id="pickupCity"
                  className="form-input"
                  value={pickupCity}
                  onChange={(e) => setPickupCity(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Receiver */}
        <div className="dark-card">
          <div className="form-section-title">👤 Receiver Details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="receiverName">Receiver Name *</label>
                <input
                  id="receiverName"
                  className="form-input"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="receiverPhone">Receiver Phone *</label>
                <input
                  id="receiverPhone"
                  className="form-input"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="receiverAddressLine1">Address Line 1 *</label>
              <input
                id="receiverAddressLine1"
                className="form-input"
                value={receiverAddressLine1}
                onChange={(e) => setReceiverAddressLine1(e.target.value)}
                required
              />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="receiverAddressLine2">Address Line 2 (optional)</label>
                <input
                  id="receiverAddressLine2"
                  className="form-input"
                  value={receiverAddressLine2}
                  onChange={(e) => setReceiverAddressLine2(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="receiverCity">City (optional)</label>
                <input
                  id="receiverCity"
                  className="form-input"
                  value={receiverCity}
                  onChange={(e) => setReceiverCity(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Weight & Notes */}
        <div className="dark-card">
          <div className="form-section-title">📦 Parcel Details</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="weightKg">Weight (kg, optional)</label>
              <input
                id="weightKg"
                className="form-input"
                inputMode="decimal"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 1.50"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Delivery instructions, fragile items…"
                rows={3}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={parcels.createStatus === "loading" || auth.token == null}
          className="btn-primary"
          style={{ width: "100%", padding: "14px", fontSize: "15px" }}
        >
          {parcels.createStatus === "loading" ? "Creating…" : "🚀 Create Parcel Order"}
        </button>
      </form>
    </div>
  );
}
