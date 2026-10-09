const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();
const AI_TIMEOUT_MS = 1500;
const MONGO_CONNECT_TIMEOUT_MS = 8000;
const INSECURE_JWT_SECRETS = ["secretkey", "default", "changeme", "jwt_secret", "secret", "placeholder"];
const rawJwtSecret = process.env.JWT_SECRET;
if (!rawJwtSecret || INSECURE_JWT_SECRETS.includes(rawJwtSecret.toLowerCase().trim()) || rawJwtSecret.trim().length < 16) {
  console.error("FATAL SECURITY ERROR: JWT_SECRET must be configured in environment with a secure, non-placeholder key of at least 16 characters.");
  console.error("Server startup aborted to protect authenticated user sessions.");
  process.exit(1);
}
const JWT_SECRET = rawJwtSecret.trim();

const {
  normalizeSkillInventory,
  evaluateCareerReadiness,
  calculateAIAutomationRisk,
} = require("./services/careerScoring");
const { getMarketDemandData } = require("./services/marketData");
const {
  analyzeRoleRequirements,
  evaluateProjectRubric,
  analyzeAIAutomationRisk,
  generateGapTargetedRoadmap,
  callGeminiRaw,
} = require("./services/geminiService");
const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
// Allow up to 5 MB JSON bodies so base64-encoded profile images fit
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

app.get("/", (req, res) => {
  res.send("AI Career Copilot Backend Running");
});

const safeEncodeCredential = (value) => {
  try {
    return encodeURIComponent(decodeURIComponent(value));
  } catch {
    return encodeURIComponent(value);
  }
};

const normalizeMongoUri = (rawUri) => {
  if (!rawUri) {
    return "";
  }

  const trimmed = rawUri.trim().replace(/^['"]|['"]$/g, "").replace(/\?{2,}/g, "?");
  const match = trimmed.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.+)$/);

  if (!match) {
    return trimmed;
  }

  const [, prefix, username, password, rest] = match;
  return `${prefix}${safeEncodeCredential(username)}:${safeEncodeCredential(password)}@${rest}`;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const isValidEmail = (value) => EMAIL_PATTERN.test(normalizeEmail(value));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let isDatabaseReady = false;
let mongoConnectPromise = null;
let mongoLastError = null;
const mongoUri = normalizeMongoUri(process.env.MONGO_URI);

mongoose.connection.on("connected", () => {
  isDatabaseReady = true;
  mongoLastError = null;
  console.log("MongoDB connected");
});

mongoose.connection.on("disconnected", () => {
  isDatabaseReady = false;
  mongoConnectPromise = null;
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  isDatabaseReady = false;
  mongoLastError = err;
  console.error("MongoDB connection error:");
  console.error(err.message);
});

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  profileImage: { type: String, default: "" },
  // --- Persisted progress ---
  tasks: {
    type: Array,
    default: [],
  },
  progress: {
    type: new mongoose.Schema({
      totalXp:       { type: Number, default: 0 },
      totalCompleted:{ type: Number, default: 0 },
      dailyHistory:  { type: Map, of: Number, default: {} },
    }, { _id: false }),
    default: () => ({ totalXp: 0, totalCompleted: 0, dailyHistory: {} }),
  },
  // --- Career Intelligence Engine Fields ---
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
  skills: {
    type: Array,
    default: [],
  },
  targetRequirements: {
    type: Array,
    default: [],
  },
  projects: {
    type: Array,
    default: [],
  },
  learningGoals: {
    daysPerWeek: { type: Number, default: 4 },
    sessionsPerWeek: { type: Number, default: 5 },
    weeklyHoursTarget: { type: Number, default: 10 },
  },
  learningSessions: {
    type: Array,
    default: [],
  },
  latestAssessment: {
    type: Object,
    default: null,
  },
  assessmentHistory: {
    type: Array,
    default: [],
  },
  roadmap: {
    type: Array,
    default: [],
  },
});

const User = mongoose.model("User", userSchema);

