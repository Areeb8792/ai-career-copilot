const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const {
  evaluateCareerReadiness,
  calculateSkillMatch,
  SCORING_MODEL_VERSION,
} = require("../services/careerScoring");

// Use an isolated database specifically designated for non-destructive audit testing
const TEST_MONGO_URI = "mongodb://127.0.0.1:27017/ai-career-audit-isolated-test";
const TEST_JWT_SECRET = process.env.JWT_SECRET || "secure_audit_test_jwt_secret_key_123456";

// Define a minimal Mongoose User schema matching server.js for isolated testing
const testUserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  profileImage: { type: String, default: "" },
  tasks: { type: Array, default: [] },
  progress: { type: Object, default: () => ({ totalXp: 0, totalCompleted: 0, dailyHistory: {} }) },
  careerProfile: {
    targetRole: { type: String, default: "" },
    targetLocation: { type: String, default: "" },
    targetCountry: { type: String, default: "" },
    experienceLevel: { type: String, default: "beginner" },
    yearsOfExperience: { type: Number, default: 0 },
    careerObjective: { type: String, default: "" },
    jobDescription: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  skills: { type: Array, default: [] },
  targetRequirements: { type: Array, default: [] },
  projects: { type: Array, default: [] },
  learningGoals: {
    daysPerWeek: { type: Number, default: 4 },
    sessionsPerWeek: { type: Number, default: 5 },
    weeklyHoursTarget: { type: Number, default: 10 },
  },
  learningSessions: { type: Array, default: [] },
  latestAssessment: { type: Object, default: null },
  assessmentHistory: { type: Array, default: [] },
  roadmap: { type: Array, default: [] },
});

let TestUser;

