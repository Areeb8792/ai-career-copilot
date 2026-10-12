Pravida AI — AI Career Copilot
Turn career uncertainty into an actionable growth plan.
Pravida AI is an AI-powered career intelligence platform that helps learners understand their career readiness, uncover skill gaps, assess changing career risks, and turn their goals into a structured learning roadmap.
Career Readiness · Skill Intelligence · Risk Assessment · Personalized Growth 

Table of Contents
Overview
The Problem
What Pravida AI Does
Core Capabilities
How the Assessment Works
System Architecture
Technology Stack
Project Structure
Getting Started
Environment Configuration
Run with Docker Compose
API Overview
Security and Reliability
Testing
Deployment Notes
Future Enhancements
Contributing
License
Overview
Career planning is more than choosing a job title. It requires understanding current capabilities, comparing them with role expectations, keeping pace with technology, and consistently working on the most valuable gaps.
Pravida AI — AI Career Copilot brings these activities into one application. Users can maintain a career profile, record skills and projects, evaluate readiness for a target role, track learning activity, and generate personalized career guidance. Its backend combines a deterministic scoring engine with generative AI: defined business rules calculate quantitative scores, while Google's Gemini model can help produce contextual analysis and recommendations.
The project demonstrates a practical full-stack architecture integrating a React application, REST APIs, persistent data storage, authentication, AI services, automated tests, and container-based development.
The Problem
Students and early-career professionals often face several connected challenges:
Unclear readiness: It can be difficult to judge how closely current skills match a target role.
Scattered learning: Courses, projects, and practice can lack a coherent plan.
Changing expectations: Technology stacks and market demand evolve over time.
Limited feedback: A list of skills does not necessarily explain what to prioritize next.
Inconsistent progress: Learning goals are easier to abandon when progress is not visible.
Pravida AI aims to connect assessment with action: understand the current position, identify gaps, prioritize improvements, and track progress over time.
What Pravida AI Does
At a high level, the application supports this cycle:
Build a profile — maintain career goals, skills, proficiency information, and project experience.
Assess readiness — evaluate the profile against a chosen career direction using the scoring engine.
Understand the risks — review skill gaps, technology relevance, market-related signals, and estimated AI automation exposure.
Create a plan — use AI-assisted analysis and roadmap generation to turn findings into practical next steps.
Track progress — record learning sessions and goals and revisit the assessment as the profile develops.
Core Capabilities
1. Career profile and skill intelligence
Users can maintain a structured career profile and update the skills and proficiency information used by the assessment workflow. This creates a more useful foundation than a one-time, generic career quiz.
2. Explainable career-readiness scoring
The scoring service applies explicit weights to normalized assessment factors. This makes the score more consistent and testable than asking a language model to produce a numerical rating without a defined calculation method.
3. Career and automation-risk analysis
The platform considers factors such as role-skill alignment, technology relevance, project complexity, market-demand signals, and AI automation risk. These are decision-support indicators, not guarantees of employment outcomes or precise predictions of the future.
4. AI-assisted analysis and roadmap generation
The Gemini integration supports contextual interpretation and recommendation generation. AI output supplements the application's business logic rather than replacing the deterministic scoring calculation.
5. Learning goals and progress tracking
Learning sessions and goals provide a way to record activity and review progress. Consistency signals can contribute to the assessment, helping connect everyday learning behavior with longer-term career development.
6. Authentication and user-specific data
The backend provides signup and login routes, password hashing, JWT-based authentication, and protected endpoints for profile and learning data.
7. Containerized development
Dockerfiles and a Docker Compose configuration are included for the frontend, backend, and MongoDB service, making it easier to run the core application stack in a repeatable local environment.
How the Assessment Works
The assessment combines quantitative scoring with AI-assisted explanation.
Weighted scoring model
The project's career scoring model uses the following weights:
Assessment factor
Weight
What it represents
Skill Match Score
30%
Alignment between a user's skills and the target role
Learning Consistency Score
15%
Learning activity and consistency over time
Market Demand Score
15%
Market-demand signals relevant to the career path
Tech Stack Relevance Score
15%
Relevance of the user's technologies to the target role
AI Automation Resilience
10%
Resilience after accounting for estimated automation risk
Project Complexity Score
15%
Evidence of practical experience through project work
Total
100%

