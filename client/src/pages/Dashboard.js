import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout";
import API_BASE_URL from "../config/api";
import "./theme-dynamic.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [syncingTaskId, setSyncingTaskId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [previousAssessment, setPreviousAssessment] = useState(null);
  const [roadmap, setRoadmap] = useState([]);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const showToast = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: "", text: "" }), 4000);
  };

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [profileRes, assessmentRes, roadmapRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/career-profile`, { headers: { authorization: token } }),
        axios.get(`${API_BASE_URL}/api/career-assessment`, { headers: { authorization: token } }),
        axios.get(`${API_BASE_URL}/api/career-roadmap`, { headers: { authorization: token } }),
      ]);

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value.data);
      }
      if (assessmentRes.status === "fulfilled") {
        setAssessment(assessmentRes.value.data?.assessment || null);
        setPreviousAssessment(assessmentRes.value.data?.previousAssessment || null);
      }
      if (roadmapRes.status === "fulfilled") {
        setRoadmap(roadmapRes.value.data?.roadmap || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRunAssessment = async () => {
    setAssessing(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/career-assessment`,
        {},
        { headers: { authorization: token }, timeout: 30000 }
      );
      setAssessment(res.data.assessment);
      setPreviousAssessment(res.data.previousAssessment);
      showToast("success", "Career readiness recalculated!");

      // If roadmap was empty, auto-generate one
      if (roadmap.length === 0) {
        handleGenerateRoadmap();
      }
    } catch (err) {
      showToast("error", err.response?.data?.message || "Assessment calculation failed.");
    } finally {
      setAssessing(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/career-roadmap/generate`,
        {},
        { headers: { authorization: token }, timeout: 25000 }
      );
      setRoadmap(res.data.roadmap || []);
      showToast("success", "Personalized learning roadmap generated!");
    } catch (err) {
      showToast("error", "Failed to generate roadmap.");
    }
  };

  const handleSyncRoadmapToTasks = async (milestone) => {
    setSyncingTaskId(milestone.id);
    try {
      const tasksToAdd = [
        milestone.title,
        ...(milestone.practicalExercises || []),
      ];

      await axios.post(
        `${API_BASE_URL}/api/career-roadmap/sync-tasks`,
        { tasksToAdd },
        { headers: { authorization: token } }
      );
      showToast("success", `Added ${tasksToAdd.length} task(s) from "${milestone.title}" to your Tasks!`);
    } catch (err) {
      showToast("error", "Failed to sync milestone to tasks.");
    } finally {
      setSyncingTaskId(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Loading Career Intelligence Engine...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const targetRole = profile?.careerProfile?.targetRole || "";
  const overallScore = assessment?.overallScore;
  const status = assessment?.status || (targetRole ? "incomplete" : "unconfigured");
  const dataCoverage = assessment?.dataCoverage ?? 0;
  const overallConfidence = assessment?.overallConfidence ?? 0;
  const factors = assessment?.factors || {};

  // Delta calculation (version-checked)
  let deltaText = null;
  let isModelVersionMismatch = false;
  if (previousAssessment && typeof previousAssessment === "object") {
    const prevVersion = previousAssessment.methodologyVersion || "legacy";
    const currentVersion = assessment?.methodologyVersion || "1.0.0";
    if (prevVersion !== currentVersion) {
      isModelVersionMismatch = true;
      deltaText = `Model updated (v${prevVersion} → v${currentVersion})`;
    } else if (
      typeof overallScore === "number" &&
      typeof previousAssessment.overallScore === "number" &&
      previousAssessment.overallScore !== null &&
      overallScore !== null
    ) {
      const diff = Math.round((overallScore - previousAssessment.overallScore) * 10) / 10;
      deltaText = diff > 0 ? `+${diff} pts` : diff < 0 ? `${diff} pts` : "No change";
    }
  }

  // Circular gauge constants
  const circleRadius = 70;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset = overallScore !== null && overallScore !== undefined
    ? circleCircumference * (1 - overallScore / 100)
    : circleCircumference;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Status Toast */}
        {statusMsg.text && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${
              statusMsg.type === "error"
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            }`}
          >
            {statusMsg.type === "error" ? "⚠️" : "✓"} {statusMsg.text}
          </div>
        )}

        {/* ── 1. READINESS OVERVIEW HERO ── */}
        <div className="glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-96 h-96 blur-[120px] pointer-events-none rounded-full"
            style={{ background: "rgba(var(--accent-1-rgb), 0.15)" }}
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            {/* Left: Role Info & Badges */}
            <div className="space-y-4 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                  Target Career
                </span>
                {status === "complete" ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    ✓ Complete Assessment (100% Coverage)
                  </span>
                ) : status === "provisional" ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    ⚠ Provisional Score ({dataCoverage}% Coverage)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400">
                    Onboarding Incomplete ({dataCoverage}% Coverage)
                  </span>
                )}
                {assessment?.verificationStatus && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    assessment.verificationStatus === "verified"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                  }`}>
                    {assessment.verificationStatus === "verified" ? "✓ Verified Feeds" : "⚡ Estimated Evidence Included"}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-white">
                  {targetRole || "Target Role Not Set"}
                </h1>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                  {profile?.careerProfile?.careerObjective ||
                    "Evaluates your skill match, learning consistency, market demand, technology relevance, AI risk, and project complexity."}
                </p>
              </div>

              {/* Data Coverage & Freshness */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Model Coverage</span>
                  <span className="text-sm font-bold text-indigo-400">{dataCoverage}%</span>
                  <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${dataCoverage}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Confidence</span>
                  <span className="text-sm font-bold text-zinc-200">{overallConfidence}%</span>
                  <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${overallConfidence}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Assessed On</span>
                  <span className="text-xs font-semibold text-zinc-300 truncate block mt-0.5">
                    {assessment?.assessedAt ? new Date(assessment.assessedAt).toLocaleDateString() : "Never"}
                  </span>
                  {deltaText && (
                    <span className={`text-[10px] font-bold ${
                      isModelVersionMismatch
                        ? "text-amber-400"
                        : deltaText.startsWith("+")
                        ? "text-emerald-400"
                        : "text-zinc-400"
                    }`}>
                      {deltaText}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleRunAssessment}
                  disabled={assessing || !targetRole}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {assessing ? "Calculating..." : "Re-assess Readiness"}
                </button>
                <button
                  onClick={() => navigate("/career-profile")}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all flex items-center gap-1.5"
                >
                  Edit Career Profile & Skills →
                </button>
              </div>
            </div>

            {/* Right: Circular Gauge */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/5 min-w-[240px]">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg width="176" height="176" className="transform -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r={circleRadius}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r={circleRadius}
                    stroke="var(--accent-primary)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={circleOffset}
                    strokeLinecap="round"
                    style={{
                      transition: "stroke-dashoffset 1s ease",
                      filter: "drop-shadow(0 0 10px rgba(168,85,247,0.5))",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-extrabold font-display text-white">
                    {overallScore !== null && overallScore !== undefined ? `${overallScore}` : "—"}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mt-1">
                    {overallScore !== null && overallScore !== undefined ? "Readiness Score" : "Incomplete Data"}
                  </span>
                  <span className="text-[10px] text-zinc-500">out of 100</span>
                </div>
              </div>

              <div className="text-center mt-3">
                <p className="text-xs text-zinc-400 max-w-[200px]">
                  {status === "complete"
                    ? "Full canonical readiness evaluated across all 6 dimensions."
                    : status === "provisional"
                    ? "Provisional readiness calculated on available dimensions."
                    : "Add profile details to unlock your readiness score."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ONBOARDING BANNER (If coverage < 60%) ── */}
        {dataCoverage < 60 && (
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-zinc-200 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <h3 className="font-bold text-base text-amber-300">
                Data Coverage Below 60% — Complete Your Profile to Unlock Readiness Score
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              To produce a reliable assessment, the scoring engine requires at least 60% model coverage. Please configure:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <span className={`p-2 rounded-lg ${profile?.careerProfile?.targetRole ? "bg-emerald-500/10 text-emerald-300" : "bg-black/30 text-zinc-400"}`}>
                {profile?.careerProfile?.targetRole ? "✓ Target Role Set" : "○ Target Role"}
              </span>
              <span className={`p-2 rounded-lg ${(profile?.skills?.length || 0) > 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-black/30 text-zinc-400"}`}>
                {(profile?.skills?.length || 0) > 0 ? `✓ ${profile.skills.length} Skills Added` : "○ Skills Inventory"}
              </span>
              <span className={`p-2 rounded-lg ${(profile?.projects?.length || 0) > 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-black/30 text-zinc-400"}`}>
                {(profile?.projects?.length || 0) > 0 ? `✓ ${profile.projects.length} Project(s)` : "○ Project Portfolio"}
              </span>
              <span className={`p-2 rounded-lg ${(profile?.learningSessions?.length || 0) > 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-black/30 text-zinc-400"}`}>
                {(profile?.learningSessions?.length || 0) > 0 ? `✓ ${profile.learningSessions.length} Session(s)` : "○ Learning Sessions"}
              </span>
            </div>
            <button
              onClick={() => navigate("/career-profile")}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all"
            >
              Go to Career Profile Setup →
            </button>
          </div>
        )}

        {/* ── 2. SIX FACTOR CARDS GRID ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold font-display text-white">Career Dimensions Breakdown</h2>
              <p className="text-xs text-zinc-400">Six weighted criteria combining into your overall readiness.</p>
            </div>
            <span className="text-xs text-zinc-500">Weights total exactly 100%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Skill Match (30%) */}
            <FactorCard
              title="Skill Match"
              weight="30%"
              score={factors.skillMatch?.score}
              isComplete={factors.skillMatch?.isComplete}
              sourceType={factors.skillMatch?.sourceType}
              confidence={factors.skillMatch?.confidence}
              badge={factors.skillMatch?.isComplete ? "Target Met" : "Incomplete"}
              color="indigo"
              explanation={factors.skillMatch?.explanation}
              metrics={[
                { label: "Covered Criteria", val: `${factors.skillMatch?.subfactors?.coveredCount || 0}/${factors.skillMatch?.subfactors?.totalRequirements || 0}` },
                { label: "Critical Gaps", val: factors.skillMatch?.subfactors?.criticalGapsCount || 0 },
                { label: "Confidence", val: `${factors.skillMatch?.confidence || 0}%` },
              ]}
              recommendation={factors.skillMatch?.recommendations?.[0]}
            />

            {/* Card 2: Learning Consistency (15%) */}
            <FactorCard
              title="Learning Consistency"
              weight="15%"
              score={factors.learningConsistency?.score}
              isComplete={factors.learningConsistency?.isComplete}
              sourceType={factors.learningConsistency?.sourceType}
              confidence={factors.learningConsistency?.confidence}
              badge="Rolling 28-Day"
              color="cyan"
              explanation={factors.learningConsistency?.explanation}
              metrics={[
                { label: "Active Days", val: `${factors.learningConsistency?.subfactors?.actualDistinctDays || 0}/${factors.learningConsistency?.subfactors?.plannedDays28 || 16}` },
                { label: "Active Weeks", val: `${factors.learningConsistency?.subfactors?.weeksWithActivity || 0}/4` },
                { label: "7-Day Sessions", val: factors.learningConsistency?.subfactors?.sessions7d || 0 },
              ]}
              recommendation={factors.learningConsistency?.recommendations?.[0]}
            />

            {/* Card 3: Market Demand (15%) */}
            <FactorCard
              title="Market Demand"
              weight="15%"
              score={factors.marketDemand?.score}
              isComplete={factors.marketDemand?.isComplete}
              sourceType={factors.marketDemand?.sourceType}
              confidence={factors.marketDemand?.confidence}
              badge={factors.marketDemand?.sourceType === "verified_provider" ? "Live Telemetry" : "AI Estimate"}
              badgeColor={factors.marketDemand?.sourceType === "verified_provider" ? "emerald" : "amber"}
              color="blue"
              explanation={factors.marketDemand?.explanation}
              metrics={[
                { label: "Vacancy Demand", val: `${factors.marketDemand?.subfactors?.vacancyDemand || 0}/100` },
                { label: "Hiring Trend", val: `${factors.marketDemand?.subfactors?.hiringTrend || 0}/100` },
                { label: "Confidence", val: `${factors.marketDemand?.confidence || 45}%` },
              ]}
              recommendation={factors.marketDemand?.recommendations?.[0]}
            />

            {/* Card 4: Tech Stack Relevance (15%) */}
            <FactorCard
              title="Tech Stack Relevance"
              weight="15%"
              score={factors.techStackRelevance?.score}
              isComplete={factors.techStackRelevance?.isComplete}
              sourceType={factors.techStackRelevance?.sourceType}
              confidence={factors.techStackRelevance?.confidence}
              badge="Ecosystem Fit"
              color="purple"
              explanation={factors.techStackRelevance?.explanation}
              metrics={[
                { label: "Stack Alignment", val: `${factors.techStackRelevance?.subfactors?.stackAlignment || 0}%` },
                { label: "Currency Index", val: `${factors.techStackRelevance?.subfactors?.technologyCurrency || 0}/100` },
                { label: "Missing Tools", val: factors.techStackRelevance?.subfactors?.missingToolsCount || 0 },
              ]}
              recommendation={factors.techStackRelevance?.recommendations?.[0]}
            />

            {/* Card 5: AI Automation Resilience (10%, Resilience = 100 - Risk) */}
            <FactorCard
              title="AI Automation Resilience"
              weight="10%"
              score={factors.aiAutomationRisk?.resilienceScore}
              isComplete={factors.aiAutomationRisk?.isComplete}
              sourceType={factors.aiAutomationRisk?.sourceType}
              confidence={factors.aiAutomationRisk?.confidence}
              badge="Inverse Risk"
              badgeColor="rose"
              color="rose"
              explanation={factors.aiAutomationRisk?.explanation}
              metrics={[
                { label: "AI Risk Level", val: `${factors.aiAutomationRisk?.score || 0}% (Unfavorable)` },
                { label: "Resilience", val: `${factors.aiAutomationRisk?.resilienceScore || 0}%` },
                { label: "Confidence", val: `${factors.aiAutomationRisk?.confidence || 0}%` },
              ]}
              recommendation={factors.aiAutomationRisk?.recommendations?.[0]}
              extraAlert="Higher risk reduces readiness score. Resilience = 100 - Risk."
            />

            {/* Card 6: Project Complexity (15%) */}
            <FactorCard
              title="Project Complexity"
              weight="15%"
              score={factors.projectComplexity?.score}
              isComplete={factors.projectComplexity?.isComplete}
              sourceType={factors.projectComplexity?.sourceType}
              confidence={factors.projectComplexity?.confidence}
              badge="6-Point Rubric"
              color="emerald"
              explanation={factors.projectComplexity?.explanation}
              metrics={[
                { label: "Projects Analyzed", val: factors.projectComplexity?.subfactors?.projectCount || 0 },
                { label: "Top Project", val: factors.projectComplexity?.strongestProjects?.[0]?.title || "None" },
                { label: "Verified Links", val: factors.projectComplexity?.subfactors?.verifiedLinksCount || 0 },
              ]}
              recommendation={factors.projectComplexity?.recommendations?.[0]}
            />
          </div>
        </div>

        {/* ── 3. SKILL GAP ANALYSIS SECTION ── */}
        <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-xl font-bold font-display text-white">Prioritized Skill Gap Report</h2>
              <p className="text-xs text-zinc-400">
                Skills ranked by role importance weight and current proficiency deficit.
              </p>
            </div>
            <button
              onClick={() => navigate("/career-profile")}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
            >
              Update Skills in Profile →
            </button>
          </div>

          {factors.skillMatch?.highestImpactNext && factors.skillMatch.highestImpactNext.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {factors.skillMatch.highestImpactNext.map((gap, i) => (
                <div
                  key={gap.name || i}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                        Priority #{i + 1} • {gap.importance} (Weight {gap.weight})
                      </span>
                      <h4 className="font-bold text-base text-white">{gap.name}</h4>
                    </div>
                    <span className="text-xs font-bold text-amber-400">Gap: -{gap.gap}%</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Current: {gap.currentProficiency} ({gap.currentScore}%)</span>
                      <span>Target: {gap.targetBenchmark}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-indigo-500 h-full" style={{ width: `${gap.currentScore}%` }} />
                      <div className="bg-amber-500/40 h-full" style={{ width: `${gap.gap}%` }} />
                    </div>
                  </div>

                  {gap.rationale && (
                    <p className="text-xs text-zinc-400 leading-relaxed">{gap.rationale}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-zinc-400">
                {factors.skillMatch?.isComplete
                  ? "All required skills meet or exceed target benchmarks! Focus on portfolio project evidence."
                  : "Generate target role requirements to populate your skill gap report."}
              </p>
            </div>
          )}
        </div>

        {/* ── 4. PERSONALIZED LEARNING ROADMAP ── */}
        <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-xl font-bold font-display text-white">Personalized Learning Roadmap</h2>
              <p className="text-xs text-zinc-400">
                Generated from your exact skill gaps. Sync milestones directly to your Quests/Tasks.
              </p>
            </div>

            <button
              onClick={handleGenerateRoadmap}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all flex items-center gap-1.5"
            >
              <span>⚡</span> Regenerate Roadmap
            </button>
          </div>

          {roadmap.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl space-y-3">
              <p className="text-sm text-zinc-400">No active roadmap. Click below to generate your tailored milestones.</p>
              <button
                onClick={handleGenerateRoadmap}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white"
              >
                Generate Milestone Roadmap
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {roadmap.map((milestone, idx) => (
                <div
                  key={milestone.id || idx}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center text-sm">
                        {milestone.stage || idx + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-base text-white">{milestone.title}</h3>
                        <span className="text-xs text-zinc-500">Effort: {milestone.estimatedEffort || "2-3 weeks"}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSyncRoadmapToTasks(milestone)}
                      disabled={syncingTaskId === milestone.id}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      {syncingTaskId === milestone.id ? (
                        "Syncing..."
                      ) : (
                        <>
                          <span>+</span> Add to Tasks & Quests
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">{milestone.description}</p>

                  {/* Practical Exercises & Deliverables */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5 text-xs">
                    <div>
                      <span className="font-bold uppercase tracking-wider text-zinc-500 text-[10px] block mb-1">
                        Practical Exercises:
                      </span>
                      <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                        {(milestone.practicalExercises || []).map((ex, i) => (
                          <li key={i}>{ex}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-bold uppercase tracking-wider text-zinc-500 text-[10px] block mb-1">
                        Deliverable & Portfolio Project:
                      </span>
                      <p className="text-zinc-300 font-medium">{milestone.portfolioProject || "Production case study"}</p>
                      <span className="text-[10px] text-emerald-400 block mt-1">
                        Criteria: {milestone.measurableCriteria || "Deployed with tests"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// ── SUBCOMPONENT: FACTOR CARD ──
function FactorCard({
  title,
  weight,
  score,
  isComplete,
  sourceType,
  confidence,
  badge,
  badgeColor = "indigo",
  color = "indigo",
  explanation,
  metrics = [],
  recommendation,
  extraAlert,
}) {
  const colorMap = {
    indigo: { text: "text-indigo-400", bg: "bg-indigo-500/15", border: "border-indigo-500/30" },
    cyan: { text: "text-cyan-400", bg: "bg-cyan-500/15", border: "border-cyan-500/30" },
    blue: { text: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" },
    purple: { text: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/30" },
    rose: { text: "text-rose-400", bg: "bg-rose-500/15", border: "border-rose-500/30" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
    amber: { text: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  };

  const c = colorMap[color] || colorMap.indigo;
  const b = colorMap[badgeColor] || colorMap.indigo;

  const renderSourceBadge = () => {
    switch (sourceType) {
      case "verified_provider":
        return (
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            ✓ Verified Feed
          </span>
        );
      case "ai_estimated":
        return (
          <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            ⚡ AI Estimate (Unverified)
          </span>
        );
      case "user_reported":
        return (
          <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
            👤 User Reported
          </span>
        );
      case "deterministic_heuristic":
        return (
          <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-500/10 border border-zinc-500/20 px-2 py-0.5 rounded">
            ⚙️ Heuristic Fallback
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-800 border border-zinc-700/50 px-2 py-0.5 rounded">
            ⏳ Awaiting Input
          </span>
        );
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
              Weight {weight}
            </span>
            <h3 className="font-bold text-lg font-display text-white">{title}</h3>
          </div>

          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${b.bg} ${b.text} ${b.border} border`}>
            {badge}
          </span>
        </div>

        {/* Evidence Source & Confidence Sub-bar */}
        <div className="flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded-lg bg-black/40 border border-white/5 mt-3 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[10px] font-medium">Evidence:</span>
            {renderSourceBadge()}
          </div>
          {confidence !== undefined && confidence !== null && (
            <span className="text-[10px] text-zinc-400 font-medium">
              Conf: <strong className="text-zinc-200">{confidence}%</strong>
            </span>
          )}
        </div>

        {/* Score Display */}
        <div className="my-3 flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold font-display ${isComplete ? "text-white" : "text-zinc-500"}`}>
            {isComplete && score !== null && score !== undefined ? score : "—"}
          </span>
          <span className="text-xs text-zinc-500">/ 100</span>
        </div>

        {/* Score Progress Bar */}
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-700 ${c.bg.replace("/15", "")}`}
            style={{ width: `${isComplete && score !== null ? Math.min(100, score) : 0}%`, background: "currentColor" }}
          />
        </div>

        {extraAlert && (
          <div className="text-[10px] text-rose-300 font-semibold bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg mb-3">
            {extraAlert}
          </div>
        )}

        {/* Explanation */}
        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
          {explanation || "Data required to evaluate this dimension."}
        </p>

        {/* Subfactor Metrics */}
        <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-white/5 text-center">
          {metrics.map((m, idx) => (
            <div key={idx} className="p-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block truncate">{m.label}</span>
              <span className="text-xs font-bold text-zinc-200 block truncate">{m.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Next Action */}
      {recommendation && (
        <div className="pt-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Next Action:</span>
          <p className="text-xs text-indigo-300 font-medium line-clamp-2 leading-snug">
            {recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
