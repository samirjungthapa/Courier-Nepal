import { useEffect, useState } from "react";
import { http } from "../api/http";
import StatusBadge from "../components/ui/StatusBadge";
import type { User } from "../features/auth/authSlice";

type ParcelData = any;

export default function AdminDashboardPage() {
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [staffList, setStaffList] = useState<User[]>([]);
  const [searchFilter, setSearchFilter] = useState("");

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
    fetchStaff();
  }, []);

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

  // Filter parcels based on search bar
  const filteredParcels = parcels.filter(p => {
    const term = searchFilter.toLowerCase();
    return (
      String(p.id).includes(term) ||
      (p.receiverName && p.receiverName.toLowerCase().includes(term)) ||
      (p.receiverCity && p.receiverCity.toLowerCase().includes(term))
    );
  });

  return (
    <div className="page-inner" style={{ maxWidth: "1150px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <span className="hero-badge" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>Operations Hub</span>
        <h1 className="page-heading" style={{ fontFamily: "Poppins", marginTop: "8px" }}>Enterprise Logistics Manager</h1>
        <p className="page-subheading">Dispatch new pickups, monitor sorting centers, assign drivers, and trace shipments.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.4)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "28px" }}>📊</span>
          <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Total Freight Load</span>
          <h3 style={{ fontSize: "28px", color: "#fff" }}>{parcels.length} Parcels</h3>
        </div>
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.4)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "28px" }}>⏳</span>
          <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Unassigned Drivers</span>
          <h3 style={{ fontSize: "28px", color: "#fff" }}>
            {parcels.filter((p: any) => !p.assignedStaffId).length} Pending
          </h3>
        </div>
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.4)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "28px" }}>🚚</span>
          <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Active Drivers</span>
          <h3 style={{ fontSize: "28px", color: "#fff" }}>{staffList.length} Active</h3>
        </div>
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.4)", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "28px" }}>✨</span>
          <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}>Hub Dispatch Status</span>
          <h3 style={{ fontSize: "18px", color: "var(--cyan)", fontWeight: 700, marginTop: "8px" }}>Optimal Flow</h3>
        </div>
      </div>

      {/* Map & Controls Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "28px", marginBottom: "36px" }}>
        {/* SVG Route Volume Chart */}
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.5)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>📦 Route Dispatch Densities</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { route: "Kathmandu ➔ Pokhara", count: 48, percentage: 80, color: "var(--accent)" },
              { route: "Kathmandu ➔ Biratnagar", count: 28, percentage: 55, color: "var(--primary)" },
              { route: "Kathmandu ➔ Nepalgunj", count: 18, percentage: 35, color: "var(--cyan)" },
            ].map((r, idx) => (
              <div key={idx}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{r.route}</span>
                  <span style={{ color: "var(--text-muted)" }}>{r.count} shipments</span>
                </div>
                <div style={{ background: "#070a13", height: "8px", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ background: r.color, width: `${r.percentage}%`, height: "100%", borderRadius: "99px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch Controls */}
        <div className="dark-card" style={{ background: "rgba(15, 23, 42, 0.5)", display: "flex", flexDirection: "column", gap: "14px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>🔍 Search &amp; Filter Dispatches</h3>
          <input
            className="form-input"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by ID, receiver name, city..."
            style={{ background: "rgba(7, 10, 19, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
          />
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Showing {filteredParcels.length} of {parcels.length} registered parcels.
          </div>
        </div>
      </div>

      {/* Parcels management list */}
      <h2 style={{ fontSize: "18px", color: "#fff", marginBottom: "16px", fontFamily: "Poppins" }}>Fulfillment Log</h2>

      {loading && <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>Refreshing cargo files...</div>}
      {error && <div className="alert-error">{error}</div>}

      {filteredParcels.length === 0 && !loading && (
        <div className="dark-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: "var(--text-secondary)" }}>No parcels match your current search queries.</p>
        </div>
      )}

      {filteredParcels.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredParcels.map((p) => {
            return (
              <div key={p.id} className="order-card" style={{ display: "flex", flexDirection: "column", gap: "16px", background: "rgba(15, 23, 42, 0.45)", border: "1px solid rgba(255,255,255,0.04)", padding: "24px" }}>
                <div className="order-head" style={{ marginBottom: 0 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="order-id-value" style={{ fontSize: "18px", color: "#fff" }}>Parcel #{p.id}</span>
                      <span style={{ fontSize: "11px", color: "var(--cyan)", background: "rgba(6, 182, 212, 0.08)", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                        {p.parcelType || "Standard"}
                      </span>
                    </div>
                    <div className="order-receiver" style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.7" }}>
                      🧑‍💼 Customer: <strong style={{ color: "#fff" }}>{p.customer?.name}</strong> ({p.customer?.phone})<br/>
                      🧑‍🚀 Receiver: <strong style={{ color: "#fff" }}>{p.receiverName}</strong> ({p.receiverPhone})<br />
                      📍 Destination: {p.receiverAddressLine1}, {p.receiverCity}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
                    <StatusBadge status={p.status} />
                    <select
                      className="form-input"
                      style={{ fontSize: "12px", padding: "8px 12px", width: "160px", background: "rgba(7,10,19,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
                      value={p.status}
                      onChange={(e) => updateStatus(p.id, e.target.value)}
                    >
                      <option value="PENDING_PICKUP">Pending Pickup</option>
                      <option value="PICKED">Picked</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                      Assigned Driver: <strong style={{ color: "var(--text-secondary)" }}>{p.assignedStaff ? p.assignedStaff.name : "None assigned"}</strong> ({p.assignmentStatus})
                    </div>
                    <select
                      className="form-input"
                      style={{ fontSize: "12px", padding: "6px 12px", width: "220px", background: "rgba(7,10,19,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
                      value={p.assignedStaffId || ""}
                      onChange={(e) => {
                        if (e.target.value) assignStaff(p.id, Number(e.target.value));
                      }}
                    >
                      <option value="">-- Click to Assign Driver --</option>
                      {staffList.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                  {p.deliveryRemarks && (
                    <div style={{ fontSize: "12px", color: "var(--cyan)", background: "rgba(6, 182, 212, 0.04)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(6, 182, 212, 0.1)", maxWidth: "320px" }}>
                      📝 Remarks: {p.deliveryRemarks}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
