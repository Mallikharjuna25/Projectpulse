import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../routes/ProtectedRoute.jsx';
import { RoleRoute } from '../routes/RoleRoute.jsx';
import * as AuthContextModule from '../context/AuthContext.jsx';

describe('Auth Guards: ProtectedRoute & RoleRoute', () => {
  it('should show loading spinner while authentication state is resolving', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Secret Data</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText(/Authenticating ProjectPulse session/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Secret Data')).not.toBeInTheDocument();
  });

  it('should redirect unauthenticated users to /login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Secret Data</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page Screen')).toBeInTheDocument();
    expect(screen.queryByText('Protected Secret Data')).not.toBeInTheDocument();
  });

  it('should render protected children when user is authenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Rahul', globalRole: 'STUDENT' }
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Student Workspace</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Student Workspace')).toBeInTheDocument();
  });

  it('should allow authorized roles and block unauthorized roles', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Rahul', globalRole: 'STUDENT' }
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRoles={['COLLEGE_ADMIN', 'SUPER_ADMIN']}>
                <div>Admin Secret Console</div>
              </RoleRoute>
            }
          />
          <Route path="/dashboard" element={<div>Student Home Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Should redirect student away from /admin to /dashboard
    expect(screen.getByText('Student Home Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin Secret Console')).not.toBeInTheDocument();
  });
});

