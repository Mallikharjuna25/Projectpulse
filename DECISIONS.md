# ProjectPulse – Architectural Decisions & System Design Log (DECISIONS.md)

This living document records all architectural choices, technical decisions, multi-tenant data isolation rules, and implementation records across all sprints of **ProjectPulse**.

---

## 10. Sprint 8 – Discussions, Comments & System Notifications

### 10.1 Scope & Delivered Features
- [x] Database Models & Schema Constraints:
  - `Comment`: `collegeId`, `projectId`, `entityType` (`TASK`, `PROJECT`, `DISCUSSION`, `ANNOUNCEMENT`), `entityId`, `author`, `body`, `mentions` array of User references, `parentId` (hierarchical threads). Compound indexes on `(collegeId, projectId)` and `(entityType, entityId, createdAt: 1)`.
  - `Notification`: `collegeId`, `userId`, `type` (`TASK_ASSIGNED`, `TASK_STATUS`, `MILESTONE_DUE`, `DOCUMENT_REVIEW`, `FACULTY_REQUEST`, `COMMENT_MENTION`, `ANNOUNCEMENT`, `GENERAL`), `title`, `message`, `link`, `isRead`. Compound indexes on `(userId, isRead, createdAt: -1)` and `(collegeId, userId)`.
  - `Announcement`: `collegeId`, `projectId` (null = college-wide), `authorId`, `title`, `body`, `pinned`. Compound indexes on `(collegeId, projectId, createdAt: -1)` and `(collegeId, pinned, createdAt: -1)`.
- [x] Notification & Real-Time Pipeline (`server/src/services/notificationService.js`):
  - System notification creation with instant Socket.IO push to `user:${userId}` personal room.
  - Paginated user notifications retrieval with real-time `unreadCount` badge tally.
  - Individual and bulk `markAllAsRead` endpoints.
- [x] Commenting & Mention Services (`server/src/services/commentService.js`):
  - Mention parser: extracts `@name` or explicit user mentions, validates users within tenant college, creates `COMMENT_MENTION` notifications.
  - Hierarchical replies: parent comment references supporting threaded conversations.
  - Socket.IO broadcast: emits `'comment:new'` to `project:${projectId}` room for instant live append.
  - Permission checks: comment deletion restricted to original author, project leader, or college/super admin.
- [x] Institutional & Project Announcements (`server/src/services/announcementService.js`):
  - Role-gated publishing: College-wide broadcasts restricted to `COLLEGE_ADMIN` or `SUPER_ADMIN`; project announcements permitted for project leaders and faculty guides.
  - Real-time broadcast: emits `'announcement:new'` to `college:${collegeId}` or `project:${projectId}` rooms.
  - Pinning engine: prioritizes pinned announcements at the top of feeds.
- [x] Frontend UI Components:
  - `Topbar.jsx`: Real-time Notification Bell with live unread counter badge, animated dropdown popover with type-based iconography, single-click mark-as-read navigation, and "Mark all as read" button.
  - `NotificationsPage.jsx`: Filterable central alert dashboard (`ALL`, `UNREAD`, `READ`) with full pagination controls and deletion tools.
  - `DiscussionsTab.jsx`: Pinned announcement banner cards, interactive comment stream with quick `@mention` chips, inline threaded reply boxes, and real-time Socket.IO synchronization.
  - Integrated `/notifications` into `App.jsx` routing and `DiscussionsTab` into `ProjectWorkspaceShell.jsx`.
- [x] Automated Testing & Verification:
  - `server/tests/notification_comment.test.js`: 12 integration tests verifying comment posting, mention notification generation, threaded replies, deletion authorization, notification lifecycle, announcement broadcasting, and cross-college tenant isolation.
  - **95/95 backend integration tests passing** across all 8 test suites.
  - Client production build verified cleanly with zero errors.
  - Client unit tests passing (4/4).

### 10.2 Sprint 8 Acceptance Verification
1. **Comment Posting & Mention Notifications**:
   - Posting a comment mentioning a teammate creates the comment and triggers a `COMMENT_MENTION` notification with target links.
2. **Threaded Discussions**:
   - Team members reply to comments; nested replies display under the parent thread.
3. **Comment Deletion Permissions**:
   - Non-author members are blocked from deleting others' comments (`403 Forbidden`).
   - Authors and project leaders can delete comments and nested replies.
4. **Notification Management & Real-Time Sync**:
   - Real-time notification bell displays unread count badge.
   - Users mark individual or all notifications as read; unread count decrements accurately.
5. **Role-Gated Announcements**:
   - College Admins broadcast college-wide notices; non-admin students are rejected with `403 Forbidden`.
   - Project leaders publish project announcements with pinning support.
6. **Multi-Tenant Protection**:
   - Students from another college cannot view or post comments on a project (returns `404 Not Found`).

---

## 1. Architectural Principles

### 1.1 Multi-Tenant Isolation (Shared Database, Pooled Model)
- **Tenancy model:** Single shared MongoDB database with logical tenant separation via `collegeId` on every college-owned collection.
- **Tenant scoping rule:** Every service query touching college resources MUST strictly scope by `collegeId: req.collegeId`.
- **Information disclosure prevention:** If a user belonging to College A attempts to access or query a resource belonging to College B via direct ID, the API returns `404 Not Found` (rather than `403 Forbidden`) to avoid leaking the existence of other colleges' resources. Super Admin is the sole role exempt from tenant scoping for platform-level management endpoints.
- **Pipeline:** `JWT auth middleware (verifies token, loads req.user)` → `Tenant middleware (checks college is ACTIVE, attaches req.collegeId)` → `Role middleware` → `Project permission middleware` → `Service method execution`.

### 1.2 Authentication & Token Strategy
- **Access Token:** Short-lived JWT (15 minutes expiry) signed with `JWT_ACCESS_SECRET`, containing `{ userId, collegeId, globalRole }`.
- **Refresh Token:** Long-lived random cryptographic token (7 days expiry) stored in an `httpOnly`, `secure`, `sameSite=lax` cookie, with its SHA-256 hash stored on the User document (`refreshTokenHash`).
- **Token Rotation & Revocation:** Every `/auth/refresh` rotates the refresh token. Replay/reuse of an already rotated refresh token triggers automatic invalidation of all sessions for that user (compromise detection).
- **Password Hashing:** `bcryptjs` with salt rounds = 12.

### 1.3 Service Layer Pattern
- Controllers remain thin and only handle HTTP request parsing, status codes, and formatting responses using a standardized format:
  ```json
  {
    "success": true,
    "message": "Operation successful",
    "data": {},
    "errors": null
  }
  ```
- All business logic, transaction handling, authorization verification, activity logging, and notification creation reside in dedicated services under `server/src/services/`.

### 1.4 Client Architecture
- **Framework:** React 18 with Vite for fast HMR and build performance.
- **Styling:** Tailwind CSS with custom color palette (indigo/violet primary, emerald for completed, amber for in-progress, rose for overdue/at-risk).
- **HTTP Client:** Axios instance configured with `withCredentials: true` and an automatic token-refresh interceptor that queues pending concurrent requests during a refresh.
- **Navigation:** React Router v6 with declarative `ProtectedRoute` and `RoleRoute` components.

---

## 10. Sprint 8 – Discussions, Comments & System Notifications

### 10.1 Scope & Delivered Features
- [x] Database Models & Schema Constraints:
  - `Comment`: `collegeId`, `projectId`, `entityType` (`TASK`, `PROJECT`, `DISCUSSION`, `ANNOUNCEMENT`), `entityId`, `author`, `body`, `mentions` array of User references, `parentId` (hierarchical threads). Compound indexes on `(collegeId, projectId)` and `(entityType, entityId, createdAt: 1)`.
  - `Notification`: `collegeId`, `userId`, `type` (`TASK_ASSIGNED`, `TASK_STATUS`, `MILESTONE_DUE`, `DOCUMENT_REVIEW`, `FACULTY_REQUEST`, `COMMENT_MENTION`, `ANNOUNCEMENT`, `GENERAL`), `title`, `message`, `link`, `isRead`. Compound indexes on `(userId, isRead, createdAt: -1)` and `(collegeId, userId)`.
  - `Announcement`: `collegeId`, `projectId` (null = college-wide), `authorId`, `title`, `body`, `pinned`. Compound indexes on `(collegeId, projectId, createdAt: -1)` and `(collegeId, pinned, createdAt: -1)`.
- [x] Notification & Real-Time Pipeline (`server/src/services/notificationService.js`):
  - System notification creation with instant Socket.IO push to `user:${userId}` personal room.
  - Paginated user notifications retrieval with real-time `unreadCount` badge tally.
  - Individual and bulk `markAllAsRead` endpoints.
- [x] Commenting & Mention Services (`server/src/services/commentService.js`):
  - Mention parser: extracts `@name` or explicit user mentions, validates users within tenant college, creates `COMMENT_MENTION` notifications.
  - Hierarchical replies: parent comment references supporting threaded conversations.
  - Socket.IO broadcast: emits `'comment:new'` to `project:${projectId}` room for instant live append.
  - Permission checks: comment deletion restricted to original author, project leader, or college/super admin.
- [x] Institutional & Project Announcements (`server/src/services/announcementService.js`):
  - Role-gated publishing: College-wide broadcasts restricted to `COLLEGE_ADMIN` or `SUPER_ADMIN`; project announcements permitted for project leaders and faculty guides.
  - Real-time broadcast: emits `'announcement:new'` to `college:${collegeId}` or `project:${projectId}` rooms.
  - Pinning engine: prioritizes pinned announcements at the top of feeds.
- [x] Frontend UI Components:
  - `Topbar.jsx`: Real-time Notification Bell with live unread counter badge, animated dropdown popover with type-based iconography, single-click mark-as-read navigation, and "Mark all as read" button.
  - `NotificationsPage.jsx`: Filterable central alert dashboard (`ALL`, `UNREAD`, `READ`) with full pagination controls and deletion tools.
  - `DiscussionsTab.jsx`: Pinned announcement banner cards, interactive comment stream with quick `@mention` chips, inline threaded reply boxes, and real-time Socket.IO synchronization.
  - Integrated `/notifications` into `App.jsx` routing and `DiscussionsTab` into `ProjectWorkspaceShell.jsx`.
- [x] Automated Testing & Verification:
  - `server/tests/notification_comment.test.js`: 12 integration tests verifying comment posting, mention notification generation, threaded replies, deletion authorization, notification lifecycle, announcement broadcasting, and cross-college tenant isolation.
  - **95/95 backend integration tests passing** across all 8 test suites.
  - Client production build verified cleanly with zero errors.
  - Client unit tests passing (4/4).

