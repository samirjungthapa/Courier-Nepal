import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store/store";

import { loadMe } from "./features/auth/authSlice";
import { logout } from "./features/auth/authSlice";
import CreateParcelPage from "./pages/CreateParcelPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import TrackParcelPage from "./pages/TrackParcelPage";
import AiAssistantPage from "./pages/AiAssistantPage";
import HomePage from "./pages/HomePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import SuperAdminDashboardPage from "./pages/SuperAdminDashboardPage";
import DeliveryStaffDashboardPage from "./pages/DeliveryStaffDashboardPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationPage from "./pages/NotificationPage";
import { fetchNotifications } from "./features/notifications/notificationSlice";

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useSelector((s: RootState) => s.auth.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ children, roles }: { children: ReactNode; roles: string[] }) {
  const token = useSelector((s: RootState) => s.auth.token);
  const user = useSelector((s: RootState) => s.auth.user);

  if (!token) return <Navigate to="/login" replace />;
  // If user is loading, wait
  if (token && !user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="loading-row">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
        <div style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>Loading session...</div>
      </div>
    );
  }
  if (user && !roles.includes(user.role)) {
    // Redirect to their own dashboard if they hit a forbidden page
    const dashboardMap: Record<string, string> = {
      USER: "/dashboard",
      ADMIN: "/admin-dashboard",
      SUPER_ADMIN: "/super-admin-dashboard",
      DELIVERY_STAFF: "/delivery-staff-dashboard",
    };
    return <Navigate to={dashboardMap[user.role] || "/"} replace />;
  }

  return <>{children}</>;
}

function Navbar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  const token = useSelector((s: RootState) => s.auth.token);
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { unreadCount } = useSelector((s: RootState) => s.notifications);
  const location = useLocation();

  useEffect(() => {
    if (token) {
      dispatch(fetchNotifications());
      const interval = setInterval(() => dispatch(fetchNotifications()), 30000);
      return () => clearInterval(interval);
    }
  }, [dispatch, token]);

  const isHome = location.pathname === "/";

  function onLogout() {
    dispatch(logout());
    navigate("/");
    setMobileOpen(false);
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setMobileOpen(false)}>
          <span className="navbar-logo-dot" />
          Courier Nepal
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar-nav">
          {!isHome && (
            <>
              {user?.role === "USER" && (
                <>
                  <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Dashboard</NavLink>
                  <NavLink to="/track" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Track</NavLink>
                  <NavLink to="/create" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Schedule Pickup</NavLink>
                  <NavLink to="/history" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Order History</NavLink>
                  <NavLink to="/ai" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>AI Assistant</NavLink>
                </>
              )}
              {user?.role === "ADMIN" && (
                <NavLink to="/admin-dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Dashboard</NavLink>
              )}
              {user?.role === "SUPER_ADMIN" && (
                <NavLink to="/super-admin-dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Dashboard</NavLink>
              )}
              {user?.role === "DELIVERY_STAFF" && (
                <NavLink to="/delivery-staff-dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Dashboard</NavLink>
              )}
            </>
          )}
        </nav>

        {/* Actions */}
        <div className="navbar-actions">
          {token ? (
            <>
              <Link to="/profile" className="navbar-user">
                {user?.name ? `Hi, ${user.name}` : "Signed in"}
              </Link>
              <Link to="/notifications" className="btn-nav-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </Link>
              <button onClick={onLogout} className="btn-nav-outline">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-nav-outline">Login</Link>
              <Link to="/register" className="btn-nav-primary">Register</Link>
            </>
          )}
          {/* Mobile toggle */}
          <button className="navbar-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{
          background: "var(--bg-darker)",
          borderTop: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}>
          <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)}>Home</NavLink>
          {user?.role === "USER" && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)}>Dashboard</NavLink>
              <NavLink to="/track" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)}>Track</NavLink>
              <NavLink to="/create" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)}>Schedule Pickup</NavLink>
              <NavLink to="/history" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)}>Order History</NavLink>
              <NavLink to="/ai" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)}>AI Assistant</NavLink>
            </>
          )}
          {user?.role === "ADMIN" && (
            <NavLink to="/admin-dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)}>Dashboard</NavLink>
          )}
          {user?.role === "SUPER_ADMIN" && (
            <NavLink to="/super-admin-dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)}>Dashboard</NavLink>
          )}
          {user?.role === "DELIVERY_STAFF" && (
            <NavLink to="/delivery-staff-dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)}>Dashboard</NavLink>
          )}
          {token && (
            <NavLink to="/notifications" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} onClick={() => setMobileOpen(false)}>
              Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </NavLink>
          )}
          {token ? (
            <button onClick={onLogout} className="btn-secondary" style={{ marginTop: "8px" }}>Logout</button>
          ) : (
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <Link to="/login" className="btn-secondary" style={{ flex: 1, textAlign: "center" }} onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/register" className="btn-primary" style={{ flex: 1, textAlign: "center" }} onClick={() => setMobileOpen(false)}>Register</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function AppInner() {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((s: RootState) => s.auth.token);
  const user = useSelector((s: RootState) => s.auth.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (token && !user) {
      dispatch(loadMe());
    }
  }, [dispatch, token, user]);

  return (
    <div className="app-shell">
      <Navbar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="page-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/dashboard"
            element={
              <RequireRole roles={["USER"]}>
                <UserDashboardPage />
              </RequireRole>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/track"
            element={
              <RequireRole roles={["USER"]}>
                <TrackParcelPage />
              </RequireRole>
            }
          />
          <Route
            path="/create"
            element={
              <RequireRole roles={["USER"]}>
                <CreateParcelPage />
              </RequireRole>
            }
          />
          <Route
            path="/history"
            element={
              <RequireRole roles={["USER"]}>
                <OrderHistoryPage />
              </RequireRole>
            }
          />
          <Route 
            path="/ai" 
            element={
              <RequireRole roles={["USER"]}>
                <AiAssistantPage />
              </RequireRole>
            } 
          />
          <Route
            path="/admin-dashboard"
            element={
              <RequireRole roles={["ADMIN"]}>
                <AdminDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/super-admin-dashboard"
            element={
              <RequireRole roles={["SUPER_ADMIN"]}>
                <SuperAdminDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/delivery-staff-dashboard"
            element={
              <RequireRole roles={["DELIVERY_STAFF"]}>
                <DeliveryStaffDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <NotificationPage />
              </RequireAuth>
            }
          />
        </Routes>
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} Courier Nepal · Built for Nepal's courier needs
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
