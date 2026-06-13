import { useEffect, useState } from "react";
import { http } from "../api/http";
import StatusBadge from "../components/ui/StatusBadge";
import type { User } from "../features/auth/authSlice";

type ParcelData = any;

export default function SuperAdminDashboardPage() {
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [staffList, setStaffList] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"OPERATIONS" | "USERS" | "SETTINGS">("OPERATIONS");

  const [users, setUsers] = useState<User[]>([]);

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

  async function fetchUsers() {
    try {
      const res = await http.get("/api/users");
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleBan(id: number, currentlyBanned: boolean) {
    if (!window.confirm(`Are you sure you want to ${currentlyBanned ? 'unban' : 'ban'} this user?`)) return;
    try {
      const endpoint = currentlyBanned ? `/api/users/${id}/unban` : `/api/users/${id}/ban`;
      await http.post(endpoint);
      fetchUsers();
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to toggle ban status");
    }
  }

  useEffect(() => {
    fetchParcels();
    fetchStaff();
    fetchUsers();
  }, []);

  async function updateStatus(id: number, status: string) {
    try {
      await http.patch(`/api/parcels/${id}/status`, { status });
      fetchParcels();
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

  return (
    <div className="page-inner">
      <div style={{ marginBottom: "28px" }}>
        <h1 className="page-heading">Super Admin Dashboard</h1>
        <p className="page-subheading">System Owner interface: operations, analytics, settings, and full system control.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab("OPERATIONS")}
          style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: activeTab === 'OPERATIONS' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'OPERATIONS' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: 600 }}
        >Operations</button>
        <button 
          onClick={() => setActiveTab("USERS")}
          style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: activeTab === 'USERS' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'USERS' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: 600 }}
        >Users & Roles</button>
        <button 
          onClick={() => setActiveTab("SETTINGS")}
          style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: activeTab === 'SETTINGS' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'SETTINGS' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: 600 }}
        >System Settings</button>
      </div>

      {activeTab === "OPERATIONS" && (
        <>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div className="dark-card" style={{ flex: 1, padding: '24px' }}>
                 <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>System Total Revenue</div>
                 <div style={{ fontSize: '32px', fontWeight: 700 }}>NPR {parcels.reduce((sum, p) => sum + Number(p.payments?.[0]?.amount || 0), 0)}</div>
              </div>
             <div className="dark-card" style={{ flex: 1, padding: '24px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Platform Parcels</div>
                <div style={{ fontSize: '32px', fontWeight: 700 }}>{parcels.length}</div>
             </div>
          </div>

          {loading && <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading...</div>}
          {error && <div className="alert-error">{error}</div>}

          {parcels.length === 0 && !loading && (
            <div className="dark-card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div>No parcels found in the system.</div>
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
                          Customer: <strong>{p.customer?.name} ({p.customer?.phone})</strong><br/>
                          Receiver: <strong>{p.receiverName}</strong><br/>
                          Address: {p.receiverAddressLine1}, {p.receiverCity}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                        <StatusBadge status={p.status} />
                        <select
                          className="form-input"
                          style={{ fontSize: "12px", padding: "4px 8px", width: "160px" }}
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

                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                            Staff: {p.assignedStaff ? p.assignedStaff.name : "Unassigned"} ({p.assignmentStatus})
                          </div>
                          <select
                            className="form-input"
                            style={{ fontSize: "12px", padding: "4px 8px", width: "auto" }}
                            value={p.assignedStaffId || ""}
                            onChange={(e) => {
                              if (e.target.value) assignStaff(p.id, Number(e.target.value));
                            }}
                          >
                            <option value="">-- Assign Delivery Staff --</option>
                            {staffList.map((st) => (
                              <option key={st.id} value={st.id}>{st.name}</option>
                            ))}
                          </select>
                        </div>
                        {p.deliveryRemarks && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: '200px' }}>
                            Remarks: {p.deliveryRemarks}
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "USERS" && (
        <div className="dark-card" style={{ padding: '24px' }}>
          <h3>Manage System Roles</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>View and manage platform accounts (admins, staff, and users).</p>
          <div style={{ overflowX: 'auto' }}>
            <table className="user-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>ID</th>
                  <th style={{ padding: '12px' }}>Name</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: u.isBanned ? 0.6 : 1 }}>
                    <td style={{ padding: '12px' }}>#{u.id}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '12px' }}>{u.email}</td>
                    <td style={{ padding: '12px' }}>
                       <span className={`role-tag role-${u.role.toLowerCase()}`}>{u.role}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                        {u.isBanned ? (
                           <span style={{ color: "var(--error)", fontSize: "12px", fontWeight: 700, background: 'rgba(229,62,62,0.1)', padding: '4px 8px', borderRadius: '4px' }}>BANNED</span>
                        ) : (
                          <span style={{ color: "var(--success)", fontSize: "12px", fontWeight: 700, background: 'rgba(56,161,105,0.1)', padding: '4px 8px', borderRadius: '4px' }}>ACTIVE</span>
                        )}
                    </td>
                    <td style={{ padding: '12px' }}>
                       {u.role !== 'SUPER_ADMIN' && (
                          <button 
                            className="btn-primary"
                            style={{ 
                              fontSize: '12px', 
                              padding: '6px 14px', 
                              width: '90px', 
                              borderRadius: '6px',
                              background: u.isBanned ? 'var(--success)' : 'var(--error)',
                              border: 'none',
                              color: 'white',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            onClick={() => toggleBan(u.id, !!u.isBanned)}
                          >
                            {u.isBanned ? "Unban" : "Ban User"}
                          </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "SETTINGS" && (
        <div className="dark-card" style={{ padding: '24px' }}>
           <h3>System Configuration</h3>
           <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Pricing rules, backups, logs. (Feature mock)</p>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn-secondary" style={{ width: 'fit-content' }}>System Logs</button>
              <button className="btn-secondary" style={{ width: 'fit-content' }}>Force Database Backup</button>
              <button className="btn-secondary" style={{ width: 'fit-content' }}>Configure Pricing Rules</button>
           </div>
        </div>
      )}

    </div>
  );
}