### 10.2 Sprint 8 Acceptance Verification
1. **Comment Posting & Mention Notifications**:
   - Posting a comment mentioning a teammate creates the comment and triggers a `COMMENT_MENTION` notification with target links.
2. **Threaded Discussions**:
   - Team members reply to comments; nested replies display under the parent thread.
3. **Comment Deletion Permissions**:
   - Non-author members are blocked from deleting others' comments (`403 Forbidden`).
   - Authors and project leaders can delete comments and nested replies.
4. **Notification Management & Real-Time Sync**:
   - Real-time notification bell displays unread count badge.
   - Users mark individual or all notifications as read; unread count decrements accurately.
5. **Role-Gated Announcements**:
   - College Admins broadcast college-wide notices; non-admin students are rejected with `403 Forbidden`.
   - Project leaders publish project announcements with pinning support.
6. **Multi-Tenant Protection**:
   - Students from another college cannot view or post comments on a project (returns `404 Not Found`).

---

## 2. Sprint 1 Scope & Status

- [x] Initial specification and architectural review
- [x] Monorepo structure initialization (`package.json`, `client/`, `server/`)
- [x] Environment variables configuration (`.env.example` at root, server, and client)
- [x] Server foundation: Express, Mongoose, security middleware (helmet, mongoSanitize, hpp, rateLimit, cors), error handler
- [x] Database models: College, Department, User
- [x] Authentication services, validators (Zod), and controllers:
  - Register student with institutional domain validation & roll number uniqueness
  - Login with brute-force lockout (5 attempts / 15m), active college check, and refresh token cookie
  - Refresh session with token rotation and revocation
  - Verify email and password reset workflows
- [x] Tenant (`resolveTenant`) and Role (`requireRoles`) authorization middlewares
- [x] Client foundation: Vite + React 18, Tailwind CSS, Lucide icons, React Router v6
- [x] Client AuthContext and Axios token refresh interceptor with queue
- [x] Client Auth views:
  - Modern Landing page (hero, problem strip, features grid, role cards, FAQs)
  - Login view with quick demo buttons for all roles
  - Register view with dynamic college discovery and department cascade
  - Verify Email, Forgot Password, and Reset Password views
- [x] Role-based Layout Shell (Sidebar, Topbar) and Role Dashboards (Student, Faculty, College Admin, Super Admin)
- [x] Automated testing:
  - 13/13 backend tests passed (`tests/auth.test.js`)
  - 4/4 frontend tests passed (`src/tests/AuthGuard.test.jsx`)
  - Client production build verification (`npm run build` completed in 4.61s)

---

## 10. Sprint 8 – Discussions, Comments & System Notifications

### 10.1 Scope & Delivered Features
- [x] Database Models & Schema Constraints:
  - `Comment`: `collegeId`, `projectId`, `entityType` (`TASK`, `PROJECT`, `DISCUSSION`, `ANNOUNCEMENT`), `entityId`, `author`, `body`, `mentions` array of User references, `parentId` (hierarchical threads). Compound indexes on `(collegeId, projectId)` and `(entityType, entityId, createdAt: 1)`.
  - `Notification`: `collegeId`, `userId`, `type` (`TASK_ASSIGNED`, `TASK_STATUS`, `MILESTONE_DUE`, `DOCUMENT_REVIEW`, `FACULTY_REQUEST`, `COMMENT_MENTION`, `ANNOUNCEMENT`, `GENERAL`), `title`, `message`, `link`, `isRead`. Compound indexes on `(userId, isRead, createdAt: -1)` and `(collegeId, userId)`.
  - `Announcement`: `collegeId`, `projectId` (null = college-wide), `authorId`, `title`, `body`, `pinned`. Compound indexes on `(collegeId, projectId, createdAt: -1)` and `(collegeId, pinned, createdAt: -1)`.
- [x] Notification & Real-Time Pipeline (`server/src/services/notificationService.js`):
  - System notification creation with instant Socket.IO push to `user:${userId}` personal room.
  - Paginated user notifications retrieval with real-time `unreadCount` badge tally.
  - Individual and bulk `markAllAsRead` endpoints.
- [x] Commenting & Mention Services (`server/src/services/commentService.js`):
  - Mention parser: extracts `@name` or explicit user mentions, validates users within tenant college, creates `COMMENT_MENTION` notifications.
  - Hierarchical replies: parent comment references supporting threaded conversations.
  - Socket.IO broadcast: emits `'comment:new'` to `project:${projectId}` room for instant live append.
  - Permission checks: comment deletion restricted to original author, project leader, or college/super admin.
- [x] Institutional & Project Announcements (`server/src/services/announcementService.js`):
  - Role-gated publishing: College-wide broadcasts restricted to `COLLEGE_ADMIN` or `SUPER_ADMIN`; project announcements permitted for project leaders and faculty guides.
  - Real-time broadcast: emits `'announcement:new'` to `college:${collegeId}` or `project:${projectId}` rooms.
  - Pinning engine: prioritizes pinned announcements at the top of feeds.
- [x] Frontend UI Components:
  - `Topbar.jsx`: Real-time Notification Bell with live unread counter badge, animated dropdown popover with type-based iconography, single-click mark-as-read navigation, and "Mark all as read" button.
  - `NotificationsPage.jsx`: Filterable central alert dashboard (`ALL`, `UNREAD`, `READ`) with full pagination controls and deletion tools.
  - `DiscussionsTab.jsx`: Pinned announcement banner cards, interactive comment stream with quick `@mention` chips, inline threaded reply boxes, and real-time Socket.IO synchronization.
  - Integrated `/notifications` into `App.jsx` routing and `DiscussionsTab` into `ProjectWorkspaceShell.jsx`.
- [x] Automated Testing & Verification:
  - `server/tests/notification_comment.test.js`: 12 integration tests verifying comment posting, mention notification generation, threaded replies, deletion authorization, notification lifecycle, announcement broadcasting, and cross-college tenant isolation.
  - **95/95 backend integration tests passing** across all 8 test suites.
  - Client production build verified cleanly with zero errors.
  - Client unit tests passing (4/4).

### 10.2 Sprint 8 Acceptance Verification
1. **Comment Posting & Mention Notifications**:
   - Posting a comment mentioning a teammate creates the comment and triggers a `COMMENT_MENTION` notification with target links.
2. **Threaded Discussions**:
   - Team members reply to comments; nested replies display under the parent thread.
3. **Comment Deletion Permissions**:
   - Non-author members are blocked from deleting others' comments (`403 Forbidden`).
   - Authors and project leaders can delete comments and nested replies.
4. **Notification Management & Real-Time Sync**:
   - Real-time notification bell displays unread count badge.
   - Users mark individual or all notifications as read; unread count decrements accurately.
5. **Role-Gated Announcements**:
   - College Admins broadcast college-wide notices; non-admin students are rejected with `403 Forbidden`.
   - Project leaders publish project announcements with pinning support.
6. **Multi-Tenant Protection**:
   - Students from another college cannot view or post comments on a project (returns `404 Not Found`).

---

## 3. Sprint 1 Acceptance Verification

1. **User Registration & Login across colleges**:
   - Seed script creates 2 colleges (AIT & SCE), 1 Super Admin, 2 College Admins, 2 Faculty guides, and 2 Students.
   - Registration verifies college status, enforces college email domain, and ensures roll number uniqueness per college.
2. **Role Route Redirections**:
   - Super Admin -> `/super-admin`
   - College Admin -> `/admin`
   - Faculty -> `/faculty`
   - Student -> `/dashboard`
   - Unauthenticated or unauthorized access properly guarded and redirected.
3. **Tenant Isolation**:
   - Non-Super Admin queries strictly bound to `collegeId`.
   - Suspended college immediately rejects all user sessions with 403 Forbidden.
   - Cross-college access blocked at the API layer.

---

## 10. Sprint 8 – Discussions, Comments & System Notifications

### 10.1 Scope & Delivered Features
- [x] Database Models & Schema Constraints:
  - `Comment`: `collegeId`, `projectId`, `entityType` (`TASK`, `PROJECT`, `DISCUSSION`, `ANNOUNCEMENT`), `entityId`, `author`, `body`, `mentions` array of User references, `parentId` (hierarchical threads). Compound indexes on `(collegeId, projectId)` and `(entityType, entityId, createdAt: 1)`.
  - `Notification`: `collegeId`, `userId`, `type` (`TASK_ASSIGNED`, `TASK_STATUS`, `MILESTONE_DUE`, `DOCUMENT_REVIEW`, `FACULTY_REQUEST`, `COMMENT_MENTION`, `ANNOUNCEMENT`, `GENERAL`), `title`, `message`, `link`, `isRead`. Compound indexes on `(userId, isRead, createdAt: -1)` and `(collegeId, userId)`.
  - `Announcement`: `collegeId`, `projectId` (null = college-wide), `authorId`, `title`, `body`, `pinned`. Compound indexes on `(collegeId, projectId, createdAt: -1)` and `(collegeId, pinned, createdAt: -1)`.
- [x] Notification & Real-Time Pipeline (`server/src/services/notificationService.js`):
  - System notification creation with instant Socket.IO push to `user:${userId}` personal room.
  - Paginated user notifications retrieval with real-time `unreadCount` badge tally.
  - Individual and bulk `markAllAsRead` endpoints.
- [x] Commenting & Mention Services (`server/src/services/commentService.js`):
  - Mention parser: extracts `@name` or explicit user mentions, validates users within tenant college, creates `COMMENT_MENTION` notifications.
  - Hierarchical replies: parent comment references supporting threaded conversations.
  - Socket.IO broadcast: emits `'comment:new'` to `project:${projectId}` room for instant live append.
  - Permission checks: comment deletion restricted to original author, project leader, or college/super admin.
- [x] Institutional & Project Announcements (`server/src/services/announcementService.js`):
  - Role-gated publishing: College-wide broadcasts restricted to `COLLEGE_ADMIN` or `SUPER_ADMIN`; project announcements permitted for project leaders and faculty guides.
  - Real-time broadcast: emits `'announcement:new'` to `college:${collegeId}` or `project:${projectId}` rooms.
  - Pinning engine: prioritizes pinned announcements at the top of feeds.
- [x] Frontend UI Components:
  - `Topbar.jsx`: Real-time Notification Bell with live unread counter badge, animated dropdown popover with type-based iconography, single-click mark-as-read navigation, and "Mark all as read" button.
  - `NotificationsPage.jsx`: Filterable central alert dashboard (`ALL`, `UNREAD`, `READ`) with full pagination controls and deletion tools.
  - `DiscussionsTab.jsx`: Pinned announcement banner cards, interactive comment stream with quick `@mention` chips, inline threaded reply boxes, and real-time Socket.IO synchronization.
  - Integrated `/notifications` into `App.jsx` routing and `DiscussionsTab` into `ProjectWorkspaceShell.jsx`.
