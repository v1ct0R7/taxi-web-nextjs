import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ShieldCheck } from "lucide-react";
import "./admin.css";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import Dashboard from "./pages/Dashboard/Dashboard";
import Rides from "./pages/Rides/Rides";
import Drivers from "./pages/Drivers/Drivers";
import Fares from "./pages/Fares/Fares";
import Promos from "./pages/Promos/Promos";
import Activity from "./pages/Activity/Activity";
import Settings from "./pages/Settings/Settings";

const url = import.meta.env.VITE_API_URL || "http://localhost:4000";

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await axios.post(`${url}/api/admin/login`, { email, password });
      if (!response.data.success) throw new Error(response.data.message || "Nuk mund të hysh");
      onLogin(response.data.token, response.data.name);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Nuk mund të hysh");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-login">
      <form onSubmit={submit} className="admin-login-card card">
        <span className="admin-login-mark"><ShieldCheck size={24} /></span>
        <span className="eyebrow">Tirana Ride · Admin</span>
        <h1>Paneli i kontrollit.</h1>
        <p className="muted">Hyr me llogarinë e administratorit për të ndjekur porositë, shoferët dhe ofertat.</p>
        <label className="field"><span>Email</span><input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" /></label>
        <label className="field"><span>Fjalëkalimi</span><input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
        <button className="btn btn-primary btn-block" disabled={submitting}>{submitting ? "Po hyn…" : "Hyr në panel"}</button>
      </form>
    </main>
  );
};

const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem("adminToken") || "");
  const [adminName, setAdminName] = useState(() => localStorage.getItem("adminName") || "Administrator");
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    setToken("");
  }, []);

  // Token i skaduar → kthehu te hyrja
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(undefined, (error) => {
      if (token && [401, 403].includes(error.response?.status) && !error.config?.url?.endsWith("/login")) {
        toast.error("Sesioni skadoi. Hyr përsëri.", { toastId: "session" });
        logout();
      }
      return Promise.reject(error);
    });
    return () => axios.interceptors.response.eject(interceptor);
  }, [token, logout]);

  const login = (authToken, name) => {
    localStorage.setItem("adminToken", authToken);
    localStorage.setItem("adminName", name || "Administrator");
    setAdminName(name || "Administrator");
    setToken(authToken);
  };

  return (
    <>
      <ToastContainer theme="dark" autoClose={2500} />
      {!token ? <AdminLogin onLogin={login} /> : (
        <div className="admin-app">
          <Navbar adminName={adminName} onLogout={logout} onMenu={() => setMenuOpen((open) => !open)} />
          <div className="admin-layout">
            <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
            <main className="admin-main">
              <Routes>
                <Route path="/" element={<Dashboard url={url} token={token} />} />
                <Route path="/rides" element={<Rides url={url} token={token} />} />
                <Route path="/drivers" element={<Drivers url={url} token={token} />} />
                <Route path="/fares" element={<Fares url={url} token={token} />} />
                <Route path="/promos" element={<Promos url={url} token={token} />} />
                <Route path="/activity" element={<Activity url={url} token={token} />} />
                <Route path="/settings" element={<Settings url={url} token={token} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
