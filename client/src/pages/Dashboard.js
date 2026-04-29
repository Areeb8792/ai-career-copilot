import { useNavigate } from "react-router-dom";
import Layout from "../components/layout";
import "./theme.css";

const featureCards = [
  {
    id: "01",
    title: "Skill_Matrix_v2",
    accent: "var(--accent-purple)",
    bg: "rgba(124, 58, 237, 0.1)",
    border: "rgba(124, 58, 237, 0.3)",
    copy: "Real-time skill comparison against the global labor ledger. Identifies critical leveling points for your professional avatar.",
    link: "ACCESS_MATRIX",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
    ),
    path: "/risk-management",
  },
  {
    id: "02",
    title: "Daily_Quests",
    accent: "var(--accent-amber)",
    bg: "rgba(251, 191, 36, 0.1)",
    border: "rgba(251, 191, 36, 0.3)",
    copy: "Receive objective-based tasks daily. Each completion boosts your sync-factor and unlocks new high-tier project opportunities.",
    link: "VIEW_QUEST_LOG",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
    ),
    path: "/tasks",
  },
  {
    id: "03",
    title: "Proxy_Agent",
    accent: "var(--accent-emerald)",
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.3)",
    copy: "Deploy an AI sub-routine that manages low-level logic, allowing your primary processor to focus on high-stakes human interaction.",
    link: "DEPLOY_PROXY",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
    ),
    path: "/progress",
  },
];

