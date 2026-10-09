import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout";
import API_BASE_URL from "../config/api";
import "./theme-dynamic.css";

const COMMON_SKILL_SUGGESTIONS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Express", "Python", "Java", "Go",
  "SQL", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Git",
  "CI/CD", "System Design", "REST APIs", "GraphQL", "Microservices", "Linux",
  "Unit Testing", "Jest", "Tailwind CSS", "Next.js", "Data Structures", "Communication"
];

const PROFICIENCY_OPTIONS = [
  { value: "No Experience", label: "No Experience (0%)", score: 0 },
  { value: "Beginner", label: "Beginner (25%)", score: 25 },
  { value: "Intermediate", label: "Intermediate (55%)", score: 55 },
  { value: "Advanced", label: "Advanced (80%)", score: 80 },
  { value: "Expert", label: "Expert (100%)", score: 100 },
];

const EXPERIENCE_LEVELS = [
  { value: "student", label: "Student" },
  { value: "beginner", label: "Beginner / Self-Taught" },
  { value: "entry-level", label: "Entry-Level (0-2 yrs)" },
  { value: "intermediate", label: "Intermediate (2-5 yrs)" },
  { value: "experienced", label: "Experienced / Senior (5+ yrs)" },
];

export default function CareerProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";

  // Active section tab
  const [activeTab, setActiveTab] = useState("target");

  // Form states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzingReqs, setAnalyzingReqs] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [evaluatingProjId, setEvaluatingProjId] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // 1. Target Role State
  const [targetRole, setTargetRole] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [targetCountry, setTargetCountry] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [careerObjective, setCareerObjective] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // 2. Skill Inventory State
  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillProf, setNewSkillProf] = useState("Beginner");
  const [skillSearch, setSkillSearch] = useState("");

  // 3. Target Requirements State
  const [targetRequirements, setTargetRequirements] = useState([]);
  const [customReqName, setCustomReqName] = useState("");
  const [customReqImp, setCustomReqImp] = useState("Important");

  // 4. Project Portfolio State
  const [projects, setProjects] = useState([]);
  const [editingProjIndex, setEditingProjIndex] = useState(null);

  // 5. Learning Targets & Session Logger
  const [learningGoals, setLearningGoals] = useState({ daysPerWeek: 4, sessionsPerWeek: 5, weeklyHoursTarget: 10 });
  const [sessions, setSessions] = useState([]);
  const [sessionForm, setSessionForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    durationMinutes: 45,
    topic: "",
    note: "",
  });

  const showToast = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: "", text: "" }), 4000);
  };

  const loadProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/career-profile`, {
        headers: { authorization: token },
        timeout: 10000,
      });
      const data = res.data || {};
      const cp = data.careerProfile || {};
      setTargetRole(cp.targetRole || "");
      setTargetLocation(cp.targetLocation || "");
      setTargetCountry(cp.targetCountry || "");
      setExperienceLevel(cp.experienceLevel || "beginner");
      setYearsOfExperience(cp.yearsOfExperience || 0);
      setCareerObjective(cp.careerObjective || "");
      setJobDescription(cp.jobDescription || "");

      setSkills(Array.isArray(data.skills) ? data.skills : []);
      setTargetRequirements(Array.isArray(data.targetRequirements) ? data.targetRequirements : []);
      setProjects(Array.isArray(data.projects) ? data.projects : []);
      if (data.learningGoals) setLearningGoals(data.learningGoals);
      setSessions(Array.isArray(data.learningSessions) ? data.learningSessions : []);
    } catch (err) {
      console.error("Error loading career profile:", err);
      showToast("error", "Failed to load career profile data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Save Target Role
  const handleSaveTarget = async (e) => {
    if (e) e.preventDefault();
    if (!targetRole.trim()) {
      showToast("error", "Target role title is mandatory.");
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/career-profile`,
        {
          targetRole,
          targetLocation,
          targetCountry,
          experienceLevel,
          yearsOfExperience: Number(yearsOfExperience),
          careerObjective,
          jobDescription,
        },
        { headers: { authorization: token } }
      );
      showToast("success", "Target career profile saved!");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to save career target.");
    } finally {
      setSaving(false);
    }
  };

  // Skill Inventory Management
  const handleAddSkill = (skillName, prof = newSkillProf) => {
    const name = (skillName || newSkillName).trim();
    if (!name) return;

    // Duplicate check: normalized casing & whitespace
    const norm = name.toLowerCase().replace(/\s+/g, " ");
    const exists = skills.some((s) => s.name.toLowerCase().replace(/\s+/g, " ") === norm);
    if (exists) {
      showToast("error", `Skill "${name}" is already in your inventory.`);
      return;
    }

    const updated = [...skills, { name, proficiency: prof, yearsOfExperience: 1 }];
    setSkills(updated);
    setNewSkillName("");
    saveSkills(updated);
  };

  const handleRemoveSkill = (name) => {
    const updated = skills.filter((s) => s.name.toLowerCase() !== name.toLowerCase());
    setSkills(updated);
    saveSkills(updated);
  };

  const handleUpdateProficiency = (name, proficiency) => {
    const updated = skills.map((s) =>
      s.name.toLowerCase() === name.toLowerCase() ? { ...s, proficiency } : s
    );
    setSkills(updated);
    saveSkills(updated);
  };

  const saveSkills = async (skillList) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/career-skills`,
        { skills: skillList },
        { headers: { authorization: token } }
      );
    } catch (err) {
      console.error("Save skills failed:", err);
    }
  };

  // Target Requirements Analysis
  const handleAnalyzeRequirements = async () => {
    if (!targetRole.trim()) {
      showToast("error", "Please specify a Target Role first.");
      return;
    }
    setAnalyzingReqs(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/career-requirements/analyze`,
        { targetRole, jobDescription },
        { headers: { authorization: token }, timeout: 25000 }
      );
      setTargetRequirements(res.data.requirements || []);
      showToast("success", `Generated ${res.data.requirements?.length || 0} required skills for ${targetRole}!`);
    } catch (err) {
      showToast("error", "Failed to analyze requirements. Using baseline standards.");
    } finally {
      setAnalyzingReqs(false);
    }
  };

  const handleAddCustomReq = () => {
    if (!customReqName.trim()) return;
    const importance = customReqImp;
    const weight = importance === "Critical" ? 3 : importance === "Important" ? 2 : 1;
    const updated = [
      ...targetRequirements,
      {
        name: customReqName.trim(),
        importance,
        weight,
        rationale: "Custom candidate-defined role requirement.",
        category: "Custom",
      },
    ];
    setTargetRequirements(updated);
    setCustomReqName("");
    saveRequirements(updated);
  };

  const handleRemoveReq = (name) => {
    const updated = targetRequirements.filter((r) => r.name !== name);
    setTargetRequirements(updated);
    saveRequirements(updated);
  };

  const handleReqImportanceChange = (name, newImp) => {
    const weight = newImp === "Critical" ? 3 : newImp === "Important" ? 2 : 1;
    const updated = targetRequirements.map((r) =>
      r.name === name ? { ...r, importance: newImp, weight } : r
    );
    setTargetRequirements(updated);
    saveRequirements(updated);
  };

  const saveRequirements = async (reqList) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/career-requirements`,
        { requirements: reqList },
        { headers: { authorization: token } }
      );
    } catch (err) {
      console.error("Save requirements failed:", err);
    }
  };

  // Project Portfolio
  const handleAddProject = () => {
    const newProj = {
      id: `proj-${Date.now()}`,
      title: "New Portfolio Project",
      description: "",
      mainFeatures: "",
      technologies: [],
      architecture: "",
      engineeringQuality: "",
      repoUrl: "",
      liveUrl: "",
      roleContribution: "",
      measurableOutcomes: "",
      technicalDepth: 55,
      architectureComplexity: 50,
      integrationsScore: 50,
      engineeringQualityScore: 45,
      ownershipScore: 60,
      roleRelevance: 75,
    };
    const updated = [newProj, ...projects];
    setProjects(updated);
    setEditingProjIndex(0);
    saveProjects(updated);
  };

  const handleUpdateProjectField = (index, field, value) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const handleSaveProjects = async () => {
    setSaving(true);
    await saveProjects(projects);
    setSaving(false);
    showToast("success", "Projects saved successfully!");
  };

  const saveProjects = async (projList) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/career-projects`,
        { projects: projList },
        { headers: { authorization: token } }
      );
    } catch (err) {
      console.error("Save projects failed:", err);
    }
  };

  const handleEvaluateProjectRubric = async (proj, index) => {
    setEvaluatingProjId(proj.id);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/career-projects/evaluate`,
        { project: proj, targetRole: targetRole || "Software Engineer" },
        { headers: { authorization: token }, timeout: 25000 }
      );
      const r = res.data.rubric || {};
      const updated = [...projects];
      updated[index] = {
        ...updated[index],
        technicalDepth: r.technicalDepth ?? updated[index].technicalDepth,
        architectureComplexity: r.architectureComplexity ?? updated[index].architectureComplexity,
        integrationsScore: r.integrationsScore ?? updated[index].integrationsScore,
        engineeringQualityScore: r.engineeringQuality ?? updated[index].engineeringQualityScore,
        ownershipScore: r.ownershipScore ?? updated[index].ownershipScore,
        roleRelevance: r.roleRelevance ?? updated[index].roleRelevance,
        aiRationale: r.summaryRationale || "",
      };
      setProjects(updated);
      saveProjects(updated);
      showToast("success", "AI evaluated project rubric! You can adjust the sliders.");
    } catch (err) {
      showToast("error", "AI evaluation timed out. You can adjust scores manually.");
    } finally {
      setEvaluatingProjId(null);
    }
  };

  const handleDeleteProject = (id) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    saveProjects(updated);
    setEditingProjIndex(null);
  };

  // Learning Sessions & Goals
  const handleSaveGoals = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/api/learning-goals`, learningGoals, {
        headers: { authorization: token },
      });
      showToast("success", "Learning goals updated!");
    } catch (err) {
      showToast("error", "Failed to update learning goals.");
    }
  };

  const handleLogSession = async (e) => {
    e.preventDefault();
    if (!sessionForm.topic.trim()) {
      showToast("error", "Session topic or skill is required.");
      return;
    }
    if (sessionForm.durationMinutes < 1) {
      showToast("error", "Duration must be at least 1 minute.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/learning-sessions`,
        sessionForm,
        { headers: { authorization: token } }
      );
      setSessions(res.data.sessions || []);
      setSessionForm({
        date: new Date().toISOString().slice(0, 10),
        durationMinutes: 45,
        topic: "",
        note: "",
      });
      showToast("success", "Learning session logged!");
    } catch (err) {
      showToast("error", "Failed to log session.");
    }
  };

  const handleDeleteSession = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/learning-sessions/${id}`, {
        headers: { authorization: token },
      });
      setSessions(res.data.sessions || []);
      showToast("success", "Session deleted.");
    } catch (err) {
      showToast("error", "Failed to delete session.");
    }
  };

  // Trigger Assessment & Redirect to Dashboard
  const handleRunAssessment = async () => {
    if (!targetRole.trim()) {
      showToast("error", "Set your Target Role before running assessment.");
      return;
    }
    setAssessing(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/career-assessment`,
        {},
        { headers: { authorization: token }, timeout: 30000 }
      );
      showToast("success", "Assessment successfully calculated!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to calculate assessment.");
    } finally {
      setAssessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Loading Career Profile & Assessment...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-display tracking-tight text-white">
                Career Profile & Intelligence
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                CANONICAL
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Configure your career target, skill inventory, project portfolio, and learning targets for weighted readiness evaluation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAssessment}
              disabled={assessing || !targetRole.trim()}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {assessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                  Run Career Assessment
                </>
              )}
            </button>
          </div>
        </div>

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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-2">
          {[
            { id: "target", label: "1. Career Target", icon: "🎯" },
            { id: "skills", label: `2. Skills (${skills.length})`, icon: "⚡" },
            { id: "requirements", label: `3. Role Requirements (${targetRequirements.length})`, icon: "📋" },
            { id: "projects", label: `4. Project Portfolio (${projects.length})`, icon: "🛠️" },
            { id: "learning", label: `5. Learning Sessions (${sessions.length})`, icon: "⏱️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: CAREER TARGET */}
        {activeTab === "target" && (
          <form onSubmit={handleSaveTarget} className="glass-card p-6 md:p-8 rounded-2xl space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold font-display text-white">Career Target & Objective</h2>
              <p className="text-xs text-zinc-400">All readiness metrics are evaluated relative to your target goal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Target Role / Job Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Stack Developer, DevOps Engineer, AI Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Target Location / Market
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City or Remote"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Country (e.g. US, India)"
                    value={targetCountry}
                    onChange={(e) => setTargetCountry(e.target.value)}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Current Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value} className="bg-zinc-900 text-white">
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Total Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Career Objective
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Transition from junior frontend to full-stack engineer building distributed microservices."
                value={careerObjective}
                onChange={(e) => setCareerObjective(e.target.value)}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Optional Pasted Job Description
              </label>
              <textarea
                rows="4"
                placeholder="Paste the full job posting text here to tailor requirements specifically to this employer's criteria..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md"
              >
                {saving ? "Saving..." : "Save Career Target"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SKILL INVENTORY */}
        {activeTab === "skills" && (
          <div className="glass-card p-6 md:p-8 rounded-2xl space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold font-display text-white">Skill Inventory</h2>
              <p className="text-xs text-zinc-400">
                Add your technical and engineering competencies. Each skill contributes to your Skill Match and Tech Stack Relevance scores.
              </p>
            </div>

            {/* Quick Add Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="md:col-span-5">
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Add Skill</label>
                <input
                  type="text"
                  placeholder="e.g. React, Docker, Python..."
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Proficiency Level</label>
                <select
                  value={newSkillProf}
                  onChange={(e) => setNewSkillProf(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {PROFICIENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="w-full py-2.5 rounded-xl font-bold text-sm bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-md"
                >
                  + Add to Inventory
                </button>
              </div>
            </div>

            {/* Suggestions Chips */}
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Suggested Common Skills:</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_SKILL_SUGGESTIONS.filter(
                  (s) => !skills.some((userS) => userS.name.toLowerCase() === s.toLowerCase())
                )
                  .slice(0, 16)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddSkill(s, "Beginner")}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 transition-all flex items-center gap-1.5"
                    >
                      <span>+</span>
                      <span>{s}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Current Inventory Table/Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                  Your Declared Skills ({skills.length})
                </h3>
                <input
                  type="text"
                  placeholder="Filter skills..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="rounded-lg bg-black/30 border border-white/10 px-3 py-1 text-xs text-white focus:outline-none w-48"
                />
              </div>

              {skills.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                  <p className="text-sm text-zinc-400">No skills added yet. Click on the suggestions above or add custom skills.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {skills
                    .filter((s) => s.name.toLowerCase().includes(skillSearch.toLowerCase()))
                    .map((s) => {
                      const profObj = PROFICIENCY_OPTIONS.find((p) => p.value === s.proficiency) || PROFICIENCY_OPTIONS[1];
                      return (
                        <div
                          key={s.name}
                          className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-white truncate">{s.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <select
                                value={s.proficiency}
                                onChange={(e) => handleUpdateProficiency(s.name, e.target.value)}
                                className="text-xs bg-black/40 text-indigo-300 border border-indigo-500/30 rounded px-2 py-0.5 focus:outline-none"
                              >
                                {PROFICIENCY_OPTIONS.map((p) => (
                                  <option key={p.value} value={p.value} className="bg-zinc-900 text-white">
                                    {p.value}
                                  </option>
                                ))}
                              </select>
                              <span className="text-[10px] text-zinc-500">{profObj.score}%</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(s.name)}
                            aria-label={`Remove skill ${s.name}`}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ROLE REQUIREMENTS */}
        {activeTab === "requirements" && (
          <div className="glass-card p-6 md:p-8 rounded-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Target Role Requirements</h2>
                <p className="text-xs text-zinc-400">
                  Skills required for <span className="text-indigo-400 font-bold">{targetRole || "your target role"}</span>. Classified into Critical (weight 3), Important (weight 2), and Helpful (weight 1).
                </p>
              </div>

              <button
                type="button"
                onClick={handleAnalyzeRequirements}
                disabled={analyzingReqs || !targetRole.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-all flex items-center gap-2"
              >
                {analyzingReqs ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Regenerate Requirements
                  </>
                )}
              </button>
            </div>

            {/* Custom Requirement Adder */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 items-center">
              <input
                type="text"
                placeholder="Add custom required skill..."
                value={customReqName}
                onChange={(e) => setCustomReqName(e.target.value)}
                className="flex-1 rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <select
                value={customReqImp}
                onChange={(e) => setCustomReqImp(e.target.value)}
                className="rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="Critical">Critical (Weight 3)</option>
                <option value="Important">Important (Weight 2)</option>
                <option value="Helpful">Helpful (Weight 1)</option>
              </select>
              <button
                type="button"
                onClick={handleAddCustomReq}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white whitespace-nowrap"
              >
                + Add Requirement
              </button>
            </div>

            {/* Requirements List */}
            {targetRequirements.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                <p className="text-sm text-zinc-400 mb-3">No requirements set. Click "Regenerate Requirements" to analyze with Gemini.</p>
                <button
                  onClick={handleAnalyzeRequirements}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500 text-white"
                >
                  Generate Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {targetRequirements.map((req) => {
                  const userSkill = skills.find(
                    (s) => s.name.toLowerCase().trim() === req.name.toLowerCase().trim()
                  );
                  const userScore = userSkill
                    ? PROFICIENCY_OPTIONS.find((p) => p.value === userSkill.proficiency)?.score || 0
                    : 0;
                  const benchmark = req.importance === "Critical" ? 80 : req.importance === "Important" ? 55 : 25;
                  const isCovered = userScore >= benchmark;

                  return (
                    <div
                      key={req.name}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-base text-white">{req.name}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              req.importance === "Critical"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : req.importance === "Important"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {req.importance} (Weight {req.weight || 2})
                          </span>
                          <span className="text-[11px] text-zinc-500">{req.category || "General"}</span>
                        </div>
                        {req.rationale && (
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{req.rationale}</p>
                        )}
                      </div>

                      {/* Coverage status */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-zinc-300">
                            {userSkill ? `${userSkill.proficiency} (${userScore}%)` : "Missing (0%)"}
                          </p>
                          <span
                            className={`text-[10px] font-bold ${
                              isCovered
                                ? "text-emerald-400"
                                : userSkill
                                ? "text-amber-400"
                                : "text-red-400"
                            }`}
                          >
                            {isCovered ? "✓ Benchmark Met" : userSkill ? "Needs Practice" : "Skill Gap"}
                          </span>
                        </div>

                        <select
                          value={req.importance}
                          onChange={(e) => handleReqImportanceChange(req.name, e.target.value)}
                          className="text-xs bg-black/40 text-zinc-300 border border-white/10 rounded px-2 py-1 focus:outline-none"
                        >
                          <option value="Critical">Critical (3)</option>
                          <option value="Important">Important (2)</option>
                          <option value="Helpful">Helpful (1)</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveReq(req.name)}
                          aria-label={`Remove requirement ${req.name}`}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROJECT PORTFOLIO */}
        {activeTab === "projects" && (
          <div className="glass-card p-6 md:p-8 rounded-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Project Portfolio</h2>
                <p className="text-xs text-zinc-400">
                  Document your production applications. Projects are scored across 6 technical rubric criteria and weighted by role relevance.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md flex items-center gap-1.5"
                >
                  <span>+</span> Add Project
                </button>
                <button
                  type="button"
                  onClick={handleSaveProjects}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-all border border-white/10"
                >
                  {saving ? "Saving..." : "Save Portfolio"}
                </button>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                <p className="text-sm text-zinc-400 mb-3">No portfolio projects listed yet.</p>
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white"
                >
                  + Add First Project
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {projects.map((proj, idx) => {
                  const isEditing = editingProjIndex === idx;
                  const projScore = Math.round(
                    (0.20 * (proj.technicalDepth || 50)) +
                    (0.20 * (proj.architectureComplexity || 50)) +
                    (0.20 * (proj.integrationsScore || 50)) +
                    (0.15 * (proj.engineeringQualityScore || 45)) +
                    (0.15 * (proj.ownershipScore || 60)) +
                    (0.10 * (proj.roleRelevance || 70))
                  );

                  return (
                    <div
                      key={proj.id || idx}
                      className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
                    >
                      {/* Project Header Bar */}
                      <div className="p-4 md:p-5 flex items-center justify-between gap-4 border-b border-white/5 bg-black/20">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setEditingProjIndex(isEditing ? null : idx)}
                            className="text-zinc-400 hover:text-white"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              className={`transition-transform ${isEditing ? "rotate-90" : ""}`}
                            >
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>
                          <div>
                            <h3 className="font-bold text-base text-white">{proj.title || "Untitled Project"}</h3>
                            <p className="text-xs text-zinc-400 truncate max-w-md">
                              {proj.description || "Self-reported project. Click to expand and configure."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-xs font-bold text-indigo-400">Score: {projScore}/100</span>
                            <div className="text-[10px] text-zinc-500">Relevance: {proj.roleRelevance || 70}%</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleEvaluateProjectRubric(proj, idx)}
                            disabled={evaluatingProjId === proj.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 flex items-center gap-1.5"
                          >
                            {evaluatingProjId === proj.id ? "Analyzing..." : "Evaluate Rubric"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            aria-label={`Delete project ${proj.title}`}
                            className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Project Details Form */}
                      {isEditing && (
                        <div className="p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-zinc-400 mb-1">Project Title</label>
                              <input
                                type="text"
                                value={proj.title}
                                onChange={(e) => handleUpdateProjectField(idx, "title", e.target.value)}
                                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-zinc-400 mb-1">Technologies Used (comma separated)</label>
                              <input
                                type="text"
                                placeholder="React, Node.js, MongoDB, Docker"
                                value={Array.isArray(proj.technologies) ? proj.technologies.join(", ") : proj.technologies}
                                onChange={(e) =>
                                  handleUpdateProjectField(
                                    idx,
                                    "technologies",
                                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                                  )
                                }
                                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-zinc-400 mb-1">Description & Problem Solved</label>
                              <textarea
                                rows="2"
                                value={proj.description}
                                onChange={(e) => handleUpdateProjectField(idx, "description", e.target.value)}
                                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-zinc-400 mb-1">Architecture & APIs</label>
                              <textarea
                                rows="2"
                                placeholder="REST/GraphQL endpoints, database schemas, microservice patterns..."
                                value={proj.architecture}
                                onChange={(e) => handleUpdateProjectField(idx, "architecture", e.target.value)}
                                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-zinc-400 mb-1">Testing, Security & CI/CD</label>
                              <textarea
                                rows="2"
                                placeholder="Unit test coverage, OAuth/JWT, Docker, GitHub Actions pipeline..."
                                value={proj.engineeringQuality}
                                onChange={(e) => handleUpdateProjectField(idx, "engineeringQuality", e.target.value)}
                                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-zinc-400 mb-1">GitHub Repository URL (Optional)</label>
                              <input
                                type="url"
                                placeholder="https://github.com/username/repo"
                                value={proj.repoUrl}
                                onChange={(e) => handleUpdateProjectField(idx, "repoUrl", e.target.value)}
                                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-xs text-white focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-zinc-400 mb-1">Live Demo URL (Optional)</label>
                              <input
                                type="url"
                                placeholder="https://my-app.vercel.app"
                                value={proj.liveUrl}
                                onChange={(e) => handleUpdateProjectField(idx, "liveUrl", e.target.value)}
                                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* 6-Point Rubric Sliders (Reviewable by User) */}
                          <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                                6-Point Rubric Evaluation (User-Editable)
                              </h4>
                              <span className="text-[11px] text-zinc-400">Review & calibrate your self-reported ratings</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {[
                                { key: "technicalDepth", label: "Technical Depth (20%)", val: proj.technicalDepth || 50 },
                                { key: "architectureComplexity", label: "Architecture (20%)", val: proj.architectureComplexity || 50 },
                                { key: "integrationsScore", label: "Integrations & APIs (20%)", val: proj.integrationsScore || 50 },
                                { key: "engineeringQualityScore", label: "Quality & CI/CD (15%)", val: proj.engineeringQualityScore || 45 },
                                { key: "ownershipScore", label: "Ownership (15%)", val: proj.ownershipScore || 60 },
                                { key: "roleRelevance", label: "Career Relevance (10%)", val: proj.roleRelevance || 75 },
                              ].map((r) => (
                                <div key={r.key} className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-zinc-400">{r.label}</span>
                                    <span className="font-bold text-white">{r.val}/100</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={r.val}
                                    onChange={(e) => handleUpdateProjectField(idx, r.key, Number(e.target.value))}
                                    className="w-full accent-indigo-500 cursor-pointer"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: LEARNING SESSIONS & GOALS */}
        {activeTab === "learning" && (
          <div className="space-y-6">
            {/* Learning Goals Setter */}
            <form onSubmit={handleSaveGoals} className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">Learning Targets</h3>
                  <p className="text-xs text-zinc-400">Sets your 28-day baseline for the Learning Consistency dimension.</p>
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Save Goals
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Planned Days per Week (1-7)</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={learningGoals.daysPerWeek}
                    onChange={(e) => setLearningGoals({ ...learningGoals, daysPerWeek: Number(e.target.value) })}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-sm text-white"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">28-day planned target: {learningGoals.daysPerWeek * 4} distinct days</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Planned Sessions per Week (1-28)</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={learningGoals.sessionsPerWeek}
                    onChange={(e) => setLearningGoals({ ...learningGoals, sessionsPerWeek: Number(e.target.value) })}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-sm text-white"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">28-day planned target: {learningGoals.sessionsPerWeek * 4} sessions</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Weekly Target Study Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="80"
                    value={learningGoals.weeklyHoursTarget}
                    onChange={(e) => setLearningGoals({ ...learningGoals, weeklyHoursTarget: Number(e.target.value) })}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-sm text-white"
                  />
                </div>
              </div>
            </form>

            {/* Session Logger Form */}
            <form onSubmit={handleLogSession} className="glass-card p-6 rounded-2xl space-y-4">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-base font-bold text-white">Log Dedicated Learning Session</h3>
                <p className="text-xs text-zinc-400">
                  Qualifying sessions require at least 15 minutes of dedicated skill practice.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.date}
                    onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="720"
                    required
                    value={sessionForm.durationMinutes}
                    onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: Number(e.target.value) })}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-sm text-white"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Min 15 min for consistency score</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Skill or Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Docker networking, LeetCode"
                    value={sessionForm.topic}
                    onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Key concepts covered..."
                    value={sessionForm.note}
                    onChange={(e) => setSessionForm({ ...sessionForm, note: e.target.value })}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
                >
                  + Log Qualifying Session
                </button>
              </div>
            </form>

            {/* Sessions History Table */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white">Recent Learning Sessions ({sessions.length})</h3>

              {sessions.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">No learning sessions recorded yet. Start logging sessions above.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Topic</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Notes</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sessions.slice(0, 15).map((s) => (
                        <tr key={s.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-zinc-300 font-mono">
                            {new Date(s.date).toISOString().slice(0, 10)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">{s.topic}</td>
                          <td className="py-2.5 px-3 text-indigo-400">{s.durationMinutes} mins</td>
                          <td className="py-2.5 px-3 text-zinc-400 max-w-xs truncate">{s.note || "—"}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteSession(s.id)}
                              aria-label={`Delete session on ${s.topic}`}
                              className="text-zinc-500 hover:text-red-400 p-1"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
