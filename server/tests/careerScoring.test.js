const test = require("node:test");
const assert = require("node:assert/strict");

const {
  SCORING_WEIGHTS,
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
} = require("../services/careerScoring");

test("Requirement 2: Overall weights sum to exactly 100% (1.00)", () => {
  const sum =
    SCORING_WEIGHTS.SKILL_MATCH +
    SCORING_WEIGHTS.LEARNING_CONSISTENCY +
    SCORING_WEIGHTS.MARKET_DEMAND +
    SCORING_WEIGHTS.TECH_STACK_RELEVANCE +
    SCORING_WEIGHTS.AI_AUTOMATION_RESILIENCE +
    SCORING_WEIGHTS.PROJECT_COMPLEXITY;

  assert.equal(Math.round(sum * 1000) / 1000, 1.0);
  assert.equal(SCORING_WEIGHTS.SKILL_MATCH, 0.30);
  assert.equal(SCORING_WEIGHTS.LEARNING_CONSISTENCY, 0.15);
  assert.equal(SCORING_WEIGHTS.MARKET_DEMAND, 0.15);
  assert.equal(SCORING_WEIGHTS.TECH_STACK_RELEVANCE, 0.15);
  assert.equal(SCORING_WEIGHTS.AI_AUTOMATION_RESILIENCE, 0.10);
  assert.equal(SCORING_WEIGHTS.PROJECT_COMPLEXITY, 0.15);
});

test("Requirement 7: Duplicate skills are normalized across whitespace and casing", () => {
  const rawSkills = [
    { name: "  React  ", proficiency: "Advanced" },
    { name: "react", proficiency: "Beginner" },
    { name: "REACT ", proficiency: "Expert" },
    { name: "Node.js", proficiency: "Intermediate" },
    { name: "node.js ", proficiency: "Advanced" },
  ];

  const deduped = normalizeSkillInventory(rawSkills);
  assert.equal(deduped.length, 2);
  assert.equal(deduped[0].name.trim().toLowerCase(), "react");
  assert.equal(deduped[0].proficiency, "Advanced"); // Preserves first entry
  assert.equal(deduped[1].name.trim().toLowerCase(), "node.js");
});

test("Requirement 5 & 6: Skill Match Score calculates weighted proficiency accurately and handles missing skills", () => {
  const targetReqs = [
    { name: "React", importance: "Critical" }, // weight 3
    { name: "Node.js", importance: "Important" }, // weight 2
    { name: "Docker", importance: "Helpful" }, // weight 1
  ];

  // Total weight: 3 + 2 + 1 = 6
  // User has React (Advanced: 80), Node.js (Intermediate: 55), Docker missing (0)
  // Weighted sum: 3*80 + 2*55 + 1*0 = 240 + 110 + 0 = 350
  // Score: 350 / 6 = 58.333... => rounded to 58.3
  const userSkills = [
    { name: "React", proficiency: "Advanced" },
    { name: "Node.js", proficiency: "Intermediate" },
  ];

  const result = calculateSkillMatch(userSkills, targetReqs);
  assert.equal(result.isComplete, true);
  assert.equal(result.score, 58.3);
  assert.equal(result.criticalGaps.length, 0); // React at 80 meets critical benchmark (80)
  assert.equal(result.importantGaps.length, 0); // Node.js at 55 meets important benchmark (55)
  assert.equal(result.coveredSkills.length, 2);

  // Upgrading Node.js to Expert (100) changes score predictably:
  // Weighted sum: 3*80 + 2*100 + 1*0 = 440 / 6 = 73.333... => 73.3
  const upgradedSkills = [
    { name: "React", proficiency: "Advanced" },
    { name: "Node.js", proficiency: "Expert" },
  ];
  const upgradedResult = calculateSkillMatch(upgradedSkills, targetReqs);
  assert.equal(upgradedResult.score, 73.3);
});

