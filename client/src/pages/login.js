import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";
import "./theme.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      alert("Enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      alert("Enter your password.");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/login`, {
        email: normalizedEmail,
        password,
      });

      localStorage.setItem("token", res.data.token);
      window.location.href = "/dashboard";
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  const handleSwitch = (e) => {
    e.preventDefault();
    window.location.href = "/signup";
  };

  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + "vw",
      top: Math.random() * 100 + "vh",
      duration: (Math.random() * 10 + 5) + "s",
      delay: Math.random() * 5 + "s",
      opacity: Math.random() * 0.5
    }));
  }, []);

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden font-tech" style={{ background: "var(--bg-dark)", color: "#fff" }}>
      {/* Background Layers */}
      <div className="absolute inset-0 bg-[#0f172a]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#0f172a_80%)]"></div>
      <div className="cyber-grid-3d" style={{ opacity: 0.3, transformOrigin: "top center" }}></div>
      <div className="absolute inset-0 scanlines opacity-20 mix-blend-overlay"></div>
      
      {/* Animated Particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div 
            key={p.id}
            className="particle"
            style={{
              position: "absolute",
              background: "var(--accent-purple)",
              width: "2px",
              height: "2px",
              borderRadius: "50%",
              left: p.left,
              top: p.top,
              animationDuration: p.duration,
              animationDelay: p.delay,
              opacity: p.opacity
            }}
          />
        ))}
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-5xl px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Branding & Info */}
        <div className="lg:col-span-7 flex flex-col items-start gap-8">
          <div className="flex items-center gap-4 group">
            <div className="clip-angle glow-box-purple" style={{ width: "64px", height: "64px", background: "linear-gradient(to top right, var(--accent-amber), var(--accent-purple))", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}>
              <div className="clip-angle" style={{ width: "100%", height: "100%", background: "black", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "white", transition: "color 0.3s" }} className="group-hover:text-var(--accent-amber)"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="italic uppercase glitch-hero" data-text="PROMETHEUS" style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1 }}>PROMETHEUS</span>
              <span style={{ fontSize: "0.6rem", color: "var(--accent-emerald)", letterSpacing: "0.4em", textTransform: "uppercase" }}>Central_Auth_Protocol_v2.4</span>
            </div>
          </div>

          <div className="clip-angle relative p-1" style={{ background: "linear-gradient(to right, rgba(251, 191, 36, 0.4), transparent)" }}>
            <div className="clip-angle backdrop-blur-xl" style={{ background: "rgba(0,0,0,0.6)", padding: "32px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h2 className="italic uppercase" style={{ fontSize: "3rem", fontWeight: 900, marginBottom: "24px", letterSpacing: "-0.05em", lineHeight: 1.1 }}>
                ESTABLISH_<br/><span style={{ color: "var(--accent-purple)" }}>CONNECTION</span>
              </h2>
              <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: "450px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Welcome operative. Authenticate your neural link to access the risk assessment matrix and survival directives.
              </p>
              
              <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "12px", height: "12px", background: "#00ff00", borderRadius: "50%", boxShadow: "0 0 8px var(--accent-emerald)" }} className="animate-pulse"></div>
                  <span style={{ fontSize: "0.6rem", color: "var(--accent-emerald)", textTransform: "uppercase", letterSpacing: "0.1em" }}>SYSTEM_STATUS: OPTIMAL</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "12px", height: "12px", background: "#00ffff", borderRadius: "50%", boxShadow: "0 0 8px var(--accent-purple)" }}></div>
                  <span style={{ fontSize: "0.6rem", color: "var(--accent-purple)", textTransform: "uppercase", letterSpacing: "0.1em" }}>LATENCY: 12MS // NODES_SYNCED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Overlay Label */}
          <div style={{ position: "absolute", bottom: "-80px", left: 0, fontSize: "6rem", fontWeight: 900, color: "rgba(255,255,255,0.03)", userSelect: "none", letterSpacing: "-0.05em", lineHeight: 1, display: "none", "@media (minWidth: 1024px)": { display: "block" } }}>
            ACCESS_GRANTED
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-5 relative mt-16 lg:mt-0">
          {/* Decorative Background Shape */}
          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "160px", height: "160px", background: "rgba(251, 191, 36, 0.1)", filter: "blur(40px)", borderRadius: "50%" }}></div>
          <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: "160px", height: "160px", background: "rgba(0, 255, 255, 0.1)", filter: "blur(40px)", borderRadius: "50%" }}></div>

          <div className="clip-angle glow-box-amber backdrop-blur-2xl relative" style={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", padding: "4px" }}>
            <div className="clip-angle" style={{ padding: "32px 40px", border: "1px solid rgba(255,255,255,0.05)", background: "linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)" }}>
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <label style={{ fontSize: "0.6rem", color: "var(--accent-amber)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Operative_ID</label>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-amber)" }}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <input 
                    type="email" 
                    placeholder="EMAIL_OR_USERNAME" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="clip-angle font-tech" 
                    style={{ width: "100%", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", padding: "16px", fontSize: "0.875rem", color: "var(--accent-purple)", outline: "none", textTransform: "uppercase", transition: "all 0.3s" }} 
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <label style={{ fontSize: "0.6rem", color: "var(--accent-purple)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Neural_Key</label>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-purple)" }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="clip-angle font-tech" 
                    style={{ width: "100%", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", padding: "16px", fontSize: "0.875rem", color: "var(--accent-amber)", outline: "none", transition: "all 0.3s" }} 
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  <label className="group" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input type="checkbox" style={{ display: "none" }} checked={keepLoggedIn} onChange={() => setKeepLoggedIn(!keepLoggedIn)} />
                    <div style={{ width: "16px", height: "16px", border: "1px solid var(--accent-emerald)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} className="group-hover:bg-emerald-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-emerald)", opacity: keepLoggedIn ? 1 : 0, transition: "opacity 0.2s" }}><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.4)", transition: "color 0.2s" }} className="group-hover:text-white">Keep_Logged_In</span>
                  </label>
                  <a href="#" style={{ color: "var(--accent-purple)", textDecoration: "none", transition: "color 0.2s" }} className="hover:text-white">Forgot_Key?</a>
                </div>

                <button type="submit" className="clip-angle font-tech" style={{ width: "100%", padding: "20px", background: "linear-gradient(to right, var(--accent-amber), #f59e0b)", color: "black", fontWeight: 900, fontSize: "1.25rem", textTransform: "uppercase", letterSpacing: "0.1em", boxShadow: "0 0 15px rgba(251, 191, 36, 0.3)", cursor: "pointer", border: "none", transition: "all 0.2s" }}>
                  INITIALIZE_AUTH
                </button>

                <div style={{ position: "relative", padding: "16px 0" }}>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
                    <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.1)" }}></div>
                  </div>
                  <div style={{ position: "relative", display: "flex", justifyContent: "center", fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.5em", color: "rgba(255,255,255,0.2)" }}>
                    <span style={{ background: "black", padding: "0 16px" }}>OR_ESTABLISH_NEW_LINK</span>
                  </div>
                </div>

                <button onClick={handleSwitch} type="button" className="clip-angle font-tech" style={{ display: "block", width: "100%", padding: "16px", border: "1px solid rgba(0, 255, 255, 0.5)", color: "var(--accent-purple)", textAlign: "center", fontWeight: 900, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", background: "transparent", cursor: "pointer", transition: "all 0.2s" }}>
                  REGISTER_NEW_OPERATIVE
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <footer style={{ position: "absolute", bottom: "32px", left: 0, width: "100%", padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.5em", userSelect: "none" }}>
        <div style={{ display: "flex", gap: "40px" }}>
          <div>UPLINK_ENCRYPTED: 256_BIT</div>
          <div className="hidden md:block">LOCATION: UNKNOWN_NODE_4</div>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-emerald)" }}><path d="m12 22-8-4.5v-7L12 6l8 4.5v7Z"/><path d="m12 11 4.5-2.5"/><path d="m12 11-4.5-2.5"/><path d="M12 22v-6.5"/></svg>
          <span>FIREWALL: ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}

export default Login;
