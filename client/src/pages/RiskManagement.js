import { useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/layout";
import "./theme.css";
import "./risk-management.css";
import API_BASE_URL from "../config/api";

const AI_REQUEST_TIMEOUT_MS = 1800;
const TASKS_STORAGE_KEY = "prometheus_tasks";

const defaultRisk = {
  baseRisk: 42,
  risk: 42,
  explanation:
    "Roles that rely on repeatable execution face more automation pressure. Strengthening judgment, domain context, and human-led problem solving lowers your exposure.",
  tips: [
    "Build domain-specific expertise that AI tools cannot apply without context.",
    "Strengthen communication, stakeholder handling, and decision framing.",
    "Own workflows end-to-end instead of only isolated execution tasks.",
    "Create visible proof of work through projects, case studies, and systems thinking.",
  ],
};

const fallbackCompare = [
  { role: "Product Designer", risk: 34 },
  { role: "Data Analyst", risk: 48 },
  { role: "Frontend Developer", risk: 57 },
];

const roleProfiles = [
  {
    keywords: ["mechanical", "engineer", "manufacturing", "industrial", "civil"],
    baseRisk: 38,
    explanation:
      "Engineering roles with physical systems knowledge are less exposed than pure routine desk work, but repetitive drafting, documentation, and standard analysis can still be automated.",
    tips: [
      "Build mastery in tolerance stack-up decisions, material tradeoffs, manufacturability reviews, and failure-mode analysis for real components rather than only CAD drafting.",
      "Create a portfolio of mechanical case studies that shows how you improved reliability, reduced cost, or solved thermal, vibration, or maintenance constraints in a physical system.",
      "Use AI tools for first-pass documentation, BOM cleanup, and simulation prep, but keep ownership of engineering judgment, safety sign-off, and design validation.",
      "Upskill in PLC integration, robotics, digital twins, or maintenance analytics so your role expands from design execution into plant and system-level problem solving.",
    ],
  },
  {
    keywords: ["software", "developer", "frontend", "backend", "web", "programmer"],
    baseRisk: 58,
    explanation:
      "Software work is increasingly accelerated by AI, especially for repeatable coding tasks. Risk drops when your work involves architecture, product thinking, and system ownership.",
    tips: [
      "Move beyond writing isolated features and become strong in architecture choices, debugging strategy, integration planning, and tradeoff decisions across the whole product.",
      "Build at least two end-to-end production-style projects with authentication, database design, observability, API integration, deployment, and performance tuning.",
      "Use AI coding tools aggressively for speed, but document where your value came from: system design, edge-case handling, refactoring judgment, and shipping decisions.",
      "Develop depth in one harder-to-automate layer such as security, distributed systems, developer tooling, accessibility, or performance engineering.",
    ],
  },
  {
    keywords: ["designer", "ux", "ui", "graphic", "creative"],
    baseRisk: 52,
    explanation:
      "AI can automate fast asset generation, but designers who understand user behavior, product goals, and decision-making remain more resilient.",
    tips: [
      "Shift from only making screens to leading problem framing, user research synthesis, information architecture, and measurable design decisions tied to product outcomes.",
      "Create detailed case studies that show your reasoning, tradeoffs, usability findings, and how your work improved conversion, retention, or task success.",
      "Use AI for moodboards, early concepts, and visual exploration, but keep ownership of user flows, accessibility, design systems, and final interaction quality.",
      "Strengthen product strategy, experimentation, accessibility, and cross-functional collaboration so your value is not limited to asset production.",
    ],
  },
  {
    keywords: ["analyst", "finance", "account", "operations", "data"],
    baseRisk: 49,
    explanation:
      "Routine analysis and reporting are becoming easier to automate. Your value increases when you can frame problems, interpret uncertainty, and guide decisions.",
    tips: [
      "Automate recurring dashboards and reporting work so you can spend more time on root-cause analysis, forecasting, and decision support.",
      "Strengthen your ability to translate metrics into action by writing recommendations, highlighting uncertainty, and connecting analysis to business priorities.",
      "Develop deeper domain expertise in one area such as pricing, operations, growth, finance, or customer behavior so your interpretation becomes harder to replace.",
      "Build a portfolio of analysis projects that show stakeholder communication, experimentation design, and business impact instead of only charts and SQL output.",
    ],
  },
];

const isGenericExplanation = (text) => {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("roles that rely on repeatable execution") ||
    normalized.includes("strengthening judgment, domain context") ||
    normalized.includes("human-led problem solving")
  );
};