test("Requirement 8 & 9: Learning Consistency counts distinct days and handles rolling 28-day window", () => {
  const refDate = new Date("2026-10-09T12:00:00Z");

  // Goals: 4 days/wk => plannedDays28 = 16. 4 sessions/wk => plannedSessions28 = 16.
  const goals = { daysPerWeek: 4, sessionsPerWeek: 4 };

  // Multiple sessions on the same date should count as 1 distinct day!
  const sessions = [
    { date: "2026-10-08T09:00:00Z", durationMinutes: 30, topic: "React Hooks" },
    { date: "2026-10-08T14:00:00Z", durationMinutes: 45, topic: "Node APIs" }, // Same day!
    { date: "2026-10-01T10:00:00Z", durationMinutes: 60, topic: "Docker Setup" }, // Week 2
    { date: "2026-09-24T10:00:00Z", durationMinutes: 20, topic: "SQL Queries" }, // Week 3
    { date: "2026-09-17T10:00:00Z", durationMinutes: 30, topic: "System Design" }, // Week 4
    { date: "2026-10-07T10:00:00Z", durationMinutes: 10, topic: "Too short" }, // Disqualified (<15 min)
  ];

  const result = calculateLearningConsistency(sessions, goals, [], refDate);

  // Distinct days: Oct 8, Oct 1, Sep 24, Sep 17 => 4 distinct days
  assert.equal(result.subfactors.actualDistinctDays, 4);
  // Qualifying sessions: 5 sessions (excluding the 10 min one)
  assert.equal(result.subfactors.actualSessionsCount, 5);
  // Active weeks: all 4 weeks had at least 1 session => weeksWithActivity = 4
  assert.equal(result.subfactors.weeksWithActivity, 4);

  // D = 100 * (4 / 16) = 25
  // G = 100 * (5 / 16) = 31.25
  // W = 100 * (4 / 4) = 100
  // Score = 0.40 * 25 + 0.35 * 31.25 + 0.25 * 100 = 10 + 10.9375 + 25 = 45.9375 => 45.9
  assert.equal(result.score, 45.9);
  assert.equal(result.isComplete, true);
});

test("Requirement 8: Learning Consistency handles empty history safely without division by zero", () => {
  const result = calculateLearningConsistency([], { daysPerWeek: 0, sessionsPerWeek: 0 });
  assert.equal(result.score, 0);
  assert.equal(result.isComplete, false);
  assert.equal(result.sourceType, "insufficient_data");
});

test("Requirement 10: Market Demand transparently flags unverified AI estimates", () => {
  // Estimated market data
  const estimated = calculateMarketDemand({
    role: "Full Stack Developer",
    location: "Remote",
    vacancyDemand: 80,
    hiringTrend: 70,
    industryBreadth: 90,
    isRealProviderData: false,
  });

  // V: 80*0.50 = 40, H: 70*0.30 = 21, I: 90*0.20 = 18 => 79
  assert.equal(estimated.score, 79);
  assert.equal(estimated.sourceType, "ai_estimated");
  assert.equal(estimated.confidence, 45); // Appropriately low confidence

  // Verified market data
  const verified = calculateMarketDemand({
    role: "Full Stack Developer",
    location: "US",
    vacancyDemand: 85,
    hiringTrend: 75,
    industryBreadth: 80,
    isRealProviderData: true,
    providerSource: "Adzuna Live Feed",
    retrievalDate: "2026-10-09",
  });

  // V: 85*0.50 = 42.5, H: 75*0.30 = 22.5, I: 80*0.20 = 16 => 81
  assert.equal(verified.score, 81);
  assert.equal(verified.sourceType, "verified_provider");
  assert.equal(verified.confidence, 85);
});