Let all component scores be normalized to a range from 0 to 100. If A is the AI automation-risk score, automation resilience is represented as 100 - A.
Readiness Score =
    0.30 × Skill Match
  + 0.15 × Learning Consistency
  + 0.15 × Market Demand
  + 0.15 × Tech Stack Relevance
  + 0.10 × (100 - AI Automation Risk)
  + 0.15 × Project Complexity
This is an assessment framework, not an objective guarantee of employability. Its usefulness depends on the quality, freshness, and coverage of the data supplied to it.
Missing-data awareness
The scoring implementation considers data coverage when deciding how to interpret an assessment. As configured in the project, coverage below 60% is insufficient for a full provisional score, while coverage of at least 60% but below complete coverage is treated as provisional. This distinction helps avoid presenting an assessment based on sparse information as fully reliable.
Where generative AI fits
The assessment workflow separates responsibilities:
Scoring engine: calculates the quantitative result using defined rules and weights.
AI service: helps interpret assessment context and generate human-readable analysis or recommendations.
API layer: validates requests, coordinates services and persistence, and returns results to the frontend.
Frontend: presents the assessment and makes the results actionable for the user.
This separation supports more predictable scoring, clearer testing boundaries, and easier maintenance.
System Architecture
flowchart TD
    U[User] --> UI[React Frontend]
    UI -->|HTTP / REST API| API[Express Backend]
    API --> AUTH[JWT Authentication and Request Validation]
    AUTH --> DB[(MongoDB / Mongoose)]
    AUTH --> SCORE[Career Scoring Service]
    AUTH --> AI[Gemini AI Service]
    AUTH --> MARKET[Market Data Service]
    SCORE --> RESULT[Assessment and Recommendations]
    AI --> RESULT
    MARKET --> SCORE
    RESULT --> API
    API --> UI