const toPublicUser = (user) => ({
  id: user._id,
  email: user.email,
  xp: user.progress?.totalXp ?? 0,
  questCount: Array.isArray(user.tasks) ? user.tasks.filter(t => t.completed).length : 0,
  profileImage: user.profileImage || "",
});

const connectToMongo = async () => {
  if (isDatabaseReady) {
    return true;
  }

  if (!mongoUri) {
    throw new Error("Missing MONGO_URI");
  }

  if (!mongoConnectPromise) {
    mongoConnectPromise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      })
      .then(() => true)
      .catch((err) => {
        mongoLastError = err;
        mongoConnectPromise = null;
        throw err;
      });
  }

  return mongoConnectPromise;
};

connectToMongo().catch((err) => {
  mongoLastError = err;
  console.error("MongoDB initial connection failed:");
  console.error(err.message);
});

const ensureDatabaseReady = async (res) => {
  if (isDatabaseReady) {
    return true;
  }

  try {
    await Promise.race([
      connectToMongo(),
      wait(MONGO_CONNECT_TIMEOUT_MS).then(() => {
        throw new Error("MongoDB connection timed out");
      }),
    ]);

    return true;
  } catch (err) {
    const reason = mongoLastError?.message || err.message;
    console.error("Database unavailable:");
    console.error(reason);
    res.status(503).json({ message: "Database unavailable. Check MongoDB connection settings." });
    return false;
  }
};

const authMiddleware = (req, res, next) => {
  let token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  if (typeof token === "string" && token.startsWith("Bearer ")) {
    token = token.slice(7).trim();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const estimateRoleRisk = (role) => {
  const calculated = calculateAIAutomationRisk({ role, isAiGenerated: false });
  return calculated.score;
};

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Gemini API key");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } finally {
    clearTimeout(timeoutId);
  }
}

