import { useMemo } from "react";
import Layout from "../components/layout";

const PROGRESS_STORAGE_KEY = "prometheus_progress";
const SIGNUP_DATE_KEY = "prometheus_signup_date";

const readStoredProgress = () => {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw
      ? JSON.parse(raw)
      : {
          totalXp: 0,
          totalCompleted: 0,
          dailyHistory: {},
        };
  } catch {
    return {
      totalXp: 0,
      totalCompleted: 0,
      dailyHistory: {},
    };
  }
};

const getStreakCount = (dailyHistory) => {
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if ((dailyHistory[key] || 0) > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  if (h.length === 3) return `${parseInt(h[0]+h[0],16)},${parseInt(h[1]+h[1],16)},${parseInt(h[2]+h[2],16)}`;
  return `${parseInt(h.substring(0,2),16)},${parseInt(h.substring(2,4),16)},${parseInt(h.substring(4,6),16)}`;
};

const TIERS = [
  { name: "BRONZE", minLevel: 1, color: "#cd7f32", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { name: "SILVER", minLevel: 6, color: "#94a3b8", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 6 6 .5-4.5 4 1.5 6-6-3.5L6 18.5l1.5-6L3 8.5l6-.5z"/></svg> },
  { name: "GOLD", minLevel: 11, color: "#fbbf24", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg> },
  { name: "PLATINUM", minLevel: 16, color: "#38bdf8", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
  { name: "DIAMOND", minLevel: 21, color: "#a78bfa", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3h12l4 6-10 13L2 9Z"/></svg> },
  { name: "CROWN", minLevel: 26, color: "#f472b6", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg> },
  { name: "ACE", minLevel: 31, color: "#f87171", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg> },
  { name: "CONQUEROR", minLevel: 36, color: "#ef4444", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg> }
];

function Progress() {
  const progressData = useMemo(readStoredProgress, []);

  const totalXp = progressData.totalXp || 0;
  const totalCompleted = progressData.totalCompleted || 0;
  const currentLevel = Math.floor(totalXp / 100) + 1;
  const streakDays = getStreakCount(progressData.dailyHistory || {});
  
  const currentTier = useMemo(() => {
    return [...TIERS].reverse().find(t => currentLevel >= t.minLevel) || TIERS[0];
  }, [currentLevel]);

  const last14Days = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let offset = 13; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      const count = (progressData.dailyHistory || {})[key] || 0;

      days.push({
        key,
        label: date.toLocaleDateString("en-US", { weekday: 'short' }),
        count,
      });
    }

    return days;
  }, [progressData.dailyHistory]);

  const maxCount = Math.max(...last14Days.map(d => d.count), 1); // Avoid div by 0

  // Generate SVG path for the last 14 days
  const chartWidth = 800;
  const chartHeight = 200;
  const paddingY = 20;
  const usableHeight = chartHeight - (paddingY * 2);
  const stepX = chartWidth / (last14Days.length - 1);
  
  const pathPoints = last14Days.map((d, i) => {
    const x = i * stepX;
    const y = chartHeight - paddingY - ((d.count / maxCount) * usableHeight);
    return `${x},${y}`;
  });
  
  const pathData = `M${pathPoints.join(' L')}`;

  // Generate 35 heatmap cells (5 weeks)
  // Fill the last 14 with actual data, and the first 21 with mock empty or sparse data.
  const heatmapData = useMemo(() => {
    const cells = [];
    for (let i = 0; i < 21; i++) {
      cells.push(0); // Mock past data
    }
    last14Days.forEach(d => cells.push(d.count));
    return cells;
  }, [last14Days]);

  return (
    <Layout>
      <div className="page-console" style={{ padding: 0, border: "none", background: "transparent", boxShadow: "none" }}>
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {/* Level Badge */}
          <div className="card-grad clip-angle glow-box-amber relative flex flex-col items-center justify-center overflow-hidden" style={{ padding: "16px", border: "2px solid var(--accent-amber)", minHeight: "120px" }}>
            <div style={{ position: "absolute", top: "-40px", left: "-40px", width: "100px", height: "100px", background: "rgba(251, 191, 36, 0.1)", filter: "blur(20px)", borderRadius: "50%" }}></div>
            <span className="font-tech" style={{ fontSize: "0.6rem", color: "var(--accent-amber)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>Current_Level</span>
            <div className="font-led" style={{ fontSize: "4rem", color: "white", textShadow: "0 0 10px rgba(251, 191, 36, 0.8)", lineHeight: 1 }}>{String(currentLevel).padStart(2, "0")}</div>
            <div className="font-tech" style={{ marginTop: "4px", fontSize: "0.6rem", color: currentTier.color, textTransform: "uppercase", fontWeight: 900, letterSpacing: "0.1em" }}>Tier: {currentTier.name}</div>
          </div>
          
          {/* XP Stats */}
          <div className="card-grad clip-angle glow-box-purple flex flex-col justify-between" style={{ padding: "16px", border: "1px solid rgba(124, 58, 237, 0.3)", minHeight: "120px" }}>
            <span className="font-tech" style={{ fontSize: "0.6rem", color: "var(--accent-purple)", textTransform: "uppercase" }}>Total_XP_Harvested</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "auto" }}>
              <span className="font-led" style={{ fontSize: "2.5rem", color: "white" }}>{totalXp.toLocaleString()}</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(124, 58, 237, 0.4)" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
          </div>
          
          {/* Tasks Completed */}
          <div className="card-grad clip-angle glow-box-emerald flex flex-col justify-between" style={{ padding: "16px", border: "1px solid rgba(16, 185, 129, 0.3)", minHeight: "120px" }}>
            <span className="font-tech" style={{ fontSize: "0.6rem", color: "var(--accent-emerald)", textTransform: "uppercase" }}>Sync_Completions</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "auto" }}>
              <span className="font-led" style={{ fontSize: "2.5rem", color: "white" }}>{totalCompleted}</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
          </div>
          
          {/* Daily Streak */}
          <div className="card-grad clip-angle glow-box-amber flex flex-col justify-between" style={{ padding: "16px", border: "1px solid rgba(251, 191, 36, 0.3)", minHeight: "120px" }}>
            <span className="font-tech" style={{ fontSize: "0.6rem", color: "var(--accent-amber)", textTransform: "uppercase" }}>Survival_Streak</span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
              <span className="font-led" style={{ fontSize: "2.5rem", color: "white" }}>{streakDays}D</span>
              <div className="animate-flame">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px", marginBottom: "24px" }}>
          
          {/* XP Curve Visualization */}
          <div className="clip-angle" style={{ display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="font-tech" style={{ margin: 0, fontSize: "0.75rem", fontWeight: 900, color: "var(--accent-purple)", textTransform: "uppercase", letterSpacing: "0.2em" }}>XP_Progression_Timeline</h3>
              <div className="font-tech" style={{ display: "flex", gap: "16px", fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                <span>Daily</span>
                <span style={{ color: "var(--accent-purple)" }}>14_Days</span>
                <span>Monthly</span>
              </div>
            </div>
            
            <div style={{ flex: 1, padding: "32px", position: "relative", display: "flex", alignItems: "flex-end", minHeight: "250px" }}>
              <svg style={{ width: "100%", height: "100%", opacity: 0.8 }} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                <path d={pathData} stroke="var(--accent-purple)" fill="none" strokeWidth="3" />
                <path d={`M0,${chartHeight} L${chartWidth},${chartHeight}`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                
                {last14Days.map((d, i) => {
                  const x = i * stepX;
                  const y = chartHeight - paddingY - ((d.count / maxCount) * usableHeight);
                  return <circle key={i} cx={x} cy={y} r="4" fill="var(--accent-purple)" style={{ filter: "drop-shadow(0 0 4px var(--accent-purple))" }} />;
                })}
              </svg>
              
              <div className="font-tech" style={{ position: "absolute", bottom: "8px", left: "32px", right: "32px", display: "flex", justifyContent: "space-between", fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                {last14Days.map((d, i) => (
                  <span key={i}>{d.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Heatmap (Amber) */}
          <div className="clip-angle" style={{ display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
              <h3 className="font-tech" style={{ margin: 0, fontSize: "0.75rem", fontWeight: 900, color: "var(--accent-amber)", textTransform: "uppercase", letterSpacing: "0.2em" }}>Activity_Heatmap</h3>
            </div>
            
            <div className="scrollbar-cyber" style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", overflowY: "auto", maxHeight: "200px" }}>
              {heatmapData.map((count, i) => {
                const op = count >= 3 ? 1 : count === 2 ? 0.6 : count === 1 ? 0.3 : 0.05;
                const isGlow = count >= 3 ? "0 0 8px rgba(251, 191, 36, 0.4)" : "none";
                return (
                  <div key={i} className="heatmap-cell clip-tab" style={{ 
                    background: `rgba(251, 191, 36, ${op})`, 
                    borderColor: `rgba(251, 191, 36, ${Math.max(0.2, op)})`,
                    boxShadow: isGlow
                  }}></div>
                );
              })}
            </div>
            
            <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <span className="font-tech" style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Less</span>
                <div style={{ width: "8px", height: "8px", background: "rgba(251, 191, 36, 0.05)" }}></div>
                <div style={{ width: "8px", height: "8px", background: "rgba(251, 191, 36, 0.3)" }}></div>
                <div style={{ width: "8px", height: "8px", background: "rgba(251, 191, 36, 0.6)" }}></div>
                <div style={{ width: "8px", height: "8px", background: "rgba(251, 191, 36, 1)" }}></div>
                <span className="font-tech" style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>More</span>
              </div>
              <span className="font-tech" style={{ fontSize: "0.6rem", color: "var(--accent-amber)", textTransform: "uppercase" }}>Sync_Stable</span>
            </div>
          </div>
          
        </div>

        {/* Achievement Badges Scrollable Row */}
        <div className="clip-angle" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", padding: "16px" }}>
          <h3 className="font-tech" style={{ margin: "0 0 16px 0", fontSize: "0.6rem", fontWeight: 900, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.3em" }}>Rank_Tiers</h3>
          
          <div className="scrollbar-cyber" style={{ display: "flex", gap: "24px", overflowX: "auto", paddingBottom: "12px" }}>
            
            {TIERS.map((tier, index) => {
              const isUnlocked = currentLevel >= tier.minLevel;
              return (
                <div key={index} className="group" style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", opacity: isUnlocked ? 1 : 0.3, filter: isUnlocked ? "none" : "grayscale(100%)", transition: "all 0.3s" }}>
                  <div className="clip-angle" style={{ width: "64px", height: "64px", background: isUnlocked ? `rgba(${hexToRgb(tier.color)}, 0.1)` : "rgba(255, 255, 255, 0.05)", border: `2px solid ${isUnlocked ? tier.color : "rgba(255, 255, 255, 0.2)"}`, padding: "8px", display: "grid", placeItems: "center", color: isUnlocked ? tier.color : "rgba(255,255,255,0.5)", boxShadow: isUnlocked ? `0 0 10px rgba(${hexToRgb(tier.color)}, 0.2)` : "none" }}>
                    {tier.icon}
                  </div>
                  <span className="font-tech" style={{ fontSize: "0.5rem", color: isUnlocked ? tier.color : "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 900 }}>{tier.name}</span>
                  <span className="font-tech" style={{ fontSize: "0.4rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>LVL {tier.minLevel}</span>
                </div>
              );
            })}
            
          </div>
        </div>

      </div>
    </Layout>
  );
}

export default Progress;