- [x] Automated Testing & Verification:
  - `server/tests/notification_comment.test.js`: 12 integration tests verifying comment posting, mention notification generation, threaded replies, deletion authorization, notification lifecycle, announcement broadcasting, and cross-college tenant isolation.
  - **95/95 backend integration tests passing** across all 8 test suites.
  - Client production build verified cleanly with zero errors.
  - Client unit tests passing (4/4).

### 10.2 Sprint 8 Acceptance Verification
1. **Comment Posting & Mention Notifications**:
   - Posting a comment mentioning a teammate creates the comment and triggers a `COMMENT_MENTION` notification with target links.
2. **Threaded Discussions**:
   - Team members reply to comments; nested replies display under the parent thread.
3. **Comment Deletion Permissions**:
   - Non-author members are blocked from deleting others' comments (`403 Forbidden`).
   - Authors and project leaders can delete comments and nested replies.
4. **Notification Management & Real-Time Sync**:
   - Real-time notification bell displays unread count badge.
   - Users mark individual or all notifications as read; unread count decrements accurately.
5. **Role-Gated Announcements**:
   - College Admins broadcast college-wide notices; non-admin students are rejected with `403 Forbidden`.
   - Project leaders publish project announcements with pinning support.
6. **Multi-Tenant Protection**:
   - Students from another college cannot view or post comments on a project (returns `404 Not Found`).

---

## 4. Sprint 2 – College & User Management

### 4.1 Scope & Delivered Features
- [x] Super Admin College Management:
  - Onboard new college with initial College Admin (`POST /colleges`)
  - List colleges with aggregated statistics (`GET /colleges`)
  - Platform totals & stats (`GET /super-admin/stats`)
  - Suspend / Activate college toggle (`PATCH /colleges/:id/status`)
- [x] College Admin Department Management:
  - List departments with live aggregated student/faculty/total counts (`GET /admin/departments`)
  - Create department with unique code validation (`POST /admin/departments`)
  - Update department details (`PUT /admin/departments/:id`)
  - Safe deletion protection blocking department removal when active users are assigned (`DELETE /admin/departments/:id`)
- [x] College Admin User Management:
  - Search, filter by department/role/status, and paginate users (`GET /admin/users`)
  - Add individual faculty with designation and supervision capacity (`POST /admin/users/faculty`)
  - Add individual student with roll number uniqueness (`POST /admin/users/students`)
  - Bulk student roster CSV import with client-side preview, validation summary, and template download (`POST /admin/users/students/bulk-import`)
  - Activate / Deactivate user toggle (`PATCH /admin/users/:id/status`)
  - Administrative password reset token generation (`POST /admin/users/:id/reset-password`)
- [x] Shared User Profile & Security:
  - View & edit profile bio, avatar, and tech stack tags (`PATCH /auth/me`)
  - Change password with current password verification and session revocation (`POST /users/change-password`)
- [x] Automated Testing:
  - 14/14 new backend integration tests (`tests/management.test.js`)
  - Total 27/27 backend tests passing across test suites
  - Production build verified in 8.11s

### 4.2 Sprint 2 Acceptance Verification
1. **Admin creates college, department, faculty, and students**:
   - Super Admin creates new college with initial College Admin.
   - College Admin creates department (AIML) and adds faculty with supervision quota.
   - College Admin adds students individually and via bulk CSV import.
2. **Deactivated users cannot log in**:
   - Tested in `tests/management.test.js`: Deactivating student Karan sets `isActive: false` and immediately blocks subsequent logins with `403 Forbidden` (`Account has been deactivated. Please contact your college administrator.`).
   - Reactivating the user restores login access.
3. **Tenant Scoping**:
   - College Admin 1 attempting to view/modify College 2 user or department receives `404 Not Found`.

---

## 10. Sprint 8 – Discussions, Comments & System Notifications

### 10.1 Scope & Delivered Features
- [x] Database Models & Schema Constraints:
  - `Comment`: `collegeId`, `projectId`, `entityType` (`TASK`, `PROJECT`, `DISCUSSION`, `ANNOUNCEMENT`), `entityId`, `author`, `body`, `mentions` array of User references, `parentId` (hierarchical threads). Compound indexes on `(collegeId, projectId)` and `(entityType, entityId, createdAt: 1)`.
  - `Notification`: `collegeId`, `userId`, `type` (`TASK_ASSIGNED`, `TASK_STATUS`, `MILESTONE_DUE`, `DOCUMENT_REVIEW`, `FACULTY_REQUEST`, `COMMENT_MENTION`, `ANNOUNCEMENT`, `GENERAL`), `title`, `message`, `link`, `isRead`. Compound indexes on `(userId, isRead, createdAt: -1)` and `(collegeId, userId)`.
  - `Announcement`: `collegeId`, `projectId` (null = college-wide), `authorId`, `title`, `body`, `pinned`. Compound indexes on `(collegeId, projectId, createdAt: -1)` and `(collegeId, pinned, createdAt: -1)`.
- [x] Notification & Real-Time Pipeline (`server/src/services/notificationService.js`):
  - System notification creation with instant Socket.IO push to `user:${userId}` personal room.
  - Paginated user notifications retrieval with real-time `unreadCount` badge tally.
  - Individual and bulk `markAllAsRead` endpoints.
- [x] Commenting & Mention Services (`server/src/services/commentService.js`):
  - Mention parser: extracts `@name` or explicit user mentions, validates users within tenant college, creates `COMMENT_MENTION` notifications.
  - Hierarchical replies: parent comment references supporting threaded conversations.
  - Socket.IO broadcast: emits `'comment:new'` to `project:${projectId}` room for instant live append.
  - Permission checks: comment deletion restricted to original author, project leader, or college/super admin.
- [x] Institutional & Project Announcements (`server/src/services/announcementService.js`):
  - Role-gated publishing: College-wide broadcasts restricted to `COLLEGE_ADMIN` or `SUPER_ADMIN`; project announcements permitted for project leaders and faculty guides.
  - Real-time broadcast: emits `'announcement:new'` to `college:${collegeId}` or `project:${projectId}` rooms.
  - Pinning engine: prioritizes pinned announcements at the top of feeds.
- [x] Frontend UI Components:
  - `Topbar.jsx`: Real-time Notification Bell with live unread counter badge, animated dropdown popover with type-based iconography, single-click mark-as-read navigation, and "Mark all as read" button.
  - `NotificationsPage.jsx`: Filterable central alert dashboard (`ALL`, `UNREAD`, `READ`) with full pagination controls and deletion tools.
  - `DiscussionsTab.jsx`: Pinned announcement banner cards, interactive comment stream with quick `@mention` chips, inline threaded reply boxes, and real-time Socket.IO synchronization.
  - Integrated `/notifications` into `App.jsx` routing and `DiscussionsTab` into `ProjectWorkspaceShell.jsx`.
- [x] Automated Testing & Verification:
  - `server/tests/notification_comment.test.js`: 12 integration tests verifying comment posting, mention notification generation, threaded replies, deletion authorization, notification lifecycle, announcement broadcasting, and cross-college tenant isolation.
  - **95/95 backend integration tests passing** across all 8 test suites.
  - Client production build verified cleanly with zero errors.
  - Client unit tests passing (4/4).

### 10.2 Sprint 8 Acceptance Verification
1. **Comment Posting & Mention Notifications**:
   - Posting a comment mentioning a teammate creates the comment and triggers a `COMMENT_MENTION` notification with target links.
2. **Threaded Discussions**:
   - Team members reply to comments; nested replies display under the parent thread.
3. **Comment Deletion Permissions**:
   - Non-author members are blocked from deleting others' comments (`403 Forbidden`).
   - Authors and project leaders can delete comments and nested replies.
4. **Notification Management & Real-Time Sync**:
   - Real-time notification bell displays unread count badge.
   - Users mark individual or all notifications as read; unread count decrements accurately.
5. **Role-Gated Announcements**:
   - College Admins broadcast college-wide notices; non-admin students are rejected with `403 Forbidden`.
   - Project leaders publish project announcements with pinning support.
6. **Multi-Tenant Protection**:
   - Students from another college cannot view or post comments on a project (returns `404 Not Found`).

---

## 10. Sprint 8 – Discussions, Comments & System Notifications

### 10.1 Scope & Delivered Features
- [x] Database Models & Schema Constraints:
  - `Comment`: `collegeId`, `projectId`, `entityType` (`TASK`, `PROJECT`, `DISCUSSION`, `ANNOUNCEMENT`), `entityId`, `author`, `body`, `mentions` array of User references, `parentId` (hierarchical threads). Compound indexes on `(collegeId, projectId)` and `(entityType, entityId, createdAt: 1)`.
  - `Notification`: `collegeId`, `userId`, `type` (`TASK_ASSIGNED`, `TASK_STATUS`, `MILESTONE_DUE`, `DOCUMENT_REVIEW`, `FACULTY_REQUEST`, `COMMENT_MENTION`, `ANNOUNCEMENT`, `GENERAL`), `title`, `message`, `link`, `isRead`. Compound indexes on `(userId, isRead, createdAt: -1)` and `(collegeId, userId)`.
  - `Announcement`: `collegeId`, `projectId` (null = college-wide), `authorId`, `title`, `body`, `pinned`. Compound indexes on `(collegeId, projectId, createdAt: -1)` and `(collegeId, pinned, createdAt: -1)`.
- [x] Notification & Real-Time Pipeline (`server/src/services/notificationService.js`):
  - System notification creation with instant Socket.IO push to `user:${userId}` personal room.
  - Paginated user notifications retrieval with real-time `unreadCount` badge tally.
  - Individual and bulk `markAllAsRead` endpoints.
- [x] Commenting & Mention Services (`server/src/services/commentService.js`):
  - Mention parser: extracts `@name` or explicit user mentions, validates users within tenant college, creates `COMMENT_MENTION` notifications.
  - Hierarchical replies: parent comment references supporting threaded conversations.
  - Socket.IO broadcast: emits `'comment:new'` to `project:${projectId}` room for instant live append.
  - Permission checks: comment deletion restricted to original author, project leader, or college/super admin.
- [x] Institutional & Project Announcements (`server/src/services/announcementService.js`):
  - Role-gated publishing: College-wide broadcasts restricted to `COLLEGE_ADMIN` or `SUPER_ADMIN`; project announcements permitted for project leaders and faculty guides.
  - Real-time broadcast: emits `'announcement:new'` to `college:${collegeId}` or `project:${projectId}` rooms.
  - Pinning engine: prioritizes pinned announcements at the top of feeds.