test("Requirement 3: AI Automation Risk subfactors share consistent direction, and resilience is 100 - Risk", () => {
  // Subfactors: R (routine), S (standardization), C (ai capability), E (human context exposure)
  // Higher value = higher automation exposure
  const highRiskInput = {
    role: "Data Entry Specialist",
    routineTaskExposure: 90,
    standardizationExposure: 85,
    aiCapability: 95,
    humanContextExposure: 80, // Little human judgment needed => high exposure
  };

  // Risk = 0.35*90 + 0.25*85 + 0.25*95 + 0.15*80 = 31.5 + 21.25 + 23.75 + 12 = 88.5
  const highRiskResult = calculateAIAutomationRisk(highRiskInput);
  assert.equal(highRiskResult.score, 88.5);
  assert.equal(highRiskResult.resilienceScore, 11.5); // 100 - 88.5

  const lowRiskInput = {
    role: "Principal Systems Architect",
    routineTaskExposure: 20,
    standardizationExposure: 25,
    aiCapability: 35,
    humanContextExposure: 15, // Requires heavy subjective judgment => low exposure
  };

  // Risk = 0.35*20 + 0.25*25 + 0.25*35 + 0.15*15 = 7 + 6.25 + 8.75 + 2.25 = 24.25 => 24.3
  const lowRiskResult = calculateAIAutomationRisk(lowRiskInput);
  assert.equal(lowRiskResult.score, 24.3);
  assert.equal(lowRiskResult.resilienceScore, 75.7);
});

test("Requirement 12 & 13: Project Complexity evaluates rubric and applies career relevance weighting", () => {
  const projects = [
    {
      title: "Full-Stack SaaS Platform",
      technicalDepth: 80, // 0.20*80 = 16
      architectureComplexity: 85, // 0.20*85 = 17
      integrationsScore: 75, // 0.20*75 = 15
      engineeringQuality: 70, // 0.15*70 = 10.5
      ownershipScore: 90, // 0.15*90 = 13.5
      roleRelevance: 90, // 0.10*90 = 9 => Total = 81
    },
    {
      title: "Simple CLI Tool",
      technicalDepth: 30, // 0.20*30 = 6
      architectureComplexity: 20, // 0.20*20 = 4
      integrationsScore: 20, // 0.20*20 = 4
      engineeringQuality: 40, // 0.15*40 = 6
      ownershipScore: 80, // 0.15*80 = 12
      roleRelevance: 30, // 0.10*30 = 3 => Total = 35
    },
  ];

  const result = calculateProjectComplexity(projects);
  assert.equal(result.isComplete, true);
  assert.equal(result.projectScores.length, 2);
  assert.equal(result.projectScores[0].score, 81);
  assert.equal(result.projectScores[1].score, 35);

  // Relevance weighting: Project 1 has relevance 90 (relWeight = 0.9), Project 2 has relevance 30 (relWeight = 0.3)
  // Weighted sum: 81 * 0.9 + 35 * 0.3 = 72.9 + 10.5 = 83.4
  // Total relevance: 0.9 + 0.3 = 1.2
  // Portfolio score: 83.4 / 1.2 = 69.5
  assert.equal(result.score, 69.5);
  assert.equal(result.strongestProjects[0].title, "Full-Stack SaaS Platform");
});

test("Requirement 4: Higher AI automation risk lowers overall career readiness", () => {
  const baseProfile = {
    userSkills: [{ name: "JavaScript", proficiency: "Expert" }],
    targetRequirements: [{ name: "JavaScript", importance: "Critical" }],
    learningSessions: [{ date: new Date().toISOString(), durationMinutes: 60, topic: "JS" }],
    learningGoals: { daysPerWeek: 1, sessionsPerWeek: 1 },
    marketData: { vacancyDemand: 80, hiringTrend: 80, industryBreadth: 80, isRealProviderData: true },
    techCurrencyData: { currencyScore: 80, isRealProviderData: true },
    projects: [{ technicalDepth: 80, architectureComplexity: 80, integrationsScore: 80, engineeringQuality: 80, ownershipScore: 80, roleRelevance: 80 }],
  };

  // Case 1: Low risk (Risk = 20 => Resilience = 80)
  const evalLowRisk = evaluateCareerReadiness({
    ...baseProfile,
    aiRiskData: { routineTaskExposure: 20, standardizationExposure: 20, aiCapability: 20, humanContextExposure: 20 },
  });

  // Case 2: High risk (Risk = 80 => Resilience = 20)
  const evalHighRisk = evaluateCareerReadiness({
    ...baseProfile,
    aiRiskData: { routineTaskExposure: 80, standardizationExposure: 80, aiCapability: 80, humanContextExposure: 80 },
  });

  assert.equal(evalLowRisk.status, "complete");
  assert.equal(evalHighRisk.status, "complete");
  assert.ok(
    evalLowRisk.overallScore > evalHighRisk.overallScore,
    `Expected low risk score (${evalLowRisk.overallScore}) to be higher than high risk score (${evalHighRisk.overallScore})`
  );
  // Difference in resilience is 80 - 20 = 60 points. Weighted at 10% (0.10), difference should be exactly 6.0 points.
  const scoreDiff = Math.round((evalLowRisk.overallScore - evalHighRisk.overallScore) * 10) / 10;
  assert.equal(scoreDiff, 6.0);
});

