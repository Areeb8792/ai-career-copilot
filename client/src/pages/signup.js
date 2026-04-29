import { useState } from "react";
import axios from "axios";
import "./auth.css";
import API_BASE_URL from "../config/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12Zm0 1.75c-4.13 0-7.5 2.29-7.5 5.1 0 .34.28.61.62.61h13.76c.34 0 .62-.27.62-.61 0-2.81-3.37-5.1-7.5-5.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M17 9h-1V6.75a4 4 0 1 0-8 0V9H7a2.75 2.75 0 0 0-2.75 2.75v7.5A2.75 2.75 0 0 0 7 22h10a2.75 2.75 0 0 0 2.75-2.75v-7.5A2.75 2.75 0 0 0 17 9Zm-6.5-2.25a1.5 1.5 0 0 1 3 0V9h-3V6.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FlameMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M35.31 6.94c1.41 7.4-2.17 10.28-5.94 14.3-3.33 3.55-5.77 7.12-5.77 12.18 0 6.42 4.81 10.93 10.78 10.93 6.8 0 11.72-5.21 11.72-12.57 0-7.2-4.23-12.93-10.79-24.84Z"
        fill="currentColor"
      />
      <path
        d="M25.06 32.76c0 3.76 2.79 6.57 6.47 6.57 4.22 0 7.18-3.21 7.18-7.82 0-2.6-.87-4.96-2.83-8.52-.46 2.36-1.76 4.08-3.14 5.56-1.21 1.3-2.22 2.46-2.22 4.21 0 2.08 1.48 3.54 3.31 3.54a3.3 3.3 0 0 0 3.34-2.84c.34 3.41-1.96 5.88-5.48 5.88-3.61 0-6.63-2.76-6.63-6.58Z"
        fill="rgba(10,8,18,0.88)"
      />
      <path
        d="M32 45.6 19.44 57h25.12L32 45.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      alert("Enter a valid email address.");
      return;
    }

    if (password.trim().length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/signup`, {
        email: normalizedEmail,
        password,
      });

      if (!localStorage.getItem("prometheus_signup_date")) {
        localStorage.setItem("prometheus_signup_date", new Date().toISOString());
      }
      localStorage.setItem("prometheus_username", normalizedEmail);

      alert("Account created");
      window.location.href = "/login";
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-grid" />
      <div className="corner-circuits corner-left" />
      <div className="corner-circuits corner-top" />

      <main className="auth-layout">
        
        {/* DUAL PANEL WRAPPER */}
        <div className="auth-dual-panel">
          
          {/* LEFT PANEL: INFO */}
          <div className="auth-info-panel">
            <header className="brand-row" style={{ marginBottom: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", border: "2px solid var(--pink)", display: "grid", placeItems: "center", background: "rgba(255,0,255,0.1)", borderRadius: "4px" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>
                </div>
                <div>
                  <h1 className="glitch-line" style={{ margin: 0, fontSize: "2rem", letterSpacing: "0.1em", fontStyle: "italic", textShadow: "2px 0 var(--pink), -2px 0 var(--cyan)" }}>PROMETHEUS</h1>
                  <span style={{ color: "var(--lime)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>CENTRAL_AUTH_PROTOCOL_V2.4</span>
                </div>
              </div>
            </header>

            <div className="auth-headline-box" style={{ background: "linear-gradient(135deg, rgba(255,0,255,0.1), transparent)", border: "1px solid rgba(255,0,255,0.2)", padding: "32px", clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)", marginBottom: "32px" }}>
              <h2 style={{ margin: 0, fontSize: "2.4rem", fontStyle: "italic", color: "var(--text-main)", letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1.1 }}>
                REGISTER_<br/><span style={{ color: "var(--cyan)" }}>NEW_OPERATIVE</span>
              </h2>
              <p style={{ marginTop: "24px", color: "var(--text-dim)", fontSize: "0.85rem", letterSpacing: "0.05em", lineHeight: 1.6, textTransform: "uppercase" }}>
                WELCOME RECRUIT. INITIALIZE YOUR NEURAL LINK TO ACCESS THE RISK ASSESSMENT MATRIX AND SURVIVAL DIRECTIVES.
              </p>

              <div style={{ marginTop: "32px", display: "grid", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--lime)", boxShadow: "0 0 8px var(--lime)" }}></span>
                  <span style={{ color: "var(--lime)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>SYSTEM_STATUS: SECURE_UPLINK</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--cyan)", boxShadow: "0 0 8px var(--cyan)" }}></span>
                  <span style={{ color: "var(--cyan)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>LATENCY: 12MS // NODES_SYNCED</span>
                </div>
              </div>
            </div>

            <div style={{ position: "absolute", bottom: "-20px", left: "20px", fontSize: "4rem", color: "rgba(255,255,255,0.03)", fontWeight: 900, pointerEvents: "none", whiteSpace: "nowrap" }}>
              ACCESS_GRANTED
            </div>
          </div>

          {/* RIGHT PANEL: FORM */}
          <div className="auth-form-panel" style={{ background: "rgba(5, 2, 10, 0.95)", border: "1px solid rgba(255,0,255,0.15)", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center", clipPath: "polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 24px)" }}>
            
            <div className="field-group" style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ color: "var(--pink)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>NEW_OPERATIVE_ID</label>
                <UserIcon />
              </div>
              <input
                type="email"
                autoComplete="email"
                placeholder="EMAIL_OR_USERNAME"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: "16px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-main)", fontFamily: "inherit", letterSpacing: "0.05em", outline: "none" }}
              />
            </div>

            <div className="field-group" style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ color: "var(--cyan)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>NEW_NEURAL_KEY</label>
                <LockIcon />
              </div>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", padding: "16px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-main)", fontFamily: "inherit", letterSpacing: "0.1em", outline: "none" }}
              />
            </div>

            <button onClick={handleSignup} style={{ width: "100%", padding: "18px", background: "var(--cyan)", border: "none", color: "black", fontSize: "1.2rem", fontWeight: "bold", letterSpacing: "0.1em", cursor: "pointer", clipPath: "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)" }}>
              INITIALIZE_REGISTRATION
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "32px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }}></div>
              <span style={{ color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.2em" }}>OR_RETURN_TO_BASE</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }}></div>
            </div>

            <button onClick={() => window.location.href = "/login"} style={{ width: "100%", padding: "16px", background: "transparent", border: "1px solid var(--pink)", color: "var(--pink)", fontSize: "0.9rem", letterSpacing: "0.1em", cursor: "pointer" }}>
              ACCESS_EXISTING_LINK
            </button>

          </div>
        </div>

        {/* BOTTOM WATERMARK BAR */}
        <div style={{ position: "absolute", bottom: "16px", left: "24px", right: "24px", display: "flex", justifyContent: "space-between", color: "var(--text-dim)", fontSize: "0.6rem", letterSpacing: "0.2em", opacity: 0.5 }}>
          <span>UPLINK_ENCRYPTED: 256_BIT</span>
          <span>LOCATION: UNKNOWN_NODE_4</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ color: "var(--lime)" }}>✓</span> FIREWALL: ACTIVE</span>
        </div>

      </main>
    </div>
  );
}

export default Signup;