- [x] Frontend UI Components:
  - `Topbar.jsx`: Real-time Notification Bell with live unread counter badge, animated dropdown popover with type-based iconography, single-click mark-as-read navigation, and "Mark all as read" button.
  - `NotificationsPage.jsx`: Filterable central alert dashboard (`ALL`, `UNREAD`, `READ`) with full pagination controls and deletion tools.
  - `DiscussionsTab.jsx`: Pinned announcement banner cards, interactive comment stream with quick `@mention` chips, inline threaded reply boxes, and real-time Socket.IO synchronization.
  - Integrated `/notifications` into `App.jsx` routing and `DiscussionsTab` into `ProjectWorkspaceShell.jsx`.
- [x] Automated Testing & Verification:
  - `server/tests/notification_comment.test.js`: 12 integration tests verifying comment posting, mention notification generation, threaded replies, deletion authorization, notification lifecycle, announcement broadcasting, and cross-college tenant isolation.
  - **95/95 backend integration tests passing** across all 8 test suites.
  - Client production build verified cleanly with zero errors.
  - Client unit tests passing (4/4).

### 10.2 Sprint 8 Acceptance Verification
1. **Comment Posting & Mention Notifications**:
   - Posting a comment mentioning a teammate creates the comment and triggers a `COMMENT_MENTION` notification with target links.
2. **Threaded Discussions**:
   - Team members reply to comments; nested replies display under the parent thread.
3. **Comment Deletion Permissions**:
   - Non-author members are blocked from deleting others' comments (`403 Forbidden`).
   - Authors and project leaders can delete comments and nested replies.
4. **Notification Management & Real-Time Sync**:
   - Real-time notification bell displays unread count badge.
   - Users mark individual or all notifications as read; unread count decrements accurately.
5. **Role-Gated Announcements**:
   - College Admins broadcast college-wide notices; non-admin students are rejected with `403 Forbidden`.
   - Project leaders publish project announcements with pinning support.
6. **Multi-Tenant Protection**:
   - Students from another college cannot view or post comments on a project (returns `404 Not Found`).

---

## 5. Sprint 3 – Projects, Teams & Invitations

### 5.1 Scope & Delivered Features
- [x] Project Data Modeling & Constraints:
  - `Project`: Auto-generated institutional code (`{COLLEGECODE}-{YEAR}-{001}`), `title`, `abstract`, `description`, `objectives`, `domain`, `techStack`, `priority`, `startDate`, `deadline`, `status` (`PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`), `health` (`ON_TRACK`, `AT_RISK`, `DELAYED`, `INACTIVE`), `progress` (0–100%), `changeHistory` audit trail.
  - `Team`: College-scoped, auto-generated unique 6-character alphanumeric `joinCode`, 1:1 relationship with `Project`.
  - `TeamMember`: Unique compound index `(projectId, userId)`, separation of `projectRole` (`LEADER` vs `MEMBER`) from global system role, trackable `responsibility`, `status` (`ACTIVE`, `REMOVED`).
  - `Invitation`: Dual-flow support (`EMAIL_INVITE` with 7-day cryptographic token & `JOIN_CODE_REQUEST` submitted by students).
  - `Activity`: Chronological audit trail with compound index `(projectId, createdAt)` and real-time Socket.IO emission to room `project:{projectId}`.
- [x] Project & Team API Services:
  - Atomic auto-sequencing project code generation scoped per college and calendar year.
  - Creation pipeline: creates Project, Team with joinCode, assigns creator as `LEADER`, dispatches initial email invitations, and logs `PROJECT_CREATED` activity.
  - Join code workflow: student submits join request via code, leader accepts/rejects, automated enrollment as active `MEMBER`.
  - Email invitation workflow: token-based invitation with expiry and duplicate prevention.
  - Project governance: leader transfer to active team member (demotes previous leader to member), member removal with protection against removing the sole leader, join code regeneration.
  - Dynamic health computation: detects delays against target deadline and progress threshold, logs explanatory status.
  - Change history tracking: automatic recording of modified fields with mandatory audit reason when deadlines change.
- [x] Frontend Project Workspace & Components:
  - `ProjectsListPage.jsx`: Active, college-wide explore, and archived tabs, domain/status filters, health & priority badges, progress bars, and days-remaining countdowns.
  - `CreateProjectWizard.jsx`: 4-step wizard (Basics, Timeline & Scope, Team Invites, Review & Launch).
  - `JoinProjectPage.jsx`: Uppercase join code submission view with live feedback.
  - `ProjectWorkspaceShell.jsx`: Tabbed project workspace shell with real-time Socket.IO updates.
  - Workspace child tabs:
    - `OverviewTab.jsx`: Project abstract, objectives checklist, tech stack chips, health explanation banner, quick metrics, recent team activity.
    - `TeamTab.jsx`: Team join code display with copy & regenerate actions, pending join request approvals, member cards with skills & responsibilities, leadership transfer modal, and member removal.
    - `ActivityTab.jsx`: Chronological event audit feed with type filters and user avatars.
    - `SettingsTab.jsx`: Project metadata editor, deadline modification with required change reason, and danger zone project archiving.
- [x] Automated Testing & Quality Checks:
  - `server/tests/project.test.js`: 15 integration test cases verifying project creation, code sequencing, join requests, approval flows, email invites, multi-tenant isolation (cross-college join code rejection), and leadership transfer.
  - 42/42 backend integration tests passing across all 3 test files.
  - Client production build verified cleanly with zero errors.

### 5.2 Sprint 3 Acceptance Verification
1. **Student creates project**:
   - Student creates project via 4-step wizard.
   - Project code is automatically sequenced as `{COLLEGECODE}-{YEAR}-001` (e.g. `AIT-2026-001`).
   - Creator is automatically assigned as `LEADER`.
2. **Team joining & invitation flows**:
   - Classmates in the same college can request to join using the team's 6-character join code.
   - Leader sees pending requests in the workspace and accepts them, enrolling the student as active `MEMBER`.
   - Leader can invite members via email with automatic token generation.
3. **Leadership transfer & protection**:
   - Leader can transfer project leadership to any active team member; previous leader is safely demoted to regular member.
   - System strictly blocks removing the sole project leader.
4. **Tenant Isolation**:
   - Students from College B (SCE) cannot use or discover College A (AIT) team join codes (returns 404).
   - Cross-college project direct lookup returns 404.

---

## 10. Sprint 8 – Discussions, Comments & System Notifications

### 10.1 Scope & Delivered Features
- [x] Database Models & Schema Constraints:
  - `Comment`: `collegeId`, `projectId`, `entityType` (`TASK`, `PROJECT`, `DISCUSSION`, `ANNOUNCEMENT`), `entityId`, `author`, `body`, `mentions` array of User references, `parentId` (hierarchical threads). Compound indexes on `(collegeId, projectId)` and `(entityType, entityId, createdAt: 1)`.
  - `Notification`: `collegeId`, `userId`, `type` (`TASK_ASSIGNED`, `TASK_STATUS`, `MILESTONE_DUE`, `DOCUMENT_REVIEW`, `FACULTY_REQUEST`, `COMMENT_MENTION`, `ANNOUNCEMENT`, `GENERAL`), `title`, `message`, `link`, `isRead`. Compound indexes on `(userId, isRead, createdAt: -1)` and `(collegeId, userId)`.
  - `Announcement`: `collegeId`, `projectId` (null = college-wide), `authorId`, `title`, `body`, `pinned`. Compound indexes on `(collegeId, projectId, createdAt: -1)` and `(collegeId, pinned, createdAt: -1)`.
- [x] Notification & Real-Time Pipeline (`server/src/services/notificationService.js`):
  - System notification creation with instant Socket.IO push to `user:${userId}` personal room.
  - Paginated user notifications retrieval with real-time `unreadCount` badge tally.
  - Individual and bulk `markAllAsRead` endpoints.
- [x] Commenting & Mention Services (`server/src/services/commentService.js`):
  - Mention parser: extracts `@name` or explicit user mentions, validates users within tenant college, creates `COMMENT_MENTION` notifications.
  - Hierarchical replies: parent comment references supporting threaded conversations.
  - Socket.IO broadcast: emits `'comment:new'` to `project:${projectId}` room for instant live append.
  - Permission checks: comment deletion restricted to original author, project leader, or college/super admin.
- [x] Institutional & Project Announcements (`server/src/services/announcementService.js`):
  - Role-gated publishing: College-wide broadcasts restricted to `COLLEGE_ADMIN` or `SUPER_ADMIN`; project announcements permitted for project leaders and faculty guides.
  - Real-time broadcast: emits `'announcement:new'` to `college:${collegeId}` or `project:${projectId}` rooms.
  - Pinning engine: prioritizes pinned announcements at the top of feeds.
- [x] Frontend UI Components:
  - `Topbar.jsx`: Real-time Notification Bell with live unread counter badge, animated dropdown popover with type-based iconography, single-click mark-as-read navigation, and "Mark all as read" button.
  - `NotificationsPage.jsx`: Filterable central alert dashboard (`ALL`, `UNREAD`, `READ`) with full pagination controls and deletion tools.
  - `DiscussionsTab.jsx`: Pinned announcement banner cards, interactive comment stream with quick `@mention` chips, inline threaded reply boxes, and real-time Socket.IO synchronization.
  - Integrated `/notifications` into `App.jsx` routing and `DiscussionsTab` into `ProjectWorkspaceShell.jsx`.
- [x] Automated Testing & Verification:
  - `server/tests/notification_comment.test.js`: 12 integration tests verifying comment posting, mention notification generation, threaded replies, deletion authorization, notification lifecycle, announcement broadcasting, and cross-college tenant isolation.
  - **95/95 backend integration tests passing** across all 8 test suites.
  - Client production build verified cleanly with zero errors.
  - Client unit tests passing (4/4).

### 10.2 Sprint 8 Acceptance Verification
1. **Comment Posting & Mention Notifications**:
   - Posting a comment mentioning a teammate creates the comment and triggers a `COMMENT_MENTION` notification with target links.
2. **Threaded Discussions**:
   - Team members reply to comments; nested replies display under the parent thread.
3. **Comment Deletion Permissions**:
   - Non-author members are blocked from deleting others' comments (`403 Forbidden`).
   - Authors and project leaders can delete comments and nested replies.
4. **Notification Management & Real-Time Sync**:
   - Real-time notification bell displays unread count badge.
   - Users mark individual or all notifications as read; unread count decrements accurately.
