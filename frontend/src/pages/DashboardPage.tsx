import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { http } from "../api/http";
import StatusBadge from "../components/ui/StatusBadge";
import type { User } from "../features/auth/authSlice";

// We define our local types so we don't have to redefine in slice
type ParcelData = any;

export default function DashboardPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [staffList, setStaffList] = useState<User[]>([]);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isDriver = user?.role === "DELIVERY_STAFF";

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

  async function fetchStaff() {
    try {
      const res = await http.get("/api/users?role=DELIVERY_STAFF");
      setStaffList(res.data.users);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchParcels();
    if (isAdmin) {
      fetchStaff();
    }
  }, [isAdmin, isDriver]);

  async function updateStatus(id: number, status: string) {
    try {
      await http.patch(`/api/parcels/${id}/status`, { status });
      fetchParcels(); // refresh
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update status");
    }
  }

  async function assignStaff(id: number, staffId: number) {
    try {
      await http.put(`/api/parcels/${id}/assign`, { assignedStaffId: staffId });
      alert("Staff assigned successfully!");
      fetchParcels();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to assign staff");
    }
  }

  if (!isAdmin && !isDriver) {
    return <div className="page-inner"><div className="alert-error">Unauthorized. Please navigate back to home.</div></div>;
  }

  return (
    <div className="page-inner">
      <div style={{ marginBottom: "28px" }}>
        <h1 className="page-heading">Dashboard</h1>
        <p className="page-subheading">
          {isAdmin ? "Manage all parcels and assign staff." : "Manage your assigned parcels."}
        </p>
      </div>

      {loading && <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading...</div>}
      {error && <div className="alert-error">{error}</div>}

      {parcels.length === 0 && !loading && (
        <div className="dark-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div>No parcels found.</div>
        </div>
      )}

      {parcels.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {parcels.map((p) => {
            return (
              <div key={p.id} className="order-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="order-head">
                  <div>
                    <div className="order-id-label">Parcel ID</div>
                    <div className="order-id-value">#{p.id}</div>
                    <div className="order-receiver">
                      Customer: <strong>{p.customer?.name}</strong><br/>
                      To: <strong>{p.receiverName}</strong> · {p.receiverPhone}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                    <StatusBadge status={p.status} />
                    
                    {/* Status Update */}
                    <select
                      className="form-input"
                      style={{ fontSize: "12px", padding: "4px 8px", width: "160px" }}
                      value={p.status}
                      onChange={(e) => updateStatus(p.id, e.target.value)}
                    >
                      <option value="PICKED">Picked</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                    </select>
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Assigned Staff: {p.assignedStaff ? p.assignedStaff.name : "None"}
                    </div>
                    <div>
                      <select
                        className="form-input"
                        style={{ fontSize: "12px", padding: "4px 8px", width: "auto" }}
                        value={p.assignedStaffId || ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            assignStaff(p.id, Number(e.target.value));
                          }
                        }}
                      >
                        <option value="">-- Assign Delivery Staff --</option>
                        {staffList.map((st) => (
                          <option key={st.id} value={st.id}>{st.name} ({st.email})</option>
                        ))}
                      </select>
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
