import { useEffect, useState } from "react";
import { http } from "../api/http";
import StatusBadge from "../components/ui/StatusBadge";

type ParcelData = any;

export default function DeliveryStaffDashboardPage() {
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
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

  return (
    <div className="page-inner">
      <div style={{ marginBottom: "28px" }}>
        <h1 className="page-heading">Delivery Staff Dashboard</h1>
        <p className="page-subheading">View assigned tasks, update tasks, and complete drops.</p>
      </div>

      {loading && <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading...</div>}
      {error && <div className="alert-error">{error}</div>}

      {parcels.length === 0 && !loading && (
        <div className="dark-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div>No assigned parcels found.</div>
        </div>
      )}

      {parcels.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {parcels.map((p) => {
            const isPending = p.assignmentStatus === "PENDING";
            const isRejected = p.assignmentStatus === "REJECTED";
            return (
              <div key={p.id} className="order-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: isRejected ? 0.6 : 1 }}>
                <div className="order-head">
                  <div>
                    <div className="order-id-label">Parcel ID</div>
                    <div className="order-id-value">#{p.id}</div>
                    
                    <div className="order-receiver">
                      <strong>Pickup:</strong><br/>
                      Customer: {p.customer?.name} ({p.customer?.phone})<br/>
                      {p.pickupAddressLine1}, {p.pickupCity}
                    </div>
                    <div className="order-receiver" style={{ marginTop: '8px' }}>
                      <strong>Dropoff:</strong><br/>
                      Receiver: {p.receiverName} ({p.receiverPhone})<br/>
                      {p.receiverAddressLine1}, {p.receiverCity}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                    <StatusBadge status={p.status} />
                    {!isPending && !isRejected && (
                        <select
                        className="form-input"
                        style={{ fontSize: "12px", padding: "4px 8px", width: "160px" }}
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
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button className="btn-primary" onClick={() => updateAssignment(p.id, "ACCEPTED")} style={{ padding: '4px 12px', fontSize: '13px' }}>Accept</button>
                            <button className="btn-secondary" onClick={() => updateAssignment(p.id, "REJECTED")} style={{ padding: '4px 12px', fontSize: '13px' }}>Reject</button>
                        </div>
                    )}
                    {isRejected && (
                        <span style={{ color: 'var(--error)' }}>Declined</span>
                    )}
                  </div>
                </div>

                {!isPending && !isRejected && (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <input 
                      type="text" 
                      placeholder="Add delivery remarks (e.g. left at door)" 
                      className="form-input" 
                      style={{ fontSize: "12px", padding: "4px 8px", width: "250px" }}
                      defaultValue={p.deliveryRemarks || ""}
                      onBlur={(e) => {
                          if (e.target.value !== p.deliveryRemarks) addRemarks(p.id, e.target.value);
                      }}
                    />
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
