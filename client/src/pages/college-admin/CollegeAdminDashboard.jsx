import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Layers,
  FolderGit2,
  AlertCircle,
  Clock,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { userManagementApi } from '../../services/userManagementApi.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import toast from 'react-hot-toast';

export const CollegeAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await userManagementApi.getCollegeStats();
      setStats(res.data?.stats || null);
    } catch {
      toast.error('Failed to load institutional statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
            Institutional Administration
          </span>
          <h1 className="text-2xl font-black mt-1">
            {user?.collegeId?.collegeName || 'College Admin Console'}
          </h1>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            Manage academic departments, faculty guide assignments, student rosters, and project milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/admin/students">
            <Button
              variant="secondary"
              size="sm"
              icon={GraduationCap}
              className="bg-white text-blue-950 hover:bg-blue-50 shadow-sm"
            >
              Manage Students
            </Button>
          </Link>
          <Link to="/projects">
            <Button
              variant="secondary"
              size="sm"
              icon={FolderGit2}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              All Projects
            </Button>
          </Link>
          <button
            onClick={fetchStats}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 6 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Students</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : stats?.studentsCount ?? 0}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Active Roster</span>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Faculty</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : stats?.facultyCount ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">Guides</span>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Departments</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : stats?.departmentsCount ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">Academic Units</span>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Total Projects</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : stats?.totalProjectsCount ?? 0}
          </div>
          <span className="text-[10px] text-blue-600 font-medium">Registered</span>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Unassigned</div>
          <div className="text-2xl font-black text-amber-600">
            {loading ? '...' : stats?.noGuideCount ?? 0}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">Needs Guide</span>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Delayed</div>
          <div className="text-2xl font-black text-rose-600">
            {loading ? '...' : stats?.delayedCount ?? 0}
          </div>
          <span className="text-[10px] text-rose-600 font-medium">Overdue</span>
        </Card>
      </div>

      {/* Main Section: Projects Needing a Guide */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-brand-600" /> Projects Requiring Faculty Guide Assignment
          </h2>
          <Link to="/projects" className="text-xs font-semibold text-brand-600 hover:underline">
            View all projects
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        ) : !stats?.unassignedProjects || stats.unassignedProjects.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              All Projects Have Assigned Guides
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              There are currently no active projects awaiting faculty guide allocation. All teams are under active faculty supervision.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Project Code</th>
                  <th className="py-2.5 px-3">Project Title</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Team Leader</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.unassignedProjects.map((proj) => (
                  <tr key={proj._id}>
                    <td className="py-3 px-3 font-mono font-bold text-brand-600">
                      {proj.projectCode}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                      {proj.title}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {proj.departmentId?.name || 'General'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {proj.createdBy?.name || 'Student'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="amber" size="sm">{proj.status}</Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link to={`/projects/${proj._id}`}>
                        <Button size="sm" className="text-xs py-1 px-3">
                          Review Project
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