5. **Role-Gated Announcements**:
   - College Admins broadcast college-wide notices; non-admin students are rejected with `403 Forbidden`.
   - Project leaders publish project announcements with pinning support.
6. **Multi-Tenant Protection**:
   - Students from another college cannot view or post comments on a project (returns `404 Not Found`).

---

## 6. Sprint 4 – Tasks, Kanban Board & Real-Time Sync

### 6.1 Scope & Delivered Features
- [x] Database Model & Schema Constraints:
  - `Task`: Auto-sequenced `taskCode` (`TASK-001`, `TASK-002` per project), `title`, `description`, `acceptanceCriteria` checklist (`text`, `isCompleted`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `status` (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`), `assignees` array, `milestoneId`, `startDate`, `dueDate`, `completedAt`, `order` for Kanban column positioning, `statusHistory` audit trail, `isOverdue` virtual, and compound index `(projectId, taskCode)`.
- [x] Task Management Services (`server/src/services/taskService.js`):
  - Sequential task code generation scoped strictly per project.
  - Automatic project progress calculation: updates `Project.progress` (% of completed tasks) and adjusts project health (`ON_TRACK`, `AT_RISK`, `DELAYED`).
  - Drag-and-drop column transition and reordering with automatic order shifting.
  - Socket.IO broadcasting for `task:created`, `task:moved`, `task:updated`, `task:deleted`, and `project:progress_updated` to room `project:{projectId}`.
  - Acceptance criteria interactive toggling.
  - Student personal task query (`/api/v1/tasks/my`).
- [x] Frontend Kanban Board & Task Components:
  - Drag-and-drop Kanban board using `@dnd-kit/core` and `@dnd-kit/sortable` with smooth `DragOverlay` ghosting and pointer activation constraint.
  - `KanbanColumn.jsx`: 4 status columns (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`), count badges, and quick-add actions.
  - `KanbanCard.jsx`: Task code, priority badge, title, overdue indicator, acceptance criteria progress counter, and assignee avatars stack.
  - `TaskModal.jsx`: Create & edit task modal with priority, due date, team members checklist, and dynamic acceptance criteria builder.
  - `TaskDetailDrawer.jsx`: Slide-over drawer with quick status dropdown, interactive acceptance criteria checkboxes, assignees list, and status movement audit trail.
  - `TasksListPage.jsx`: Personal assigned tasks view for `/tasks` with stats cards (Total, In Progress, Overdue, Completed) and search/filter controls.
  - Live Socket.IO multi-client synchronization.
- [x] Automated Testing & Quality Checks:
  - `server/tests/task.test.js`: 13 integration test cases covering code sequencing, assignee assignment & filtering, Kanban column movement, progress percentage updates, acceptance criteria toggles, member permissions, and tenant isolation.
  - 55/55 backend integration tests passing across 4 test suites.
  - Client production build verified cleanly with zero errors.

### 6.2 Sprint 4 Acceptance Verification
1. **Task Code Auto-Sequencing**:
   - First task created in a project automatically receives `TASK-001`.
   - Subsequent tasks increment sequentially to `TASK-002`, `TASK-003`.
2. **Kanban Drag-and-Drop & Status Audit**:
   - Tasks smoothly drag and drop between columns (TODO -> IN_PROGRESS -> IN_REVIEW -> COMPLETED).
   - Moving a task updates `order` and records entry in `statusHistory` (`status`, `changedBy`, `changedAt`).
   - Completing a task sets `completedAt` timestamp and recalculates project progress (e.g. 1 of 2 = 50%, 2 of 2 = 100%).
3. **Acceptance Criteria Checklist**:
   - Interactive checkboxes toggle `isCompleted` and update progress counters across cards and drawer.
4. **Tenant Isolation**:
   - Students from College B (SCE) cannot view, update, or move tasks of College A (AIT) projects (returns 404).

---

## 10. Sprint 8 – Discussions, Comments & System Notifications

### 10.1 Scope & Delivered Features
- [x] Database Models & Schema Constraints:
  - `Comment`: `collegeId`, `projectId`, `entityType` (`TASK`, `PROJECT`, `DISCUSSION`, `ANNOUNCEMENT`), `entityId`, `author`, `body`, `mentions` array of User references, `parentId` (hierarchical threads). Compound indexes on `(collegeId, projectId)` and `(entityType, entityId, createdAt: 1)`.
  - `Notification`: `collegeId`, `userId`, `type` (`TASK_ASSIGNED`, `TASK_STATUS`, `MILESTONE_DUE`, `DOCUMENT_REVIEW`, `FACULTY_REQUEST`, `COMMENT_MENTION`, `ANNOUNCEMENT`, `GENERAL`), `title`, `message`, `link`, `isRead`. Compound indexes on `(userId, isRead, createdAt: -1)` and `(collegeId, userId)`.
  - `Announcement`: `collegeId`, `projectId` (null = college-wide), `authorId`, `title`, `body`, `pinned`. Compound indexes on `(collegeId, projectId, createdAt: -1)` and `(collegeId, pinned, createdAt: -1)`.
- [x] Notification & Real-Time Pipeline (`server/src/services/notificationService.js`):
  - System notification creation with instant Socket.IO push to `user:${userId}` personal room.
  - Paginated user notifications retrieval with real-time `unreadCount` badge tally.
  - Individual and bulk `markAllAsRead` endpoints.
- [x] Commenting & Mention Services (`server/src/services/commentService.js`):
  - Mention parser: extracts `@name` or explicit user mentions, validates users within tenant college, creates `COMMENT_MENTION` notifications.
  - Hierarchical replies: parent comment references supporting threaded conversations.
  - Socket.IO broadcast: emits `'comment:new'` to `project:${projectId}` room for instant live append.
  - Permission checks: comment deletion restricted to original author, project leader, or college/super admin.
- [x] Institutional & Project Announcements (`server/src/services/announcementService.js`):
  - Role-gated publishing: College-wide broadcasts restricted to `COLLEGE_ADMIN` or `SUPER_ADMIN`; project announcements permitted for project leaders and faculty guides.
  - Real-time broadcast: emits `'announcement:new'` to `college:${collegeId}` or `project:${projectId}` rooms.
  - Pinning engine: prioritizes pinned announcements at the top of feeds.
- [x] Frontend UI Components:
  - `Topbar.jsx`: Real-time Notification Bell with live unread counter badge, animated dropdown popover with type-based iconography, single-click mark-as-read navigation, and "Mark all as read" button.
  - `NotificationsPage.jsx`: Filterable central alert dashboard (`ALL`, `UNREAD`, `READ`) with full pagination controls and deletion tools.
  - `DiscussionsTab.jsx`: Pinned announcement banner cards, interactive comment stream with quick `@mention` chips, inline threaded reply boxes, and real-time Socket.IO synchronization.
  - Integrated `/notifications` into `App.jsx` routing and `DiscussionsTab` into `ProjectWorkspaceShell.jsx`.
- [x] Automated Testing & Verification:
  - `server/tests/notification_comment.test.js`: 12 integration tests verifying comment posting, mention notification generation, threaded replies, deletion authorization, notification lifecycle, announcement broadcasting, and cross-college tenant isolation.
  - **95/95 backend integration tests passing** across all 8 test suites.
  - Client production build verified cleanly with zero errors.
  - Client unit tests passing (4/4).

### 10.2 Sprint 8 Acceptance Verification
1. **Comment Posting & Mention Notifications**:
   - Posting a comment mentioning a teammate creates the comment and triggers a `COMMENT_MENTION` notification with target links.
2. **Threaded Discussions**:
   - Team members reply to comments; nested replies display under the parent thread.
3. **Comment Deletion Permissions**:
   - Non-author members are blocked from deleting others' comments (`403 Forbidden`).
   - Authors and project leaders can delete comments and nested replies.
4. **Notification Management & Real-Time Sync**:
   - Real-time notification bell displays unread count badge.
   - Users mark individual or all notifications as read; unread count decrements accurately.
5. **Role-Gated Announcements**:
   - College Admins broadcast college-wide notices; non-admin students are rejected with `403 Forbidden`.
   - Project leaders publish project announcements with pinning support.
6. **Multi-Tenant Protection**:
   - Students from another college cannot view or post comments on a project (returns `404 Not Found`).

---

## 7. Sprint 5 – Milestones, Calendar & Deadline Tracking

### 7.1 Scope & Delivered Features
- [x] Database Model & Schema Constraints:
  - `Milestone`: `collegeId`, `projectId`, `title`, `description`, `deliverables` array, `startDate`, `dueDate`, `status` (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `DELAYED`), `completionPercent` (dynamically computed from linked tasks), and `deadlineHistory` (`oldDate`, `newDate`, `reason`, `changedBy`, `changedAt`).
  - Compound indexes: `(collegeId, projectId)`, `(projectId, status)`.
- [x] Milestone Management & Calendar Services (`server/src/services/milestoneService.js`):
  - Dynamic completion calculation: derives `completionPercent` from linked tasks (`(completedTasks / totalTasks) * 100`).
  - Target deadline modification: requires mandatory `deadlineChangeReason` and writes to `deadlineHistory` audit trail.
  - Deletion safety: unlinks associated tasks when milestone is deleted.
  - Calendar aggregation endpoint (`/api/v1/calendar/events`): returns project deadlines (indigo), milestones (purple), and tasks (emerald/sky/red for overdue) formatted for FullCalendar.
- [x] Automated Deadline & Overdue Inspection (`server/src/jobs/deadlineJob.js`):
  - Daily scheduled cron job (runs at midnight via `node-cron`).
  - Inspects uncompleted milestones past due date and transitions status to `DELAYED`.
  - Inspects active projects nearing deadline (<= 7 days) and updates health to `AT_RISK` if progress < 70%.
- [x] Frontend Milestones & Calendar Views:
  - `MilestonesTab.jsx`: Project checkpoints, deliverables checklist, linked task progress bar, deadline countdown, deadline history audit viewer, and create/edit modals.
  - `CalendarPage.jsx`: Interactive calendar using `@fullcalendar/react` with `dayGridMonth`, `timeGridWeek`, `timeGridDay` views, event filtering by type (Deadlines / Milestones / Tasks), color legend, and event click inspection drawer with workspace links.
- [x] Automated Testing & Quality Checks:
  - `server/tests/milestone.test.js`: 8 integration tests verifying milestone creation, task progress calculation, deadline modification audit, overdue job transition to DELAYED, calendar event aggregation, and tenant isolation.
  - 63/63 backend integration tests passing across 5 test suites.
  - Client production build verified cleanly with zero errors.

### 7.2 Sprint 5 Acceptance Verification
1. **Milestones & Linked Tasks**:
   - Milestones created with deliverables and deadlines.
   - Tasks linked to milestone dynamically drive the milestone's `completionPercent`.
2. **Audit Trail for Deadline Modifications**:
   - Modifying a milestone target deadline without reason is rejected with `400 Bad Request`.
   - Modifying with reason logs the change in `deadlineHistory` with user and timestamp.
3. **Automated Overdue Detection**:
   - `DeadlineJob.checkDeadlines()` finds past-due milestones and updates status to `DELAYED`.
4. **Institutional Calendar**:
   - `/api/v1/calendar/events` combines project deadlines, milestones, and task due dates with proper color-coding and metadata.


---

## 10. Sprint 8 – Discussions, Comments & System Notifications

### 10.1 Scope & Delivered Features
- [x] Database Models & Schema Constraints:
  - `Comment`: `collegeId`, `projectId`, `entityType` (`TASK`, `PROJECT`, `DISCUSSION`, `ANNOUNCEMENT`), `entityId`, `author`, `body`, `mentions` array of User references, `parentId` (hierarchical threads). Compound indexes on `(collegeId, projectId)` and `(entityType, entityId, createdAt: 1)`.
  - `Notification`: `collegeId`, `userId`, `type` (`TASK_ASSIGNED`, `TASK_STATUS`, `MILESTONE_DUE`, `DOCUMENT_REVIEW`, `FACULTY_REQUEST`, `COMMENT_MENTION`, `ANNOUNCEMENT`, `GENERAL`), `title`, `message`, `link`, `isRead`. Compound indexes on `(userId, isRead, createdAt: -1)` and `(collegeId, userId)`.
  - `Announcement`: `collegeId`, `projectId` (null = college-wide), `authorId`, `title`, `body`, `pinned`. Compound indexes on `(collegeId, projectId, createdAt: -1)` and `(collegeId, pinned, createdAt: -1)`.
- [x] Notification & Real-Time Pipeline (`server/src/services/notificationService.js`):
  - System notification creation with instant Socket.IO push to `user:${userId}` personal room.
  - Paginated user notifications retrieval with real-time `unreadCount` badge tally.
  - Individual and bulk `markAllAsRead` endpoints.
- [x] Commenting & Mention Services (`server/src/services/commentService.js`):
  - Mention parser: extracts `@name` or explicit user mentions, validates users within tenant college, creates `COMMENT_MENTION` notifications.
  - Hierarchical replies: parent comment references supporting threaded conversations.
  - Socket.IO broadcast: emits `'comment:new'` to `project:${projectId}` room for instant live append.
  - Permission checks: comment deletion restricted to original author, project leader, or college/super admin.
- [x] Institutional & Project Announcements (`server/src/services/announcementService.js`):
  - Role-gated publishing: College-wide broadcasts restricted to `COLLEGE_ADMIN` or `SUPER_ADMIN`; project announcements permitted for project leaders and faculty guides.
  - Real-time broadcast: emits `'announcement:new'` to `college:${collegeId}` or `project:${projectId}` rooms.
  - Pinning engine: prioritizes pinned announcements at the top of feeds.
- [x] Frontend UI Components:
  - `Topbar.jsx`: Real-time Notification Bell with live unread counter badge, animated dropdown popover with type-based iconography, single-click mark-as-read navigation, and "Mark all as read" button.
  - `NotificationsPage.jsx`: Filterable central alert dashboard (`ALL`, `UNREAD`, `READ`) with full pagination controls and deletion tools.
  - `DiscussionsTab.jsx`: Pinned announcement banner cards, interactive comment stream with quick `@mention` chips, inline threaded reply boxes, and real-time Socket.IO synchronization.
  - Integrated `/notifications` into `App.jsx` routing and `DiscussionsTab` into `ProjectWorkspaceShell.jsx`.
- [x] Automated Testing & Verification:
  - `server/tests/notification_comment.test.js`: 12 integration tests verifying comment posting, mention notification generation, threaded replies, deletion authorization, notification lifecycle, announcement broadcasting, and cross-college tenant isolation.
  - **95/95 backend integration tests passing** across all 8 test suites.
  - Client production build verified cleanly with zero errors.
  - Client unit tests passing (4/4).

### 10.2 Sprint 8 Acceptance Verification
1. **Comment Posting & Mention Notifications**:
   - Posting a comment mentioning a teammate creates the comment and triggers a `COMMENT_MENTION` notification with target links.
2. **Threaded Discussions**:
   - Team members reply to comments; nested replies display under the parent thread.
3. **Comment Deletion Permissions**:
   - Non-author members are blocked from deleting others' comments (`403 Forbidden`).
   - Authors and project leaders can delete comments and nested replies.
4. **Notification Management & Real-Time Sync**:
   - Real-time notification bell displays unread count badge.
   - Users mark individual or all notifications as read; unread count decrements accurately.
5. **Role-Gated Announcements**:
   - College Admins broadcast college-wide notices; non-admin students are rejected with `403 Forbidden`.
   - Project leaders publish project announcements with pinning support.
6. **Multi-Tenant Protection**:
   - Students from another college cannot view or post comments on a project (returns `404 Not Found`).

---

## 8. Sprint 6 – Faculty Supervision & Progress Updates

### 8.1 Scope & Delivered Features
- [x] Database Models & Constraints:
  - `FacultyRequest`: `collegeId`, `projectId`, `facultyId`, `requestedBy`, `source` (`STUDENT_REQUEST`, `ADMIN_ASSIGNMENT`), `status` (`PENDING`, `ACCEPTED`, `REJECTED`, `REASSIGN_REQUESTED`), `message`, `responseNote`, `respondedAt`. Compound index on `(collegeId, projectId)` and `(facultyId, status)`.
  - `ProgressUpdate`: `collegeId`, `projectId`, `author`, `type` (`DAILY`, `WEEKLY`, `MEETING_NOTE`), `content`, `blockers`, `nextSteps`, `weekNumber`. Compound index on `(collegeId, projectId, createdAt)`.
  - `Feedback`: `collegeId`, `projectId`, `entityType` (`PROJECT`, `MILESTONE`, `DOCUMENT`, `TASK`), `entityId`, `authorId`, `comment`, `decision` (`COMMENT`, `APPROVED`, `CHANGES_REQUESTED`).
- [x] Supervision Business Logic & Services (`server/src/services/supervisionService.js`):
  - Request Guide Workflow: Team leader requests faculty supervision with optional message.
  - Quota Enforcement: Validates faculty capacity against `maxSupervisionCapacity` before permitting request or assignment; rejects with `400 Bad Request` if capacity reached.
  - Faculty Decision Handler: Faculty accepts or declines pending request; acceptance sets `facultyGuideId` on project and marks request `ACCEPTED`.
  - Admin Direct Assignment: College Admin can directly assign or reassign faculty guides, archiving prior assignments into `assignmentHistory`.
  - Progress Standups: Team members submit daily/weekly progress reports including blockers and upcoming next steps.
  - Structured Reviews & Feedback: Faculty guides and reviewers post formal feedback with decisions (`APPROVED`, `CHANGES_REQUESTED`, `COMMENT`).
  - Faculty Dashboard Analytics: Aggregates active supervised projects count, pending requests queue, capacity usage percentage, and recent standups.
- [x] RESTful API Routes:
  - Mounted at `/api/v1/projects/:projectId/supervision` (requests, guide assignment, progress updates, feedback) and `/api/v1/faculty` (dashboard analytics, requests list, response handler, supervised projects).
- [x] Frontend Supervision UI Components:
  - `SupervisionTab.jsx`: Rendered within `ProjectWorkspaceShell.jsx`. Displays assigned faculty card, guide request wizard modal, progress updates timeline with blocker alerts, and faculty feedback history with review submission modal.
  - `FacultyDashboard.jsx`: Overview metrics (Supervised Projects, Pending Requests, Capacity Quota), urgent request triage cards with inline accept/decline actions, and list of supervised projects with direct links to workspace tabs.
  - `SupervisionRequestsPage.jsx`: Filterable supervision queue for faculty (`/faculty/requests`).
  - Integrated `/faculty/requests` into client routing (`App.jsx`).
- [x] Quality Assurance & Test Verification:
  - `server/tests/supervision.test.js`: 10 integration tests verifying student requests, faculty capacity limits, acceptance & rejection flow, admin assignment, standup updates, feedback decisions, and cross-college tenant isolation.
  - 73/73 backend integration tests passing across all 6 test suites.
  - Client production build verified cleanly with zero errors.
  - Client unit tests passing (4/4).

### 8.2 Sprint 6 Acceptance Verification
1. **Student Supervision Request**:
   - Team leader successfully submits supervision request to faculty within the same college.
   - Non-leaders are blocked from initiating supervision requests.
2. **Faculty Supervision Quota**:
   - When faculty member reaches `maxSupervisionCapacity`, further requests or assignments are blocked with a clear quota exceeded error.
3. **Faculty Accept/Decline Workflow**:
   - Faculty reviews incoming requests on dashboard and can accept with a welcome note or decline with explanation.
   - Acceptance assigns `facultyGuideId` on the project and notifies the team.
4. **Progress Standups & Blocker Tracking**:
   - Team members post daily/weekly progress updates detailing accomplishments, blockers, and next steps.
   - Blockers are highlighted in workspace UI for immediate faculty visibility.
5. **Formal Faculty Feedback & Review Decisions**:
   - Faculty guides provide structured reviews with decisions (`APPROVED`, `CHANGES_REQUESTED`, or `COMMENT`).
6. **Multi-Tenant Protection**:
   - Faculty members cannot view, accept, or review projects from another college (returns 404).

---

## 10. Sprint 8 – Discussions, Comments & System Notifications

### 10.1 Scope & Delivered Features
- [x] Database Models & Schema Constraints:
  - `Comment`: `collegeId`, `projectId`, `entityType` (`TASK`, `PROJECT`, `DISCUSSION`, `ANNOUNCEMENT`), `entityId`, `author`, `body`, `mentions` array of User references, `parentId` (hierarchical threads). Compound indexes on `(collegeId, projectId)` and `(entityType, entityId, createdAt: 1)`.
  - `Notification`: `collegeId`, `userId`, `type` (`TASK_ASSIGNED`, `TASK_STATUS`, `MILESTONE_DUE`, `DOCUMENT_REVIEW`, `FACULTY_REQUEST`, `COMMENT_MENTION`, `ANNOUNCEMENT`, `GENERAL`), `title`, `message`, `link`, `isRead`. Compound indexes on `(userId, isRead, createdAt: -1)` and `(collegeId, userId)`.
  - `Announcement`: `collegeId`, `projectId` (null = college-wide), `authorId`, `title`, `body`, `pinned`. Compound indexes on `(collegeId, projectId, createdAt: -1)` and `(collegeId, pinned, createdAt: -1)`.
- [x] Notification & Real-Time Pipeline (`server/src/services/notificationService.js`):
  - System notification creation with instant Socket.IO push to `user:${userId}` personal room.
  - Paginated user notifications retrieval with real-time `unreadCount` badge tally.
  - Individual and bulk `markAllAsRead` endpoints.
- [x] Commenting & Mention Services (`server/src/services/commentService.js`):
  - Mention parser: extracts `@name` or explicit user mentions, validates users within tenant college, creates `COMMENT_MENTION` notifications.
  - Hierarchical replies: parent comment references supporting threaded conversations.
  - Socket.IO broadcast: emits `'comment:new'` to `project:${projectId}` room for instant live append.
  - Permission checks: comment deletion restricted to original author, project leader, or college/super admin.
- [x] Institutional & Project Announcements (`server/src/services/announcementService.js`):
  - Role-gated publishing: College-wide broadcasts restricted to `COLLEGE_ADMIN` or `SUPER_ADMIN`; project announcements permitted for project leaders and faculty guides.
  - Real-time broadcast: emits `'announcement:new'` to `college:${collegeId}` or `project:${projectId}` rooms.
  - Pinning engine: prioritizes pinned announcements at the top of feeds.
- [x] Frontend UI Components:
  - `Topbar.jsx`: Real-time Notification Bell with live unread counter badge, animated dropdown popover with type-based iconography, single-click mark-as-read navigation, and "Mark all as read" button.
  - `NotificationsPage.jsx`: Filterable central alert dashboard (`ALL`, `UNREAD`, `READ`) with full pagination controls and deletion tools.
  - `DiscussionsTab.jsx`: Pinned announcement banner cards, interactive comment stream with quick `@mention` chips, inline threaded reply boxes, and real-time Socket.IO synchronization.
  - Integrated `/notifications` into `App.jsx` routing and `DiscussionsTab` into `ProjectWorkspaceShell.jsx`.
- [x] Automated Testing & Verification:
  - `server/tests/notification_comment.test.js`: 12 integration tests verifying comment posting, mention notification generation, threaded replies, deletion authorization, notification lifecycle, announcement broadcasting, and cross-college tenant isolation.
  - **95/95 backend integration tests passing** across all 8 test suites.
  - Client production build verified cleanly with zero errors.
  - Client unit tests passing (4/4).

### 10.2 Sprint 8 Acceptance Verification
1. **Comment Posting & Mention Notifications**:
   - Posting a comment mentioning a teammate creates the comment and triggers a `COMMENT_MENTION` notification with target links.
2. **Threaded Discussions**:
   - Team members reply to comments; nested replies display under the parent thread.
3. **Comment Deletion Permissions**:
   - Non-author members are blocked from deleting others' comments (`403 Forbidden`).
   - Authors and project leaders can delete comments and nested replies.
4. **Notification Management & Real-Time Sync**:
   - Real-time notification bell displays unread count badge.
   - Users mark individual or all notifications as read; unread count decrements accurately.
5. **Role-Gated Announcements**:
   - College Admins broadcast college-wide notices; non-admin students are rejected with `403 Forbidden`.
   - Project leaders publish project announcements with pinning support.
6. **Multi-Tenant Protection**:
   - Students from another college cannot view or post comments on a project (returns `404 Not Found`).

---

## 9. Sprint 7 – Document Uploads & Versioning

### 9.1 Scope & Delivered Features
- [x] Database Model & Constraints:
  - `Document`: `collegeId`, `projectId`, `category` (`PROPOSAL`, `REQUIREMENTS`, `DESIGN`, `REPORT`, `PRESENTATION`, `FINAL_SUBMISSION`, `OTHER`), `title`, `fileName`, `fileUrl`, `mimeType`, `size`, `version` (auto-incrementing integer), `versions` array (tracking historical revisions with `version`, `fileUrl`, `fileName`, `mimeType`, `size`, `uploadedBy`, `uploadedAt`, and `notes`), `uploadedBy`, `status` (`DRAFT`, `SUBMITTED`, `APPROVED`, `CHANGES_REQUESTED`), `reviewedBy`, `reviewedAt`, `reviewNotes`.
  - Compound indexes on `(collegeId, projectId)`, `(projectId, category)`, and `(projectId, status)`.
- [x] Multer Upload Middleware & Storage Abstraction (`server/src/middleware/upload.js`):
  - Local disk storage engine targeting `uploads/documents/` with sanitized filename preservation and collision prevention.
  - File filtering: permits PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT, images (JPEG/PNG/WEBP), and ZIP archives up to 25 MB. Rejects executables.
  - Express static file serving configured at `/uploads`.
- [x] Document Business Services (`server/src/services/documentService.js`):
  - Document Upload: stores file, establishes initial version (v1), logs audit activity.
  - Version Control: uploads revisions (v2, v3, ...), archives previous entries into `versions` history array, updates current pointers, and auto-submits revised documents if changes were requested.
  - Faculty Review & Approval Workflow: validates faculty/reviewer/admin role, sets decision (`APPROVED` or `CHANGES_REQUESTED`), attaches formal feedback notes and reviewer signature.
  - Deletion Safeguard: blocks deletion of `APPROVED` documents; restricts deletion to document creators or project leaders.
  - Cross-Tenant Isolation: verifies tenant and project membership on all document operations, returning `404 Not Found` for cross-college access.
- [x] RESTful API Routes:
  - Mounted under `/api/v1/projects/:projectId/documents` (`GET /`, `POST /`, `GET /:documentId`, `POST /:documentId/versions`, `PATCH /:documentId/status`, `DELETE /:documentId`).
- [x] Frontend UI Components:
  - `documentApi.js`: Axios client handling multipart file uploads, version pushes, and status reviews.
  - `DocumentsTab.jsx`: Filter pills by category with badge counters, status filtering, document cards with version tags (`v1`, `v2`), file metadata (size, upload timestamp, author), and faculty feedback callout.
  - Document Modals:
    - "Upload Document" modal with category selector and draft/immediate submission toggle.
    - "Upload Revision" modal with revision notes and auto-submit flag.
    - "Version History" drawer displaying complete chronological revision changelog with uploader attribution and direct download links.
    - "Review Document" modal allowing faculty guides to approve or request changes with instruction notes.
  - Wired into `ProjectWorkspaceShell.jsx` replacing Sprint 7 teaser.
- [x] Automated Testing & Verification:
  - `server/tests/document.test.js`: 10 integration tests verifying upload, version increments, faculty approval/change-request workflow, deletion restrictions, and multi-tenant isolation.
  - **83/83 backend integration tests passing** across all 7 test suites.
  - Client production build verified cleanly with zero errors.
  - Client unit tests passing (4/4).

### 9.2 Sprint 7 Acceptance Verification
1. **Document Upload & Version 1 Creation**:
   - Uploading a project document creates a record with version 1 and initializes the `versions[]` history.
2. **Category Organization**:
   - Filter pills dynamically group documents by Proposal, Requirements, Design, Reports, Presentations, and Submissions.
3. **Revision Tracking & Increments**:
   - Uploading an updated file increments version to `v2` and appends previous revision to the history log.
4. **Faculty Review Workflow**:
   - Team members submit documents for review (`SUBMITTED`).
   - Faculty guide approves or requests changes with detailed feedback notes (`APPROVED` or `CHANGES_REQUESTED`).
   - Non-faculty/non-admin users are blocked from approving documents (returns `403 Forbidden`).
5. **Approved Document Immutability**:
   - Deletion of approved documents is rejected with `400 Bad Request`.
6. **Multi-Tenant Protection**:
   - Student from another college attempting to view or modify documents receives `404 Not Found`.

---

## 10. Sprint 8 – Discussions, Comments & System Notifications

### 10.1 Scope & Delivered Features
- [x] Database Models & Schema Constraints:
  - `Comment`: `collegeId`, `projectId`, `entityType` (`TASK`, `PROJECT`, `DISCUSSION`, `ANNOUNCEMENT`), `entityId`, `author`, `body`, `mentions` array of User references, `parentId` (hierarchical threads). Compound indexes on `(collegeId, projectId)` and `(entityType, entityId, createdAt: 1)`.
  - `Notification`: `collegeId`, `userId`, `type` (`TASK_ASSIGNED`, `TASK_STATUS`, `MILESTONE_DUE`, `DOCUMENT_REVIEW`, `FACULTY_REQUEST`, `COMMENT_MENTION`, `ANNOUNCEMENT`, `GENERAL`), `title`, `message`, `link`, `isRead`. Compound indexes on `(userId, isRead, createdAt: -1)` and `(collegeId, userId)`.
  - `Announcement`: `collegeId`, `projectId` (null = college-wide), `authorId`, `title`, `body`, `pinned`. Compound indexes on `(collegeId, projectId, createdAt: -1)` and `(collegeId, pinned, createdAt: -1)`.
- [x] Notification & Real-Time Pipeline (`server/src/services/notificationService.js`):
  - System notification creation with instant Socket.IO push to `user:${userId}` personal room.
  - Paginated user notifications retrieval with real-time `unreadCount` badge tally.
  - Individual and bulk `markAllAsRead` endpoints.
- [x] Commenting & Mention Services (`server/src/services/commentService.js`):
  - Mention parser: extracts `@name` or explicit user mentions, validates users within tenant college, creates `COMMENT_MENTION` notifications.
  - Hierarchical replies: parent comment references supporting threaded conversations.
  - Socket.IO broadcast: emits `'comment:new'` to `project:${projectId}` room for instant live append.
  - Permission checks: comment deletion restricted to original author, project leader, or college/super admin.
- [x] Institutional & Project Announcements (`server/src/services/announcementService.js`):
  - Role-gated publishing: College-wide broadcasts restricted to `COLLEGE_ADMIN` or `SUPER_ADMIN`; project announcements permitted for project leaders and faculty guides.
  - Real-time broadcast: emits `'announcement:new'` to `college:${collegeId}` or `project:${projectId}` rooms.
  - Pinning engine: prioritizes pinned announcements at the top of feeds.
- [x] Frontend UI Components:
  - `Topbar.jsx`: Real-time Notification Bell with live unread counter badge, animated dropdown popover with type-based iconography, single-click mark-as-read navigation, and "Mark all as read" button.
  - `NotificationsPage.jsx`: Filterable central alert dashboard (`ALL`, `UNREAD`, `READ`) with full pagination controls and deletion tools.
  - `DiscussionsTab.jsx`: Pinned announcement banner cards, interactive comment stream with quick `@mention` chips, inline threaded reply boxes, and real-time Socket.IO synchronization.
  - Integrated `/notifications` into `App.jsx` routing and `DiscussionsTab` into `ProjectWorkspaceShell.jsx`.
- [x] Automated Testing & Verification:
  - `server/tests/notification_comment.test.js`: 12 integration tests verifying comment posting, mention notification generation, threaded replies, deletion authorization, notification lifecycle, announcement broadcasting, and cross-college tenant isolation.
  - **95/95 backend integration tests passing** across all 8 test suites.
  - Client production build verified cleanly with zero errors.
  - Client unit tests passing (4/4).

### 10.2 Sprint 8 Acceptance Verification
1. **Comment Posting & Mention Notifications**:
   - Posting a comment mentioning a teammate creates the comment and triggers a `COMMENT_MENTION` notification with target links.
2. **Threaded Discussions**:
   - Team members reply to comments; nested replies display under the parent thread.
3. **Comment Deletion Permissions**:
   - Non-author members are blocked from deleting others' comments (`403 Forbidden`).
   - Authors and project leaders can delete comments and nested replies.
4. **Notification Management & Real-Time Sync**:
   - Real-time notification bell displays unread count badge.
   - Users mark individual or all notifications as read; unread count decrements accurately.
5. **Role-Gated Announcements**:
   - College Admins broadcast college-wide notices; non-admin students are rejected with `403 Forbidden`.
   - Project leaders publish project announcements with pinning support.
6. **Multi-Tenant Protection**:
   - Students from another college cannot view or post comments on a project (returns `404 Not Found`).

---


## 11. Sprint 9 – Phase 2: GitHub Integration (Optional & Strictly Isolated)

### 11.1 Scope & Delivered Features
- [x] Decoupled Modular Architecture (`server/src/integrations/github/`):
  - Strictly isolated directory containing models, services, controllers, routes, and webhook verification utilities.
  - The entire core platform functions 100% independently without GitHub credentials or connectivity.
- [x] Database Models & Constraints:
  - `GithubIntegration`: `collegeId`, `projectId`, `repoFullName` (format validated: `owner/repo`), `repoUrl`, `webhookSecret` (cryptographically generated HMAC key), `connectedBy`, `status` (`CONNECTED`, `DISCONNECTED`), `stats` (`totalPushes`, `totalPRs`, `tasksClosed`, `lastSyncAt`). Unique compound index on `(collegeId, projectId)`.
  - `GithubEvent`: `collegeId`, `projectId`, `eventType` (`push`, `pull_request`, `ping`), `sha`, `branch`, `author` (`username`, `avatarUrl`), `message`, `files` array, `url`, `linkedTasks` (array of Task references auto-closed or linked), `payload` (raw JSON). Compound index on `(collegeId, projectId, receivedAt: -1)`.
- [x] Cryptographic Webhook Security (`server/src/integrations/github/utils/webhookVerifier.js`):
  - HMAC-SHA256 signature verification comparing `X-Hub-Signature-256` header against hash calculated with `webhookSecret`.
  - Buffer length guard and constant-time comparison via `crypto.timingSafeEqual` preventing timing attack vulnerabilities.
- [x] Business Services & Auto-Task Closure (`server/src/integrations/github/services/githubService.js`):
  - Repository connection lifecycle: connect, query status, and clean disconnection.
  - Smart Commit Message Parsing: detects regex pattern `\b(fixes|closes|resolves|fixed|closed|resolved)\s+(TASK-\d+)\b/gi` as well as standalone task references `\b(TASK-\d+)\b/gi`.
  - Automated Task Closure: Automatically updates matching tasks from `TODO`/`IN_PROGRESS`/`IN_REVIEW` to `COMPLETED`, sets `completedAt`, pushes commit metadata to `task.githubLinks[]`, recalculates project progress via `TaskService.recalculateProjectProgress()`, and dispatches Socket.IO event `task:status_changed`.
  - Pull Request Ingestion: logs PR action, author, and branch state into `GithubEvent`.
  - Unauthenticated Webhook Isolation: resolves `effectiveCollegeId` from the integration record to ensure webhook deliveries from GitHub servers adhere strictly to multi-tenant isolation.
  - Presentation Simulation Endpoint: allows demo participants to simulate a commit push without needing external tunnel/ngrok setup.
- [x] Frontend Project Workspace Integration:
  - `githubApi.js`: Frontend API client handling repository connection, status, event stream, and demo push simulation.
  - `GithubTab.jsx`: Modern, demo-ready tab integrated directly into `ProjectWorkspaceShell.jsx`. Features:
    - Connected repository card with repo link, branch status, and instant disconnect trigger.
    - Setup & Webhook Guide displaying the unique project payload URL and webhook secret with copy-to-clipboard utilities.
    - Statistics metrics strip (Pushes, Pull Requests, Tasks Auto-Closed, Last Sync).
    - Event Stream filterable by `ALL`, `push`, and `pull_request`, displaying commit SHA badges, author info, commit messages, and linked task status chips.
    - "Simulate Git Push" demo modal to easily showcase task auto-completion in viva/presentations.
- [x] Automated Testing & Quality Checks:
  - `server/tests/github_integration.test.js`: 10 integration tests verifying repository connection, repo name regex validation, integration status, commit parsing with task auto-closure, webhook HMAC-SHA256 signature verification, PR ingestion, event listing, push simulation, repository disconnection, and cross-college isolation (404).
  - **105/105 backend integration tests passing** across all 9 test suites.
  - Client production build verified cleanly with zero errors.

### 11.2 Sprint 9 Acceptance Verification
1. **Repository Connection & Secret Generation**:
   - Project leader connects repository `acme/projectpulse-demo`.
   - Webhook secret is generated and stored securely.
2. **Commit Parsing & Automated Task Closure**:
   - Ingesting a webhook with commit message `"fixes TASK-001 implement auth"` immediately marks `TASK-001` as `COMPLETED`, sets `completedAt`, appends commit link, and updates overall project progress.
3. **Cryptographic Webhook Verification**:
   - Webhooks with invalid or missing HMAC signatures are rejected with `401 Unauthorized`.
4. **Live Presentation Simulation**:
   - Simulated push triggers end-to-end event recording and task closure for local/offline demonstrations.
5. **Multi-Tenant Protection**:
   - Users from College B cannot view or dispatch webhooks for College A repositories (returns `404 Not Found`).

---

## 12. Sprint 10 – Production Hardening, Deployment Configurations & Documentation

### 12.1 Scope & Delivered Features
- [x] Security & Hardening:
  - Enforced Helmet HTTP headers (`crossOriginEmbedderPolicy: false`, custom CSP for dashboard components).
  - General API rate limiter (`express-rate-limit`) mounted across `/api` endpoints with environment variable controls, active in development/production and safely disabled in test suites.
  - Strict authentication rate limiting (20 requests per 15 minutes) on `/register`, `/login`, `/forgot-password`, `/reset-password`.
  - HTTP Parameter Pollution protection via `hpp()`.
  - NoSQL injection prevention via `express-mongo-sanitize()`.
  - Dual-token session security: 15-minute access token in HTTP response/headers, 7-day refresh token in `httpOnly` secure cookie with `sameSite` protection and automated rotation.
  - Database connection resilience: in-memory `MongoMemoryServer` automatic fallback when local or remote MongoDB is unavailable, ensuring immediate out-of-the-box local developer and evaluator experience.
- [x] Automated Background Jobs:
  - Initialized `DeadlineJob.initDeadlineCron()` on server launch: schedules midnight automated health inspection of milestones, tasks, and projects; dynamically flags overdue milestones as `DELAYED` and calculates project health (`ON_TRACK`, `AT_RISK`, `DELAYED`).
- [x] Pre-Seeded Comprehensive Accounts:
  - Extended `server/src/seed/index.js` to seed accounts across all 5 system roles (`SUPER_ADMIN`, `COLLEGE_ADMIN`, `FACULTY`, `REVIEWER`, `STUDENT`) across two separate colleges (Apex Institute of Technology and Stanford College of Engineering).
- [x] Deployment Configurations:
  - `client/vercel.json`: Single Page Application (SPA) HTML5 pushState rewrites and static asset cache-control headers for seamless Vercel hosting.
  - `render.yaml`: Infrastructure-as-code configuration for Render web service deployment with environment variable declarations.
  - `server/Dockerfile` & `server/.dockerignore`: Optimized Alpine Node.js multi-stage Docker containerization.
  - Root `package.json`: Unified build, start, dev, and test scripts for monorepo workflows.
- [x] Complete Root Documentation:
  - Root `README.md`: Exhaustive, presentation-ready documentation covering architecture, problem statement, multi-tenancy model, permission matrix, seed credentials table, 10-module REST API reference, real-time Socket.IO events, and step-by-step deployment guide.
- [x] Full Automated Verification:
  - Backend integration test suite: **105 / 105 passed (100%)** across all 9 test files.
  - Client unit test suite: **4 / 4 passed (100%)**.
  - Client production build: **Passed with zero errors**.

### 12.2 Sprint 10 Acceptance Verification
1. **Security & Production Hardening**:
   - Helmet, MongoSanitize, HPP, and rate limiting active.
   - Dual-token auth rotates securely with httpOnly cookies.
2. **Deployment Ready**:
   - `vercel.json` verified for client SPA routing.
   - `render.yaml` and `Dockerfile` verified for backend server containerization.
3. **Comprehensive Documentation & Seeding**:
   - Seed script creates complete sets of colleges, departments, and users across all 5 roles.
   - Root `README.md` details architecture, credentials, APIs, and deployment guides.
4. **End-to-End Test Suite Green**:
   - Full suite of 105 integration tests passing across all 9 sprints.

---

### 12.3 Super Admin Institutional Onboarding Fix
- **Issue:** On the Super Admin dashboard (`/super-admin`), the "+ Add New College" and "+ Add First College" buttons linked to `/super-admin/colleges/new`, which lacked an explicit route in `App.jsx` and fell back to re-rendering the overview dashboard without opening the onboarding form.
- **Resolution:**
  - Integrated the "Onboard New College" modal directly into [`SuperAdminDashboard.jsx`](file:///d:/Fsd_project_2/client/src/pages/super-admin/SuperAdminDashboard.jsx). Clicking either "+ Add New College" or "+ Add First College" now opens the modal instantly on the dashboard.
  - Added explicit routing in [`App.jsx`](file:///d:/Fsd_project_2/client/src/App.jsx) for `/super-admin/colleges/new` rendering `<CollegesListPage defaultOpenModal={true} />`.
  - Enriched error toast reporting across both pages to surface backend validation messages (e.g., duplicate college code or email collisions).