app.post("/api/signup", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!(await ensureDatabaseReady(res))) {
    return;
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
    });

    await user.save();
    res.json({ message: "Signup successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!(await ensureDatabaseReady(res))) {
    return;
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/profile", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) {
    return;
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: toPublicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/profile", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) {
    return;
  }

  const profileImage = String(req.body.profileImage || "");

  if (profileImage && !profileImage.startsWith("data:image/") && !profileImage.startsWith("http")) {
    return res.status(400).json({ message: "Profile image must be a valid image or URL." });
  }

  if (profileImage.length > 2_200_000) {
    return res.status(400).json({ message: "Profile image is too large. Use a smaller image." });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profileImage = profileImage;
    await user.save();

    res.json({
      message: "Profile updated",
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/profile/password", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) {
    return;
  }

  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");

  if (!currentPassword) {
    return res.status(400).json({ message: "Current password is required." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /api/progress ─────────────────────────────────────────
app.get("/api/progress", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      tasks:    user.tasks    || [],
      progress: {
        totalXp:        user.progress?.totalXp        ?? 0,
        totalCompleted: user.progress?.totalCompleted ?? 0,
        dailyHistory:   user.progress?.dailyHistory
                          ? Object.fromEntries(user.progress.dailyHistory)
                          : {},
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── PATCH /api/progress ────────────────────────────────────────
app.patch("/api/progress", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  const { tasks, progress } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (Array.isArray(tasks))   user.tasks    = tasks;
    if (progress && typeof progress === "object") {
      user.progress = {
        totalXp:        Number(progress.totalXp)        || 0,
        totalCompleted: Number(progress.totalCompleted) || 0,
        dailyHistory:   progress.dailyHistory || {},
      };
    }
    await user.save();
    res.json({ message: "Progress saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════
// CAREER INTELLIGENCE & ASSESSMENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

// GET /api/career-profile
app.get("/api/career-profile", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      careerProfile: user.careerProfile || {},
      skills: user.skills || [],
      targetRequirements: user.targetRequirements || [],
      projects: user.projects || [],
      learningGoals: user.learningGoals || { daysPerWeek: 4, sessionsPerWeek: 5, weeklyHoursTarget: 10 },
      learningSessions: user.learningSessions || [],
      latestAssessment: user.latestAssessment || null,
      roadmap: user.roadmap || [],
    });
  } catch (err) {
    console.error("GET /api/career-profile error:", err);
    res.status(500).json({ message: "Failed to fetch career profile" });
  }
});

// PUT /api/career-profile
app.put("/api/career-profile", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  const {
    targetRole,
    targetLocation,
    targetCountry,
    experienceLevel,
    yearsOfExperience,
    careerObjective,
    jobDescription,
  } = req.body;

  if (!targetRole || !String(targetRole).trim()) {
    return res.status(400).json({ message: "Target role is required." });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.careerProfile = {
      targetRole: String(targetRole).trim(),
      targetLocation: String(targetLocation || "").trim(),
      targetCountry: String(targetCountry || "").trim(),
      experienceLevel: String(experienceLevel || "beginner").toLowerCase(),
      yearsOfExperience: Math.max(0, Number(yearsOfExperience) || 0),
      careerObjective: String(careerObjective || "").trim(),
      jobDescription: String(jobDescription || "").trim(),
      updatedAt: new Date(),
    };

    await user.save();
    res.json({ message: "Career profile updated", careerProfile: user.careerProfile });
  } catch (err) {
    console.error("PUT /api/career-profile error:", err);
    res.status(500).json({ message: "Failed to update career profile" });
  }
});

// PUT /api/career-skills
app.put("/api/career-skills", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  const { skills } = req.body;

  if (!Array.isArray(skills)) {
    return res.status(400).json({ message: "Skills must be an array." });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const normalized = normalizeSkillInventory(skills);
    user.skills = normalized;
    await user.save();

    res.json({ message: "Skills updated", skills: user.skills });
  } catch (err) {
    console.error("PUT /api/career-skills error:", err);
    res.status(500).json({ message: "Failed to update skills" });
  }
});

// POST /api/career-requirements/analyze
app.post("/api/career-requirements/analyze", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const role = String(req.body.targetRole || user.careerProfile?.targetRole || "").trim();
    if (!role) {
      return res.status(400).json({ message: "Target role is required to analyze requirements." });
    }

    const jobDesc = String(req.body.jobDescription || user.careerProfile?.jobDescription || "").trim();
    const requirements = await analyzeRoleRequirements(role, jobDesc);

    user.targetRequirements = requirements;
    await user.save();

    res.json({ requirements });
  } catch (err) {
    console.error("POST /api/career-requirements/analyze error:", err);
    res.status(500).json({ message: "Failed to analyze role requirements" });
  }
});

// PUT /api/career-requirements
app.put("/api/career-requirements", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  const { requirements } = req.body;

  if (!Array.isArray(requirements)) {
    return res.status(400).json({ message: "Requirements must be an array." });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.targetRequirements = requirements.map((r) => {
      const importance = /crit/i.test(r.importance)
        ? "Critical"
        : /help|opt/i.test(r.importance)
        ? "Helpful"
        : "Important";
      const weight = importance === "Critical" ? 3 : importance === "Important" ? 2 : 1;
      return {
        name: String(r.name || "").trim(),
        importance,
        weight,
        rationale: String(r.rationale || ""),
        category: String(r.category || "General"),
      };
    });

    await user.save();
    res.json({ message: "Requirements updated", requirements: user.targetRequirements });
  } catch (err) {
    console.error("PUT /api/career-requirements error:", err);
    res.status(500).json({ message: "Failed to update requirements" });
  }
});

// POST /api/career-projects/evaluate
app.post("/api/career-projects/evaluate", authMiddleware, async (req, res) => {
  const { project, targetRole } = req.body;
  if (!project || typeof project !== "object") {
    return res.status(400).json({ message: "Project object is required." });
  }

  try {
    const userRole = targetRole || (await User.findById(req.user.id))?.careerProfile?.targetRole || "Software Engineer";
    const rubric = await evaluateProjectRubric(project, userRole);
    res.json({ rubric });
  } catch (err) {
    console.error("POST /api/career-projects/evaluate error:", err);
    res.status(500).json({ message: "Failed to evaluate project rubric" });
  }
});

// PUT /api/career-projects
app.put("/api/career-projects", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  const { projects } = req.body;

  if (!Array.isArray(projects)) {
    return res.status(400).json({ message: "Projects must be an array." });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.projects = projects.map((p, idx) => ({
      id: p.id || `proj-${Date.now()}-${idx}`,
      title: String(p.title || `Project ${idx + 1}`).trim(),
      description: String(p.description || "").trim(),
      mainFeatures: String(p.mainFeatures || "").trim(),
      technologies: Array.isArray(p.technologies)
        ? p.technologies
        : String(p.technologies || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      architecture: String(p.architecture || "").trim(),
      engineeringQuality: String(p.engineeringQuality || "").trim(),
      repoUrl: String(p.repoUrl || "").trim(),
      liveUrl: String(p.liveUrl || "").trim(),
      roleContribution: String(p.roleContribution || "").trim(),
      measurableOutcomes: String(p.measurableOutcomes || "").trim(),
      technicalDepth: Math.max(0, Math.min(100, Number(p.technicalDepth ?? 50))),
      architectureComplexity: Math.max(0, Math.min(100, Number(p.architectureComplexity ?? 50))),
      integrationsScore: Math.max(0, Math.min(100, Number(p.integrationsScore ?? 50))),
      engineeringQualityScore: Math.max(0, Math.min(100, Number(p.engineeringQualityScore ?? 45))),
      ownershipScore: Math.max(0, Math.min(100, Number(p.ownershipScore ?? 60))),
      roleRelevance: Math.max(0, Math.min(100, Number(p.roleRelevance ?? 70))),
    }));

    await user.save();
    res.json({ message: "Projects updated", projects: user.projects });
  } catch (err) {
    console.error("PUT /api/career-projects error:", err);
    res.status(500).json({ message: "Failed to update projects" });
  }
});

// GET /api/learning-sessions
app.get("/api/learning-sessions", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      sessions: user.learningSessions || [],
      goals: user.learningGoals || { daysPerWeek: 4, sessionsPerWeek: 5, weeklyHoursTarget: 10 },
    });
  } catch (err) {
    console.error("GET /api/learning-sessions error:", err);
    res.status(500).json({ message: "Failed to fetch learning sessions" });
  }
});

