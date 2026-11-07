# ProjectPulse 🚀
### Multi-Tenant Student Project Management & Collaboration Platform
> Built strictly with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js). Designed for higher education institutions to streamline the end-to-end lifecycle of student capstone and course projects—from team formation and faculty supervision to Kanban tasks, milestone calendars, document version control, and real-time collaboration.

---

## 📑 Table of Contents
1. [Overview & Problem Solved](#-overview--problem-solved)
2. [Tech Stack](#-tech-stack)
3. [Multi-Tenant Security Architecture](#-multi-tenant-security-architecture)
4. [Roles & Permission Matrix](#-roles--permission-matrix)
5. [Monorepo Structure](#-monorepo-structure)
6. [Quick Start & Setup](#-quick-start--setup)
7. [Pre-Seeded Demo Credentials](#-pre-seeded-demo-credentials)
8. [Comprehensive API Reference](#-comprehensive-api-reference)
9. [Real-Time Socket.IO Events](#-real-time-socketio-events)
10. [Automated Testing & Acceptance](#-automated-testing--acceptance)
11. [Deployment Guide (Vercel + Render)](#-deployment-guide-vercel--render)

---

## 🎯 Overview & Problem Solved

College capstone and final-year projects frequently struggle with fragmented communication across WhatsApp groups and email threads, missed deadlines, lack of visibility into student task contribution, and overloaded faculty guides struggling to supervise dozens of teams.

**ProjectPulse** centralizes institutional project governance into a single secure platform:
- **Multi-Tenant Scoping:** Colleges operate with complete logical data isolation on a single database.
- **Team Formation & Join Codes:** Students form teams, generate 6-character join codes, and invite members.
- **Interactive Kanban Boards:** Real-time task board with drag-and-drop, priority flags, checklist criteria, and assignees.
- **Milestones & Interactive Calendar:** Visual timeline tracking with deadline change audits and progress calculation.
- **Faculty Supervision & Standups:** Faculty assignment approvals, weekly progress standups with blocker logs, and feedback.
- **Document Version Control:** Formal document submissions (Proposal, Requirements, Design, Reports, Final Submissions) with `v1`, `v2`, ... revision history and faculty approval workflows.
- **Discussions, Mentions & Alerts:** Project discussions with `@mention` alerts, hierarchical threads, and college-wide announcements.
- **Decoupled GitHub Integration (Phase 2):** Connect GitHub repositories, verify webhooks with HMAC-SHA256, auto-close tasks with commit triggers (e.g. `fixes TASK-001`), and simulate commits for live demos.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Tailwind CSS, Recharts, @dnd-kit (Kanban), FullCalendar, React Hook Form + Zod, react-hot-toast, Lucide React |
| **Backend** | Node.js (ES Modules), Express.js, Mongoose, Socket.IO |
| **Database** | MongoDB (Atlas compatible; automatic `MongoMemoryServer` fallback for offline testing/evaluation) |
| **Authentication** | Dual-Token JWT (15-min Access Token + 7-day Refresh Token in `httpOnly` secure cookie), bcrypt password hashing |
| **Validation** | Zod (strict validation middleware on all routes) |
| **Real-Time** | Socket.IO (scoped rooms: `user:{id}`, `project:{id}`, `college:{id}`) |
| **File Storage** | Multer disk storage (with Cloudinary adapter interface) |
| **Scheduling** | node-cron (automated daily deadline and overdue health inspections) |
| **Security** | Helmet, CORS whitelist, express-rate-limit, express-mongo-sanitize, HPP |
| **Testing** | Vitest + Supertest (Backend), Vitest + React Testing Library (Frontend) |

---

## 🔒 Multi-Tenant Security Architecture

ProjectPulse implements strict, database-level multi-tenancy:
1. **Shared Database, Isolated Records:** Every institutional document (Users, Departments, Projects, Teams, Tasks, Milestones, Documents, Comments, Notifications) contains an indexed `collegeId`.
2. **Request Processing Pipeline:**
   ```
   HTTP Request → JWT Authentication → Load User → Tenant Scoping Middleware (req.collegeId)
                → Global Role Guard → Project Membership Guard → Service Logic Scoped by collegeId
   ```
3. **Information Leakage Prevention (404 Policy):** When a user from College A attempts to view, query, or mutate a resource belonging to College B, the API returns **`404 Not Found`** (never `403 Forbidden`). Cross-tenant resources logically do not exist to foreign users.
4. **Super Admin Isolation:** Only `SUPER_ADMIN` accounts operate above individual colleges for platform management and college onboarding.

---

## 👥 Roles & Permission Matrix

ProjectPulse decouples **Global Roles** (stored on `User`) from **Project Roles** (stored on `TeamMember`), allowing a student to lead one capstone project while being a member of another.

| Action | Super Admin | College Admin | Faculty Guide | Team Leader | Team Member | Reviewer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Manage Colleges & System Health | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Departments & Users (Own College) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assign Faculty to Project | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Accept / Decline Project Supervision | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Edit Project Details, Milestones & Settings | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create, Assign & Delete Tasks | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Move Tasks on Kanban, Post Updates, Upload Docs | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Formal Document Reviews (Approve/Reject) | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| College Announcements Broadcast | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Project Discussions & Mention Team | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |

---

## 📂 Monorepo Structure

```
projectpulse/
├── client/                     # Frontend Single Page Application (React 18 + Vite)
│   ├── src/
│   │   ├── assets/             # Brand logos and static icons
│   │   ├── components/         # Common UI, Navigation, Topbar, Modals, ProtectedRoute
│   │   ├── context/            # AuthContext, SocketContext, ThemeContext
│   │   ├── hooks/              # Custom React hooks (auth, socket, responsive)
│   │   ├── pages/              # Role-specific & Shared views
│   │   │   ├── auth/           # Login, Register, Forgot/Reset Password
│   │   │   ├── super-admin/    # Colleges onboarding & platform metrics
│   │   │   ├── college-admin/  # Departments, Users, CSV bulk upload, Faculty assignments
│   │   │   ├── faculty/        # Supervision requests, Assigned projects, Document reviews
│   │   │   ├── student/        # Student dashboard, Join by code, Team workspace
│   │   │   ├── projects/       # Projects list, Creation wizard, ProjectWorkspaceShell & Tabs
│   │   │   │   └── tabs/       # Overview, Team, Kanban, Milestones, Supervision, Documents, Discussions, GitHub, Activity
│   │   │   └── shared/         # Profile, Notifications, 404
│   │   ├── routes/             # App router configuration
│   │   └── services/           # Axios domain API clients
│   └── vercel.json             # Vercel deployment SPA configuration
├── server/                     # Backend REST API + Socket.IO Server (Node.js ES Modules)
│   ├── src/
│   │   ├── config/             # Database, CORS, Socket.IO, Env configuration
│   │   ├── controllers/        # Thin controllers handling HTTP contracts
│   │   ├── integrations/       # Phase 2 GitHub module (strictly decoupled)
│   │   │   └── github/         # Models, services, controllers, routes, webhook verifier
│   │   ├── jobs/               # node-cron scheduled tasks (deadline & overdue audits)
│   │   ├── middleware/         # auth, tenant, role, validate, upload, errorHandler
│   │   ├── models/             # Mongoose schemas with compound multi-tenant indexes
│   │   ├── routes/             # Express v1 modular API routes
│   │   ├── seed/               # Database seed runner with demo accounts
│   │   ├── services/           # Reusable domain business logic
│   │   ├── utils/              # API response formatting, logger, async handler
│   │   ├── validators/         # Zod request payload schemas
│   │   ├── app.js              # Express app factory with security middlewares
│   │   └── server.js           # HTTP + WebSocket server launcher
│   ├── tests/                  # Integration test suites (105 tests across 9 files)
│   ├── Dockerfile              # Docker container configuration
│   └── render.yaml             # Render infrastructure-as-code deployment configuration
├── .env.example                # Root environment template
├── DECISIONS.md                # Engineering decisions, sprint changelogs & acceptance records
└── package.json                # Monorepo root scripts & workspaces
```

---

## ⚡ Quick Start & Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/projectpulse`) or MongoDB Atlas URI. *(Note: If MongoDB is not installed locally, the server automatically starts an embedded `MongoMemoryServer` fallback for hassle-free evaluation).*

### 2. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/projectpulse.git
cd projectpulse

# Install root, server, and client dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Configure Environment Variables
Copy `.env.example` into server and client directories:
```bash
# Copy template
cp .env.example server/.env
cp client/.env.example client/.env
```
*(Default values in `.env.example` work out of the box for local development).*

### 4. Launch the Application (Clean Production Ready)
You can launch the application directly on an empty database without any seed or mock data:
```bash
npm run dev
```
On first launch on a clean database, ProjectPulse automatically bootstraps the primary **Platform Super Admin** (`superadmin@projectpulse.edu` / `Password@123`). The administrator logs into `/login` to onboard institutions, colleges, departments, faculty, and project teams.

*(Optional)* If you wish to pre-populate sample institutions and test accounts for rapid evaluation, run:
```bash
npm run seed
```

- **Frontend Application:** http://localhost:5173
- **Backend API Gateway:** http://localhost:5000/api/v1
- **API Health Check:** http://localhost:5000/api/v1/health

---

## 🔑 Administrative Access & Setup

ProjectPulse works like a modern enterprise SaaS platform with an institutional onboarding pipeline:

### 1. Platform Super Admin (Clean DB Bootstrap)
| Setting | Default Value | Notes |
|---|---|---|
| **Email** | `superadmin@projectpulse.edu` | Configurable via `SUPER_ADMIN_EMAIL` in `.env` |
| **Password** | `Password@123` | Configurable via `SUPER_ADMIN_PASSWORD` in `.env` |
| **Role** | `SUPER_ADMIN` | Platform-wide institution onboarding & tenant oversight |

### 2. Institutional Onboarding Workflow
1. **Super Admin Log In:** Access http://localhost:5173/login using the Super Admin credentials.
2. **Onboard College:** Navigate to **Colleges** → **Add New College**. Specify College Name, unique College Code (e.g. `MIT`), allowed Email Domain (e.g. `mit.edu`), and initial College Administrator details.
3. **College Admin Setup:** The designated College Administrator signs in, creates Academic Departments (CSE, IT, ECE), and invites Faculty Guides.
4. **Student Self-Registration & Project Teams:** Students navigate to http://localhost:5173/register, select their college, and register. Once in their dashboard, students can create capstone projects, generate team join codes, build Kanban task boards, and request faculty supervision.
5. **No Mock Fallbacks:** Every dashboard (Student, Faculty, College Admin, Super Admin) binds directly to real-time MongoDB collections. When collections are newly created, UI surfaces sleek, empty-state call-to-actions.

---

## 📡 Comprehensive API Reference

All API routes are prefixed with `/api/v1` and return standardized JSON envelopes:
`{ "success": boolean, "message": string, "data": any, "errors": any }`

### 1. Authentication (`/api/v1/auth`)
- `POST /auth/register` – Register new student (validated against college email domain).
- `POST /auth/login` – Login user, returns access token + sets `httpOnly` refresh cookie.
- `POST /auth/refresh` – Rotate refresh token and issue new access token.
- `POST /auth/logout` – Clear session cookie and revoke refresh token.
- `GET  /auth/me` – Retrieve current authenticated user profile.
- `PATCH /auth/me` – Update user profile bio, skills, and phone.
- `GET  /auth/verify-email` – Verify email address via token.
- `POST /auth/forgot-password` – Request password reset token.
- `POST /auth/reset-password` – Reset password using token.

### 2. Super Admin & Governance (`/api/v1/colleges`, `/api/v1/admin`)
- `GET  /colleges` – List colleges (public active colleges or super admin all).
- `POST /colleges` – Onboard a new college and initial College Admin (Super Admin only).
- `PATCH /colleges/:id/status` – Activate or suspend a college.
- `GET  /admin/stats` – College metrics (total students, faculty, projects, completed).

### 3. Departments & Users (`/api/v1/admin/departments`, `/api/v1/admin/users`)
- `GET  /admin/departments` – List departments in college.
- `POST /admin/departments` – Create academic department.
- `PATCH /admin/departments/:id` – Update department details.
- `DELETE /admin/departments/:id` – Delete department (blocked if users assigned).
- `GET  /admin/users` – List college users with filters (role, department, search).
- `POST /admin/users` – Create faculty or student account.
- `POST /admin/users/bulk` – Bulk import students via CSV.
- `PATCH /admin/users/:id/status` – Toggle user active/deactivated status.

### 4. Projects & Teams (`/api/v1/projects`)
- `GET  /projects` – List accessible projects with filters (active, explore, archived).
- `POST /projects` – Create project (auto-generates project code and 6-char join code).
- `GET  /projects/:id/overview` – Full workspace overview, health, metrics, and role.
- `PATCH /projects/:id` – Update project metadata (leader only).
- `PATCH /projects/:id/deadline` – Update deadline with mandatory audit reason.
- `POST /projects/join` – Request to join a project via 6-character team join code.
- `POST /projects/:id/invitations/respond` – Accept or reject join request.
- `POST /projects/:id/team/transfer-leader` – Transfer project leadership.
- `DELETE /projects/:id/team/:userId` – Remove team member (blocked if sole leader).
- `POST /projects/:id/team/regenerate-code` – Regenerate team join code.
- `GET  /projects/:id/activity` – Project audit event feed.

### 5. Tasks & Kanban Board (`/api/v1/projects/:id/tasks`, `/api/v1/tasks/:id`)
- `GET  /projects/:id/tasks` – List tasks with assignees and checklist items.
- `POST /projects/:id/tasks` – Create task (`TASK-001`, `TASK-002`, ...).
- `GET  /tasks/:id` – Get single task details.
- `PATCH /tasks/:id` – Edit task details, checklist criteria, assignees.
- `PATCH /tasks/:id/status` – Move task status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`).
- `PATCH /projects/:id/tasks/reorder` – Reorder tasks within Kanban columns.
- `DELETE /tasks/:id` – Delete task (leader only).

### 6. Milestones & Interactive Calendar (`/api/v1/projects/:id/milestones`, `/api/v1/calendar`)
- `GET  /projects/:id/milestones` – List project milestones with computed completion %.
- `POST /projects/:id/milestones` – Create milestone with deliverables and target dates.
- `PATCH /projects/:id/milestones/:id` – Update milestone details.
- `PATCH /projects/:id/milestones/:id/deadline` – Reschedule milestone with audit log.
- `PATCH /projects/:id/milestones/:id/status` – Update milestone status.
- `DELETE /projects/:id/milestones/:id` – Delete milestone.
- `GET  /calendar` – Aggregated user calendar events (milestones, task deadlines).

### 7. Faculty Supervision & Standups (`/api/v1/projects/:id/supervision`, `/api/v1/faculty`)
- `POST /projects/:id/supervision/request` – Team requests faculty supervision.
- `GET  /faculty/supervision-requests` – Faculty guide reviews pending requests.
- `POST /faculty/supervision-requests/:id/respond` – Accept or reject supervision.
- `GET  /faculty/assigned-projects` – Faculty dashboard of supervised projects.
- `POST /admin/projects/:id/assign-faculty` – College Admin manual faculty assignment.
- `GET  /projects/:id/standups` – List weekly standups and meeting notes.
- `POST /projects/:id/standups` – Submit weekly standup (blockers, next steps).
- `POST /projects/:id/feedback` – Faculty guide submits formal project feedback.

### 8. Documents & Version History (`/api/v1/projects/:id/documents`)
- `GET  /projects/:id/documents` – List documents grouped by category.
- `POST /projects/:id/documents` – Upload initial version (`v1`) via multipart/form-data.
- `POST /projects/:id/documents/:id/versions` – Upload revision (`v2`, `v3`, ...).
- `PATCH /projects/:id/documents/:id/status` – Faculty review (`APPROVED`, `CHANGES_REQUESTED`).
- `DELETE /projects/:id/documents/:id` – Delete document (blocked if `APPROVED`).

### 9. Discussions, Comments & Notifications (`/api/v1/notifications`, `/api/v1/announcements`)
- `GET  /notifications` – Paginated alerts with unread counter.
- `PATCH /notifications/:id/read` – Mark individual notification read.
- `PATCH /notifications/read-all` – Mark all user notifications read.
- `GET  /announcements` – College-wide and project announcements feed.
- `POST /announcements` – Post announcement (role-gated: Admin or Leader).
- `GET  /projects/:id/comments` – Comment threads for tasks or project discussions.
- `POST /projects/:id/comments` – Post comment with `@mention` parsing and replies.
- `DELETE /projects/:id/comments/:id` – Delete comment (author or leader).

### 10. Phase 2 GitHub Integration (`/api/v1/projects/:id/github`)
- `GET  /projects/:id/github/status` – Get connected repository status and stats.
- `POST /projects/:id/github/connect` – Connect repository with auto-generated webhook secret.
- `DELETE /projects/:id/github/disconnect` – Disconnect repository.
- `GET  /projects/:id/github/events` – Paginated commit and PR event log.
- `POST /projects/:id/github/webhook` – Ingest GitHub webhook (HMAC-SHA256 verified).
- `POST /projects/:id/github/simulate-push` – Local simulation for presentations.

---

## ⚡ Real-Time Socket.IO Events

| Event Name | Direction | Room Scope | Payload | Description |
|---|---|---|---|---|
| `task:status_changed` | Server → Client | `project:{projectId}` | `{ taskId, status, progress }` | Instant Kanban column moves |
| `task:created` | Server → Client | `project:{projectId}` | `{ task }` | New task added to board |
| `comment:new` | Server → Client | `project:{projectId}` | `{ comment }` | Live discussion stream append |
| `notification:new` | Server → Client | `user:{userId}` | `{ notification }` | Live notification bell popup |
| `announcement:new` | Server → Client | `college:{collegeId}` | `{ announcement }` | Institutional banner broadcast |
| `github:event` | Server → Client | `project:{projectId}` | `{ event, autoClosedTasks }` | Webhook commit and task closure |
| `activity:new` | Server → Client | `project:{projectId}` | `{ activity }` | Workspace audit timeline update |

---

## 🧪 Automated Testing & Acceptance

ProjectPulse is built with test-driven discipline across all 9 core sprints.

### Run All Backend Integration Tests (105 Tests)
```bash
npm --prefix server run test
```
**Test Suites Breakdown:**
1. `tests/auth.test.js` (13 tests) – Registration, dual-token JWT rotation, domain rules, college suspension.
2. `tests/management.test.js` (14 tests) – College onboarding, departments, CSV bulk student import, RBAC.
3. `tests/project.test.js` (15 tests) – Project codes, join codes, leadership transfer, 404 tenant isolation.
4. `tests/task.test.js` (13 tests) – Kanban ordering, auto-progress calculation, task code sequencing.
5. `tests/milestone.test.js` (8 tests) – Milestone completion %, deadline extension audit history.
6. `tests/supervision.test.js` (10 tests) – Faculty guide requests, supervisor limits, weekly standups.
7. `tests/document.test.js` (10 tests) – Multipart upload, version incrementing, faculty review workflow.
8. `tests/notification_comment.test.js` (12 tests) – Mention alerts, threaded comments, announcements.
9. `tests/github_integration.test.js` (10 tests) – HMAC verification, commit task closure, push simulation.

**Result:** `105 / 105 passed (100%)`

### Run Frontend Unit Tests
```bash
npm --prefix client run test
```
**Result:** `4 / 4 passed`

### Run Frontend Production Build
```bash
npm --prefix client run build
```
**Result:** Built cleanly in Vite with zero compilation errors.

---

## 🚀 Deployment Guide (Vercel + Render)

### 1. Frontend Deployment to Vercel
1. Push repository to GitHub.
2. Link repository in [Vercel](https://vercel.com).
3. Set **Root Directory** to `client`.
4. Ensure **Framework Preset** is `Vite`.
5. Configure Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com/api/v1`
   - `VITE_SOCKET_URL`: `https://your-backend.onrender.com`
6. Deploy! The included [`client/vercel.json`](file:///d:/Fsd_project_2/client/vercel.json) handles client-side routing automatically.

### 2. Backend Deployment to Render
1. In [Render Dashboard](https://dashboard.render.com), create a new **Web Service**.
2. Connect your repository and select **Root Directory** as `server`.
3. Set **Runtime** to `Node` and **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGO_URI`: Your MongoDB Atlas connection URI (`mongodb+srv://...`)
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
   - `JWT_ACCESS_SECRET`: Generate a secure random 64-char hex string
   - `JWT_REFRESH_SECRET`: Generate a secure random 64-char hex string
   - `COOKIE_SECRET`: Generate a secure random 64-char hex string
   - `STORAGE_DRIVER`: `local` (or `cloudinary` if cloud storage configured)
6. Click **Deploy Web Service**. Render reads the provided [`render.yaml`](file:///d:/Fsd_project_2/render.yaml) or Dockerfile.

---

## 📄 License & Academic Integrity
Developed as a production-quality full-stack academic capstone project. Free to use, adapt, and build upon for institutional research and student learning.

