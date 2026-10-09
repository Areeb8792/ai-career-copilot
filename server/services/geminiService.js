/**
 * Pravida AI Career Intelligence Engine - Gemini 2.5 Flash Service
 *
 * Provides structured schema generation for:
 * 1. Role requirements analysis
 * 2. Project rubric evaluation
 * 3. AI automation risk exposure breakdown
 * 4. Gap-targeted personalized learning roadmaps
 *
 * Arithmetic is NEVER delegated to the LLM. The LLM provides qualitative breakdowns;
 * deterministic scoring occurs in careerScoring.js.
 */

const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS, 10) || 20000;
const GEMINI_MODEL = "gemini-2.5-flash";

async function callGeminiRaw(prompt, timeoutMs = AI_TIMEOUT_MS) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || "Gemini API error");
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}

function cleanAndParseJson(rawText, fallbackValue) {
  if (!rawText || typeof rawText !== "string") return fallbackValue;
  try {
    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/```(?:json)?/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.warn("Failed to parse JSON from Gemini response, using fallback:", err.message);
    return fallbackValue;
  }
}

// Deterministic baseline role requirements when Gemini is unreachable
const DOMAIN_REQUIREMENT_DEFAULTS = {
  software: [
    { name: "JavaScript", importance: "Critical", weight: 3, rationale: "Core language for web and modern application development.", category: "Languages" },
    { name: "React", importance: "Critical", weight: 3, rationale: "Dominant frontend UI framework.", category: "Frontend" },
    { name: "Node.js", importance: "Important", weight: 2, rationale: "Industry standard backend runtime environment.", category: "Backend" },
    { name: "System Design", importance: "Important", weight: 2, rationale: "Critical for building scalable, reliable architectures.", category: "Architecture" },
    { name: "SQL", importance: "Important", weight: 2, rationale: "Essential relational data querying and management.", category: "Databases" },
    { name: "Docker", importance: "Helpful", weight: 1, rationale: "Containerization and reproducible runtime environments.", category: "DevOps" },
    { name: "Git", importance: "Helpful", weight: 1, rationale: "Standard version control workflows.", category: "Tooling" },
  ],
  data: [
    { name: "Python", importance: "Critical", weight: 3, rationale: "Primary language for data manipulation and modeling.", category: "Languages" },
    { name: "SQL", importance: "Critical", weight: 3, rationale: "Essential for data warehouse extraction and ETL pipelines.", category: "Databases" },
    { name: "Data Modeling", importance: "Important", weight: 2, rationale: "Structuring schemas for reporting and analysis.", category: "Analytics" },
    { name: "Statistics", importance: "Important", weight: 2, rationale: "Foundational for rigorous hypothesis testing.", category: "Theory" },
    { name: "Tableau or Power BI", importance: "Helpful", weight: 1, rationale: "Executive dashboarding and reporting.", category: "Visualization" },
  ],
  devops: [
    { name: "Linux Administration", importance: "Critical", weight: 3, rationale: "Operating system fundamentals for cloud workloads.", category: "Systems" },
    { name: "Docker & Kubernetes", importance: "Critical", weight: 3, rationale: "Container orchestration standard.", category: "Containers" },
    { name: "CI/CD Pipelines", importance: "Important", weight: 2, rationale: "Automating testing and deployment.", category: "Automation" },
    { name: "Cloud Platforms (AWS/GCP/Azure)", importance: "Important", weight: 2, rationale: "Infrastructure provisioning and networking.", category: "Cloud" },
    { name: "Terraform", importance: "Helpful", weight: 1, rationale: "Infrastructure as Code.", category: "IaC" },
  ],
  ai: [
    { name: "Python", importance: "Critical", weight: 3, rationale: "Ecosystem language for machine learning and LLM engineering.", category: "Languages" },
    { name: "PyTorch or TensorFlow", importance: "Critical", weight: 3, rationale: "Core deep learning frameworks.", category: "ML" },
    { name: "LLM Orchestration & RAG", importance: "Important", weight: 2, rationale: "Modern agentic architectures and retrieval.", category: "AI Systems" },
    { name: "Vector Databases", importance: "Important", weight: 2, rationale: "Embeddings indexing and retrieval.", category: "Databases" },
    { name: "Model Evaluation & Fine-Tuning", importance: "Helpful", weight: 1, rationale: "Systematic performance assessment.", category: "Evaluation" },
  ],
};

function getFallbackRequirements(role) {
  const lowered = String(role || "").toLowerCase();
  for (const [domain, reqs] of Object.entries(DOMAIN_REQUIREMENT_DEFAULTS)) {
    if (lowered.includes(domain)) {
      return reqs;
    }
  }
  return DOMAIN_REQUIREMENT_DEFAULTS.software;
}

/**
 * 1. Analyze target role & optional job description to extract structured requirements
 */
async function analyzeRoleRequirements(role, jobDescription = "") {
  const fallback = getFallbackRequirements(role);
  const prompt = `You are a Principal Career Architect. Analyze the target role "${role}" ${
    jobDescription ? `and the following pasted job description:\n"""${jobDescription}"""\n` : ""
  }.
Generate a structured JSON array of 5 to 9 required skills.
Every skill must have:
- "name": string (standard skill name, e.g. "React", "Node.js", "Docker", "System Design")
- "importance": "Critical" (for foundational skills needed daily), "Important" (for key production capabilities), or "Helpful" (for valuable secondary tooling)
- "weight": number (3 for Critical, 2 for Important, 1 for Helpful)
- "rationale": string (brief explanation of why this role requires it, 1 sentence)
- "category": string (e.g. "Frontend", "Backend", "Architecture", "DevOps", "Database", "Testing")

Return ONLY valid JSON matching:
[
  { "name": "...", "importance": "Critical", "weight": 3, "rationale": "...", "category": "..." }
]`;

  try {
    const raw = await callGeminiRaw(prompt);
    const parsed = cleanAndParseJson(raw, null);
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return parsed.map((item) => {
        const imp = String(item.importance || "Important");
        const normImp = /crit/i.test(imp) ? "Critical" : /help|opt/i.test(imp) ? "Helpful" : "Important";
        const weight = normImp === "Critical" ? 3 : normImp === "Important" ? 2 : 1;
        return {
          name: String(item.name || "").trim(),
          importance: normImp,
          weight,
          rationale: String(item.rationale || ""),
          category: String(item.category || "General"),
        };
      });
    }
    return fallback;
  } catch (err) {
    console.warn("analyzeRoleRequirements failed:", err.message);
    return fallback;
  }
}

/**
 * 2. Evaluate a single project against the 6-point engineering rubric
 */
async function evaluateProjectRubric(project, targetRole) {
  const fallback = {
    technicalDepth: 60,
    architectureComplexity: 55,
    integrationsScore: 50,
    engineeringQuality: 45,
    ownershipScore: 70,
    roleRelevance: 75,
    summaryRationale: "Self-reported project. Demonstrates functional implementation; add testing and CI/CD for higher production score.",
  };

  const prompt = `You are a Staff Software Engineer evaluating a portfolio project for a candidate targeting the role of "${targetRole}".
Project Details:
- Title: ${project.title || "Untitled"}
- Description: ${project.description || ""}
- Main Features: ${project.mainFeatures || ""}
- Technologies: ${Array.isArray(project.technologies) ? project.technologies.join(", ") : project.technologies || ""}
- Architecture / Integrations / APIs: ${project.architecture || ""}
- Testing / Security / Deployment: ${project.engineeringQuality || ""}
- Role / Contributions: ${project.roleContribution || ""}
- Measurable Outcomes: ${project.measurableOutcomes || ""}

Score this project on a 0-100 scale for each of these 6 rubric dimensions:
1. "technicalDepth" (20%): Depth of implementation and non-trivial technical challenges solved.
2. "architectureComplexity" (20%): Modular patterns, separation of concerns, scalability.
3. "integrationsScore" (20%): External APIs, databases, authentication, caching, third-party services.
4. "engineeringQuality" (15%): Automated testing, security practices, CI/CD, deployment.
5. "ownershipScore" (15%): Demonstrated end-to-end contribution and problem solving.
6. "roleRelevance" (10%): How closely this project aligns with what a "${targetRole}" does.

Return ONLY a JSON object:
{
  "technicalDepth": 0-100,
  "architectureComplexity": 0-100,
  "integrationsScore": 0-100,
  "engineeringQuality": 0-100,
  "ownershipScore": 0-100,
  "roleRelevance": 0-100,
  "summaryRationale": "1-2 sentence constructive assessment"
}`;

  try {
    const raw = await callGeminiRaw(prompt);
    const parsed = cleanAndParseJson(raw, null);
    if (parsed && typeof parsed.technicalDepth === "number") {
      return {
        technicalDepth: Math.max(0, Math.min(100, parsed.technicalDepth)),
        architectureComplexity: Math.max(0, Math.min(100, parsed.architectureComplexity)),
        integrationsScore: Math.max(0, Math.min(100, parsed.integrationsScore)),
        engineeringQuality: Math.max(0, Math.min(100, parsed.engineeringQuality)),
        ownershipScore: Math.max(0, Math.min(100, parsed.ownershipScore)),
        roleRelevance: Math.max(0, Math.min(100, parsed.roleRelevance)),
        summaryRationale: String(parsed.summaryRationale || fallback.summaryRationale),
      };
    }
    return fallback;
  } catch (err) {
    console.warn("evaluateProjectRubric failed:", err.message);
    return fallback;
  }
}

/**
 * 3. AI Automation Risk Analysis
 * All subfactors use the consistent direction: HIGHER = GREATER EXPOSURE.
 */
async function analyzeAIAutomationRisk(role) {
  const fallback = {
    role,
    routineTaskExposure: 55,
    standardizationExposure: 50,
    aiCapability: 55,
    humanContextExposure: 40,
    isAiGenerated: false,
    countermeasures: [
      "Master distributed system architecture and complex troubleshooting.",
      "Develop domain expertise and product judgment that AI cannot replicate.",
      "Lead cross-functional engineering initiatives and technical communication.",
    ],
  };

  const prompt = `Analyze the AI automation exposure for the career role "${role}".
Evaluate the 4 core exposure subfactors (ALL SCORES FROM 0 to 100, where HIGHER = GREATER EXPOSURE):
1. "routineTaskExposure" (35% weight): How much of the daily work consists of routine or repetitive tasks? (0 = completely unique/creative, 100 = highly routine boilerplate)
2. "standardizationExposure" (25% weight): How structured and standardized are the workflows? (0 = unstructured/ambiguous, 100 = rigidly standardized)
3. "aiCapability" (25% weight): How capable are current generation AI models at performing the core tasks of this role? (0 = zero AI capability, 100 = completely solvable by current AI)
4. "humanContextExposure" (15% weight): How little human judgment, empathy, or physical context is required? (0 = demands deep physical/human judgment, 100 = pure digital execution with minimal subjective judgment)
Also provide:
- "countermeasures": Array of 3-5 concrete, actionable engineering capabilities the candidate should develop to future-proof themselves against routine automation.

Return ONLY a JSON object:
{
  "routineTaskExposure": number,
  "standardizationExposure": number,
  "aiCapability": number,
  "humanContextExposure": number,
  "countermeasures": ["..."]
}`;

  try {
    const raw = await callGeminiRaw(prompt);
    const parsed = cleanAndParseJson(raw, null);
    if (parsed && typeof parsed.routineTaskExposure === "number") {
      return {
        role,
        routineTaskExposure: Math.max(0, Math.min(100, parsed.routineTaskExposure)),
        standardizationExposure: Math.max(0, Math.min(100, parsed.standardizationExposure)),
        aiCapability: Math.max(0, Math.min(100, parsed.aiCapability)),
        humanContextExposure: Math.max(0, Math.min(100, parsed.humanContextExposure)),
        isAiGenerated: true,
        countermeasures: Array.isArray(parsed.countermeasures) && parsed.countermeasures.length > 0
          ? parsed.countermeasures
          : fallback.countermeasures,
      };
    }
    return fallback;
  } catch (err) {
    console.warn("analyzeAIAutomationRisk failed:", err.message);
    return fallback;
  }
}

/**
 * 4. Generate Personalized, Gap-Targeted Learning Roadmap
 */
async function generateGapTargetedRoadmap(targetRole, assessmentResult, userSkills = []) {
  const criticalGaps = assessmentResult?.factors?.skillMatch?.criticalGaps || [];
  const importantGaps = assessmentResult?.factors?.skillMatch?.importantGaps || [];
  const missingTech = assessmentResult?.factors?.techStackRelevance?.missingTech || [];

  const focusSkills = [
    ...criticalGaps.map((g) => g.name),
    ...importantGaps.map((g) => g.name),
    ...missingTech,
  ].slice(0, 5);

  const fallbackMilestones = [
    {
      id: "m-1",
      title: `Master ${focusSkills[0] || "Core Architecture"} Fundamentals`,
      stage: 1,
      skillsAddressed: [focusSkills[0] || "System Design"],
      description: "Build deep foundational proficiency and apply it in focused coding challenges.",
      practicalExercises: [
        `Complete 3 focused exercises implementing ${focusSkills[0] || "core patterns"}.`,
        "Document architecture decisions in a technical design doc.",
      ],
      portfolioProject: `Mini-service demonstrating ${focusSkills[0] || "core API"} with automated tests.`,
      estimatedEffort: "2-3 weeks",
      measurableCriteria: "All unit tests pass and code is deployed.",
      status: "todo",
    },
    {
      id: "m-2",
      title: `Production Integration: ${focusSkills[1] || "Database & DevOps"}`,
      stage: 2,
      skillsAddressed: [focusSkills[1] || "Docker"],
      description: "Integrate end-to-end data persistence, containerization, and automated workflows.",
      practicalExercises: [
        "Configure Docker container and multi-stage build.",
        "Set up GitHub Actions CI workflow to run test suite on pull requests.",
      ],
      portfolioProject: "Production-ready API service with containerized database and CI/CD.",
      estimatedEffort: "3 weeks",
      measurableCriteria: "Automated pipeline builds and deploys successfully on push.",
      status: "todo",
    },
    {
      id: "m-3",
      title: `Capstone Portfolio Project for ${targetRole}`,
      stage: 3,
      skillsAddressed: focusSkills.slice(0, 3),
      description: "Deliver a comprehensive, deployed full-stack application directly showcasing target career readiness.",
      practicalExercises: [
        "Design schema and write migrations.",
        "Implement secure JWT authentication and role-based permissions.",
        "Conduct load testing and optimize database query latency.",
      ],
      portfolioProject: `Comprehensive ${targetRole} Capstone with public repository and live demo URL.`,
      estimatedEffort: "4 weeks",
      measurableCriteria: "Deployed live with public repository documentation and >=80% test coverage.",
      status: "todo",
    },
  ];

  const prompt = `You are a Principal Technical Career Mentor.
Candidate Target Role: "${targetRole}"
Identified Skill Gaps to target: ${focusSkills.join(", ") || "Advanced System Design, CI/CD, Production Architecture"}
Current User Skills: ${userSkills.map((s) => `${s.name} (${s.proficiency})`).join(", ") || "Beginner"}

Generate a personalized, progressive 3-stage learning roadmap directly addressing these specific gaps.
DO NOT tell the user to learn basics they already know. Focus on elevating their weakest areas.
Every milestone must have:
- "id": string (e.g. "m-1", "m-2", "m-3")
- "title": string
- "stage": number (1, 2, or 3)
- "skillsAddressed": array of string skill names
- "description": string (clear objective)
- "practicalExercises": array of 2-3 specific hands-on tasks
- "portfolioProject": string (concrete deliverable)
- "estimatedEffort": string (e.g. "2 weeks", "3-4 weeks")
- "measurableCriteria": string (specific verification condition, e.g. "Passes all integration tests and deployed on Vercel/Railway")
- "status": "todo"

Return ONLY a JSON array of 3 milestone objects.`;

  try {
    const raw = await callGeminiRaw(prompt);
    const parsed = cleanAndParseJson(raw, null);
    if (Array.isArray(parsed) && parsed.length >= 2) {
      return parsed.map((item, idx) => ({
        id: item.id || `m-${idx + 1}`,
        title: String(item.title || `Milestone ${idx + 1}`),
        stage: item.stage || idx + 1,
        skillsAddressed: Array.isArray(item.skillsAddressed) ? item.skillsAddressed : [focusSkills[0] || targetRole],
        description: String(item.description || ""),
        practicalExercises: Array.isArray(item.practicalExercises) ? item.practicalExercises : [],
        portfolioProject: String(item.portfolioProject || ""),
        estimatedEffort: String(item.estimatedEffort || "2-3 weeks"),
        measurableCriteria: String(item.measurableCriteria || "Working prototype deployed"),
        status: "todo",
      }));
    }
    return fallbackMilestones;
  } catch (err) {
    console.warn("generateGapTargetedRoadmap failed:", err.message);
    return fallbackMilestones;
  }
}

module.exports = {
  callGeminiRaw,
  analyzeRoleRequirements,
  evaluateProjectRubric,
  analyzeAIAutomationRisk,
  generateGapTargetedRoadmap,
};