// POST /api/learning-sessions
app.post("/api/learning-sessions", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  const { date, durationMinutes, topic, note } = req.body;

  const dur = Number(durationMinutes);
  if (!Number.isFinite(dur) || dur < 1 || dur > 1440) {
    return res.status(400).json({ message: "Duration must be between 1 and 1440 minutes." });
  }

  const cleanTopic = String(topic || "").trim();
  if (!cleanTopic) {
    return res.status(400).json({ message: "Topic is required." });
  }

  const sessionDate = date ? new Date(date) : new Date();
  if (!Number.isFinite(sessionDate.getTime()) || sessionDate.getTime() > Date.now() + 60000) {
    return res.status(400).json({ message: "Session date cannot be in the future or invalid." });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: sessionDate.toISOString(),
      durationMinutes: Math.round(dur),
      topic: cleanTopic,
      note: String(note || "").trim(),
      createdAt: new Date().toISOString(),
    };

    user.learningSessions = [newSession, ...(user.learningSessions || [])].slice(0, 200);
    await user.save();

    res.json({ message: "Learning session logged", session: newSession, sessions: user.learningSessions });
  } catch (err) {
    console.error("POST /api/learning-sessions error:", err);
    res.status(500).json({ message: "Failed to log learning session" });
  }
});

// DELETE /api/learning-sessions/:id
app.delete("/api/learning-sessions/:id", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.learningSessions = (user.learningSessions || []).filter((s) => s.id !== req.params.id);
    await user.save();

    res.json({ message: "Learning session deleted", sessions: user.learningSessions });
  } catch (err) {
    console.error("DELETE /api/learning-sessions error:", err);
    res.status(500).json({ message: "Failed to delete learning session" });
  }
});

