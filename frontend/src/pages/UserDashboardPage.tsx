import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "../store/store";
import { http } from "../api/http";
import StatusBadge from "../components/ui/StatusBadge";

type ParcelData = any;

export default function UserDashboardPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchParcels() {
    setLoading(true);
    try {
      const res = await http.get("/api/parcels/history");
      setParcels(res.data.parcels.slice(0, 3)); // show only top 3
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load parcels");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchParcels();
  }, []);

  return (
    <div className="page-inner">
      <div style={{ marginBottom: "28px" }}>
        <h1 className="page-heading">Welcome, {user?.name}!</h1>
        <p className="page-subheading">Track your shipments and manage your courier requests.</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
         <Link to="/create" className="dark-card" style={{ flex: 1, padding: '24px', textAlign: 'center', transition: 'transform .2s' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
            <div style={{ fontWeight: 700 }}>Schedule Pickup</div>
         </Link>
         <Link to="/track" className="dark-card" style={{ flex: 1, padding: '24px', textAlign: 'center', transition: 'transform .2s' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontWeight: 700 }}>Track Parcel</div>
         </Link>
         <Link to="/history" className="dark-card" style={{ flex: 1, padding: '24px', textAlign: 'center', transition: 'transform .2s' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📜</div>
            <div style={{ fontWeight: 700 }}>Order History</div>
         </Link>
      </div>

      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Recent Shipments</h2>
      
      {loading && <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading...</div>}
      {error && <div className="alert-error">{error}</div>}

      {parcels.length === 0 && !loading && (
        <div className="dark-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div>No recent parcels found.</div>
          <Link to="/create" className="btn-primary" style={{ marginTop: '16px' }}>Start Shipping</Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {parcels.map((p) => (
          <div key={p.id} className="order-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="order-id-label">Parcel #{p.id}</div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>Receiver: {p.receiverName}</div>
            </div>
            <StatusBadge status={p.status} />
          </div>
        ))}
      </div>

      {parcels.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/history" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '14px' }}>View all orders →</Link>
        </div>
      )}
    </div>
  );
}
