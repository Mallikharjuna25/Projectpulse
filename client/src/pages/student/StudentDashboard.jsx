import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  KeyRound,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { projectApi } from '../../services/projectApi.js';
import { taskApi } from '../../services/taskApi.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import toast from 'react-hot-toast';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsRes, tasksRes] = await Promise.all([
        projectApi.listProjects({ roleFilter: 'MEMBER' }).catch(() => ({ data: { projects: [] } })),
        taskApi.getMyTasks().catch(() => ({ data: { tasks: [] } }))
      ]);

      setProjects(projectsRes?.data?.projects || projectsRes?.projects || []);
      setTasks(tasksRes?.data?.tasks || tasksRes?.tasks || []);
    } catch {
      toast.error('Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute metrics
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE' || p.status === 'PLANNING');
  const leaderProjects = projects.filter(
    (p) => p.createdBy === user?._id || p.currentUserRole === 'LEADER'
  );

  const now = new Date();
  const isDueToday = (d) => {
    if (!d) return false;
    const date = new Date(d);
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  const isOverdue = (d) => {
    if (!d) return false;
    return new Date(d) < now;
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const dueTodayTasks = pendingTasks.filter((t) => isDueToday(t.dueDate));
  const overdueTasks = pendingTasks.filter((t) => isOverdue(t.dueDate));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-violet-600 rounded-2xl p-6 text-white shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-wider text-brand-200 font-semibold">
            {user?.collegeId?.collegeName || 'Student Workspace'}
          </span>
          <h1 className="text-2xl font-black mt-1">Welcome back, {user?.name}!</h1>
          <p className="text-xs text-brand-100 mt-1 max-w-xl">
            {user?.rollNumber ? `Roll No: ${user.rollNumber} · ` : ''}
            {user?.academicYear ? `${user.academicYear} Year · ` : ''}
            Track your milestones, team tasks, and faculty reviews in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/projects/join">
            <Button
              variant="secondary"
              size="sm"
              icon={KeyRound}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xs"
            >
              Join with Code
            </Button>
          </Link>
          <Link to="/projects/create">
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              className="bg-white text-brand-900 hover:bg-brand-50 shadow-sm"
            >
              New Project
            </Button>
          </Link>
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Projects</span>
            <FolderGit2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : activeProjects.length}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {leaderProjects.length} Leading
          </span>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Assigned Tasks</span>
            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : pendingTasks.length}
          </div>
          <span className="text-[11px] text-slate-400">pending completion</span>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Due Today</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {loading ? '...' : dueTodayTasks.length}
          </div>
          <span className="text-[11px] text-amber-600/80 font-medium">
            {dueTodayTasks.length > 0 ? 'Requires attention' : 'No tasks due today'}
          </span>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Overdue Tasks</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {loading ? '...' : overdueTasks.length}
          </div>
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {overdueTasks.length === 0 ? 'All deadlines on track' : `${overdueTasks.length} past due`}
          </span>
        </Card>
      </div>

      {/* Main Grid: My Projects & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Projects & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Projects */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-brand-600" /> My Projects
              </h2>
              <Link to="/projects" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                View all ({projects.length})
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              </div>
            ) : projects.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <FolderGit2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No Projects Joined Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Create a new project to start collaborating with your team or join an existing project using an invite code.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Link to="/projects/create">
                    <Button size="sm" icon={Plus}>Create Project</Button>
                  </Link>
                  <Link to="/projects/join">
                    <Button variant="secondary" size="sm" icon={KeyRound}>Join Team</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 3).map((proj) => (
                  <div
                    key={proj._id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            to={`/projects/${proj._id}`}
                            className="font-bold text-sm text-slate-900 dark:text-white hover:text-brand-600 transition-colors"
                          >
                            {proj.title}
                          </Link>
                          {proj.createdBy === user?._id && (
                            <Badge variant="indigo" size="sm">LEADER</Badge>
                          )}
                          <Badge
                            variant={
                              proj.health === 'ON_TRACK'
                                ? 'green'
                                : proj.health === 'AT_RISK'
                                ? 'amber'
                                : 'red'
                            }
                            size="sm"
                          >
                            {proj.health?.replace('_', ' ') || 'ACTIVE'}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {proj.projectCode} · {proj.facultyGuideId?.name ? `Guide: ${proj.facultyGuideId.name}` : 'Guide Pending Assignment'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {proj.progress || 0}%
                        </span>
                        <span className="block text-[10px] text-slate-400">Progress</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${proj.progress || 0}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>Deadline: {proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'Not Set'}</span>
                      <Link
                        to={`/projects/${proj._id}`}
                        className="font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top Assigned Tasks */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" /> Tasks Assigned To Me
              </h2>
              <Link to="/tasks" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                View all ({tasks.length})
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <CheckSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No tasks currently assigned to you. You are all caught up!
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {tasks.slice(0, 5).map((t) => (
                  <div
                    key={t._id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-brand-600 font-bold">
                        {t.taskCode}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {t.title}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {t.projectId?.title || 'Project'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          t.status === 'COMPLETED'
                            ? 'green'
                            : t.status === 'IN_PROGRESS'
                            ? 'blue'
                            : 'grey'
                        }
                        size="sm"
                      >
                        {t.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No Due Date'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Shortcuts & Actions */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <Card className="p-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Quick Actions
            </h2>
            <div className="space-y-2 text-xs">
              <Link
                to="/projects/create"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-700 dark:text-slate-300"
              >
                <span>Create New Project</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                to="/projects/join"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-700 dark:text-slate-300"
              >
                <span>Join Project with Code</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                to="/calendar"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-700 dark:text-slate-300"
              >
                <span>View Project Calendar</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                to="/tasks"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-700 dark:text-slate-300"
              >
                <span>My Task Deliverables</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
