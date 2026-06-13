import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";
import { fetchNotifications, markAsRead } from "../features/notifications/notificationSlice";

export default function NotificationPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, loading } = useSelector((s: RootState) => s.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const onRead = (id: number) => {
    dispatch(markAsRead(id));
  };

  return (
    <div className="page-inner-narrow">
      <div style={{ marginBottom: "28px" }}>
        <h1 className="page-heading">Notifications</h1>
        <p className="page-subheading">Stay updated with your parcel delivery status and system alerts.</p>
      </div>

      {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {notifications.length === 0 && !loading && (
          <div className="dark-card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <div>No notifications yet.</div>
          </div>
        )}

        {notifications.map((n) => (
          <div key={n.id} className={`dark-card ${n.isRead ? 'read' : 'unread'}`} style={{ 
            padding: "16px 20px",
            borderLeft: n.isRead ? "4px solid var(--border)" : "4px solid var(--primary)",
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 600 }}>{n.title}</h3>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>{n.message}</p>
                <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              {!n.isRead && (
                <button 
                  onClick={() => onRead(n.id)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--primary)', 
                    fontSize: '12px', 
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Mark as Read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
