import { useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/layout";
import "./theme.css";
import "./risk-management.css";
import API_BASE_URL from "../config/api";

const AI_REQUEST_TIMEOUT_MS = 1800;

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

const formatNumberedTips = (tips) => tips.map((tip, index) => `${index + 1}. ${tip}`).join("\n");

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
  const [countermeasuresText, setCountermeasuresText] = useState(
    formatNumberedTips(defaultRisk.tips)
  );
  const [careers, setCareers] = useState(["", "", ""]);
  const [compareData, setCompareData] = useState(fallbackCompare);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

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
      setCountermeasuresText(formatNumberedTips(finalRiskData.tips));
    } catch (error) {
      const fallback = createFallbackRisk(jobTitle, skillLevel);
      setRiskData(fallback);
      setCountermeasuresText(formatNumberedTips(fallback.tips));
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

  const copySuggestions = async () => {
    if (!countermeasuresText.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(countermeasuresText);
      alert("Suggestions copied. Paste them into Tasks to generate AI-based tasks.");
    } catch (error) {
      alert("Copy failed. You can still manually copy the text below.");
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

  const suggestionHelper =
    "Copy these countermeasures and paste them into Tasks to generate AI-based action items for your learning plan.";

  return (
    <Layout>
      <div className="risk-page-shell">
        <div className="risk-board">
          <div className="risk-brand">
            <h1>PROMETHEUS</h1>
            <p>AI Risk Assessment Platform</p>
          </div>

          <div className="risk-grid">
            <section className="risk-card risk-card-left">
              <div className="risk-card-header">
                <h2>Job Risk Calculator & Countermeasures</h2>
              </div>

              <div className="risk-form">
                <div className="field-shell search-shell">
                  <input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Enter Job Title"
                    className="risk-input"
                  />
                  <span className="field-icon">?</span>
                </div>

                <div className="skill-strip">
                  <div className="skill-strip-header">
                    <span>Current Skill Level</span>
                    <strong>{skillLevel}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(Number(e.target.value))}
                    className="risk-slider"
                  />
                </div>
              </div>

              <div className="gauge-panel">
                <div className="gauge-meter" style={{ "--risk-angle": `${riskData.risk * 1.8}deg` }}>
                  <div className="gauge-core">
                    <span>{riskData.risk}%</span>
                  </div>
                  <div className="gauge-needle" />
                </div>
                <p>Potential for AI Replacement (Risk %)</p>
              </div>

              <div className="countermeasure-panel">
                <h3>Personalized Countermeasures & Upskilling Paths</h3>
                <div className="countermeasure-block">
                  <span className="countermeasure-label">Risk Summary</span>
                  <p className="countermeasure-summary">{riskData.explanation}</p>
                </div>
                <div className="countermeasure-block">
                  <span className="countermeasure-label">Recommended Action Plan</span>
                  <ol className="countermeasure-list">
                    {riskData.tips.map((tip, index) => (
                      <li key={tip} className="countermeasure-item">
                        <span className="countermeasure-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <p>{tip}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <button onClick={calculateAndMitigate} className="risk-cta" disabled={isCalculating}>
                {isCalculating ? "Calculating..." : "Calculate and Mitigate"}
                <span>{">"}</span>
              </button>
            </section>

            <section className="risk-card risk-card-right">
              <div className="risk-card-header">
                <h2>Multi-Career Comparison</h2>
              </div>

              <div className="compare-form">
                {careers.map((career, index) => (
                  <div className="field-shell compare-shell" key={`career-${index}`}>
                    <input
                      value={career}
                      onChange={(e) => handleCareerChange(index, e.target.value)}
                      placeholder="Add Career to Compare"
                      className="risk-input"
                    />
                    {index === 0 ? <span className="field-icon">+</span> : null}
                  </div>
                ))}
              </div>

              <div className="comparison-panel">
                <div className="chart-shell">
                  <div className="chart-bars">
                    {safeCompareData.map((item) => (
                      <div className="chart-bar-column" key={item.role}>
                        <div className="chart-bar-track">
                          <div className="chart-bar-fill" style={{ height: `${Math.max(22, item.risk)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <svg className="chart-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline points={chartPoints} />
                  </svg>
                </div>

                <div className="compare-percentages">
                  {safeCompareData.map((item) => (
                    <div className="compare-row" key={`${item.role}-percent`}>
                      <span>{item.role}</span>
                      <strong>{item.risk}%</strong>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={compareCareers} className="risk-cta" disabled={isComparing}>
                {isComparing ? "Comparing..." : "Compare Careers"}
                <span>{">"}</span>
              </button>
            </section>
          </div>

          <section className="task-handoff-panel">
            <div className="task-handoff-copy">
              <h3>Task Generator Suggestion</h3>
              <p>{suggestionHelper}</p>
            </div>
            <button onClick={copySuggestions} className="copy-suggestions-btn">
              Copy Suggestions
            </button>
          </section>

          <section className="suggestion-output-panel">
            <div className="suggestion-output-header">
              <div>
                <h3>Structured Suggestion Export</h3>
                <p>Use this cleaned list as your copy-ready input for the Tasks tab.</p>
              </div>
              <span className="suggestion-status">
                {riskData.tips.length} ACTIONS
              </span>
            </div>

            <textarea
              value={countermeasuresText}
              onChange={(e) => setCountermeasuresText(e.target.value)}
              className="suggestion-box"
              placeholder="Calculated countermeasures will appear here. Copy them into Tasks to generate AI-based tasks."
            />
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default RiskManagement;
