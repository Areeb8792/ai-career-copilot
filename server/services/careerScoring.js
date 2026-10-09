/**
 * Pravida AI Career Intelligence Engine - Centralized Scoring Module
 *
 * This module is the single source of truth for all career readiness and dimension calculations.
 * All formulas, weights, proficiencies, and missing-data logic are strictly maintained here.
 */

const SCORING_WEIGHTS = {
  SKILL_MATCH: 0.30,
  LEARNING_CONSISTENCY: 0.15,
  MARKET_DEMAND: 0.15,
  TECH_STACK_RELEVANCE: 0.15,
  AI_AUTOMATION_RESILIENCE: 0.10, // Applied to (100 - AI Automation Risk)
  PROJECT_COMPLEXITY: 0.15,
};

const PROFICIENCY_SCORES = {
  "no experience": 0,
  "beginner": 25,
  "intermediate": 55,
  "advanced": 80,
  "expert": 100,
};

const IMPORTANCE_WEIGHTS = {
  "critical": 3,
  "important": 2,
  "helpful": 1,
  "optional": 1,
};

const MIN_COVERAGE_FOR_PROVISIONAL = 0.60; // 60% of total model weight

/**
 * Scoring Model Versioning Policy:
 * - Current version: "1.0.0"
 * - Increment MAJOR (e.g. "2.0.0") when scoring formulas, dimension weights, or rubric definitions change.
 * - Increment MINOR (e.g. "1.1.0") when new subfactors or provider models are introduced without changing top-level weights.
 * - Increment PATCH (e.g. "1.0.1") for bug fixes or normalization adjustments.
 * This version must be saved with each assessment record to guarantee that historical delta comparisons
 * reflect genuine user performance improvement rather than altered scoring methodology.
 */
const SCORING_MODEL_VERSION = "1.0.0";

/**
 * Safely parses and clamps numeric values to [min, max] range, guarding against NaN and non-finite inputs
 */
