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
    { label: "Tasks", path: "/tasks" },
    { label: "Progress", path: "/progress" },
    { label: "Risk", path: "/risk-management" },
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
      <header className="cyber-top-nav">
        {/* Profile Block */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
          <div className="cyber-account-avatar" style={{ width: "52px", height: "52px", fontSize: "1.4rem", border: "2px solid var(--pink)" }}>
            {account.profileImage ? (
              <img src={account.profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              avatarFallback
            )}
          </div>
          <div style={{ flex: 1, maxWidth: "400px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4px" }}>
              <div>
                <strong style={{ display: "block", color: "var(--cyan)", fontSize: "1.2rem", letterSpacing: "0.1em", textTransform: "uppercase", fontStyle: "italic", textShadow: "2px 0 var(--pink)" }}>
                  OP_0XF
                </strong>
                <span style={{ color: "var(--lime)", fontSize: "0.7rem", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ display: "inline-block", width: "6px", height: "6px", background: "var(--lime)", borderRadius: "50%", boxShadow: "0 0 8px var(--lime)" }}></span>
                  SYNC_ACTIVE
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>RANK</span>
                <strong style={{ color: "var(--pink)", fontSize: "0.9rem", letterSpacing: "0.1em" }}>LVL.{String(currentLevel).padStart(2, '0')}</strong>
              </div>
            </div>
            {/* XP Bar */}
            <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", marginTop: "8px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(xpIntoLevel / xpQuota) * 100}%`, background: "linear-gradient(90deg, var(--cyan), var(--lime))", boxShadow: "0 0 10px var(--lime)" }}></div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="cyber-nav">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `cyber-nav-link${isActive ? " active" : ""}`
              }
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