test("Live MongoDB Persistence & User Isolation Audit", async (t) => {
  // 1. Connect to isolated test database
  try {
    await mongoose.connect(TEST_MONGO_URI, { serverSelectionTimeoutMS: 3000 });
  } catch (err) {
    t.skip(`MongoDB daemon not available at ${TEST_MONGO_URI} (${err.message}). Skipping live DB test.`);
    return;
  }

  // Prevent compiling model multiple times
  TestUser = mongoose.models.AuditTestUser || mongoose.model("AuditTestUser", testUserSchema);

  // Clean test collection
  await TestUser.deleteMany({});

  await t.test("Subtest 1: Real user creation, password hashing, and JWT token issuance", async () => {
    const rawPasswordA = "superSecretPasswordA123";
    const hashedA = await bcrypt.hash(rawPasswordA, 10);
    const userA = await TestUser.create({
      email: "candidate_a@example.com",
      password: hashedA,
      careerProfile: {
        targetRole: "Full Stack Engineer",
        targetLocation: "Remote",
      },
    });

    const isMatch = await bcrypt.compare(rawPasswordA, userA.password);
    assert.equal(isMatch, true);

    const tokenA = jwt.sign({ id: userA._id }, TEST_JWT_SECRET, { expiresIn: "1h" });
    const decoded = jwt.verify(tokenA, TEST_JWT_SECRET);
    assert.equal(decoded.id.toString(), userA._id.toString());
  });

  await t.test("Subtest 2: Career profile, skills, projects, and learning sessions persist to MongoDB", async () => {
    const userA = await TestUser.findOne({ email: "candidate_a@example.com" });
    assert.ok(userA);

    // Save skills
    userA.skills = [
      { name: "React", proficiency: "Advanced", yearsOfExperience: 3 },
      { name: "Node.js", proficiency: "Expert", yearsOfExperience: 4 },
      { name: "PostgreSQL", proficiency: "Intermediate", yearsOfExperience: 2 },
    ];

    // Save projects with 6-point rubric
    userA.projects = [
      {
        id: "proj-1",
        title: "Enterprise AI Gateway",
        technicalDepth: 85,
        architectureComplexity: 90,
        integrationsScore: 80,
        engineeringQuality: 75,
        ownershipScore: 90,
        roleRelevance: 85,
        hasRepoUrl: true,
        hasLiveUrl: true,
      },
    ];

    // Save learning sessions
    userA.learningSessions = [
      {
        id: "session-1",
        date: new Date().toISOString(),
        durationMinutes: 45,
        topic: "Kubernetes Orchestration",
        note: "Studied pod lifecycle and ingress controllers",
      },
    ];

    await userA.save();

    // Re-query directly from database to verify persistence
    const reloaded = await TestUser.findById(userA._id);
    assert.equal(reloaded.skills.length, 3);
    assert.equal(reloaded.projects.length, 1);
    assert.equal(reloaded.projects[0].technicalDepth, 85);
    assert.equal(reloaded.learningSessions.length, 1);
    assert.equal(reloaded.learningSessions[0].durationMinutes, 45);
  });

  await t.test("Subtest 3: Career Assessment snapshot persistence and methodology versioning", async () => {
    const userA = await TestUser.findOne({ email: "candidate_a@example.com" });

    // Perform real assessment calculation
    const assessmentResult1 = evaluateCareerReadiness({
      userSkills: userA.skills,
      targetRequirements: [
        { name: "React", importance: "Critical", weight: 3 },
        { name: "Node.js", importance: "Important", weight: 2 },
      ],
      learningSessions: userA.learningSessions,
      learningGoals: { daysPerWeek: 4, sessionsPerWeek: 4 },
      marketData: { vacancyDemand: 80, hiringTrend: 75, industryBreadth: 85, isRealProviderData: true },
      techCurrencyData: { currencyScore: 80, isRealProviderData: true },
      aiRiskData: { routineTaskExposure: 35, standardizationExposure: 30, aiCapability: 40, humanContextExposure: 25 },
      projects: userA.projects,
    });

    assert.equal(assessmentResult1.status, "complete");
    assert.equal(assessmentResult1.methodologyVersion, SCORING_MODEL_VERSION);

    // Save assessment 1
    userA.latestAssessment = assessmentResult1;
    await userA.save();

    // Verify persisted assessment
    const reloaded1 = await TestUser.findById(userA._id);
    assert.ok(reloaded1.latestAssessment);
    assert.equal(reloaded1.latestAssessment.methodologyVersion, "1.0.0");
    assert.ok(reloaded1.latestAssessment.overallScore > 0);

    // Save assessment 2 to test assessmentHistory preservation
    const previousSnapshot = {
      overallScore: userA.latestAssessment.overallScore,
      status: userA.latestAssessment.status,
      assessedAt: userA.latestAssessment.assessedAt,
      methodologyVersion: userA.latestAssessment.methodologyVersion,
    };
    userA.assessmentHistory = [previousSnapshot];
    userA.latestAssessment = { ...assessmentResult1, overallScore: assessmentResult1.overallScore + 2 };
    await userA.save();

    const reloaded2 = await TestUser.findById(userA._id);
    assert.equal(reloaded2.assessmentHistory.length, 1);
    assert.equal(reloaded2.assessmentHistory[0].methodologyVersion, "1.0.0");
    assert.equal(reloaded2.assessmentHistory[0].overallScore, assessmentResult1.overallScore);
  });

  await t.test("Subtest 4: Strict data isolation between separate candidate accounts", async () => {
    // Create candidate B
    const hashedB = await bcrypt.hash("candidateBPassword123", 10);
    const userB = await TestUser.create({
      email: "candidate_b@example.com",
      password: hashedB,
      careerProfile: { targetRole: "DevOps Engineer" },
    });

    // Query candidate B
    const reloadedB = await TestUser.findById(userB._id);
    // User B MUST NOT have User A's data
    assert.equal(reloadedB.skills.length, 0);
    assert.equal(reloadedB.projects.length, 0);
    assert.equal(reloadedB.learningSessions.length, 0);
    assert.equal(reloadedB.latestAssessment, null);
    assert.equal(reloadedB.careerProfile.targetRole, "DevOps Engineer");

    // Candidate A remains intact
    const userA = await TestUser.findOne({ email: "candidate_a@example.com" });
    assert.equal(userA.careerProfile.targetRole, "Full Stack Engineer");
    assert.equal(userA.skills.length, 3);
  });

  // Cleanup isolated test database
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