function safeClamp(val, fallback = 0, min = 0, max = 100) {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

/**
 * Normalizes a skill or technology name for duplicate prevention and exact comparison
 */
function normalizeName(name) {
  if (!name) return "";
  return String(name).trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Deduplicates and normalizes an array of user skills
 */
function normalizeSkillInventory(skills) {
  if (!Array.isArray(skills)) return [];
  const map = new Map();

  for (const item of skills) {
    if (!item) continue;
    const name = typeof item === "string" ? item.trim() : String(item.name || "").trim();
    if (!name) continue;

    const key = normalizeName(name);
    if (!map.has(key)) {
      const proficiency = typeof item === "object" && item.proficiency
        ? item.proficiency
        : "Beginner";
      const yearsOfExperience = typeof item === "object" && typeof item.yearsOfExperience === "number"
        ? Math.max(0, item.yearsOfExperience)
        : undefined;
      const lastUsed = typeof item === "object" ? item.lastUsed : undefined;

      map.set(key, {
        name, // preserve display casing of first entry
        proficiency,
        yearsOfExperience,
        lastUsed,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Factor 1: Skill Match Score (Weight: 30%)
 */
function calculateSkillMatch(userSkills, targetRequirements) {
  const normUserSkills = normalizeSkillInventory(userSkills);
  const userMap = new Map();
  normUserSkills.forEach((s) => {
    const profKey = String(s.proficiency || "").trim().toLowerCase();
    const score = PROFICIENCY_SCORES[profKey] ?? 0;
    userMap.set(normalizeName(s.name), { ...s, score });
  });

  if (!Array.isArray(targetRequirements) || targetRequirements.length === 0) {
    return {
      score: null,
      weight: SCORING_WEIGHTS.SKILL_MATCH,
      isComplete: false,
      sourceType: "insufficient_data",
      confidence: 0,
      dataFreshness: new Date().toISOString(),
      subfactors: { totalRequirements: 0, coveredCount: 0 },
      explanation: "No target role skill requirements defined yet. Analyze your target role to generate required skills.",
      evidence: [],
      criticalGaps: [],
      importantGaps: [],
      coveredSkills: [],
      comparisonList: [],
      highestImpactNext: [],
      recommendations: ["Select a target role and generate skill requirements."],
    };
  }

  let totalWeightedProficiency = 0;
  let totalWeight = 0;
  const comparisonList = [];
  const criticalGaps = [];
  const importantGaps = [];
  const coveredSkills = [];
  const impactCandidates = [];

  for (const req of targetRequirements) {
    const reqName = String(req.name || "").trim();
    if (!reqName) continue;
    const key = normalizeName(reqName);
    const impKey = String(req.importance || "Important").trim().toLowerCase();
    const weight = IMPORTANCE_WEIGHTS[impKey] ?? 2;

    const userSkill = userMap.get(key);
    const userProfScore = userSkill ? userSkill.score : 0;
    const userProfLabel = userSkill ? userSkill.proficiency : "No Experience";

    totalWeightedProficiency += weight * userProfScore;
    totalWeight += weight;

    // Target benchmark: Critical requires >= Advanced (80), Important requires >= Intermediate (55), Helpful >= Beginner (25)
    const targetBenchmark = weight === 3 ? 80 : weight === 2 ? 55 : 25;
    const isCovered = userProfScore >= targetBenchmark;
    const gap = Math.max(0, targetBenchmark - userProfScore);

    const compItem = {
      name: reqName,
      importance: req.importance || "Important",
      weight,
      currentProficiency: userProfLabel,
      currentScore: userProfScore,
      targetBenchmark,
      isCovered,
      gap,
      rationale: req.rationale || "",
    };
    comparisonList.push(compItem);

    if (isCovered) {
      coveredSkills.push(compItem);
    } else {
      if (weight === 3) criticalGaps.push(compItem);
      else if (weight === 2) importantGaps.push(compItem);

      impactCandidates.push({
        ...compItem,
        impactScore: gap * weight,
      });
    }
  }

  if (totalWeight === 0) {
    return {
      score: 0,
      weight: SCORING_WEIGHTS.SKILL_MATCH,
      isComplete: false,
      sourceType: "insufficient_data",
      confidence: 10,
      dataFreshness: new Date().toISOString(),
      subfactors: { totalRequirements: 0, coveredCount: 0 },
      explanation: "No valid requirements found to evaluate.",
      evidence: [],
      criticalGaps: [],
      importantGaps: [],
      coveredSkills: [],
      comparisonList: [],
      highestImpactNext: [],
      recommendations: ["Review role skill requirements."],
    };
  }

  const rawScore = totalWeightedProficiency / totalWeight;
  const score = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

  impactCandidates.sort((a, b) => b.impactScore - a.impactScore);
  const highestImpactNext = impactCandidates.slice(0, 5);

  const recommendations = [];
  if (criticalGaps.length > 0) {
    recommendations.push(`Prioritize mastering critical gap: ${criticalGaps[0].name}.`);
  }
  if (importantGaps.length > 0) {
    recommendations.push(`Advance proficiency in ${importantGaps[0].name}.`);
  }
  if (recommendations.length === 0) {
    recommendations.push("Skill inventory exceeds target benchmarks! Focus on production portfolio evidence.");
  }

  return {
    score,
    weight: SCORING_WEIGHTS.SKILL_MATCH,
    isComplete: true,
    sourceType: "user_reported",
    confidence: normUserSkills.length > 0 ? 85 : 50,
    dataFreshness: new Date().toISOString(),
    subfactors: {
      totalRequirements: comparisonList.length,
      coveredCount: coveredSkills.length,
      criticalGapsCount: criticalGaps.length,
      importantGapsCount: importantGaps.length,
    },
    explanation: `Your skills match ${score}% of weighted requirements for this role (${coveredSkills.length}/${comparisonList.length} criteria met).`,
    evidence: [
      `${normUserSkills.length} declared skills evaluated against ${comparisonList.length} target role criteria.`,
      criticalGaps.length === 0
        ? "All critical skills satisfy target benchmarks."
        : `${criticalGaps.length} critical requirement(s) need development.`,
    ],
    criticalGaps,
    importantGaps,
    coveredSkills,
    comparisonList,
    highestImpactNext,
    recommendations,
  };
}

/**
 * Factor 2: Learning Consistency Score (Weight: 15%)
 *
 * Evaluates activity in a rolling 28-day window across 4 distinct 7-day buckets.
 */
function calculateLearningConsistency(sessions, learningGoals, completedTasks = [], referenceDate = new Date()) {
  const refTime = new Date(referenceDate).getTime();
  if (!Number.isFinite(refTime)) {
    return calculateLearningConsistency(sessions, learningGoals, completedTasks, new Date());
  }

  const DAY_MS = 24 * 60 * 60 * 1000;
  const WINDOW_MS = 28 * DAY_MS;
  const windowStart = refTime - WINDOW_MS;

  const rawDays = Number(learningGoals?.daysPerWeek);
  const rawSessions = Number(learningGoals?.sessionsPerWeek);
  const daysPerWeekGoal = Number.isFinite(rawDays) && rawDays > 0 ? Math.max(1, Math.min(7, rawDays)) : 4;
  const sessionsPerWeekGoal = Number.isFinite(rawSessions) && rawSessions > 0 ? Math.max(1, Math.min(28, rawSessions)) : 5;

  const plannedDays28 = daysPerWeekGoal * 4;
  const plannedSessions28 = sessionsPerWeekGoal * 4;

  const validSessions = [];

  // Parse sessions
  if (Array.isArray(sessions)) {
    for (const s of sessions) {
      if (!s || typeof s !== "object") continue;

      // Topic validation: must contain a non-empty topic
      const topic = String(s.topic || "").trim();
      if (!topic) continue;

      // Date validation: must be a valid date within [windowStart, refTime + 60000]
      const rawDate = s.date || s.createdAt;
      if (!rawDate) continue;
      const sDate = new Date(rawDate);
      const sTime = sDate.getTime();
      if (!Number.isFinite(sTime)) continue;
      if (sTime < windowStart || sTime > refTime + 60000) continue; // outside 28d window or future date

      // Duration validation: qualifying session must be >= 15 min and <= 1440 min (24h)
      const duration = Number(s.durationMinutes);
      if (!Number.isFinite(duration) || duration < 15 || duration > 1440) continue;

      // Consistent dateKey extraction (preserves local YYYY-MM-DD if provided)
      let dateKey;
      if (typeof s.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.date.trim())) {
        dateKey = s.date.trim();
      } else {
        dateKey = sDate.toISOString().slice(0, 10);
      }

      validSessions.push({
        id: s.id || String(sTime),
        dateKey,
        time: sTime,
        duration,
        topic,
        type: "session",
      });
    }
  }

  // Parse qualifying tasks from Tasks page
  if (Array.isArray(completedTasks)) {
    for (const t of completedTasks) {
      if (!t || typeof t !== "object" || !t.completed) continue;

      // Only count tasks explicitly classified as learning / skill-building
      const isLearning = t.isLearning === true ||
        String(t.category || "").toLowerCase() === "learning" ||
        String(t.category || "").toLowerCase() === "skill-building" ||
        t.fromRoadmap === true;

      if (!isLearning) continue;

      const title = String(t.title || "").trim();
      if (!title) continue;

      const rawDate = t.completedAt || t.updatedAt || t.date;
      const tDate = rawDate ? new Date(rawDate) : new Date(refTime);
      const tTime = tDate.getTime();
      if (!Number.isFinite(tTime) || tTime < windowStart || tTime > refTime + 60000) continue;

      let dateKey;
      if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
        dateKey = rawDate.trim();
      } else {
        dateKey = tDate.toISOString().slice(0, 10);
      }

      validSessions.push({
        id: t.id || String(tTime),
        dateKey,
        time: tTime,
        duration: 30, // standard default focus block for learning tasks
        topic: title,
        type: "task",
      });
    }
  }

  const distinctDates = new Set(validSessions.map((s) => s.dateKey));
  const actualDistinctDays = distinctDates.size;
  const actualSessionsCount = validSessions.length;

  // Active-day attainment D (capped at 100, safe against zero division)
  const D = plannedDays28 > 0 ? 100 * Math.min(actualDistinctDays / plannedDays28, 1) : 0;

  // Session-goal attainment G (capped at 100, safe against zero division)
  const G = plannedSessions28 > 0 ? 100 * Math.min(actualSessionsCount / plannedSessions28, 1) : 0;

  // Weekly regularity W: split 28 days into 4 rolling 7-day buckets
  let weeksWithActivity = 0;
  for (let w = 0; w < 4; w++) {
    const bucketEnd = refTime - (w * 7 * DAY_MS) + 60000;
    const bucketStart = bucketEnd - (7 * DAY_MS);
    const hasActivity = validSessions.some((s) => s.time >= bucketStart && s.time <= bucketEnd);
    if (hasActivity) weeksWithActivity++;
  }
  const W = 100 * (weeksWithActivity / 4);

  // Formula: 0.40D + 0.35G + 0.25W
  const rawScore = (0.40 * D) + (0.35 * G) + (0.25 * W);
  const score = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

  // Count 7-day activity
  const sevenDayCutoff = refTime - (7 * DAY_MS);
  const sessions7d = validSessions.filter((s) => s.time >= sevenDayCutoff).length;
  const distinctDays7d = new Set(validSessions.filter((s) => s.time >= sevenDayCutoff).map((s) => s.dateKey)).size;

  const isComplete = actualSessionsCount > 0;

  return {
    score: isComplete ? score : 0,
    weight: SCORING_WEIGHTS.LEARNING_CONSISTENCY,
    isComplete,
    sourceType: isComplete ? "user_reported" : "insufficient_data",
    confidence: isComplete ? 90 : 20,
    dataFreshness: new Date().toISOString(),
    subfactors: {
      activeDayAttainment: Math.round(D),
      sessionGoalAttainment: Math.round(G),
      weeklyRegularity: Math.round(W),
      actualDistinctDays,
      plannedDays28,
      actualSessionsCount,
      plannedSessions28,
      weeksWithActivity,
      sessions7d,
      distinctDays7d,
    },
    explanation: isComplete
      ? `Active on ${actualDistinctDays}/${plannedDays28} planned days with ${weeksWithActivity}/4 active weeks over the last 28 days.`
      : "No qualifying learning sessions logged in the last 28 days. Log sessions to establish consistency.",
    evidence: [
      `${actualSessionsCount} qualifying sessions/tasks logged (>=15 min).`,
      `${sessions7d} sessions completed in the last 7 days across ${distinctDays7d} active day(s).`,
      `Weekly regularity: ${weeksWithActivity} of 4 weeks active.`,
    ],
    recommendations: actualDistinctDays < plannedDays28
      ? [`Target ${daysPerWeekGoal} learning days this week to increase consistency.`]
      : ["Great consistency! Keep maintaining at least one study session every week."],
  };
}

/**
 * Factor 3: Market Demand Score (Weight: 15%)
 *
 * Subweights: Vacancy Demand (V): 50%, Hiring Trend (H): 30%, Industry Breadth (I): 20%
 */
function calculateMarketDemand(marketData) {
  if (!marketData || typeof marketData !== "object") {
    return {
      score: null,
      weight: SCORING_WEIGHTS.MARKET_DEMAND,
      isComplete: false,
      sourceType: "insufficient_data",
      confidence: 0,
      dataFreshness: new Date().toISOString(),
      subfactors: { vacancyDemand: 0, hiringTrend: 0, industryBreadth: 0 },
      explanation: "Market demand data is not yet available for this role and region.",
      evidence: [],
      recommendations: ["Specify target role and target location to evaluate demand."],
    };
  }

  const V = Math.max(0, Math.min(100, Number(marketData.vacancyDemand ?? 50)));
  const H = Math.max(0, Math.min(100, Number(marketData.hiringTrend ?? 50)));
  const I = Math.max(0, Math.min(100, Number(marketData.industryBreadth ?? 50)));

  const rawScore = (0.50 * V) + (0.30 * H) + (0.20 * I);
  const score = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

  const isRealProvider = marketData.isRealProviderData === true;
  const sourceType = isRealProvider ? "verified_provider" : "ai_estimated";
  const confidence = isRealProvider ? 85 : 45;

  return {
    score,
    weight: SCORING_WEIGHTS.MARKET_DEMAND,
    isComplete: true,
    sourceType,
    confidence,
    dataFreshness: marketData.retrievalDate || new Date().toISOString(),
    providerSource: marketData.providerSource || (isRealProvider ? "Live Job Board API" : "AI Market Estimation Model"),
    subfactors: {
      vacancyDemand: Math.round(V),
      hiringTrend: Math.round(H),
      industryBreadth: Math.round(I),
    },
    explanation: isRealProvider
      ? `Verified market telemetry indicates ${score}/100 hiring demand for ${marketData.role || "this role"} in ${marketData.location || "your target region"}.`
      : `AI estimated market demand is ${score}/100. (Unverified by live job board feed; treat as directional estimate).`,
    evidence: [
      isRealProvider ? `Verified via ${marketData.providerSource}` : "AI heuristic estimation based on industry hiring trends.",
      `Vacancy Demand subscore: ${Math.round(V)}/100 (50% weight).`,
      `Hiring Trend subscore: ${Math.round(H)}/100 (30% weight).`,
      `Industry Breadth subscore: ${Math.round(I)}/100 (20% weight).`,
    ],
    recommendations: score < 50
      ? ["Consider targeting high-demand adjacent specializations or broader geographic locations."]
      : ["Market demand is favorable; align your portfolio with current tech stack requirements."],
  };
}

/**
 * Factor 4: Tech Stack Relevance Score (Weight: 15%)
 *
 * Subweights: Stack Alignment (R): 70%, Currency & Relevance (C): 30%
 */
function calculateTechStackRelevance(userSkills, targetRequirements, techCurrencyData = {}) {
  const normUserSkills = normalizeSkillInventory(userSkills);
  const userSkillSet = new Set(normUserSkills.map((s) => normalizeName(s.name)));

  if (!Array.isArray(targetRequirements) || targetRequirements.length === 0) {
    return {
      score: null,
      weight: SCORING_WEIGHTS.TECH_STACK_RELEVANCE,
      isComplete: false,
      sourceType: "insufficient_data",
      confidence: 0,
      dataFreshness: new Date().toISOString(),
      subfactors: { stackAlignment: 0, technologyCurrency: 0 },
      explanation: "Target role requirements needed to assess tech stack alignment.",
      evidence: [],
      alignedTech: [],
      missingTech: [],
      legacyTech: [],
      recommendations: ["Define target role to identify required technologies."],
    };
  }

  // Distinguish technical tools from soft skills
  const techRequirements = targetRequirements.filter((r) => {
    const name = normalizeName(r.name);
    // filter non-technical terms if categorized or common soft skills
    const softSkills = ["communication", "problem solving", "leadership", "teamwork", "agile", "time management"];
    return !softSkills.includes(name);
  });

  const evalList = techRequirements.length > 0 ? techRequirements : targetRequirements;

  let alignedCount = 0;
  const alignedTech = [];
  const missingTech = [];

  for (const req of evalList) {
    const key = normalizeName(req.name);
    if (userSkillSet.has(key)) {
      alignedCount++;
      alignedTech.push(req.name);
    } else {
      missingTech.push(req.name);
    }
  }

  const stackAlignmentRatio = evalList.length > 0 ? (alignedCount / evalList.length) : 0;
  const R = 100 * stackAlignmentRatio;

  // Currency score (default 75 if modern technologies, or provided via techCurrencyData)
  const C = Math.max(0, Math.min(100, Number(techCurrencyData.currencyScore ?? 75)));

  const rawScore = (0.70 * R) + (0.30 * C);
  const score = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

  return {
    score,
    weight: SCORING_WEIGHTS.TECH_STACK_RELEVANCE,
    isComplete: true,
    sourceType: techCurrencyData.isRealProviderData ? "verified_provider" : "ai_estimated",
    confidence: normUserSkills.length > 0 ? 75 : 40,
    dataFreshness: new Date().toISOString(),
    subfactors: {
      stackAlignment: Math.round(R),
      technologyCurrency: Math.round(C),
      alignedToolsCount: alignedTech.length,
      missingToolsCount: missingTech.length,
    },
    explanation: `Your technical stack matches ${Math.round(R)}% of required technologies with a currency index of ${Math.round(C)}/100.`,
    evidence: [
      `User stack covers ${alignedTech.length} of ${evalList.length} relevant technologies.`,
      `Currency & market demand index: ${Math.round(C)}/100.`,
    ],
    alignedTech,
    missingTech: missingTech.slice(0, 6),
    legacyTech: techCurrencyData.legacyTech || [],
    recommendations: missingTech.length > 0
      ? [`Incorporate ${missingTech[0]} into your stack and upcoming portfolio projects.`]
      : ["Stack is fully aligned with modern market requirements."],
  };
}

/**
 * Factor 5: AI Automation Risk Score (Weight: 10%, Resilience = 100 - A)
 *
 * All subfactors use the exact same direction: HIGHER = GREATER AUTOMATION EXPOSURE.
 * - Routine & repetitive task exposure (R): 35%
 * - Standardization of work & digital workflow exposure (S): 25%
 * - Current AI capability for the relevant tasks (C): 25%
 * - Human judgment / physical context automation exposure (E): 15%
 *   (High when little human judgment is needed; low when heavy human judgment is required)
 */
function calculateAIAutomationRisk(riskInput) {
  if (!riskInput || typeof riskInput !== "object") {
    // Return baseline if role unknown
    return {
      score: 50,
      resilienceScore: 50,
      weight: SCORING_WEIGHTS.AI_AUTOMATION_RESILIENCE,
      isComplete: false,
      sourceType: "insufficient_data",
      confidence: 30,
      dataFreshness: new Date().toISOString(),
      subfactors: { routineTaskExposure: 50, standardizationExposure: 50, aiCapability: 50, humanContextExposure: 50 },
      explanation: "Target role needed to compute automation exposure.",
      evidence: [],
      countermeasures: [],
      recommendations: ["Specify target role to calculate AI automation risk."],
    };
  }

  const R = safeClamp(riskInput.routineTaskExposure, 50);
  const S = safeClamp(riskInput.standardizationExposure, 50);
  const C = safeClamp(riskInput.aiCapability, 50);

  // If provided as humanJudgmentRequirement (where higher = more human judgment), invert to exposure:
  let E;
  if (Number.isFinite(Number(riskInput.humanContextExposure))) {
    E = safeClamp(riskInput.humanContextExposure, 45);
  } else if (Number.isFinite(Number(riskInput.humanJudgmentRequired))) {
    E = safeClamp(100 - Number(riskInput.humanJudgmentRequired), 45);
  } else {
    E = 45; // balanced baseline
  }

  // Formula: 0.35R + 0.25S + 0.25C + 0.15E
  const rawRisk = (0.35 * R) + (0.25 * S) + (0.25 * C) + (0.15 * E);
  const riskScore = Math.max(0, Math.min(100, Math.round(rawRisk * 10) / 10));
  const resilienceScore = Math.max(0, Math.min(100, Math.round((100 - riskScore) * 10) / 10));

  const roleName = riskInput.role || "this role";

  return {
    score: riskScore, // Higher means greater risk
    resilienceScore,  // 100 - riskScore (Used in readiness score)
    weight: SCORING_WEIGHTS.AI_AUTOMATION_RESILIENCE,
    isComplete: true,
    sourceType: riskInput.isAiGenerated ? "ai_estimated" : "deterministic_heuristic",
    confidence: riskInput.isAiGenerated ? 75 : 60,
    dataFreshness: new Date().toISOString(),
    subfactors: {
      routineTaskExposure: Math.round(R),
      standardizationExposure: Math.round(S),
      aiCapability: Math.round(C),
      humanContextExposure: Math.round(E),
    },
    explanation: `Estimated AI automation risk for ${roleName} is ${riskScore}% (${resilienceScore}% resilience). Routine and standard tasks carry exposure; complex system architecture and domain judgment provide durability.`,
    evidence: [
      `Routine task exposure: ${Math.round(R)}% (35% weight).`,
      `Standardized digital workflow exposure: ${Math.round(S)}% (25% weight).`,
      `Current AI capability: ${Math.round(C)}% (25% weight).`,
      `Human judgment & physical context exposure: ${Math.round(E)}% (15% weight).`,
    ],
    countermeasures: riskInput.countermeasures || [
      "Deepen distributed system architecture and complex troubleshooting skills.",
      "Develop domain expertise and product judgment that AI cannot replicate.",
      "Lead cross-functional engineering initiatives and technical communication.",
    ],
    recommendations: [
      riskScore > 50
        ? "Focus on high-level architecture, end-to-end deployment, and cross-team leadership to offset routine automation."
        : "Maintain continuous practice with AI developer tooling to multiply output.",
    ],
  };
}

/**
 * Factor 6: Project Complexity Score (Weight: 15%)
 *
 * Per-project rubric (0-100):
 * - Technical Depth (T): 20%
 * - Architecture & Problem Solving (A): 20%
 * - Integrations, APIs, Databases (I): 20%
 * - Testing, Security, CI/CD, Deployment Quality (Q): 15%
 * - End-to-end Ownership & Completeness (O): 15%
 * - Relevance to Target Career (R): 10%
 *
 * Portfolio aggregation is weighted by target-role relevance.
 */
function calculateProjectComplexity(projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return {
      score: null,
      weight: SCORING_WEIGHTS.PROJECT_COMPLEXITY,
      isComplete: false,
      sourceType: "insufficient_data",
      confidence: 0,
      dataFreshness: new Date().toISOString(),
      subfactors: { projectCount: 0 },
      explanation: "No projects in portfolio. Add detailed projects to demonstrate real-world engineering depth.",
      evidence: [],
      projectScores: [],
      strongestProjects: [],
      missingPractices: ["Testing", "CI/CD Deployment", "Database Architecture"],
      recommendations: ["Add at least one production-grade portfolio project with architecture details."],
    };
  }

  const scoredProjects = [];
  let totalWeightedScore = 0;
  let totalRelevanceWeight = 0;

  for (const proj of projects) {
    if (!proj) continue;
    const title = proj.title || "Untitled Project";

    // Rubric subfactors
    const T = Math.max(0, Math.min(100, Number(proj.technicalDepth ?? 50)));
    const A = Math.max(0, Math.min(100, Number(proj.architectureComplexity ?? 50)));
    const I = Math.max(0, Math.min(100, Number(proj.integrationsScore ?? 50)));
    const Q = Math.max(0, Math.min(100, Number(proj.engineeringQuality ?? 40)));
    const O = Math.max(0, Math.min(100, Number(proj.ownershipScore ?? 60)));
    const R = Math.max(0, Math.min(100, Number(proj.roleRelevance ?? 70)));

    const projRaw = (0.20 * T) + (0.20 * A) + (0.20 * I) + (0.15 * Q) + (0.15 * O) + (0.10 * R);
    const projScore = Math.max(0, Math.min(100, Math.round(projRaw * 10) / 10));

    // Relevance weight (minimum 0.2 so even non-target projects have minimal contribution, but target projects dominate)
    const relWeight = Math.max(0.2, R / 100);
    totalWeightedScore += projScore * relWeight;
    totalRelevanceWeight += relWeight;

    scoredProjects.push({
      id: proj.id || String(Date.now()),
      title,
      score: projScore,
      roleRelevance: R,
      rubric: {
        technicalDepth: Math.round(T),
        architectureComplexity: Math.round(A),
        integrationsScore: Math.round(I),
        engineeringQuality: Math.round(Q),
        ownershipScore: Math.round(O),
        roleRelevance: Math.round(R),
      },
      hasRepoUrl: Boolean(proj.repoUrl && String(proj.repoUrl).startsWith("http")),
      hasLiveUrl: Boolean(proj.liveUrl && String(proj.liveUrl).startsWith("http")),
      isSelfReported: true,
    });
  }

  if (scoredProjects.length === 0) {
    return {
      score: null,
      weight: SCORING_WEIGHTS.PROJECT_COMPLEXITY,
      isComplete: false,
      sourceType: "insufficient_data",
      confidence: 0,
      dataFreshness: new Date().toISOString(),
      subfactors: { projectCount: 0 },
      explanation: "No valid projects evaluated.",
      evidence: [],
      projectScores: [],
      strongestProjects: [],
      missingPractices: [],
      recommendations: ["Add at least one detailed project."],
    };
  }

  const portfolioRaw = totalWeightedScore / totalRelevanceWeight;
  const portfolioScore = Math.max(0, Math.min(100, Math.round(portfolioRaw * 10) / 10));

  scoredProjects.sort((a, b) => b.score - a.score);
  const strongestProjects = scoredProjects.slice(0, 3);

  // Missing engineering practices detection
  const avgQuality = scoredProjects.reduce((acc, p) => acc + p.rubric.engineeringQuality, 0) / scoredProjects.length;
  const missingPractices = [];
  if (avgQuality < 50) missingPractices.push("Automated unit/integration testing");
  if (!scoredProjects.some((p) => p.hasLiveUrl)) missingPractices.push("Public cloud production deployment");
  if (!scoredProjects.some((p) => p.hasRepoUrl)) missingPractices.push("Public repository documentation & commit history");
  if (missingPractices.length === 0) missingPractices.push("Observability & distributed tracing");

  return {
    score: portfolioScore,
    weight: SCORING_WEIGHTS.PROJECT_COMPLEXITY,
    isComplete: true,
    sourceType: "user_reported",
    confidence: 70, // Self-reported project evidence
    dataFreshness: new Date().toISOString(),
    subfactors: {
      projectCount: scoredProjects.length,
      averageQuality: Math.round(avgQuality),
      verifiedLinksCount: scoredProjects.filter((p) => p.hasRepoUrl || p.hasLiveUrl).length,
    },
    explanation: `Portfolio complexity evaluated across ${scoredProjects.length} project(s), weighted by career relevance.`,
    evidence: [
      `${scoredProjects.length} self-reported project(s) analyzed against 6-point engineering rubric.`,
      `Strongest project: "${strongestProjects[0]?.title}" (${strongestProjects[0]?.score}/100).`,
      scoredProjects.some((p) => p.hasLiveUrl) ? "Includes live deployed application." : "Self-reported project evidence (unverified deployment).",
    ],
    projectScores: scoredProjects,
    strongestProjects,
    missingPractices,
    recommendations: [
      `Enhance ${strongestProjects[0]?.title || "top project"} with automated CI/CD and integration test coverage.`,
    ],
  };
}

/**
 * Composite Evaluation: Calculates overall Career Readiness score
 *
 * Implements:
 * - Separation of data coverage vs confidence vs verification status
 * - Explicit missing data handling and provisional threshold (60%)
 * - Deterministic arithmetic
 */
function evaluateCareerReadiness({
  userSkills,
  targetRequirements,
  learningSessions,
  learningGoals,
  completedTasks,
  marketData,
  techCurrencyData,
  aiRiskData,
  projects,
}) {
  const skillMatch = calculateSkillMatch(userSkills, targetRequirements);
  const learningConsistency = calculateLearningConsistency(learningSessions, learningGoals, completedTasks);
  const marketDemand = calculateMarketDemand(marketData);
  const techStack = calculateTechStackRelevance(userSkills, targetRequirements, techCurrencyData);
  const aiRisk = calculateAIAutomationRisk(aiRiskData);
  const projectComplexity = calculateProjectComplexity(projects);

  const factorMap = {
    skillMatch,
    learningConsistency,
    marketDemand,
    techStackRelevance: techStack,
    aiAutomationResilience: {
      ...aiRisk,
      // The score used in readiness formula is resilience (100 - risk)
      score: aiRisk.isComplete ? aiRisk.resilienceScore : null,
    },
    projectComplexity,
  };

  const factorKeys = Object.keys(factorMap);
  let completeWeightSum = 0;
  let weightedScoreSum = 0;
  let weightedConfidenceSum = 0;
  const missingFactors = [];
  const completeFactors = [];

  for (const key of factorKeys) {
    const factor = factorMap[key];
    const weight = factor.weight;

    if (factor.isComplete && typeof factor.score === "number") {
      completeWeightSum += weight;
      weightedScoreSum += factor.score * weight;
      weightedConfidenceSum += (factor.confidence || 50) * weight;
      completeFactors.push(key);
    } else {
      missingFactors.push(key);
    }
  }

  // Model data coverage is the sum of completed factor weights (out of 1.00)
  const dataCoverage = Math.round(completeWeightSum * 100);

  // Overall confidence is the weighted confidence of complete factors
  const overallConfidence = completeWeightSum > 0
    ? Math.round(weightedConfidenceSum / completeWeightSum)
    : 0;

  // Verification status check
  const hasUnverified = factorKeys.some((k) => factorMap[k].sourceType === "ai_estimated" || factorMap[k].sourceType === "user_reported");
  const verificationStatus = hasUnverified ? "partially_estimated" : "verified";

  let status = "complete";
  let overallScore = null;

  if (completeWeightSum < MIN_COVERAGE_FOR_PROVISIONAL) {
    // Under 60% coverage: Incomplete onboarding state
    status = "incomplete";
    overallScore = null;
  } else if (completeWeightSum < 0.99) {
    // 60% to 99% coverage: Provisional score
    status = "provisional";
    const provisional = weightedScoreSum / completeWeightSum;
    overallScore = Math.max(0, Math.min(100, Math.round(provisional * 10) / 10));
  } else {
    // 100% coverage: Canonical Full formula
    status = "complete";
    // Full readiness = 0.30S + 0.15L + 0.15M + 0.15T + 0.10(100 - A) + 0.15P
    const canonical =
      (SCORING_WEIGHTS.SKILL_MATCH * skillMatch.score) +
      (SCORING_WEIGHTS.LEARNING_CONSISTENCY * learningConsistency.score) +
      (SCORING_WEIGHTS.MARKET_DEMAND * marketDemand.score) +
      (SCORING_WEIGHTS.TECH_STACK_RELEVANCE * techStack.score) +
      (SCORING_WEIGHTS.AI_AUTOMATION_RESILIENCE * aiRisk.resilienceScore) +
      (SCORING_WEIGHTS.PROJECT_COMPLEXITY * projectComplexity.score);

    overallScore = Math.max(0, Math.min(100, Math.round(canonical * 10) / 10));
  }

  return {
    overallScore, // Round only for display
    status, // 'complete' | 'provisional' | 'incomplete'
    dataCoverage, // 0 - 100 %
    overallConfidence, // 0 - 100 %
    verificationStatus,
    methodologyVersion: SCORING_MODEL_VERSION,
    assessedAt: new Date().toISOString(),
    factors: {
      skillMatch,
      learningConsistency,
      marketDemand,
      techStackRelevance: techStack,
      aiAutomationRisk: aiRisk, // Expose full risk object with both risk and resilience
      projectComplexity,
    },
    missingFactors,
    completeFactors,
    weights: SCORING_WEIGHTS,
  };
}

module.exports = {
  SCORING_WEIGHTS,
  SCORING_MODEL_VERSION,
  PROFICIENCY_SCORES,
  IMPORTANCE_WEIGHTS,
  MIN_COVERAGE_FOR_PROVISIONAL,
  normalizeName,
  normalizeSkillInventory,
  calculateSkillMatch,
  calculateLearningConsistency,
  calculateMarketDemand,
  calculateTechStackRelevance,
  calculateAIAutomationRisk,
  calculateProjectComplexity,
  evaluateCareerReadiness,
};
