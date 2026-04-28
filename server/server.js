const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();
const AI_TIMEOUT_MS = 1500;
const GEMINI_MODEL = "gemini-2.5-flash";

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Career Copilot Backend Running");
});

mongoose
  .connect("mongodb://127.0.0.1:27017/ai-career")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  xp: { type: Number, default: 0 },
  quests: { type: Array, default: [] },
});

const User = mongoose.model("User", userSchema);

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const estimateRoleRisk = (role, index = 0) => {
  const lowered = String(role || "").toLowerCase();
  let baseRisk = 42;

  if (["mechanical", "engineer", "manufacturing", "industrial", "civil"].some((keyword) => lowered.includes(keyword))) {
    baseRisk = 38;
  } else if (["software", "developer", "frontend", "backend", "web", "programmer"].some((keyword) => lowered.includes(keyword))) {
    baseRisk = 58;
  } else if (["designer", "ux", "ui", "graphic", "creative"].some((keyword) => lowered.includes(keyword))) {
    baseRisk = 52;
  } else if (["analyst", "finance", "account", "operations", "data"].some((keyword) => lowered.includes(keyword))) {
    baseRisk = 49;
  }

  const seededOffset = String(role || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0) % 9;

  return Math.max(14, Math.min(88, baseRisk + seededOffset - index * 3));
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
  const { email, password } = req.body;

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
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, "secretkey", { expiresIn: "7d" });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/profile", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
});

app.post("/api/generate-roadmap", async (req, res) => {
  const { goal } = req.body;

  try {
    const text = await callGemini(
      `Return exactly 5 short roadmap steps for "${goal}". One step per line. No intro.`
    );
    const roadmap = text.split("\n").filter(Boolean).slice(0, 5);

    res.json({ roadmap });
  } catch {
    res.json({ roadmap: ["Learn basics", "Practice", "Build projects"] });
  }
});

app.post("/api/predict-risk", async (req, res) => {
  const { role } = req.body;

  try {
    const text = await callGemini(
      `For "${role}", return one short line only in this exact format: Risk: <number>%`
    );
    res.json({ result: text });
  } catch {
    res.json({ result: `Risk: ${estimateRoleRisk(role)}%` });
  }
});

app.post("/api/compare-roles", async (req, res) => {
  const { roles } = req.body;

  try {
    const text = await callGemini(
      `Compare AI replacement risk for these roles: ${roles.join(", ")}. Return only valid JSON as an array of exactly 3 objects with keys "role" and "risk".`
    );
    res.json({ data: JSON.parse(text) });
  } catch {
    res.json({
      data: roles.map((role, index) => ({
        role,
        risk: estimateRoleRisk(role, index),
      })),
    });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