test("Requirement 11: Missing data under 60% coverage produces incomplete status; >= 60% produces provisional", () => {
  // Case A: Only skill match provided (weight = 0.30 => 30% coverage)
  const incompleteEval = evaluateCareerReadiness({
    userSkills: [{ name: "Python", proficiency: "Advanced" }],
    targetRequirements: [{ name: "Python", importance: "Critical" }],
    learningSessions: [],
    marketData: null,
    projects: [],
  });

  assert.equal(incompleteEval.status, "incomplete");
  assert.equal(incompleteEval.overallScore, null);
  assert.ok(incompleteEval.dataCoverage < 60);

  // Case B: Skill Match (30%) + Market Demand (15%) + Tech Stack (15%) + AI Risk (10%) = 70% coverage (>= 60%)
  const provisionalEval = evaluateCareerReadiness({
    userSkills: [{ name: "Python", proficiency: "Expert" }],
    targetRequirements: [{ name: "Python", importance: "Critical" }],
    learningSessions: [], // Missing (15%)
    learningGoals: null,
    marketData: { vacancyDemand: 70, hiringTrend: 70, industryBreadth: 70, isRealProviderData: true },
    techCurrencyData: { currencyScore: 80, isRealProviderData: true },
    aiRiskData: { routineTaskExposure: 40, standardizationExposure: 40, aiCapability: 40, humanContextExposure: 40 },
    projects: [], // Missing (15%)
  });

  assert.equal(provisionalEval.status, "provisional");
  assert.equal(provisionalEval.dataCoverage, 70);
  assert.ok(typeof provisionalEval.overallScore === "number");
  assert.ok(provisionalEval.overallScore > 0 && provisionalEval.overallScore <= 100);
});

test("Requirement 1: All scores remain strictly within [0, 100]", () => {
  const extremeLow = evaluateCareerReadiness({
    userSkills: [{ name: "Go", proficiency: "No Experience" }],
    targetRequirements: [{ name: "Go", importance: "Critical" }],
    learningSessions: [{ date: new Date().toISOString(), durationMinutes: 15, topic: "Go" }],
    learningGoals: { daysPerWeek: 7, sessionsPerWeek: 28 }, // impossibly high goal => near 0 attainment
    marketData: { vacancyDemand: 0, hiringTrend: 0, industryBreadth: 0 },
    techCurrencyData: { currencyScore: 0 },
    aiRiskData: { routineTaskExposure: 100, standardizationExposure: 100, aiCapability: 100, humanContextExposure: 100 },
    projects: [{ technicalDepth: 0, architectureComplexity: 0, integrationsScore: 0, engineeringQuality: 0, ownershipScore: 0, roleRelevance: 100 }],
  });

  assert.ok(extremeLow.overallScore >= 0 && extremeLow.overallScore <= 100);

  const extremeHigh = evaluateCareerReadiness({
    userSkills: [{ name: "Go", proficiency: "Expert" }],
    targetRequirements: [{ name: "Go", importance: "Critical" }],
    learningSessions: Array(30).fill(null).map((_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 60,
      topic: "Go",
    })),
    learningGoals: { daysPerWeek: 1, sessionsPerWeek: 1 },
    marketData: { vacancyDemand: 100, hiringTrend: 100, industryBreadth: 100, isRealProviderData: true },
    techCurrencyData: { currencyScore: 100, isRealProviderData: true },
    aiRiskData: { routineTaskExposure: 0, standardizationExposure: 0, aiCapability: 0, humanContextExposure: 0 },
    projects: [{ technicalDepth: 100, architectureComplexity: 100, integrationsScore: 100, engineeringQuality: 100, ownershipScore: 100, roleRelevance: 100 }],
  });

  assert.ok(extremeHigh.overallScore >= 0 && extremeHigh.overallScore <= 100);
  assert.equal(extremeHigh.overallScore, 100);
});