const createRoleSpecificTips = (jobTitle, baseTips) => {
  const roleName = jobTitle.trim() || "this role";
  return [
    `For ${roleName}, identify the 3 to 5 tasks in your current workflow that are most repetitive, then deliberately reposition yourself toward the parts that require judgment, client interaction, physical-world context, or business tradeoff decisions.`,
    `Build a ${roleName} proof-of-work portfolio with concrete before-and-after outcomes, including what problem you solved, what constraints existed, what tools you used, and what result improved because of your contribution.`,
    `Create a personal upskilling plan for ${roleName} around tools, domain depth, and decision-making. Spend one track on AI leverage, one on advanced domain expertise, and one on communication or leadership responsibility.`,
    ...baseTips,
    `Turn these ${roleName}-specific countermeasures into weekly execution tasks and track them in Prometheus so your adaptation strategy becomes visible, measurable progress instead of general advice.`,
  ];
};

const getRoleProfile = (jobTitle) => {
  const lowered = jobTitle.toLowerCase();
  return (
    roleProfiles.find((profile) =>
      profile.keywords.some((keyword) => lowered.includes(keyword))
    ) || defaultRisk
  );
};

const createFallbackRisk = (jobTitle, skillLevel) => {
  const profile = getRoleProfile(jobTitle);
  const skillAdjustment = Math.round((50 - skillLevel) * 0.35);
  const risk = Math.max(12, Math.min(92, profile.baseRisk + skillAdjustment));
  const detailedTips = createRoleSpecificTips(jobTitle, profile.tips);

  return {
    risk,
    explanation: `${profile.explanation} For ${jobTitle || "this role"}, the safest path is to move toward responsibilities that combine tool fluency with hard-to-copy domain judgment.`,
    tips: detailedTips,
  };
};

const createCompareFallback = (roles) =>
  roles.map((role, index) => {
    const profile = getRoleProfile(role);
    const seededOffset =
      role.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 9;

    return {
      role,
      risk: Math.max(14, Math.min(88, profile.baseRisk + seededOffset - index * 3)),
    };
  });

