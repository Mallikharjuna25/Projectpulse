import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { RoleRoute } from './routes/RoleRoute.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';

// Pages
import { LandingPage } from './pages/public/LandingPage.jsx';
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { RegisterPage } from './pages/auth/RegisterPage.jsx';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage.jsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.jsx';
import { StudentDashboard } from './pages/student/StudentDashboard.jsx';
import { FacultyDashboard } from './pages/faculty/FacultyDashboard.jsx';
import { SupervisionRequestsPage } from './pages/faculty/SupervisionRequestsPage.jsx';
import { CollegeAdminDashboard } from './pages/college-admin/CollegeAdminDashboard.jsx';
import { SuperAdminDashboard } from './pages/super-admin/SuperAdminDashboard.jsx';
import { CollegesListPage } from './pages/super-admin/CollegesListPage.jsx';
import { DepartmentsPage } from './pages/college-admin/DepartmentsPage.jsx';
import { StudentsPage } from './pages/college-admin/StudentsPage.jsx';
import { FacultyPage } from './pages/college-admin/FacultyPage.jsx';
import { ProfilePage } from './pages/shared/ProfilePage.jsx';
import { NotFoundPage } from './pages/shared/NotFoundPage.jsx';
import { ForbiddenPage } from './pages/shared/ForbiddenPage.jsx';
import { ProjectsListPage } from './pages/student/ProjectsListPage.jsx';
import { CreateProjectWizard } from './pages/projects/CreateProjectWizard.jsx';
import { JoinProjectPage } from './pages/projects/JoinProjectPage.jsx';
import { ProjectWorkspaceShell } from './pages/projects/ProjectWorkspaceShell.jsx';
import { TasksListPage } from './pages/student/TasksListPage.jsx';
import { CalendarPage } from './pages/shared/CalendarPage.jsx';
import { NotificationsPage } from './pages/shared/NotificationsPage.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/unauthorized" element={<ForbiddenPage />} />

              {/* Protected App Routes inside AppLayout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Student & Project Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <RoleRoute allowedRoles={['STUDENT']}>
                      <StudentDashboard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <RoleRoute allowedRoles={['STUDENT', 'FACULTY', 'COLLEGE_ADMIN', 'REVIEWER', 'SUPER_ADMIN']}>
                      <ProjectsListPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/projects/create"
                  element={
                    <RoleRoute allowedRoles={['STUDENT', 'FACULTY', 'COLLEGE_ADMIN']}>
                      <CreateProjectWizard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/projects/join"
                  element={
                    <RoleRoute allowedRoles={['STUDENT']}>
                      <JoinProjectPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/projects/:projectId/*"
                  element={
                    <RoleRoute allowedRoles={['STUDENT', 'FACULTY', 'COLLEGE_ADMIN', 'REVIEWER', 'SUPER_ADMIN']}>
                      <ProjectWorkspaceShell />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/projects/:projectId"
                  element={
                    <RoleRoute allowedRoles={['STUDENT', 'FACULTY', 'COLLEGE_ADMIN', 'REVIEWER', 'SUPER_ADMIN']}>
                      <ProjectWorkspaceShell />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <RoleRoute allowedRoles={['STUDENT']}>
                      <TasksListPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <RoleRoute allowedRoles={['STUDENT', 'FACULTY', 'COLLEGE_ADMIN', 'REVIEWER', 'SUPER_ADMIN']}>
                      <CalendarPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <RoleRoute allowedRoles={['STUDENT', 'FACULTY', 'COLLEGE_ADMIN', 'REVIEWER', 'SUPER_ADMIN']}>
                      <NotificationsPage />
                    </RoleRoute>
                  }
                />

                {/* Reviewer Routes */}
                <Route
                  path="/reviewer"
                  element={
                    <RoleRoute allowedRoles={['REVIEWER']}>
                      <ProjectsListPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/reviewer/reviews"
                  element={
                    <RoleRoute allowedRoles={['REVIEWER']}>
                      <ProjectsListPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/reviewer/*"
                  element={
                    <RoleRoute allowedRoles={['REVIEWER']}>
                      <ProjectsListPage />
                    </RoleRoute>
                  }
                />

                {/* Faculty Routes */}
                <Route
                  path="/faculty"
                  element={
                    <RoleRoute allowedRoles={['FACULTY']}>
                      <FacultyDashboard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/faculty/requests"
                  element={
                    <RoleRoute allowedRoles={['FACULTY']}>
                      <SupervisionRequestsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/faculty/projects"
                  element={
                    <RoleRoute allowedRoles={['FACULTY']}>
                      <ProjectsListPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/faculty/*"
                  element={
                    <RoleRoute allowedRoles={['FACULTY']}>
                      <FacultyDashboard />
                    </RoleRoute>
                  }
                />

                {/* College Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <RoleRoute allowedRoles={['COLLEGE_ADMIN']}>
                      <CollegeAdminDashboard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/departments"
                  element={
                    <RoleRoute allowedRoles={['COLLEGE_ADMIN']}>
                      <DepartmentsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/students"
                  element={
                    <RoleRoute allowedRoles={['COLLEGE_ADMIN']}>
                      <StudentsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/faculty"
                  element={
                    <RoleRoute allowedRoles={['COLLEGE_ADMIN']}>
                      <FacultyPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/projects"
                  element={
                    <RoleRoute allowedRoles={['COLLEGE_ADMIN']}>
                      <ProjectsListPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <RoleRoute allowedRoles={['COLLEGE_ADMIN']}>
                      <CollegeAdminDashboard />
                    </RoleRoute>
                  }
                />

                {/* Super Admin Routes */}
                <Route
                  path="/super-admin"
                  element={
                    <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                      <SuperAdminDashboard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/super-admin/colleges"
                  element={
                    <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                      <CollegesListPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/super-admin/colleges/new"
                  element={
                    <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                      <CollegesListPage defaultOpenModal={true} />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/super-admin/*"
                  element={
                    <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                      <SuperAdminDashboard />
                    </RoleRoute>
                  }
                />

                {/* Shared User Profile & Account Settings */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<ProfilePage />} />
              </Route>

              {/* 404 Catch All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