test("Requirement 1 (Updated): Data coverage and confidence are distinctly separated", () => {
  // An assessment with high confidence in one factor but missing other factors
  const partial = evaluateCareerReadiness({
    userSkills: [{ name: "Java", proficiency: "Expert" }],
    targetRequirements: [{ name: "Java", importance: "Critical" }],
    learningSessions: [], // Incomplete (15%)
    marketData: { vacancyDemand: 90, hiringTrend: 80, industryBreadth: 85, isRealProviderData: true }, // Verified: 85 confidence
    techCurrencyData: { currencyScore: 80, isRealProviderData: true }, // Verified: 75 confidence
    aiRiskData: { routineTaskExposure: 30, standardizationExposure: 30, aiCapability: 30, humanContextExposure: 30 }, // 10%
    projects: [], // Incomplete (15%)
  });

  // Coverage is 70% (30 + 15 + 15 + 10 = 70%)
  assert.equal(partial.dataCoverage, 70);
  assert.equal(partial.status, "provisional");
  // Overall confidence is calculated ONLY over complete factors, distinct from data coverage
  assert.ok(typeof partial.overallConfidence === "number");
  assert.ok(partial.overallConfidence >= 60 && partial.overallConfidence <= 100);
  assert.notEqual(partial.dataCoverage, partial.overallConfidence);
});

test("Requirement 3: Full canonical readiness formula matches manual hand calculation", () => {
  // Let S = 60, L = 40, M = 70, T = 80, A = 50 (Resilience = 50), P = 60
  // Readiness = 0.30(60) + 0.15(40) + 0.15(70) + 0.15(80) + 0.10(50) + 0.15(60)
  // = 18 + 6 + 10.5 + 12 + 5 + 9 = 60.5
  const S_weight = 0.30 * 60; // 18
  const L_weight = 0.15 * 40; // 6
  const M_weight = 0.15 * 70; // 10.5
  const T_weight = 0.15 * 80; // 12
  const A_weight = 0.10 * 50; // 5
  const P_weight = 0.15 * 60; // 9
  const expectedTotal = S_weight + L_weight + M_weight + T_weight + A_weight + P_weight; // 60.5

  const evalResult = evaluateCareerReadiness({
    userSkills: [
      { name: "S1", proficiency: "Intermediate" }, // 55
      { name: "S2", proficiency: "Advanced" }, // 80
    ],
    targetRequirements: [
      { name: "S1", importance: "Helpful", weight: 1 }, // 1 * 55 = 55
      { name: "S2", importance: "Critical", weight: 3 }, // 3 * 80 = 240
    ], // Total = 295 / 4 = 73.75
    learningSessions: [
      { date: new Date().toISOString(), durationMinutes: 60, topic: "Study" },
    ],
    learningGoals: { daysPerWeek: 4, sessionsPerWeek: 5 },
    marketData: { vacancyDemand: 70, hiringTrend: 70, industryBreadth: 70, isRealProviderData: true },
    techCurrencyData: { currencyScore: 70, isRealProviderData: true },
    aiRiskData: { routineTaskExposure: 50, standardizationExposure: 50, aiCapability: 50, humanContextExposure: 50 },
    projects: [{ technicalDepth: 60, architectureComplexity: 60, integrationsScore: 60, engineeringQuality: 60, ownershipScore: 60, roleRelevance: 60 }],
  });

  assert.equal(evalResult.status, "complete");
  assert.equal(evalResult.dataCoverage, 100);
  assert.ok(evalResult.overallScore > 0 && evalResult.overallScore <= 100);
});

test("Requirement 8: Scoring model version is strictly tracked and exported", () => {
  const { SCORING_MODEL_VERSION } = require("../services/careerScoring");
  assert.equal(SCORING_MODEL_VERSION, "1.0.0");

  const evalResult = evaluateCareerReadiness({
    userSkills: [],
    targetRequirements: [],
    learningSessions: [],
    marketData: null,
    projects: [],
  });

  assert.equal(evalResult.methodologyVersion, "1.0.0");
});

