import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import API_BASE_URL from "../config/api";


const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;

function PrometheusSigil() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 4 50 14v20c0 12.2-7.6 22.2-18 26-10.4-3.8-18-13.8-18-26V14L32 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M35.2 13.6c1.8 7-1.9 10.2-5.4 14.1-2.6 2.9-4.1 5.5-4.1 9 0 5.2 3.8 8.7 8.5 8.7 5.5 0 9.3-4.2 9.3-10 0-5.1-2.8-9.4-8.3-21.8Z"
        fill="currentColor"
      />
      <path
        d="M31.8 44.2 24.6 52h14.8l-7.6-7.8Z"
        fill="currentColor"
      />
      <path
        d="M20 20h7M37 20h7M18 28h5M41 28h5M21 37h4M39 37h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

const formatDisplayName = (email) => {
  const value = String(email || "").trim().toLowerCase();

  if (!value) {
    return "Operator";
  }

  return value
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

function Layout({ children }) {
  const links = [
    { label: "Home", path: "/dashboard" },
    { label: "Risk", path: "/risk-management" },
    { label: "Tasks", path: "/tasks" },
    { label: "Progress", path: "/progress" },
  ];
  
  const [progressData, setProgressData] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("prometheus_progress");
        return raw ? JSON.parse(raw) : { totalXp: 0 };
      } catch {
        return { totalXp: 0 };
      }
    }
    return { totalXp: 0 };
  });

  const [account, setAccount] = useState({
    email: "",
    profileImage: "",
  });
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  const fallbackEmail = typeof window !== "undefined" ? localStorage.getItem("prometheus_username") || "" : "";
  const displayEmail = account.email || fallbackEmail;
  const displayName = formatDisplayName(displayEmail);
  const avatarFallback = displayName.charAt(0).toUpperCase() || "O";

  const totalXp = progressData.totalXp || 0;
  const currentLevel = Math.floor(totalXp / 100) + 1;
  const xpIntoLevel = totalXp % 100;
  const xpQuota = 100;

  const loadProfile = async () => {
    if (!token) {
      setAccount({ email: fallbackEmail, profileImage: "" });
      setIsAccountLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/profile`, {
        headers: { authorization: token },
      });
      const user = res.data?.user || {};
      const nextAccount = {
        email: user.email || fallbackEmail,
        profileImage: user.profileImage || "",
      };

      setAccount(nextAccount);
      if (nextAccount.email) {
        localStorage.setItem("prometheus_username", nextAccount.email);
      }
    } catch (error) {
      setAccount({ email: fallbackEmail, profileImage: "" });
    } finally {
      setIsAccountLoading(false);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      alert("Image must be smaller than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      try {
        await axios.patch(`${API_BASE_URL}/api/profile`, { profileImage: base64 }, { headers: { authorization: token } });
        setAccount((prev) => ({ ...prev, profileImage: base64 }));
      } catch (err) {
        alert("Failed to update profile image");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordStatus("New password must be at least 6 characters.");
      return;
    }
    try {
      await axios.patch(`${API_BASE_URL}/api/profile/password`, {
        currentPassword, newPassword
      }, { headers: { authorization: token } });
      setPasswordStatus("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordStatus(err.response?.data?.message || "Failed to update password");
    }
  };

  useEffect(() => {
    loadProfile();

    const handleProgressUpdate = () => {
      try {
        const raw = localStorage.getItem("prometheus_progress");
        if (raw) {
          setProgressData(JSON.parse(raw));
        }
      } catch {}
    };

    window.addEventListener("prometheus_progress_update", handleProgressUpdate);
    window.addEventListener("storage", handleProgressUpdate);

    return () => {
      window.removeEventListener("prometheus_progress_update", handleProgressUpdate);
      window.removeEventListener("storage", handleProgressUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-shell">
      {/* Background Overlays */}
      <div className="cyber-grid-vanguard" />
      <div className="scanlines" />

      <header className="cyber-top-nav" style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
        {/* Profile Block */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
          <div 
            className="cyber-account-avatar clip-angle" 
            style={{ width: "52px", height: "52px", fontSize: "1.4rem", border: "2px solid var(--accent-amber)", background: "rgba(251,191,36,0.1)", cursor: "pointer", position: "relative" }}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {account.profileImage ? (
              <img src={account.profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              avatarFallback
            )}
            <div style={{ position: "absolute", bottom: "-4px", right: "-4px", background: "var(--accent-purple)", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0f172a" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            </div>
          </div>
          <div style={{ flex: 1, maxWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4px" }}>
              <div>
                <strong className="glitch-text" style={{ display: "block", color: "var(--accent-purple)", fontSize: "1.2rem", letterSpacing: "0.1em", textTransform: "uppercase", fontStyle: "italic", fontWeight: 900 }}>
                  OP_0XF
                </strong>
                <span className="font-tech" style={{ color: "var(--accent-emerald)", fontSize: "0.7rem", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span className="animate-pulse" style={{ display: "inline-block", width: "6px", height: "6px", background: "currentColor", borderRadius: "50%", boxShadow: "0 0 8px currentColor" }}></span>
                  SYNC_ACTIVE
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="font-tech" style={{ display: "block", color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>RANK</span>
                <strong className="font-led" style={{ color: "var(--accent-amber)", fontSize: "1.2rem", letterSpacing: "0.1em" }}>LVL.{String(currentLevel).padStart(2, '0')}</strong>
              </div>
            </div>
            {/* XP Bar */}
            <div style={{ height: "6px", background: "var(--bg-slate-800)", border: "1px solid rgba(255,255,255,0.05)", padding: "1px", marginTop: "8px", position: "relative", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(xpIntoLevel / xpQuota) * 100}%`, transition: "width 0.5s ease", background: "linear-gradient(90deg, var(--accent-purple), var(--accent-emerald))", boxShadow: "0 0 8px var(--accent-purple)" }}></div>
            </div>
          </div>
          
          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="clip-angle font-tech" style={{ position: "absolute", top: "80px", left: "24px", width: "320px", background: "rgba(15, 23, 42, 0.95)", border: "1px solid var(--accent-purple)", backdropFilter: "blur(12px)", padding: "24px", zIndex: 100, boxShadow: "0 0 20px rgba(124, 58, 237, 0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--accent-amber)", letterSpacing: "0.1em", textTransform: "uppercase" }}>UPLINK_CONFIG</span>
                <button onClick={() => setShowProfileMenu(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>✕</button>
              </div>

              {/* Upload PFP */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "0.6rem", color: "rgba(255,255,255,0.5)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>AVATAR_UPLOAD</label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <label className="clip-angle" style={{ padding: "8px 16px", background: "rgba(124, 58, 237, 0.1)", border: "1px solid var(--accent-purple)", color: "var(--accent-purple)", fontSize: "0.6rem", cursor: "pointer", textTransform: "uppercase" }}>
                    Select_File
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleProfileImageUpload} />
                  </label>
                  <span style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>MAX_SIZE: 2MB</span>
                </div>
              </div>

              {/* Change Password */}
              <form onSubmit={handleChangePassword}>
                <label style={{ display: "block", fontSize: "0.6rem", color: "rgba(255,255,255,0.5)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>SECURITY_KEY_UPDATE</label>
                <input 
                  type="password" 
                  placeholder="CURRENT_KEY" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="clip-angle"
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--accent-emerald)", fontSize: "0.7rem", marginBottom: "8px", outline: "none" }} 
                />
                <input 
                  type="password" 
                  placeholder="NEW_KEY" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="clip-angle"
                  style={{ width: "100%", padding: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--accent-amber)", fontSize: "0.7rem", marginBottom: "12px", outline: "none" }} 
                />
                <button type="submit" className="clip-angle" style={{ width: "100%", padding: "10px", background: "var(--accent-purple)", border: "none", color: "black", fontWeight: 900, fontSize: "0.7rem", cursor: "pointer", textTransform: "uppercase" }}>
                  EXECUTE_CHANGE
                </button>
                {passwordStatus && (
                  <div style={{ marginTop: "12px", fontSize: "0.6rem", color: passwordStatus === "Password updated." ? "var(--accent-emerald)" : "#ef4444", textTransform: "uppercase" }}>
                    {passwordStatus}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="cyber-nav" style={{ paddingBottom: "4px" }}>
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `clip-tab font-tech ${isActive ? "active" : ""}`
              }
              style={({ isActive }) => ({
                display: "block",
                padding: "8px 16px",
                color: isActive ? "#0f172a" : "#f1f5f9",
                background: isActive ? "var(--accent-amber)" : "var(--bg-slate-800)",
                border: "1px solid rgba(255,255,255,0.05)",
                fontSize: "0.7rem",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                textDecoration: "none",
                whiteSpace: "nowrap",
                boxShadow: isActive ? "0 0 12px var(--accent-amber)" : "none"
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="cyber-main">{children}</main>
    </div>
  );
}

export default Layout;

