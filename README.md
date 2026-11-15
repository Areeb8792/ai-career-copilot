# Pravida AI — AI Career Copilot

**Turn career uncertainty into an actionable growth plan.**

Pravida AI is an AI-assisted career intelligence application for learners and early-career professionals. It helps users describe their skills and project experience, assess alignment with a target role, identify development gaps, track learning activity, and turn assessment results into a structured roadmap.

The project combines a deterministic, explainable scoring engine with AI-generated qualitative analysis. The scoring engine owns the numeric calculations; the language model is used to interpret context and generate structured guidance.

[![License: MIT](https://img.shields.io/github/license/Areeb8792/ai-career-copilot)](./LICENSE)

- **Repository:** [Areeb8792/ai-career-copilot](https://github.com/Areeb8792/ai-career-copilot)
- **Maintainer:** Areeb Ali — [@Areeb8792](https://github.com/Areeb8792)
- **License:** MIT — see [LICENSE](./LICENSE)

> **Project status:** Pravida AI is an independently maintained application under active development. Features, scoring rules, and integrations may change. It is a career-planning aid, not a hiring decision system or a guarantee of employment outcomes.

## Table of contents

- [Problem and goals](#problem-and-goals)
- [Features](#features)
- [How the assessment works](#how-the-assessment-works)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [Run with Docker Compose](#run-with-docker-compose)
- [API overview](#api-overview)
- [Security and reliability](#security-and-reliability)
- [Testing](#testing)
- [Current limitations and roadmap](#current-limitations-and-roadmap)
- [Contributing](#contributing)
- [Maintainer and support](#maintainer-and-support)
- [License](#license)

## Problem and goals

Career planning involves more than selecting a job title. Learners need to understand the skills expected for a role, compare those expectations with their current experience, decide which gaps to address first, and maintain consistent progress.

Pravida AI brings those activities into one workflow:

1. **Build a profile:** record career goals, skills, proficiency levels, and projects.
2. **Assess readiness:** compare the profile with requirements for a target role.
3. **Understand gaps:** inspect skill alignment, technology relevance, project experience, and other assessment dimensions.
4. **Plan development:** use AI-assisted analysis to produce practical recommendations and a learning roadmap.
5. **Track progress:** record learning sessions and goals, then revisit the assessment as skills develop.

The goal is to make career guidance more transparent and actionable than a one-time generic quiz.

## Features

### Career profile and skill intelligence

Maintain a career profile with a target role, experience information, skills, proficiency levels, and project experience. The assessment uses this information as its input.

### Explainable career-readiness scoring

A centralized scoring service calculates a weighted result using explicit rules. Numeric scoring is kept separate from generative AI so that the calculations can be tested and reviewed independently.

### AI-assisted role and project analysis

The Gemini integration supports structured role-requirement analysis, project-rubric evaluation, automation-risk analysis, and gap-targeted roadmap generation. AI output supplements the scoring logic rather than replacing it.

### Learning goals and progress tracking

Record learning sessions and goals and use activity information as one input to the learning-consistency dimension.

### Authentication and protected user data

The backend provides account registration and login, password hashing, JWT-based authentication, and protected application routes.

### Containerized development

Dockerfiles and a Docker Compose configuration are provided for the frontend, backend, and MongoDB service.

## How the assessment works

### Scoring model

The current scoring model uses six dimensions:

| Dimension | Weight | Purpose |
|---|---:|---|
| Skill Match | 30% | Alignment between the user's skills and target-role requirements |
| Learning Consistency | 15% | Learning activity and consistency over time |
| Market Demand | 15% | Market-related signals for the selected career direction |
| Tech Stack Relevance | 15% | Relevance of the user's technologies to the target role |
| AI Automation Resilience | 10% | Resilience calculated as 100 minus the estimated automation-risk score |
| Project Complexity | 15% | Evidence of practical experience through project work |
| **Total** | **100%** | |

All component scores are normalized to a 0–100 range. If **A** is the AI automation-risk score:

~~~text
Readiness Score =
    0.30 × Skill Match
  + 0.15 × Learning Consistency
  + 0.15 × Market Demand
  + 0.15 × Tech Stack Relevance
  + 0.10 × (100 - AI Automation Risk)
  + 0.15 × Project Complexity
~~~

The scoring implementation uses a 60% model-weight coverage threshold. Assessments with insufficient coverage are not treated as complete; partially covered assessments are identified as provisional.

The scoring model is versioned in the implementation. The current model version is **1.0.0**.

### Where generative AI fits

The application separates responsibilities:

- **Scoring service:** calculates numeric scores using deterministic rules and weights.
- **Gemini service:** generates structured qualitative analysis and recommendations.
- **API layer:** validates requests, coordinates services and persistence, and returns structured results.
- **Frontend:** presents assessments and turns findings into actions.

AI-generated recommendations may be incomplete or inaccurate and should be reviewed by the user.

### Market-data note

The current market-data service includes heuristic baseline estimates and explicitly labels estimates when live market data is unavailable. A production-grade live job-board data integration is not yet implemented. Market-demand values should therefore be treated as directional indicators, not verified vacancy counts or investment-grade labor-market data.

## Architecture

~~~mermaid
flowchart TD
    U[User] --> UI[React Frontend]
    UI -->|HTTP / REST| API[Express Backend]
    API --> AUTH[JWT Authentication and Request Validation]
    AUTH --> DB[(MongoDB / Mongoose)]
    AUTH --> SCORE[Career Scoring Service]
    AUTH --> AI[Gemini AI Service]
    AUTH --> MARKET[Market Data Service]
    SCORE --> RESULT[Assessment Results]
    AI --> RESULT
    MARKET --> SCORE
    RESULT --> API
    API --> UI
~~~

### Assessment request lifecycle

1. The frontend sends assessment information to the backend.
2. The API validates the request and applies authentication where required.
3. The backend coordinates the relevant profile data and assessment services.
4. The scoring service calculates the weighted result and data-coverage status.
5. The Gemini service can add contextual analysis, subject to external-service availability, response parsing, and timeout handling.
6. The API returns a structured response for the frontend to display.

The exact sequence of reads, writes, and AI calls depends on the endpoint being used.

## Technology stack

| Layer | Technologies | Responsibility |
|---|---|---|
| Frontend | React 19, React Router, Axios | User interface, navigation, and API requests |
| Styling | CSS, Tailwind CSS tooling | Application styling |
| Backend | Node.js, Express 5 | REST API and application logic |
| Database | MongoDB, Mongoose | Persistence and data modeling |
| Authentication | JWT, bcryptjs | Token-based access control and password hashing |
| Generative AI | Google Gemini 2.5 Flash | AI-assisted analysis and recommendations |
| Containers | Docker, Docker Compose | Repeatable local development |
| Testing | Node.js built-in test runner | Unit and API-level regression tests |
| Version control | Git, GitHub | Source history and collaboration |

## Getting started

### Prerequisites

Install the following before running the application:

- Git
- Node.js and npm
- MongoDB, or use the MongoDB service in Docker Compose
- A Gemini API key for workflows that require Gemini-generated analysis

### 1. Clone the repository

~~~bash
git clone https://github.com/Areeb8792/ai-career-copilot.git
cd ai-career-copilot
~~~

### 2. Configure the backend

~~~bash
cd server
npm ci
cp .env.example .env
~~~

Edit **server/.env** and set a strong, unique JWT secret and a valid MongoDB connection URI. Add a Gemini API key when you intend to use AI workflows that require it.

### 3. Start the backend

From the **server** directory:

~~~bash
npm run dev
~~~

The backend uses port **5000** by default.

### 4. Start the frontend

Open a second terminal from the repository root:

~~~bash
cd client
npm ci
npm start
~~~

The frontend development server normally runs at **http://localhost:3000**. Check **client/src/config/api.js** and ensure its API base URL points to the backend address you are using.

## Environment configuration

The backend reads environment variables from **server/.env**.

| Variable | Purpose | Example or guidance |
|---|---|---|
| PORT | Backend listening port | 5000 |
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017/ai-career |
| JWT_SECRET | Secret used to sign and verify JWTs | Use a long, random secret of at least 16 characters |
| AI_TIMEOUT_MS | Timeout for Gemini requests | 20000 |
| GEMINI_API_KEY | Credential for Gemini AI functionality | Optional; required for workflows that call Gemini |
| MARKET_DATA_API_KEY | Reserved for a market-data provider integration | Provider-specific |
| ADZUNA_APP_ID | Reserved for Adzuna integration | Provider-specific |
| ADZUNA_APP_KEY | Reserved for Adzuna integration | Provider-specific |

Only configure provider credentials for integrations that are implemented and enabled in your environment. Never commit a real **.env** file, API key, database credential, or production JWT secret.

## Run with Docker Compose

The repository includes a Compose configuration for the frontend, backend, and MongoDB.

1. Create **server/.env** using **server/.env.example** as a starting point.
2. Set a secure JWT secret and review the environment values.
3. From the repository root, run:

~~~bash
docker compose up --build
~~~

Run the services in the background:

~~~bash
docker compose up --build -d
~~~

Stop the services:

~~~bash
docker compose down
~~~

The current Compose configuration binds services to the local loopback interface:

| Service | Host address |
|---|---|
| Frontend | http://127.0.0.1:3000 |
| Backend | http://127.0.0.1:5001 |
| MongoDB | 127.0.0.1:27017 |

MongoDB data is stored in the named **mongo-data** volume. Local and container network addresses are not interchangeable; use the correct backend URL for the environment in which the frontend is running.

## API overview

The Express backend exposes routes for authentication, career profiles, skills, projects, assessments, learning activity, roadmaps, and role/risk analysis.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/signup | Create an account |
| POST | /api/login | Authenticate a user |
| GET | /api/profile | Retrieve the authenticated user's profile |
| GET | /api/progress | Retrieve learning progress |
| GET / PUT | /api/career-profile | Read or update career profile information |
| PUT | /api/career-skills | Update career skills |
| POST | /api/career-requirements/analyze | Analyze career requirements |
| PUT | /api/career-requirements | Update career requirements |
| POST | /api/career-projects/evaluate | Evaluate project experience |
| PUT | /api/career-projects | Update project information |
| GET / POST | /api/learning-sessions | Read or record learning sessions |
| DELETE | /api/learning-sessions/:id | Delete a learning session |
| PUT | /api/learning-goals | Update learning goals |
| GET / POST | /api/career-assessment | Retrieve or run a career assessment |
| GET / POST | /api/career-roadmap and /api/career-roadmap/generate | Retrieve or generate a career roadmap |
| POST | /api/career-roadmap/sync-tasks | Synchronize roadmap tasks |
| POST | /api/predict-risk | Run a career-risk analysis workflow |
| POST | /api/compare-roles | Compare career roles |
| POST | /api/generate-roadmap | Generate a roadmap |

This table is a quick orientation, not a substitute for checking request schemas and middleware in **server/server.js**. Verify authentication requirements and payload formats against the implementation before integrating another client.

## Security and reliability

The application includes the following safeguards:

- **Password hashing:** bcryptjs is used rather than storing plain-text passwords.
- **JWT authentication:** protected routes can associate requests with an authenticated user.
- **Fail-closed secret validation:** the backend refuses to start when JWT_SECRET is missing, too short, or set to a known placeholder.
- **Rate limiting:** authentication, password-related, and AI request routes have rate limits.
- **CORS allowlist:** browser origins are restricted according to the configured environment.
- **Server-side credentials:** third-party API keys and JWT secrets belong in backend environment variables, not frontend source code.
- **AI timeout and response handling:** external model calls have a timeout and generated output is parsed before use.
- **Deterministic scoring:** weighted calculations are maintained in a dedicated service and can be tested independently of AI output.

These are application-level safeguards, not a claim of a formal security audit or certification. Before production use, review authorization and input validation across routes, configure trusted origins, rotate secrets, monitor the application, and verify how user data is stored and logged.

## Testing

The backend uses the Node.js built-in test runner. From the **server** directory, run:

~~~bash
npm test
~~~

The current test suite includes:

- **tests/careerScoring.test.js** — scoring rules, weights, and edge cases.
- **tests/apiIntegration.test.js** — API integration behavior.
- **tests/mongoPersistence.test.js** — persistence-related behavior.
- **tests/securityFailClosedAndAdversarial.test.js** — fail-closed and adversarial security cases.
- **tests/securityJwt.test.js** — JWT-related behavior.
- **tests/securityRemediation.test.js** — security remediation regression cases.

Some integration tests may require environment configuration or a reachable test database. Use a dedicated test database rather than a production database when running persistence tests.

## Current limitations and roadmap

The following are areas for continued work; they should not be interpreted as already completed features:

- Implement and validate a real external job-board data provider, with source attribution and timestamps.
- Improve provenance, freshness, and confidence labels for market-demand signals.
- Add more transparent explanations showing how each input affects a final score.
- Improve roadmap prioritization using available study time and prerequisite dependencies.
- Expand historical assessment comparisons and measurable progress milestones.
- Extend automated checks and integration coverage for frontend and backend changes.
- Improve observability for latency, AI failures, provider costs, and assessment quality.
- Continue accessibility and responsive-interface testing.
- Add and document user controls for exporting and deleting personal career data.

## Contributing

Contributions, bug reports, and suggestions are welcome.

For a useful issue, include:

- A clear description of the problem or proposed improvement.
- Reproduction steps and relevant logs for bugs.
- Expected behavior and actual behavior.
- Environment details where they affect the report.

For a pull request:

1. Fork the repository and create a focused feature branch.
2. Make the change and add or update tests where relevant.
3. Run the backend test suite and applicable frontend checks.
4. Open a pull request describing the problem, implementation, and impact.

Please do not include API keys, passwords, database credentials, personal user data, or other secrets in issues, commits, screenshots, or test fixtures.

## Maintainer and support

Pravida AI is maintained in the **Areeb8792/ai-career-copilot** repository.

- **Project maintainer:** Areeb Ali ([GitHub profile](https://github.com/Areeb8792))
- **Bug reports and feature proposals:** [GitHub Issues](https://github.com/Areeb8792/ai-career-copilot/issues)
- **Code contributions:** [GitHub Pull Requests](https://github.com/Areeb8792/ai-career-copilot/pulls)

Please use GitHub Issues for project-specific questions and reproducible bug reports so discussions and proposed fixes remain visible alongside the source code.

## License

Pravida AI is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for the complete terms.

Third-party packages and services used by the project remain subject to their respective licenses and terms.