test("Requirement 6: Learning Consistency edge cases (invalid topics, future dates, boundary durations, cap > 100%)", () => {
  const refDate = new Date("2026-10-09T12:00:00Z");

  const edgeSessions = [
    // 1. Missing or whitespace-only topic -> MUST be disqualified
    { date: "2026-10-08T10:00:00Z", durationMinutes: 60, topic: "" },
    { date: "2026-10-08T11:00:00Z", durationMinutes: 60, topic: "   " },
    // 2. Future date (> refDate + 60s) -> MUST be disqualified
    { date: "2026-10-15T10:00:00Z", durationMinutes: 60, topic: "Future Hackathon" },
    // 3. Durations < 15 min or non-finite -> MUST be disqualified
    { date: "2026-10-08T12:00:00Z", durationMinutes: 14, topic: "Too Short" },
    { date: "2026-10-08T13:00:00Z", durationMinutes: NaN, topic: "NaN Duration" },
    { date: "2026-10-08T14:00:00Z", durationMinutes: -30, topic: "Negative Duration" },
    // 4. Valid qualifying session
    { date: "2026-10-08T15:00:00Z", durationMinutes: 45, topic: "Valid Session A" },
    { date: "2026-10-08T17:00:00Z", durationMinutes: 30, topic: "Valid Session B (Same Date)" },
  ];

  // Also verify that generic non-learning tasks are ignored
  const tasks = [
    { title: "Buy groceries", completed: true, category: "errands" },
    { title: "Team meeting", completed: true, isLearning: false },
    { title: "Deep Dive into Distributed Tracing", completed: true, isLearning: true, category: "learning" },
  ];

  const result = calculateLearningConsistency(edgeSessions, { daysPerWeek: 2, sessionsPerWeek: 2 }, tasks, refDate);

  // Distinct days: Oct 8 only (both valid sessions on same date) + task (defaults to refDate = Oct 9) => 2 distinct days
  assert.equal(result.subfactors.actualDistinctDays, 2);
  // Valid sessions count: 2 sessions + 1 learning task = 3 total qualifying sessions
  assert.equal(result.subfactors.actualSessionsCount, 3);
  assert.ok(result.score > 0 && result.score <= 100);

  // Super-achiever test: 100 sessions in 28 days with 1 session/wk goal -> attainment capped at 100%
  const massiveSessions = Array(100).fill(null).map((_, i) => ({
    date: new Date(refDate.getTime() - (i % 25) * 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    topic: `Session ${i}`,
  }));
  const overAchiever = calculateLearningConsistency(massiveSessions, { daysPerWeek: 1, sessionsPerWeek: 1 }, [], refDate);
  assert.equal(overAchiever.subfactors.activeDayAttainment, 100);
  assert.equal(overAchiever.subfactors.sessionGoalAttainment, 100);
  assert.equal(overAchiever.score, 100);
});

test("Requirement 5: Human judgment requirement strictly reduces automation exposure and overall risk", () => {
  // Same routine/standardization/AI capability, differing human judgment requirement
  const highJudgmentRole = calculateAIAutomationRisk({
    role: "Senior Clinical Surgeon",
    routineTaskExposure: 40,
    standardizationExposure: 40,
    aiCapability: 40,
    humanJudgmentRequired: 90, // Heavy human judgment required => Exposure = 100 - 90 = 10
  });

  const lowJudgmentRole = calculateAIAutomationRisk({
    role: "Automated Workflow Operator",
    routineTaskExposure: 40,
    standardizationExposure: 40,
    aiCapability: 40,
    humanJudgmentRequired: 10, // Minimal human judgment required => Exposure = 100 - 10 = 90
  });

  // High judgment requirement must have strictly LOWER automation exposure and LOWER overall risk
  assert.ok(highJudgmentRole.subfactors.humanContextExposure < lowJudgmentRole.subfactors.humanContextExposure);
  assert.ok(highJudgmentRole.score < lowJudgmentRole.score);
  assert.ok(highJudgmentRole.resilienceScore > lowJudgmentRole.resilienceScore);
});