function RiskManagement() {
  const [jobTitle, setJobTitle] = useState("");
  const [skillLevel, setSkillLevel] = useState(58);
  const [riskData, setRiskData] = useState(defaultRisk);
  const [careers, setCareers] = useState(["", "", ""]);
  const [compareData, setCompareData] = useState(fallbackCompare);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [taskActionMessage, setTaskActionMessage] = useState("");
  const [addedSuggestions, setAddedSuggestions] = useState({});

  const handleCareerChange = (index, value) => {
    setCareers((current) => current.map((career, i) => (i === index ? value : career)));
  };

  const parseRisk = (text) => {
    const riskMatch = text.match(/Risk:\s*(\d+)/i);
    const explanationMatch = text.match(/Explanation:\s*([\s\S]*?)Ways to stay relevant:/i);
    const tipsMatch = text.match(/Ways to stay relevant:\s*([\s\S]*)/i);

    const tips = tipsMatch
      ? tipsMatch[1]
          .split("\n")
          .map((tip) => tip.replace(/^[-*\d.\s]+/, "").trim())
          .filter(Boolean)
      : defaultRisk.tips;

    return {
      risk: riskMatch ? Number(riskMatch[1]) : defaultRisk.risk,
      explanation: explanationMatch ? explanationMatch[1].trim() : defaultRisk.explanation,
      tips,
    };
  };

  const calculateAndMitigate = async () => {
    if (!jobTitle.trim()) {
      alert("Enter a job title first.");
      return;
    }

    setIsCalculating(true);

    try {
      const role = `${jobTitle} - Skill ${skillLevel}%`;
      const res = await axios.post(
        `${API_BASE_URL}/api/predict-risk`,
        { role },
        { timeout: AI_REQUEST_TIMEOUT_MS }
      );
      const parsed = parseRisk(res.data.result || "");
      const fallback = createFallbackRisk(jobTitle, skillLevel);
      const finalRiskData =
        isGenericExplanation(parsed.explanation) || parsed.tips.length < 4
          ? {
              risk: parsed.risk,
              explanation: fallback.explanation,
              tips: fallback.tips,
            }
          : parsed;

      setRiskData(finalRiskData);
      setAddedSuggestions({});
      setTaskActionMessage("");
    } catch (error) {
      const fallback = createFallbackRisk(jobTitle, skillLevel);
      setRiskData(fallback);
      setAddedSuggestions({});
      setTaskActionMessage("");
    } finally {
      setIsCalculating(false);
    }
  };

  const compareCareers = async () => {
    const cleaned = careers.map((career) => career.trim()).filter(Boolean);

    if (cleaned.length !== 3) {
      alert("Enter exactly three careers to compare.");
      return;
    }

    setIsComparing(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/compare-roles`,
        {
          roles: cleaned,
        },
        { timeout: AI_REQUEST_TIMEOUT_MS }
      );

      const apiData = Array.isArray(res.data?.data) ? res.data.data : [];
      const normalized = apiData.slice(0, 3).map((item, index) => ({
        role: item.role || cleaned[index],
        risk: Number(item.risk ?? item.score ?? 0),
      }));

      setCompareData(normalized.length === 3 ? normalized : createCompareFallback(cleaned));
    } catch (error) {
      setCompareData(createCompareFallback(cleaned));
    } finally {
      setIsComparing(false);
    }
  };

  const addSuggestionToTasks = (tip) => {
    try {
      const rawTasks = localStorage.getItem(TASKS_STORAGE_KEY);
      const storedTasks = rawTasks ? JSON.parse(rawTasks) : [];
      const alreadyExists = storedTasks.some(
        (task) => String(task.title || "").trim().toLowerCase() === tip.trim().toLowerCase()
      );

      if (alreadyExists) {
        setTaskActionMessage("That suggestion is already in your Tasks queue.");
        return;
      }

      const nextTasks = [
        {
          id: Date.now(),
          title: tip,
          completed: false,
          rewarded: false,
        },
        ...storedTasks,
      ];

      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(nextTasks));
      setAddedSuggestions((current) => ({ ...current, [tip]: true }));
      setTaskActionMessage("Suggestion added to Tasks.");
    } catch (error) {
      setTaskActionMessage("Could not add that suggestion to Tasks.");
    }
  };

  const safeCompareData = compareData.length === 3 ? compareData : fallbackCompare;

  const chartPoints = useMemo(() => {
    const baseX = [28, 50, 72];
    return safeCompareData
      .map((item, index) => {
        const x = baseX[index];
        const y = 86 - Math.min(70, Math.max(12, item.risk));
        return `${x},${y}`;
      })
      .join(" ");
  }, [safeCompareData]);

  const getRiskStatus = (score) => {
    if (score < 30) return { label: "STATUS: LOW_THREAT", color: "var(--accent-emerald)", shadow: "drop-shadow(0 0 12px var(--accent-emerald))", bgClass: "bg-slate-900/50 border-var(--accent-emerald) text-var(--accent-emerald)" };
    if (score < 70) return { label: "STATUS: ELEVATED", color: "var(--accent-purple)", shadow: "drop-shadow(0 0 12px var(--accent-purple))", bgClass: "bg-slate-900/50 border-var(--accent-purple) text-var(--accent-purple)" };
    return { label: "STATUS: CRITICAL", color: "var(--accent-amber)", shadow: "drop-shadow(0 0 20px var(--accent-amber))", bgClass: "bg-slate-950 border-2 border-var(--accent-amber) text-var(--accent-amber) risk-critical" };
  };

  const riskStatus = getRiskStatus(riskData.risk);
  const strokeOffset = 880 - (riskData.risk / 100) * 880;

  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 1 + "px",
      left: Math.random() * 100 + "%",
      top: Math.random() * 100 + "%",
      delay: Math.random() * 7 + "s",
      opacity: Math.random() * 0.5 + 0.2
    }));
  }, []);

  return (
    <Layout>
      <div className="relative w-full min-h-screen overflow-hidden circuit-bg scrollbar-cyber" style={{ background: "var(--bg-dark)", margin: "-24px" }}>
        <div className="circuit-lines"></div>
        <div className="scanlines"></div>
        <div className="cyber-grid-3d"></div>

        {/* Animated Floating Background Elements */}
        <div className="floating-shape clip-hex" style={{ width: "160px", height: "160px", borderColor: "rgba(251, 191, 36, 0.1)", top: "10%", left: "10%" }}></div>
        <div className="floating-shape" style={{ width: "96px", height: "96px", borderColor: "rgba(124, 58, 237, 0.1)", bottom: "20%", right: "15%", transform: "rotate(45deg)" }}></div>

        <div style={{ position: "relative", zIndex: 10, padding: "24px" }}>
          
          {/* Full-Width Hero Risk Section */}
          <section className="relative w-full mb-12 flex flex-col items-center border clip-corner group" style={{ background: "rgba(15, 23, 42, 0.3)", borderColor: "rgba(255, 255, 255, 0.05)", padding: "48px", backdropFilter: "blur(24px)", overflow: "hidden" }}>
            {/* Corner Decorations */}
            <div className="corner-deco top-l" style={{ borderColor: "rgba(124, 58, 237, 0.3)" }}></div>
            <div className="corner-deco top-r" style={{ borderColor: "rgba(251, 191, 36, 0.3)" }}></div>
            <div className="corner-deco bot-l" style={{ borderColor: "rgba(16, 185, 129, 0.3)" }}></div>
            <div className="corner-deco bot-r" style={{ borderColor: "rgba(255, 255, 255, 0.3)" }}></div>

            <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "320px", height: "320px", background: "rgba(124, 58, 237, 0.05)", filter: "blur(120px)", borderRadius: "50%" }}></div>
            <div style={{ position: "absolute", bottom: "-80px", right: "-80px", width: "320px", height: "320px", background: "rgba(251, 191, 36, 0.05)", filter: "blur(120px)", borderRadius: "50%" }}></div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", width: "100%", maxWidth: "1280px", alignItems: "center", gap: "64px" }}>
              
              {/* Input Side */}
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                <div>
                  <span className="font-tech" style={{ fontSize: "0.75rem", color: "var(--accent-purple)", textTransform: "uppercase", letterSpacing: "0.5em", display: "block" }}>Target_Parameter</span>
                  <h1 style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "-0.05em", lineHeight: 1, margin: "8px 0" }}>
                    PROME<span style={{ color: "transparent", backgroundImage: "linear-gradient(to right, var(--accent-purple), var(--accent-amber))", WebkitBackgroundClip: "text", backgroundClip: "text" }}>THEUS</span>
                  </h1>
                </div>

                <div className="clip-angle" style={{ padding: "2px", background: "linear-gradient(to right, var(--accent-purple), var(--accent-amber))", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}>
                  <div className="clip-angle" style={{ background: "rgba(2, 6, 23, 0.95)", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
                    
                    <div>
                      <label className="font-tech" style={{ fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Input_Vocational_Protocol</label>
                      <input 
                        type="text" 
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="ENTER JOB TITLE..." 
                        className="font-tech"
                        style={{ width: "100%", background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "20px", fontSize: "1.25rem", color: "var(--accent-purple)", outline: "none", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "8px" }} 
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <label className="font-tech" style={{ fontSize: "0.6rem", color: "rgba(255, 255, 255, 0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Skill_Proficiency</label>
                        <strong className="font-tech" style={{ color: "var(--accent-amber)" }}>{skillLevel}%</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={skillLevel}
                        onChange={(e) => setSkillLevel(Number(e.target.value))}
                        style={{ width: "100%", marginTop: "8px", accentColor: "var(--accent-amber)" }}
                      />
                    </div>

                    <button 
                      onClick={calculateAndMitigate} 
                      disabled={isCalculating}
                      className="clip-corner"
                      style={{ width: "100%", padding: "24px 0", background: "linear-gradient(to right, var(--accent-purple), var(--accent-amber))", color: "#020617", fontWeight: 900, textTransform: "uppercase", fontSize: "1.125rem", border: "none", cursor: "pointer", boxShadow: "0 0 20px rgba(124, 58, 237, 0.3)", transition: "all 0.2s" }}
                    >
                      {isCalculating ? "COMPUTING_RISK..." : "INITIALIZE_CORE_SCAN"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Large Gauge Side */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px", overflow: "visible" }}>
                
                {/* Star Particles */}
                <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                  {particles.map((p) => (
                    <div 
                      key={p.id} 
                      className="particle" 
                      style={{ 
                        width: p.size, 
                        height: p.size, 
                        left: p.left, 
                        top: p.top, 
                        animationDelay: p.delay,
                        background: "rgba(255,255,255,0.8)",
                        boxShadow: "0 0 6px rgba(255,255,255,0.5)"
                      }} 
                    />
                  ))}
                </div>

                <svg className="radial-progress-svg" style={{ width: "100%", maxWidth: "450px", height: "auto", overflow: "visible", filter: riskStatus.shadow }} viewBox="0 0 300 300">
                  <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="12" />
                  <circle 
                    className="risk-circle" 
                    cx="150" cy="150" r="140" fill="none" 
                    stroke={riskStatus.color} 
                    strokeWidth="12" 
                    strokeLinecap="butt" 
                    transform="rotate(-90 150 150)" 
                    style={{ strokeDashoffset: strokeOffset }}
                  />
                  {/* Decorative inner ring */}
                  <circle cx="150" cy="150" r="115" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="2" strokeDasharray="10 20" />
                </svg>

                {/* Center Info */}
                <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <span className="font-tech" style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.3)", textTransform: "uppercase", letterSpacing: "0.5em", marginBottom: "16px" }}>Displacement_Risk</span>
                  <div className="glitch-text" style={{ fontSize: "clamp(5rem, 8vw, 8rem)", lineHeight: 1, color: "white", fontWeight: 900, fontStyle: "italic" }}>
                    {riskData.risk}%
                  </div>
                  <div className={riskStatus.label === "STATUS: CRITICAL" ? "risk-critical" : ""} style={{ marginTop: "16px", padding: "8px 24px", background: "rgba(15, 23, 42, 0.5)", border: `1px solid ${riskStatus.color}`, fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: riskStatus.color }}>
                    {riskStatus.label}
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Main Split Layout */}
          <main style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "32px", position: "relative", zIndex: 10 }}>
            
            {/* Left Column: Counter-Measures */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "1.875rem", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "-0.05em", margin: 0 }}>TACTICAL_COUNTER_MEASURES</h2>
                  <p className="font-tech" style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px", margin: 0 }}>Survival protocols generated by CORE_ENGINE</p>
                </div>
              </div>

              <p className="font-tech" style={{ color: "var(--accent-purple)", fontSize: "0.8rem", textTransform: "uppercase", borderLeft: "2px solid var(--accent-purple)", paddingLeft: "16px", background: "rgba(124, 58, 237, 0.05)", padding: "12px 16px" }}>
                {riskData.explanation}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                {riskData.tips.map((tip, i) => (
                  <div key={i} className="clip-corner" style={{ position: "relative", background: "linear-gradient(to bottom right, rgba(15, 23, 42, 0.8), rgba(2, 6, 23, 0.8))", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "32px", display: "flex", flexDirection: "column", transition: "all 0.3s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span className="font-tech" style={{ fontSize: "0.6rem", color: "var(--accent-amber)", textTransform: "uppercase", letterSpacing: "0.3em" }}>MOD_0{i+1} // TACTIC</span>
                      </div>
                    </div>
                    <p className="font-tech" style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", lineHeight: 1.6, marginBottom: "32px", flex: 1 }}>
                      {tip}
                    </p>
                    <button 
                      onClick={() => addSuggestionToTasks(tip)}
                      disabled={Boolean(addedSuggestions[tip])}
                      className="clip-angle font-tech"
                      style={{ marginTop: "auto", width: "100%", padding: "16px", background: addedSuggestions[tip] ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.05)", border: `1px solid ${addedSuggestions[tip] ? "var(--accent-emerald)" : "rgba(255, 255, 255, 0.1)"}`, color: addedSuggestions[tip] ? "var(--accent-emerald)" : "var(--accent-amber)", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", cursor: addedSuggestions[tip] ? "not-allowed" : "pointer", transition: "all 0.2s" }}
                    >
                      {addedSuggestions[tip] ? "PROTOCOL_ADDED" : "DEPLOY_DIRECTIVE"}
                    </button>
                  </div>
                ))}
              </div>
              {taskActionMessage && <div className="font-tech" style={{ padding: "12px", border: "1px solid var(--accent-emerald)", color: "var(--accent-emerald)", background: "rgba(16, 185, 129, 0.05)", fontSize: "0.8rem", textTransform: "uppercase" }}>{taskActionMessage}</div>}
            </div>

            {/* Right Column: Multi-Career Comparison */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="clip-corner" style={{ background: "rgba(15, 23, 42, 0.8)", borderTop: "2px solid var(--accent-emerald)", padding: "32px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "24px", color: "white" }}>MULTI-CAREER COMPARISON</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {careers.map((career, index) => (
                    <div key={index}>
                      <label className="font-tech" style={{ fontSize: "0.6rem", color: "var(--accent-emerald)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Target_Role_{index + 1}</label>
                      <input
                        value={career}
                        onChange={(e) => handleCareerChange(index, e.target.value)}
                        placeholder="ENTER JOB TITLE"
                        className="font-tech"
                        style={{ width: "100%", background: "rgba(2, 6, 23, 0.5)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "16px", fontSize: "0.875rem", color: "var(--accent-emerald)", textTransform: "uppercase", outline: "none", marginTop: "8px" }}
                      />
                    </div>
                  ))}

                  <button 
                    onClick={compareCareers} 
                    disabled={isComparing}
                    className="clip-angle font-tech"
                    style={{ width: "100%", padding: "16px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "var(--accent-emerald)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", cursor: "pointer", transition: "all 0.2s" }}
                  >
                    {isComparing ? "ANALYZING_VECTORS..." : "RUN_COMPARISON_MATRIX"}
                  </button>
                </div>
              </div>

              {/* Chart Visualization */}
              <div className="clip-corner" style={{ flex: 1, background: "rgba(15, 23, 42, 0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", backdropFilter: "blur(24px)", padding: "24px", display: "flex", flexDirection: "column" }}>
                <h3 className="font-tech" style={{ fontSize: "0.875rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.5)", marginBottom: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "16px" }}>THREAT_VECTORS</h3>
                
                <div style={{ flex: 1, position: "relative", minHeight: "200px" }}>
                  <div style={{ display: "flex", height: "100%", alignItems: "flex-end", justifyContent: "space-around" }}>
                    {safeCompareData.map((item, i) => (
                      <div key={item.role + i} style={{ width: "40px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative" }}>
                        <div style={{ height: `${Math.max(10, item.risk)}%`, width: "100%", background: "linear-gradient(to top, var(--accent-emerald), transparent)", border: "1px solid var(--accent-emerald)", transition: "height 0.5s" }}></div>
                      </div>
                    ))}
                  </div>
                  
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline points={chartPoints} fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
                  {safeCompareData.map((item, i) => (
                    <div key={item.role + i} className="font-tech" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", textTransform: "uppercase" }}>
                      <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>{item.role || `Role ${i+1}`}</span>
                      <strong style={{ color: "var(--accent-amber)" }}>{item.risk}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </Layout>
  );
}

export default RiskManagement;