// PUT /api/learning-goals
app.put("/api/learning-goals", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  const { daysPerWeek, sessionsPerWeek, weeklyHoursTarget } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.learningGoals = {
      daysPerWeek: Math.max(1, Math.min(7, Number(daysPerWeek) || 4)),
      sessionsPerWeek: Math.max(1, Math.min(28, Number(sessionsPerWeek) || 5)),
      weeklyHoursTarget: Math.max(1, Math.min(80, Number(weeklyHoursTarget) || 10)),
    };

    await user.save();
    res.json({ message: "Learning goals updated", goals: user.learningGoals });
  } catch (err) {
    console.error("PUT /api/learning-goals error:", err);
    res.status(500).json({ message: "Failed to update learning goals" });
  }
});

// POST /api/career-assessment (Calculate & Persist)
app.post("/api/career-assessment", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const targetRole = user.careerProfile?.targetRole || "";
    if (!targetRole) {
      return res.status(400).json({ message: "Please set your Target Role before running assessment." });
    }

    // 1. Fetch Market Telemetry / Estimate
    const marketData = await getMarketDemandData(targetRole, user.careerProfile?.targetLocation);

    // 2. Fetch AI Risk Analysis
    const aiRiskData = await analyzeAIAutomationRisk(targetRole);

    // 3. Centralized Deterministic Assessment
    const assessmentResult = evaluateCareerReadiness({
      userSkills: user.skills || [],
      targetRequirements: user.targetRequirements || [],
      learningSessions: user.learningSessions || [],
      learningGoals: user.learningGoals || {},
      completedTasks: user.tasks || [],
      marketData,
      techCurrencyData: { currencyScore: 78, isRealProviderData: false },
      aiRiskData,
      projects: user.projects || [],
    });

    // 4. Archive previous snapshot with methodology version
    const previousSnapshot = user.latestAssessment
      ? {
          overallScore: user.latestAssessment.overallScore,
          status: user.latestAssessment.status,
          assessedAt: user.latestAssessment.assessedAt,
          methodologyVersion: user.latestAssessment.methodologyVersion || "1.0.0",
        }
      : null;

    if (user.latestAssessment) {
      const history = user.assessmentHistory || [];
      user.assessmentHistory = [...history.slice(-14), previousSnapshot];
    }

    user.latestAssessment = assessmentResult;
    await user.save();

    res.json({
      assessment: assessmentResult,
      previousAssessment: previousSnapshot,
    });
  } catch (err) {
    console.error("POST /api/career-assessment error:", err);
    res.status(500).json({ message: "Failed to calculate career assessment" });
  }
});

// GET /api/career-assessment
app.get("/api/career-assessment", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const previousAssessment = (user.assessmentHistory || []).slice(-1)[0] || null;

    res.json({
      assessment: user.latestAssessment || null,
      previousAssessment,
    });
  } catch (err) {
    console.error("GET /api/career-assessment error:", err);
    res.status(500).json({ message: "Failed to fetch career assessment" });
  }
});

// POST /api/career-roadmap/generate
app.post("/api/career-roadmap/generate", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const targetRole = user.careerProfile?.targetRole || "Software Engineer";
    const roadmap = await generateGapTargetedRoadmap(targetRole, user.latestAssessment, user.skills || []);

    user.roadmap = roadmap;
    await user.save();

    res.json({ roadmap });
  } catch (err) {
    console.error("POST /api/career-roadmap/generate error:", err);
    res.status(500).json({ message: "Failed to generate roadmap" });
  }
});

// GET /api/career-roadmap
app.get("/api/career-roadmap", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ roadmap: user.roadmap || [] });
  } catch (err) {
    console.error("GET /api/career-roadmap error:", err);
    res.status(500).json({ message: "Failed to fetch roadmap" });
  }
});

