# ApplyTrack

ApplyTrack — Full Build Plan (Tech Lead Handoff)
Role assumption: ApplyTrack is a job application tracking system. Users log jobs they've applied to, track status (Applied → Interview → Offer/Rejected), set follow-up reminders, and optionally get AI help (e.g., match resume to job description, summarize a JD, draft a follow-up email).
Open Decisions (Placeholders — pick or I'll use the default)
#
Question
Default I'm assuming
1
Single-user or multi-tenant (multiple people, orgs)?
Single-user per account (simpler auth, no org/role complexity) — multi-tenant is a stretch module
2
Notifications: email, in-app only, or both?
In-app only for MVP; email is a stretch module (teaches you queues + SMTP)
3
AI feature scope?
JD summarizer + "match score" against your resume text (one Claude/OpenAI API call, no fine-tuning)
4
Deploy target?
AWS, using ECS Fargate (container-native, avoids raw EC2 sysadmin work)
5
Mobile needed?
No — responsive web only


Change any of these and the plan below adjusts easily — just tell me.


Tech Stack Summary
Layer
Choice
Why
Frontend
React + Vite + TypeScript
You already know React; TS teaches you type discipline used in enterprise codebases
Backend
Node.js + Express + TypeScript
Same language as frontend = faster ramp; TS on backend is now the enterprise default
Database
PostgreSQL + Prisma ORM
Relational data (users → applications → events) fits SQL well; Prisma teaches migrations properly
Auth
JWT (access + refresh tokens)
Core auth pattern used everywhere
Background jobs
BullMQ + Redis
Teaches queues — used for reminders, AI calls, email
AI
Anthropic API (or OpenAI)
Single API call integration, no model training needed
Containers
Docker + docker-compose
Local parity with production
CI/CD
GitHub Actions
Free, ubiquitous, teaches pipeline concepts
Cloud
AWS (ECS Fargate, RDS, ECR, S3, CloudWatch)
Industry-standard managed services
IaC
Terraform (stretch)
Teaches infra-as-code once manual AWS setup is understood
Monitoring
CloudWatch + basic health checks (Prometheus/Grafana as stretch)
Observability is a core enterprise skill



MODULE 0 — Project Foundation
Goal: Repo, structure, and tooling in place before writing features.

What it does: Nothing user-facing yet — this is scaffolding.

Tech/tools:

Git + GitHub (monorepo: /frontend, /backend)
Node.js LTS, npm/pnpm
ESLint + Prettier
.env + .env.example pattern for config

Enterprise concepts learned:

Monorepo vs polyrepo tradeoffs
12-factor app config (env vars, not hardcoded secrets)
Git branching basics (main + feature branches)

Effort: ~2-3 hours. Prerequisite for everything.

Deliverable: Empty repo with /frontend (Vite React+TS) and /backend (Express+TS) both running "Hello World", linting configured, .env.example committed.


MODULE 1 — Database & Data Modeling
Goal: Design the schema before building on top of it.

What it does: Defines Users, JobApplications, StatusEvents (history log), Reminders.

Tech/tools:

PostgreSQL (run locally via Docker for now)
Prisma ORM + Prisma Migrate

Core schema (starting point):

User (id, email, password_hash, created_at)

JobApplication (id, user_id, company, role, job_url, status, resume_version, created_at)

StatusEvent (id, application_id, from_status, to_status, note, created_at)

Reminder (id, application_id, due_date, message, done)

Enterprise concepts learned:

Relational schema design, foreign keys, normalization
Migrations (versioned schema changes — critical enterprise skill)
Why an event/history table (StatusEvent) matters — this is a light taste of event sourcing thinking (state changes are logged, not just overwritten)

Effort: ~1 day. Depends on Module 0.

Deliverable: Prisma schema file, first migration run successfully against local Postgres in Docker, seed script with fake data.


MODULE 2 — Core Backend API (CRUD)
Goal: REST API for applications, no auth yet.

What it does: Create/read/update/delete job applications; log status changes to StatusEvent automatically.

Tech/tools:

Express + TypeScript
Prisma Client
Zod (or similar) for request validation

Enterprise concepts learned:

REST API design (resource naming, status codes, pagination)
Input validation at the boundary (never trust client input)
Layered architecture: routes → controllers → services → data access (separation of concerns)
Error handling middleware (centralized, consistent error shape)

Effort: ~2-3 days. Depends on Module 1.

Deliverable: Working API tested via Postman/Thunder Client — POST /applications, GET /applications, PATCH /applications/:id/status, DELETE /applications/:id.


MODULE 3 — Authentication
Goal: Secure the API; each user only sees their own data.

What it does: Signup, login, JWT issuance, protected routes.

Tech/tools:

bcrypt (password hashing)
JWT (access token, short-lived) + refresh token pattern
Middleware for route protection

Enterprise concepts learned:

Password hashing/salting — never store plaintext
Stateless auth via JWT vs session-based auth (know the tradeoff)
Authorization vs authentication (is this user allowed to touch this record?)
Token expiry & refresh flow — a real enterprise auth pattern

Effort: ~2 days. Depends on Module 2.

Deliverable: /auth/signup, /auth/login, /auth/refresh working; all /applications routes now require a valid token and are scoped to user_id.


MODULE 4 — Frontend Integration
Goal: Connect your React app to the real API.

What it does: Login/signup forms, dashboard listing applications, add/edit/delete UI, status Kanban-style view (optional nice-to-have).

Tech/tools:

React Query (or TanStack Query) for API state management
Axios or fetch wrapper
React Router
Basic UI library (shadcn/ui or Tailwind) — your choice, you know frontend already

Enterprise concepts learned:

Client-server contract discipline (typed API responses shared or mirrored between FE/BE)
Handling auth tokens on the client (storage, refresh, logout)
Optimistic UI updates vs waiting for server confirmation

Effort: ~3-4 days. Depends on Module 3. (You'll move fastest here — it's your existing skill.)

Deliverable: Fully working local app: signup → login → add job → see it listed → change status → see history.


MODULE 5 — Background Jobs (Reminders + AI calls)
Goal: Move slow/async work off the request-response cycle.

What it does: When a user sets a reminder, a background worker checks due reminders; AI summarization runs as a queued job instead of blocking the API response.

Tech/tools:

Redis (queue backend)
BullMQ (job queue library)
A separate worker process from your API process

Enterprise concepts learned:

Why you don't do slow work (AI calls, emails) inline in an HTTP request
Producer/consumer pattern, queues, retries, dead-letter handling
Running multiple processes (API + worker) — a first taste of splitting a monolith into services

Effort: ~2 days. Depends on Module 3 (needs auth/data model in place).

Deliverable: Adding a reminder enqueues a job; a worker process (visible in separate terminal/logs) picks it up and marks it done at the right time. Bonus: AI "summarize this JD" button enqueues a job instead of blocking the UI.


MODULE 6 — AI Feature Integration
Goal: The actual AI-powered feature.

What it does: Paste a job description → get a summary + a rough "match score" against a stored resume text blob.

Tech/tools:

Anthropic API (Claude) or OpenAI API
Prompt template stored server-side (never trust client-constructed prompts for anything sensitive)

Enterprise concepts learned:

Calling third-party APIs safely (timeouts, retries, error handling, rate limits)
Prompt engineering basics (structured prompts, asking for JSON output)
Cost awareness (token usage, why you cache/avoid redundant calls)

Effort: ~1-2 days. Depends on Module 5 (runs as background job).

Deliverable: End-to-end: paste JD → job queued → summary + match score appear in UI within a few seconds.


MODULE 7 — Containerization
Goal: Package everything to run identically anywhere.

What it does: Dockerize API, worker, and (optionally) frontend; docker-compose runs the whole stack (API + worker + Postgres + Redis) with one command.

Tech/tools:

Docker
docker-compose

Enterprise concepts learned:

Why containers solve "works on my machine"
Multi-stage Docker builds (small production images)
Service orchestration basics via compose (multiple containers, networking between them)

Effort: ~1-2 days. Depends on Modules 2-5 being functional.

Deliverable: docker-compose up starts the entire stack from a clean machine with zero manual setup.


MODULE 8 — CI/CD Pipeline
Goal: Automate testing and building on every push.

What it does: On push to main: run lint, run tests, build Docker images, push to a container registry.

Tech/tools:

GitHub Actions
AWS ECR (Elastic Container Registry) for image storage

Enterprise concepts learned:

CI (continuous integration): catch problems before merge
CD (continuous delivery): automate the path to deployable artifacts
Pipeline-as-code (YAML workflows)
Secrets management in CI (GitHub Secrets, never hardcoded)

Effort: ~1-2 days. Depends on Module 7.

Deliverable: A GitHub Actions workflow that turns green on push, and a Docker image visible in your AWS ECR repo.


MODULE 9 — Cloud Deployment (AWS)
Goal: Get ApplyTrack live on the internet.

What it does: Deploys API + worker containers to ECS Fargate, database to RDS, static frontend to S3+CloudFront.

Tech/tools:

AWS ECS (Fargate) — runs your containers without managing servers
AWS RDS (Postgres) — managed database
AWS ElastiCache (Redis) or a small Redis container in ECS
S3 + CloudFront — frontend hosting + CDN
AWS IAM — least-privilege roles for each service
AWS Secrets Manager — DB password, JWT secret, API keys

Enterprise concepts learned:

Separation of compute, storage, and networking concerns
IAM least-privilege principle (each service only gets the permissions it needs)
Managed services vs self-hosted tradeoffs (why RDS instead of Postgres-in-a-container in prod)
Environment separation (dev vs prod config)

Effort: ~3-5 days (this is the steepest learning curve — expect friction, that's normal). Depends on Module 8.

Deliverable: ApplyTrack is live at a public URL, using managed AWS services, deployed via your CI/CD pipeline.


MODULE 10 — Observability & Monitoring
Goal: Know when something breaks before your user tells you.

What it does: Health check endpoints, structured logging, basic dashboards/alerts.

Tech/tools:

CloudWatch Logs + Alarms (built into AWS, easiest starting point)
Structured logging (JSON logs via pino or winston)
/health and /ready endpoints

Enterprise concepts learned:

The three pillars: logs, metrics, traces
Structured logging vs console.log (searchable, machine-parseable)
Alerting thresholds (what's worth waking someone up for)

Effort: ~1-2 days. Depends on Module 9 (needs something live to monitor).

Deliverable: A CloudWatch dashboard showing request count/error rate, and an alarm that fires (test it) if the API goes down.


MODULE 11 — Security Hardening
Goal: Close the obvious gaps before calling it "production-ready."

What it does: Rate limiting, CORS lockdown, dependency scanning, HTTPS enforcement.

Tech/tools:

express-rate-limit
CORS configured to allow only your frontend origin
npm audit / GitHub Dependabot
AWS Certificate Manager for HTTPS

Enterprise concepts learned:

Defense in depth (no single point of failure for security)
OWASP Top 10 awareness (injection, broken auth, etc. — at least know the categories)
Dependency vulnerability management

Effort: ~1-2 days. Depends on Module 9.

Deliverable: A short security checklist you personally verified against your live app.


MODULE 12 — Scaling & Advanced Patterns (Stretch Goals)
Goal: Concepts to know exist, not necessarily to fully implement in "a few weeks."

Pick based on interest, don't feel obligated to do all:

Concept
What you'd build
Why it matters
Caching
Redis cache for frequent reads (e.g., dashboard stats)
Reduces DB load, teaches cache invalidation
Infrastructure as Code
Rewrite Module 9's manual AWS setup in Terraform
Reproducible, version-controlled infra
Kubernetes
Run the same containers on local minikube instead of ECS
Understand pods/services/deployments hands-on
Multi-tenancy
Add "Organization" concept, role-based access
Common in B2B SaaS
CQRS-lite
Separate read models (dashboard aggregates) from write models
Useful when reads/writes have very different shapes
Load testing
Use k6 or autocannon against your deployed API
Understand where your app actually breaks



Compressed Timeline (targeting "a few weeks")
Week
Modules
Focus
1
0, 1, 2, 3
Backend foundation: schema, CRUD API, auth
2
4, 5, 6
Frontend integration, background jobs, AI feature
3
7, 8, 9
Docker, CI/CD, deploy live to AWS
4 (buffer/stretch)
10, 11, + pick 1 from Module 12
Monitoring, security, one advanced concept


Non-negotiable core (MVP, weeks 1-3): Modules 0-9. That alone gets you a live, working, AI-integrated full-stack app on real cloud infra — genuinely enterprise-representative.

If time runs short: cut Module 6 (AI) down to a synchronous call instead of queued, and treat Module 12 entirely as "read about it" rather than "build it."


How to Use This Plan
Work module by module, in order — each deliverable should actually run before you move on. When you finish a module, come back and tell me what you built; I'll review your approach, catch anti-patterns early (the way a real tech lead would), and hand you the next module's specifics (file structure, code review, whatever you need).

