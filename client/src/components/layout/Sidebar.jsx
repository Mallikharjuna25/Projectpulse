import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Calendar,
  Bell,
  Building,
  GraduationCap,
  Users,
  Award,
  BarChart3,
  Megaphone,
  Sliders,
  FileCheck2,
  FileSpreadsheet,
  X,
  Layers,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const getNavLinks = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { name: 'Dashboard', path: '/super-admin', icon: LayoutDashboard },
          { name: 'Colleges', path: '/super-admin/colleges', icon: Building },
          { name: 'Notifications', path: '/notifications', icon: Bell },
          { name: 'Update Password', path: '/settings', icon: KeyRound },
        ];

      case 'COLLEGE_ADMIN':
        return [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { name: 'Departments', path: '/admin/departments', icon: Layers },
          { name: 'Students', path: '/admin/students', icon: GraduationCap },
          { name: 'Faculty', path: '/admin/faculty', icon: Users },
          { name: 'All Projects', path: '/admin/projects', icon: FolderGit2 },
          { name: 'Calendar', path: '/calendar', icon: Calendar },
          { name: 'Notifications', path: '/notifications', icon: Bell },
          { name: 'Update Password', path: '/settings', icon: KeyRound },
        ];

      case 'FACULTY':
        return [
          { name: 'Dashboard', path: '/faculty', icon: LayoutDashboard },
          { name: 'Supervised Projects', path: '/faculty/projects', icon: FolderGit2 },
          { name: 'Supervision Requests', path: '/faculty/requests', icon: Users },
          { name: 'Calendar', path: '/calendar', icon: Calendar },
          { name: 'Notifications', path: '/notifications', icon: Bell },
          { name: 'Update Password', path: '/settings', icon: KeyRound },
        ];

      case 'REVIEWER':
        return [
          { name: 'Dashboard', path: '/reviewer', icon: LayoutDashboard },
          { name: 'Reviews Queue', path: '/reviewer/reviews', icon: FileCheck2 },
          { name: 'Update Password', path: '/settings', icon: KeyRound },
        ];

      case 'STUDENT':
      default:
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'My Projects', path: '/projects', icon: FolderGit2 },
          { name: 'My Tasks', path: '/tasks', icon: CheckSquare },
          { name: 'Calendar', path: '/calendar', icon: Calendar },
          { name: 'Notifications', path: '/notifications', icon: Bell },
          { name: 'Update Password', path: '/settings', icon: KeyRound },
        ];
    }
  };

  const navLinks = getNavLinks(user?.globalRole);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-violet-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
              P
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                Project<span className="text-brand-600 dark:text-brand-400">Pulse</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wide -mt-0.5">
                COLLEGE PMS
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          <div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/dashboard' || link.path === '/admin' || link.path === '/super-admin' || link.path === '/faculty'}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{link.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User footer badge */}
        <NavLink
          to="/settings"
          onClick={onClose}
          title="Account & Password Settings"
          className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors block group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 group-hover:ring-2 group-hover:ring-amber-500 transition-all">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-500 transition-colors">
                {user?.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
            <KeyRound className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors shrink-0" />
          </div>
        </NavLink>
      </aside>
    </>
  );
};