Example request lifecycle
When a user starts a career assessment, the frontend submits the required information to the backend. The API authenticates the request where required, validates the input, and coordinates the relevant profile data and assessment services. The scoring service calculates the weighted result and coverage status. The AI service can then contribute contextual analysis, subject to its response validation and timeout handling. The backend returns a structured response for the React interface to display.
The exact sequence of database reads, writes, and AI calls depends on the endpoint and workflow being executed.
Technology Stack
Layer
Technologies
Responsibility
Frontend
React, React Router, Axios
User interface, navigation, and API requests
Styling
CSS, Tailwind CSS tooling
Application styling and responsive UI development
Backend
Node.js, Express.js
REST endpoints and application logic
Database
MongoDB, Mongoose
Persistence and data modeling
Authentication
JSON Web Tokens (JWT), bcryptjs
Token-based access control and password hashing
Generative AI
Google Gemini integration
AI-assisted analysis and career recommendations
Market signals
Market-data service
Encapsulation of career-market telemetry and related signals
Containers
Docker, Docker Compose
Repeatable development and service orchestration
Testing
Node.js test runner
Unit and API-level regression tests
Version control
Git, GitHub
Source history and collaboration
Project Structure
ai-career-copilot-main/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Shared UI components
│   │   ├── config/            # Frontend configuration
│   │   ├── pages/             # Dashboard, profile, progress, tasks, etc.
│   │   ├── App.js
│   │   └── index.js
│   ├── dockerfile
│   └── package.json
├── server/
│   ├── services/
│   │   ├── careerScoring.js   # Weighted assessment and coverage logic
│   │   ├── geminiService.js   # Generative AI integration
│   │   └── marketData.js      # Market-related signals
│   ├── tests/                 # Scoring, API, persistence, and JWT tests
│   ├── server.js              # Express app, API routes, and data models
│   ├── .env.example           # Environment variable template
│   ├── dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
Getting Started
Prerequisites
For a local, non-containerized setup, install:
Node.js and npm
MongoDB running locally or a MongoDB connection URI
A Gemini API key if you want to use AI functionality that requires it
Git (optional, for cloning the repository)
1. Get the source code
git clone <your-repository-url>
cd ai-career-copilot-main
If you downloaded the source as a ZIP, extract it and open a terminal in the extracted ai-career-copilot-main directory.
2. Configure the backend
cd server
npm install
cp .env.example .env
Open server/.env and set the values for your environment. At minimum, configure a valid MongoDB URI and a strong JWT secret. Add the Gemini API key if required by the AI features you want to run.
3. Start the backend
From the server directory:
npm run dev
The backend uses port 5000 by default. Keep this terminal open while using the frontend.
4. Start the frontend
Open a second terminal from the project root:
cd client
npm install
npm start
The React development server normally runs at http://localhost:3000. Check client/src/config/api.js and make sure its API base URL matches the backend address and port used in your environment.
Environment Configuration
The backend reads configuration from server/.env. The repository includes server/.env.example as a template.
Variable
Purpose
Example / default
PORT
Backend listening port
5000
MONGO_URI
MongoDB connection URI
mongodb://localhost:27017/ai-career
JWT_SECRET
Secret used to sign and verify JWTs
Use a long, random secret; do not use the example value in production
AI_TIMEOUT_MS
Timeout for AI requests
20000
GEMINI_API_KEY
Credential for Gemini API access, when needed
Obtain from Google's AI developer tooling; keep server-side
MARKET_DATA_API_KEY
Optional market-data provider credential
Provider-specific
ADZUNA_APP_ID
Optional Adzuna application ID
Provider-specific
ADZUNA_APP_KEY
Optional Adzuna application key
Provider-specific
Only configure third-party provider credentials that are supported and required by your chosen configuration. Never commit a real .env file, API key, database credential, or production JWT secret to source control.
Run with Docker Compose
The repository includes a docker-compose.yml file for the backend, frontend, and MongoDB services.
Create server/.env using server/.env.example as a starting point.
Review the environment values and port mappings in docker-compose.yml.
From the repository root, run:
docker compose up --build
To run the services in the background:
docker compose up --build -d
To stop the services:
docker compose down
The Compose configuration maps the backend container's port 5000 to host port 5001, the frontend to host port 3000, and MongoDB to host port 27017. MongoDB data is stored in the named mongo-data volume. Verify the frontend API base URL and the environment values in the Compose file before using the containerized setup; local and container network addresses are not interchangeable.
API Overview
The Express server exposes routes for authentication, career profiles, skills, projects, assessments, learning activity, roadmaps, and role/risk analysis. Protected routes require the authentication token expected by the backend middleware.
Method
Endpoint
Purpose
POST
/api/signup
Create an account
POST
/api/login
Authenticate a user
GET
/api/profile
Retrieve the authenticated user's profile
GET
/api/progress
Retrieve learning progress
GET / PUT
/api/career-profile
Read or update career profile information
PUT
/api/career-skills
Update career skills
POST
/api/career-requirements/analyze
Analyze career requirements
PUT
/api/career-requirements
Update career requirements
POST
/api/career-projects/evaluate
Evaluate project experience
PUT
/api/career-projects
Update project information
GET / POST
/api/learning-sessions
Read or record learning sessions
DELETE
/api/learning-sessions/:id
Delete a learning session
PUT
/api/learning-goals
Update learning goals
GET / POST
/api/career-assessment
Retrieve or run a career assessment
GET / POST
/api/career-roadmap / /api/career-roadmap/generate
Retrieve or generate a career roadmap
POST
/api/career-roadmap/sync-tasks
Synchronize roadmap tasks
POST
/api/predict-risk
Run a career-risk analysis workflow
POST
/api/compare-roles
Compare career roles
POST
/api/generate-roadmap
Generate a roadmap through the corresponding workflow
This table is a quick orientation, not a substitute for inspecting request schemas and middleware in server/server.js. Endpoint authentication requirements and payload formats should be verified against the implementation before integrating another client.
Security and Reliability
The project includes several practices intended to make an AI-enabled application more robust:
Password hashing: bcryptjs is used rather than storing plain-text passwords.
JWT-based authentication: protected API routes can associate requests with an authenticated user.
Server-side secrets: third-party API keys and the JWT signing secret belong in backend environment variables, not in frontend source code.
AI timeout handling: a configurable timeout helps prevent an external model request from holding a workflow indefinitely.
Structured response handling: AI output needs parsing and validation before application logic relies on it.
Deterministic scoring: weighted calculations are maintained in a dedicated service and can be tested independently of AI output.
Missing-data awareness: coverage handling helps distinguish incomplete input from a more complete assessment.
Regression tests: test files cover scoring logic, API behavior, MongoDB persistence, and JWT-related behavior.
These are application-level safeguards, not a claim of a formal security audit. Before production deployment, review authorization and input validation on every route, configure CORS for trusted origins, rotate secrets, add rate limiting and operational monitoring, and verify how sensitive user data is stored and logged.
Testing
The backend defines a test script using Node.js's built-in test runner. From the server directory, run:
npm test
The test suite includes:
tests/careerScoring.test.js — scoring rules, weights, and edge cases.
tests/apiIntegration.test.js — API integration behavior.
tests/mongoPersistence.test.js — persistence-related behavior.
tests/securityJwt.test.js — JWT/security-related behavior.
Some integration tests may require environment configuration or a reachable test database. Use a dedicated test database rather than a production database when running persistence tests.
Deployment Notes
The application is structured so the frontend and backend can be deployed separately or run together through Docker Compose.
For a production deployment:
Build the React frontend for production and configure the correct backend API URL.
Deploy the Express API to a Node.js-compatible hosting environment or container platform.
Use a managed MongoDB deployment or another appropriately secured database environment.
Set secrets and environment variables through the hosting provider's secret-management settings.
Restrict CORS to the intended frontend origins and use HTTPS.
Configure logs, health checks, backups, monitoring, and resource limits.
Test the AI provider's rate limits, timeouts, failure modes, and cost before enabling it for real users.
The repository contains Dockerfiles and Compose configuration. A separate CI/CD workflow or hosting-provider configuration should be documented and versioned independently if it is added to the project.
Future Enhancements
Potential directions for continued development include:
More transparent score explanations showing how each input affects the final result.
Stronger provenance, timestamps, and confidence labels for market-demand data.
Personalized roadmap prioritization based on available study time and prerequisite dependencies.
Historical assessment comparisons and measurable progress milestones.
Broader integration tests and automated CI checks on every pull request.
Observability for latency, AI failures, provider costs, and assessment quality.
Accessibility improvements and expanded responsive testing.
User controls for exporting and deleting personal career data.
Contributing
Contributions, suggestions, and issue reports are welcome. A useful contribution should describe the problem it solves, include clear reproduction steps where relevant, and add or update tests when behavior changes.
Suggested workflow:
Fork the repository and create a focused feature branch.
Make the change and add tests for relevant behavior.
Run the backend test suite and any relevant frontend checks.
Open a pull request with a concise explanation of the change and its impact.
License
No explicit project license is included in this repository snapshot. Add a LICENSE file before describing the project as open source or granting reuse rights.
Pravida AI is built around a simple principle: career growth becomes more manageable when assessment, risk awareness, and consistent learning are connected in one feedback loop.
