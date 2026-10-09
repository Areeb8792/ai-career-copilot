const test = require("node:test");
const assert = require("node:assert/strict");

const {
  evaluateCareerReadiness,
  calculateSkillMatch,
  calculateLearningConsistency,
  calculateMarketDemand,
  calculateTechStackRelevance,
  calculateAIAutomationRisk,
  calculateProjectComplexity,
  normalizeSkillInventory,
} = require("../services/careerScoring");

const { getMarketDemandData } = require("../services/marketData");

test("Integration 1: Authenticated Career Readiness evaluation with full profile", () => {
  const userProfile = {
    userSkills: [
      { name: "TypeScript", proficiency: "Expert" },
      { name: "React", proficiency: "Advanced" },
      { name: "Node.js", proficiency: "Intermediate" },
      { name: "PostgreSQL", proficiency: "Intermediate" },
      { name: "Docker", proficiency: "Beginner" },
    ],
    targetRequirements: [
      { name: "TypeScript", importance: "Critical", weight: 3 },
      { name: "React", importance: "Critical", weight: 3 },
      { name: "Node.js", importance: "Important", weight: 2 },
      { name: "PostgreSQL", importance: "Important", weight: 2 },
      { name: "Docker", importance: "Helpful", weight: 1 },
      { name: "Kubernetes", importance: "Helpful", weight: 1 }, // Missing
    ],
    learningSessions: [
      { date: new Date().toISOString(), durationMinutes: 45, topic: "TS Generics" },
      { date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), durationMinutes: 60, topic: "React Fiber" },
      { date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), durationMinutes: 30, topic: "SQL Indexes" },
      { date: new Date(Date.now() - 17 * 24 * 3600 * 1000).toISOString(), durationMinutes: 45, topic: "Docker Compose" },
      { date: new Date(Date.now() - 24 * 24 * 3600 * 1000).toISOString(), durationMinutes: 60, topic: "Node Event Loop" },
    ],
    learningGoals: { daysPerWeek: 3, sessionsPerWeek: 4 },
    completedTasks: [
      { id: 101, title: "Build custom hook", completed: true, isLearning: true, date: new Date().toISOString() },
    ],
    marketData: {
      role: "Full Stack Engineer",
      vacancyDemand: 82,
      hiringTrend: 76,
      industryBreadth: 88,
      isRealProviderData: true,
      providerSource: "Verified Provider Test",
    },
    techCurrencyData: { currencyScore: 85, isRealProviderData: true },
    aiRiskData: {
      role: "Full Stack Engineer",
      routineTaskExposure: 45,
      standardizationExposure: 40,
      aiCapability: 55,
      humanContextExposure: 35,
    },
    projects: [
      {
        title: "Enterprise Copilot Dashboard",
        technicalDepth: 85,
        architectureComplexity: 80,
        integrationsScore: 80,
        engineeringQuality: 75,
        ownershipScore: 90,
        roleRelevance: 95,
        hasRepoUrl: true,
        hasLiveUrl: true,
      },
      {
        title: "Real-time Chat Microservice",
        technicalDepth: 75,
        architectureComplexity: 70,
        integrationsScore: 70,
        engineeringQuality: 65,
        ownershipScore: 80,
        roleRelevance: 85,
        hasRepoUrl: true,
      },
    ],
  };

  const result = evaluateCareerReadiness(userProfile);

  assert.equal(result.status, "complete");
  assert.equal(result.dataCoverage, 100);
  assert.ok(typeof result.overallScore === "number");
  assert.ok(result.overallScore >= 0 && result.overallScore <= 100);

  // Check all 6 factors are populated
  assert.ok(result.factors.skillMatch.score > 0);
  assert.ok(result.factors.learningConsistency.score > 0);
  assert.ok(result.factors.marketDemand.score > 0);
  assert.ok(result.factors.techStackRelevance.score > 0);
  assert.ok(result.factors.aiAutomationRisk.score > 0);
  assert.ok(result.factors.aiAutomationRisk.resilienceScore > 0);
  assert.ok(result.factors.projectComplexity.score > 0);

  // Resilience = 100 - risk
  assert.equal(
    Math.round((result.factors.aiAutomationRisk.score + result.factors.aiAutomationRisk.resilienceScore) * 10) / 10,
    100
  );
});

test("Integration 2: Data isolation and user independence", () => {
  // Candidate A: Beginner targeting DevOps
  const candidateA = evaluateCareerReadiness({
    userSkills: [{ name: "Linux", proficiency: "Beginner" }],
    targetRequirements: [
      { name: "Linux", importance: "Critical", weight: 3 },
      { name: "Kubernetes", importance: "Critical", weight: 3 },
    ],
    learningSessions: [],
    marketData: { vacancyDemand: 70, hiringTrend: 70, industryBreadth: 70 },
    techCurrencyData: { currencyScore: 70 },
    aiRiskData: { routineTaskExposure: 30, standardizationExposure: 30, aiCapability: 30, humanContextExposure: 30 },
    projects: [],
  });

  // Candidate B: Expert targeting DevOps
  const candidateB = evaluateCareerReadiness({
    userSkills: [
      { name: "Linux", proficiency: "Expert" },
      { name: "Kubernetes", proficiency: "Expert" },
    ],
    targetRequirements: [
      { name: "Linux", importance: "Critical", weight: 3 },
      { name: "Kubernetes", importance: "Critical", weight: 3 },
    ],
    learningSessions: [],
    marketData: { vacancyDemand: 70, hiringTrend: 70, industryBreadth: 70 },
    techCurrencyData: { currencyScore: 70 },
    aiRiskData: { routineTaskExposure: 30, standardizationExposure: 30, aiCapability: 30, humanContextExposure: 30 },
    projects: [],
  });

  // Both should have provisional status (coverage = 70%)
  assert.equal(candidateA.status, "provisional");
  assert.equal(candidateB.status, "provisional");

  // Candidate B's score must be significantly higher due to expert skills
  assert.ok(candidateB.overallScore > candidateA.overallScore);
  assert.equal(candidateA.factors.skillMatch.score, 12.5); // (3*25 + 3*0)/6 = 12.5
  assert.equal(candidateB.factors.skillMatch.score, 100);  // (3*100 + 3*100)/6 = 100
});

test("Integration 3: Market Data Provider returns calibrated defaults when live API is unconfigured", async () => {
  const market = await getMarketDemandData("DevOps Engineer", "Remote");

  assert.equal(market.isRealProviderData, false);
  assert.equal(market.confidence, 45); // Unverified estimate
  assert.ok(market.providerSource.includes("No live market API configured"));
  assert.ok(market.vacancyDemand > 0 && market.vacancyDemand <= 100);
  assert.ok(market.hiringTrend > 0 && market.hiringTrend <= 100);
});

test("Integration 4: Skill Normalization handles messy inputs safely", () => {
  const messy = [
    null,
    undefined,
    "",
    "   ",
    { name: "   C++   ", proficiency: "Advanced" },
    { name: "c++", proficiency: "Beginner" },
    { name: "C++\t", proficiency: "Expert" },
    { name: "Python 3", proficiency: "Intermediate" },
    { name: "python 3", proficiency: "Beginner" },
  ];

  const clean = normalizeSkillInventory(messy);
  assert.equal(clean.length, 2);
  assert.equal(clean[0].name.trim(), "C++");
  assert.equal(clean[0].proficiency, "Advanced");
  assert.equal(clean[1].name.trim(), "Python 3");
});