function Dashboard() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="relative flex flex-col min-h-screen overflow-hidden" style={{ background: "var(--bg-dark)", margin: "-24px" }}>
        
        {/* Dynamic Overlays */}
        <div className="fixed inset-0 cyber-grid-3d pointer-events-none"></div>
        <div className="fixed inset-0 scanlines pointer-events-none"></div>
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" style={{ background: "radial-gradient(circle at 50% -20%, rgba(30, 27, 75, 0.6) 0%, transparent 75%)" }}></div>

        {/* Hero Section */}
        <section className="relative z-10 pt-24 pb-36 px-6 flex flex-col items-center text-center overflow-hidden">
          {/* Floating Decorations */}
          <div className="absolute -top-10 -left-10 w-64 h-64 blur-[100px] animate-pulse" style={{ background: "rgba(124, 58, 237, 0.05)" }}></div>
          <div className="absolute top-1/4 -right-20 w-80 h-80 blur-[120px] animate-pulse" style={{ background: "rgba(251, 191, 36, 0.05)" }}></div>
          
          <div className="relative mb-8 inline-block">
            <div className="absolute -inset-1 blur opacity-30" style={{ background: "linear-gradient(to right, var(--accent-purple), var(--accent-amber))" }}></div>
            <span className="relative px-5 py-2 font-tech uppercase" style={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255, 255, 255, 0.1)", fontSize: "0.6rem", letterSpacing: "0.4em", color: "var(--accent-emerald)" }}>
              PROTOCOL_STATUS: ACTIVE // SESSION_ID: G4ME_X1
            </span>
          </div>

          <h1 className="italic uppercase glitch-hero" data-text="EVOLVE_OR_LOSE_CONTROL" style={{ fontSize: "clamp(3rem, 8vw, 8rem)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, marginBottom: "40px" }}>
            EVOLVE_OR_<br />
            <span style={{ color: "transparent", backgroundImage: "linear-gradient(to right, var(--accent-purple), var(--accent-amber))", WebkitBackgroundClip: "text", backgroundClip: "text" }}>LOSE_CONTROL</span>
          </h1>

          <p className="max-w-3xl font-tech uppercase leading-relaxed" style={{ fontSize: "clamp(1rem, 1.5vw, 1.25rem)", color: "rgba(255, 255, 255, 0.6)", marginBottom: "56px" }}>
            The next level of productivity is human-driven. Calculate your <span style={{ color: "var(--accent-amber)" }}>skill gap</span>, generate <span style={{ color: "var(--accent-purple)" }}>level-up tasks</span>, and deploy a <span style={{ color: "var(--accent-emerald)" }}>neural companion</span> to win.
          </p>

          <div style={{ display: "flex", gap: "32px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/risk-management")} className="clip-angle group relative font-tech uppercase" style={{ padding: "20px 48px", background: "linear-gradient(to right, var(--accent-amber), #f59e0b)", color: "#000", fontWeight: 900, fontSize: "1.25rem", letterSpacing: "0.1em", border: "none", cursor: "pointer", boxShadow: "0 0 20px rgba(251, 191, 36, 0.2)", transition: "all 0.2s" }}>
              <span className="relative z-10 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                START_DIAGNOSTIC
              </span>
            </button>
            <div style={{ textAlign: "left" }}>
              <div className="font-tech uppercase tracking-widest" style={{ fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.3)", marginBottom: "8px" }}>Operatives_Online</div>
              <div style={{ display: "flex", gap: "-12px", marginLeft: "12px" }}>
                <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=X" style={{ width: "40px", height: "40px", border: "2px solid #0f172a", borderRadius: "8px", marginLeft: "-12px", background: "rgba(255,255,255,0.1)" }} alt="u" />
                <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Y" style={{ width: "40px", height: "40px", border: "2px solid #0f172a", borderRadius: "8px", marginLeft: "-12px", background: "rgba(255,255,255,0.1)" }} alt="u" />
                <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Z" style={{ width: "40px", height: "40px", border: "2px solid #0f172a", borderRadius: "8px", marginLeft: "-12px", background: "rgba(255,255,255,0.1)" }} alt="u" />
                <div style={{ width: "40px", height: "40px", border: "2px solid #0f172a", borderRadius: "8px", marginLeft: "-12px", background: "rgba(30, 27, 75, 1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 900, color: "var(--accent-purple)" }}>+12K</div>
              </div>
            </div>
          </div>

          {/* Interactive Risk Matrix Mini-Demo */}
          <div className="clip-angle group relative mx-auto" style={{ marginTop: "112px", width: "100%", maxWidth: "1024px", background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "4px", backdropFilter: "blur(12px)" }}>
            <div className="animate-float" style={{ position: "absolute", top: "-48px", right: "48px", color: "var(--accent-purple)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            </div>
            <div className="clip-angle p-6 md:p-14" style={{ border: "1px solid rgba(255, 255, 255, 0.05)", background: "linear-gradient(to bottom right, rgba(99, 102, 241, 0.05), transparent)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "48px", alignItems: "center" }}>
                
                <div style={{ textAlign: "left" }}>
                  <h3 style={{ fontSize: "1.875rem", fontWeight: 900, fontStyle: "italic", marginBottom: "20px", color: "var(--accent-amber)", textTransform: "uppercase", letterSpacing: "-0.05em" }}>SKILL_SYNC_CALC</h3>
                  <p className="font-tech" style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)", marginBottom: "40px", textTransform: "uppercase" }}>Assess your current role parameters to identify neural augmentation priorities.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <input type="text" placeholder="ROLE_IDENTIFIER" className="font-tech" style={{ width: "100%", background: "rgba(2, 6, 23, 0.8)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "16px 20px", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-purple)", outline: "none", transition: "all 0.2s" }} />
                    <button onClick={() => navigate("/risk-management")} className="clip-angle font-tech" style={{ width: "100%", padding: "16px", background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)", color: "var(--accent-purple)", fontWeight: 900, fontSize: "0.6rem", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}>Initiate_Analysis</button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                  <div className="clip-angle" style={{ background: "rgba(2, 6, 23, 0.9)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "32px", position: "relative", overflow: "hidden" }}>
                    <div className="font-tech" style={{ position: "absolute", top: "8px", right: "8px", fontSize: "0.5rem", color: "rgba(255, 255, 255, 0.3)" }}>NODE_ID: 808-PX</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
                      <span className="font-tech" style={{ fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.3)", textTransform: "uppercase", letterSpacing: "0.3em" }}>Threat_Level_Output</span>
                      <span style={{ fontSize: "3rem", fontWeight: 400, color: "var(--accent-purple)", lineHeight: 1 }}>72.8%</span>
                    </div>
                    <div className="clip-angle" style={{ height: "20px", width: "100%", background: "rgba(30, 41, 59, 1)", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "2px", position: "relative" }}>
                      <div style={{ height: "100%", width: "72.8%", background: "linear-gradient(to right, var(--accent-purple), #3b82f6)", boxShadow: "0 0 15px var(--accent-purple)", transition: "width 1.2s" }}></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: "12px", textAlign: "center", marginTop: "32px" }}>
                      <div className="clip-angle" style={{ padding: "12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                        <div className="font-tech" style={{ fontSize: "0.5rem", color: "rgba(255, 255, 255, 0.2)", textTransform: "uppercase", marginBottom: "4px" }}>Risk</div>
                        <div style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--accent-amber)" }}>MODERATE</div>
                      </div>
                      <div className="clip-angle" style={{ padding: "12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                        <div className="font-tech" style={{ fontSize: "0.5rem", color: "rgba(255, 255, 255, 0.2)", textTransform: "uppercase", marginBottom: "4px" }}>XP_Potential</div>
                        <div style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--accent-purple)" }}>850</div>
                      </div>
                      <div className="clip-angle" style={{ padding: "12px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                        <div className="font-tech" style={{ fontSize: "0.5rem", color: "rgba(255, 255, 255, 0.2)", textTransform: "uppercase", marginBottom: "4px" }}>Stability</div>
                        <div style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--accent-emerald)" }}>SECURE</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section className="relative z-10 py-36 px-6">
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginBottom: "96px", alignItems: "flex-start", "@media (min-width: 768px)": { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" } }}>
              <div>
                <h2 style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "-0.05em", marginBottom: "24px", margin: 0 }}>
                  GAME_<span style={{ color: "var(--accent-purple)" }}>MODULES</span>
                </h2>
                <p className="font-tech" style={{ fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.4em" }}>Advanced protocols for professional leveling.</p>
              </div>
              <div style={{ fontSize: "4.5rem", fontWeight: 400, color: "rgba(255, 255, 255, 0.05)", userSelect: "none", letterSpacing: "-0.05em" }}>PRO_GEAR_X9</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "40px" }}>
              {featureCards.map((card) => (
                <div key={card.id} className="group clip-angle game-card-gradient" style={{ position: "relative", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "40px", transition: "all 0.3s", cursor: "pointer" }} onClick={() => navigate(card.path)}>
                  <div style={{ position: "absolute", bottom: "-40px", right: "-40px", fontSize: "8rem", color: "rgba(255, 255, 255, 0.02)", fontWeight: 900, transition: "color 0.3s" }}>{card.id}</div>
                  <div className="clip-angle" style={{ width: "56px", height: "56px", background: card.bg, border: `1px solid ${card.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "40px", color: card.accent }}>
                    {card.icon}
                  </div>
                  <h4 style={{ fontSize: "1.5rem", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "-0.05em", marginBottom: "20px", transition: "color 0.3s" }}>{card.title}</h4>
                  <p className="font-tech" style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.4)", lineHeight: 1.6, marginBottom: "40px" }}>
                    {card.copy}
                  </p>
                  <span className="font-tech" style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.6rem", color: card.accent, textTransform: "uppercase", letterSpacing: "0.1em", transition: "all 0.3s" }}>
                    {card.link} <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Global Metrics */}
        <section className="relative z-10 py-32" style={{ background: "rgba(2, 6, 23, 0.4)", borderTop: "1px solid rgba(255, 255, 255, 0.05)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
           <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "48px", textAlign: "center" }}>
              <div className="group">
                 <div style={{ fontSize: "3rem", fontWeight: 400, color: "var(--accent-purple)", marginBottom: "12px", transition: "transform 0.3s" }}>1.2M+</div>
                 <div className="font-tech" style={{ fontSize: "0.5rem", color: "rgba(255, 255, 255, 0.3)", textTransform: "uppercase", letterSpacing: "0.4em" }}>Levels_Reached</div>
              </div>
              <div className="group">
                 <div style={{ fontSize: "3rem", fontWeight: 400, color: "var(--accent-amber)", marginBottom: "12px", transition: "transform 0.3s" }}>92.1%</div>
                 <div className="font-tech" style={{ fontSize: "0.5rem", color: "rgba(255, 255, 255, 0.3)", textTransform: "uppercase", letterSpacing: "0.4em" }}>Sync_Precision</div>
              </div>
              <div className="group">
                 <div style={{ fontSize: "3rem", fontWeight: 400, color: "var(--accent-emerald)", marginBottom: "12px", transition: "transform 0.3s" }}>420K</div>
                 <div className="font-tech" style={{ fontSize: "0.5rem", color: "rgba(255, 255, 255, 0.3)", textTransform: "uppercase", letterSpacing: "0.4em" }}>Quests_Completed</div>
              </div>
              <div className="group">
                 <div style={{ fontSize: "3rem", fontWeight: 400, color: "rgba(255, 255, 255, 0.4)", marginBottom: "12px", transition: "transform 0.3s" }}>99.9%</div>
                 <div className="font-tech" style={{ fontSize: "0.5rem", color: "rgba(255, 255, 255, 0.3)", textTransform: "uppercase", letterSpacing: "0.4em" }}>Server_Uptime</div>
              </div>
           </div>
        </section>

        {/* Access Tiers */}
        <section className="relative z-10 py-40 px-6">
          <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center" }}>
             <h2 style={{ fontSize: "clamp(3rem, 4vw, 3.75rem)", fontWeight: 900, fontStyle: "italic", marginBottom: "96px", textTransform: "uppercase", letterSpacing: "-0.05em" }}>SYNC_TIERS</h2>
             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "40px", alignItems: "center" }}>
                
                {/* Tier 1 */}
                <div className="clip-angle" style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "48px", display: "flex", flexDirection: "column", transition: "border-color 0.3s" }}>
                   <div className="font-tech" style={{ fontSize: "0.5rem", color: "rgba(255, 255, 255, 0.3)", marginBottom: "32px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tier_01</div>
                   <h5 style={{ fontSize: "1.5rem", fontWeight: 900, fontStyle: "italic", marginBottom: "12px", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.7)" }}>PLAYER</h5>
                   <div style={{ fontSize: "3.75rem", fontWeight: 400, marginBottom: "40px", letterSpacing: "-0.05em", color: "var(--accent-purple)" }}>$0.00</div>
                   <ul className="font-tech" style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "20px", marginBottom: "56px", fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.3)", padding: 0 }}>
                      <li style={{ display: "flex", alignItems: "center", gap: "16px", color: "rgba(255, 255, 255, 0.5)" }}><span style={{ color: "var(--accent-purple)" }}>✔</span> 1 Weekly Scan</li>
                      <li style={{ display: "flex", alignItems: "center", gap: "16px", color: "rgba(255, 255, 255, 0.5)" }}><span style={{ color: "var(--accent-purple)" }}>✔</span> Basic Quest Log</li>
                      <li style={{ display: "flex", alignItems: "center", gap: "16px", opacity: 0.2 }}><span>🔒</span> Full Neural Proxy</li>
                      <li style={{ display: "flex", alignItems: "center", gap: "16px", opacity: 0.2 }}><span>🔒</span> Priority Latency</li>
                   </ul>
                   <button onClick={() => navigate("/signup")} className="clip-angle font-tech" style={{ marginTop: "auto", width: "100%", padding: "16px", background: "transparent", border: "1px solid rgba(255, 255, 255, 0.1)", color: "rgba(255, 255, 255, 0.4)", fontWeight: 900, textTransform: "uppercase", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}>Initiate_Play</button>
                </div>

                {/* Tier 2 */}
                <div className="clip-angle" style={{ background: "rgba(30, 27, 75, 0.2)", border: "1px solid rgba(124, 58, 237, 0.4)", padding: "48px", display: "flex", flexDirection: "column", boxShadow: "0 0 20px rgba(124, 58, 237, 0.1)", transform: "scale(1.05)", zIndex: 20, position: "relative" }}>
                   <div className="clip-angle" style={{ position: "absolute", top: "-20px", right: "40px", background: "linear-gradient(to right, var(--accent-purple), #3b82f6)", color: "white", padding: "6px 20px", fontWeight: 900, fontSize: "0.5rem", textTransform: "uppercase", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>Recommended</div>
                   <div className="font-tech" style={{ fontSize: "0.5rem", color: "var(--accent-purple)", marginBottom: "32px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tier_02</div>
                   <h5 style={{ fontSize: "1.875rem", fontWeight: 900, fontStyle: "italic", marginBottom: "12px", textTransform: "uppercase", color: "white" }}>ELITE</h5>
                   <div style={{ fontSize: "3.75rem", fontWeight: 400, marginBottom: "40px", letterSpacing: "-0.05em", color: "var(--accent-amber)" }}>$29.00</div>
                   <ul className="font-tech" style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "20px", marginBottom: "56px", fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.7)", padding: 0 }}>
                      <li style={{ display: "flex", alignItems: "center", gap: "16px" }}><span style={{ color: "var(--accent-amber)" }}>✔</span> Unlimited Sync Scans</li>
                      <li style={{ display: "flex", alignItems: "center", gap: "16px" }}><span style={{ color: "var(--accent-amber)" }}>✔</span> Full skill Mapping</li>
                      <li style={{ display: "flex", alignItems: "center", gap: "16px" }}><span style={{ color: "var(--accent-amber)" }}>✔</span> Standard Neural Proxy</li>
                      <li style={{ display: "flex", alignItems: "center", gap: "16px" }}><span style={{ color: "var(--accent-amber)" }}>✔</span> Weekly Performance Stats</li>
                   </ul>
                   <button onClick={() => navigate("/signup")} className="clip-angle font-tech" style={{ marginTop: "auto", width: "100%", padding: "16px", background: "linear-gradient(to right, var(--accent-purple), #6d28d9)", color: "white", fontWeight: 900, textTransform: "uppercase", fontSize: "0.75rem", cursor: "pointer", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>Upgrade_Now</button>
                </div>

                {/* Tier 3 */}
                <div className="clip-angle" style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "48px", display: "flex", flexDirection: "column", transition: "border-color 0.3s" }}>
                   <div className="font-tech" style={{ fontSize: "0.5rem", color: "rgba(255, 255, 255, 0.3)", marginBottom: "32px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tier_03</div>
                   <h5 style={{ fontSize: "1.5rem", fontWeight: 900, fontStyle: "italic", marginBottom: "12px", textTransform: "uppercase", color: "rgba(255, 255, 255, 0.7)" }}>LEGEND</h5>
                   <div style={{ fontSize: "3.75rem", fontWeight: 400, marginBottom: "40px", letterSpacing: "-0.05em", color: "var(--accent-emerald)" }}>$99.00</div>
                   <ul className="font-tech" style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "20px", marginBottom: "56px", fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.3)", padding: 0 }}>
                      <li style={{ display: "flex", alignItems: "center", gap: "16px", color: "rgba(255, 255, 255, 0.5)" }}><span style={{ color: "var(--accent-emerald)" }}>✔</span> Enterprise Neural Sync</li>
                      <li style={{ display: "flex", alignItems: "center", gap: "16px", color: "rgba(255, 255, 255, 0.5)" }}><span style={{ color: "var(--accent-emerald)" }}>✔</span> Custom Proxy Training</li>
                      <li style={{ display: "flex", alignItems: "center", gap: "16px", color: "rgba(255, 255, 255, 0.5)" }}><span style={{ color: "var(--accent-emerald)" }}>✔</span> Master Level Clearance</li>
                      <li style={{ display: "flex", alignItems: "center", gap: "16px", color: "rgba(255, 255, 255, 0.5)" }}><span style={{ color: "var(--accent-emerald)" }}>✔</span> Early Patch Access</li>
                   </ul>
                   <button onClick={() => navigate("/signup")} className="clip-angle font-tech" style={{ marginTop: "auto", width: "100%", padding: "16px", background: "transparent", border: "1px solid rgba(255, 255, 255, 0.1)", color: "rgba(255, 255, 255, 0.4)", fontWeight: 900, textTransform: "uppercase", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}>Request_Admin</button>
                </div>
             </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative z-10 py-40 px-6 overflow-hidden">
            <div className="clip-angle mx-auto" style={{ maxWidth: "1024px", background: "linear-gradient(to right, rgba(124, 58, 237, 0.3), rgba(251, 191, 36, 0.3), rgba(16, 185, 129, 0.3))", padding: "2px" }}>
              <div className="clip-angle p-8 md:p-16 lg:p-24" style={{ background: "rgba(2, 6, 23, 1)", textAlign: "center", position: "relative" }}>
                 <h2 className="glitch-hero" data-text="WIN_THE_FUTURE" style={{ fontSize: "clamp(3rem, 5vw, 6rem)", fontWeight: 900, fontStyle: "italic", marginBottom: "40px", textTransform: "uppercase", letterSpacing: "-0.05em" }}>WIN_THE_FUTURE</h2>
                 <p className="font-tech" style={{ fontSize: "1.125rem", color: "rgba(255, 255, 255, 0.5)", marginBottom: "56px", maxWidth: "672px", margin: "0 auto 56px auto", textTransform: "uppercase" }}>The game has changed. Don't play by the old rules. Augment your reality now.</p>
                 <div style={{ display: "flex", gap: "32px", justifyContent: "center", flexWrap: "wrap" }}>
                    <button onClick={() => navigate("/signup")} className="clip-angle font-tech" style={{ padding: "20px 56px", background: "var(--accent-purple)", color: "white", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", border: "none", boxShadow: "0 0 20px rgba(124, 58, 237, 0.3)", transition: "all 0.2s" }}>ENTER_SERVER</button>
                    <button className="clip-angle font-tech" style={{ padding: "20px 56px", border: "1px solid rgba(255, 255, 255, 0.1)", background: "transparent", color: "rgba(255, 255, 255, 0.7)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.2s" }}>READ_STRATEGY</button>
                 </div>
              </div>
           </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 pt-24 pb-12 px-6" style={{ background: "rgba(2, 6, 23, 1)", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
           <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "64px", marginBottom: "96px" }}>
                 <div style={{ gridColumn: "span 2" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
                      <div className="clip-angle" style={{ width: "40px", height: "40px", background: "var(--accent-purple)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/></svg>
                      </div>
                      <span style={{ fontSize: "1.875rem", fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.05em", color: "white" }}>PROMETHEUS</span>
                    </div>
                    <p className="font-tech" style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)", maxWidth: "450px", textTransform: "uppercase", lineHeight: 1.6 }}>
                      Engineered by Sayyed Areeb. Professional neural augmentation platform. Leveling up the global labor market through high-fidelity diagnostic protocols.
                    </p>
                 </div>
                 <div>
                    <h6 style={{ fontSize: "0.75rem", fontWeight: 900, color: "rgba(255, 255, 255, 0.7)", textTransform: "uppercase", marginBottom: "40px", letterSpacing: "0.4em" }}>LOBBIES</h6>
                    <ul className="font-tech" style={{ display: "flex", flexDirection: "column", gap: "20px", fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.2em", listStyle: "none", padding: 0 }}>
                       <li><a href="/" style={{ textDecoration: "none", color: "inherit", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = 'var(--accent-purple)'} onMouseOut={e => e.target.style.color = 'inherit'}>Main_Hall</a></li>
                       <li><a href="/risk-management" style={{ textDecoration: "none", color: "inherit", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = 'var(--accent-amber)'} onMouseOut={e => e.target.style.color = 'inherit'}>Diag_Chamber</a></li>
                       <li><a href="/progress" style={{ textDecoration: "none", color: "inherit", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = 'var(--accent-emerald)'} onMouseOut={e => e.target.style.color = 'inherit'}>Proxy_Terminal</a></li>
                       <li><a href="/tasks" style={{ textDecoration: "none", color: "inherit", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = 'white'} onMouseOut={e => e.target.style.color = 'inherit'}>Gear_Store</a></li>
                    </ul>
                 </div>
                 <div>
                    <h6 style={{ fontSize: "0.75rem", fontWeight: 900, color: "rgba(255, 255, 255, 0.7)", textTransform: "uppercase", marginBottom: "40px", letterSpacing: "0.4em" }}>UPLINK_PORTALS</h6>
                    <ul style={{ display: "flex", flexDirection: "column", gap: "20px", fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.5)", listStyle: "none", padding: 0 }}>
                       <li><a href="https://www.linkedin.com/in/areeb564/" target="_blank" rel="noreferrer" className="font-tech" style={{ textDecoration: "none", color: "inherit", textTransform: "uppercase", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = 'var(--accent-purple)'} onMouseOut={e => e.target.style.color = 'inherit'}>LINKEDIN</a></li>
                       <li><a href="https://www.instagram.com/areeb_._._?igsh=MWVsbHN0Y2tlMG4wOA==" target="_blank" rel="noreferrer" className="font-tech" style={{ textDecoration: "none", color: "inherit", textTransform: "uppercase", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = 'var(--accent-amber)'} onMouseOut={e => e.target.style.color = 'inherit'}>INSTAGRAM</a></li>
                       <li><a href="mailto:sayyedareeb90@gmail.com" className="font-tech" style={{ textDecoration: "none", color: "inherit", textTransform: "uppercase", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = 'var(--accent-emerald)'} onMouseOut={e => e.target.style.color = 'inherit'}>SAYYEDAREEB90@GMAIL.COM</a></li>
                    </ul>
                 </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingTop: "40px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", "@media (min-width: 768px)": { flexDirection: "row", justifyContent: "space-between", alignItems: "center" } }}>
                 <div className="font-tech" style={{ fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: "0.6em" }}>© 2024 CORE_STATION_NET // ALL_DATA_SAVED</div>
                 <div className="font-tech" style={{ display: "flex", gap: "40px", fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    <a href="#" style={{ textDecoration: "none", color: "inherit" }}>EULA_PROTOCOL</a>
                    <a href="#" style={{ textDecoration: "none", color: "inherit" }}>SERVER_RULES</a>
                 </div>
              </div>
           </div>
        </footer>

      </div>
    </Layout>
  );
}

export default Dashboard;