// POST /api/career-roadmap/sync-tasks (Connects roadmap milestones to Tasks page)
app.post("/api/career-roadmap/sync-tasks", authMiddleware, async (req, res) => {
  if (!(await ensureDatabaseReady(res))) return;
  const { tasksToAdd } = req.body;

  if (!Array.isArray(tasksToAdd) || tasksToAdd.length === 0) {
    return res.status(400).json({ message: "tasksToAdd array is required." });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existingTitles = new Set((user.tasks || []).map((t) => String(t.title || "").toLowerCase().trim()));
    const newTasks = [];

    for (const title of tasksToAdd) {
      const cleanTitle = String(title || "").trim();
      if (!cleanTitle || existingTitles.has(cleanTitle.toLowerCase())) continue;

      const task = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: cleanTitle,
        completed: false,
        rewarded: false,
        isLearning: true, // Counts as qualifying learning activity when completed
        fromRoadmap: true,
        category: "learning",
        createdAt: new Date().toISOString(),
      };
      newTasks.push(task);
      existingTitles.add(cleanTitle.toLowerCase());
    }

    user.tasks = [...newTasks, ...(user.tasks || [])];
    await user.save();

    res.json({
      message: `Added ${newTasks.length} task(s) to your quest list.`,
      addedCount: newTasks.length,
      tasks: user.tasks,
    });
  } catch (err) {
    console.error("POST /api/career-roadmap/sync-tasks error:", err);
    res.status(500).json({ message: "Failed to sync tasks" });
  }
});

// ─── UPGRADED RISK ENDPOINTS (Uses canonical AI Automation Risk) ────
app.post("/api/predict-risk", async (req, res) => {
  const { role } = req.body;
  if (!role || !String(role).trim()) {
    return res.status(400).json({ message: "Role is required." });
  }

  try {
    const riskAnalysis = await analyzeAIAutomationRisk(role);
    const calculated = calculateAIAutomationRisk(riskAnalysis);

    res.json({
      result: `Risk: ${calculated.score}%`,
      riskScore: calculated.score,
      resilienceScore: calculated.resilienceScore,
      details: calculated,
    });
  } catch (err) {
    console.error("predict-risk error:", err);
    const fallbackRisk = estimateRoleRisk(role);
    res.json({
      result: `Risk: ${fallbackRisk}%`,
      riskScore: fallbackRisk,
      resilienceScore: 100 - fallbackRisk,
    });
  }
});

app.post("/api/compare-roles", async (req, res) => {
  const { roles } = req.body;
  if (!Array.isArray(roles) || roles.length === 0) {
    return res.status(400).json({ message: "Roles array is required." });
  }

  try {
    const comparisons = await Promise.all(
      roles.slice(0, 3).map(async (role) => {
        const riskAnalysis = await analyzeAIAutomationRisk(role);
        const calculated = calculateAIAutomationRisk(riskAnalysis);
        const market = await getMarketDemandData(role);

        return {
          role,
          risk: calculated.score,
          resilience: calculated.resilienceScore,
          aiImpact: calculated.score > 60 ? "High" : calculated.score > 35 ? "Medium" : "Low",
          jobDemand: market.isRealProviderData
            ? market.vacancyDemand > 70 ? "High" : "Medium"
            : "Estimated", // Explicitly never claim "High" without evidence!
          isRealProviderData: market.isRealProviderData,
          outlook: calculated.score < 50 ? "Stable" : "Uncertain",
          confidence: calculated.confidence,
        };
      })
    );

    res.json({ data: comparisons });
  } catch (err) {
    console.error("compare-roles error:", err);
    res.json({
      data: roles.slice(0, 3).map((role) => {
        const risk = estimateRoleRisk(role);
        return {
          role,
          risk,
          resilience: 100 - risk,
          aiImpact: risk > 60 ? "High" : risk > 35 ? "Medium" : "Low",
          jobDemand: "Estimated",
          outlook: risk < 50 ? "Stable" : "Uncertain",
        };
      }),
    });
  }
});

// Legacy roadmap endpoint preserved for backward compatibility
app.post("/api/generate-roadmap", async (req, res) => {
  const { goal } = req.body;

  try {
    const text = await callGeminiRaw(
      `Return exactly 5 short roadmap steps for "${goal}". One step per line. No intro.`
    );
    const roadmap = text.split("\n").filter(Boolean).slice(0, 5);

    res.json({ roadmap });
  } catch {
    res.json({ roadmap: ["Learn basics", "Practice", "Build projects"] });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;