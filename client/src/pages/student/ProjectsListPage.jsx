import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  KeyRound,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { projectApi } from '../../services/projectApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export const ProjectsListPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('MY_PROJECTS'); // 'MY_PROJECTS' | 'EXPLORE'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      if (user?.globalRole === 'STUDENT') {
        params.roleFilter = activeTab === 'EXPLORE' ? 'EXPLORE' : 'MEMBER';
      } else if (user?.globalRole === 'FACULTY') {
        params.roleFilter = activeTab === 'MY_PROJECTS' ? 'SUPERVISED' : '';
      }

      const res = await projectApi.listProjects(params);
      setProjects(res?.data?.projects || res?.projects || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeTab, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  const getHealthBadge = (health) => {
    switch (health) {
      case 'ON_TRACK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> On Track
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> At Risk
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Clock className="w-3 h-3" /> Delayed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {health || 'Unknown'}
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      PLANNING: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      ON_HOLD: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      COMPLETED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      ARCHIVED: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${map[status] || map.PLANNING}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const map = {
      LOW: 'text-slate-400 bg-slate-500/10',
      MEDIUM: 'text-sky-400 bg-sky-500/10',
      HIGH: 'text-amber-400 bg-amber-500/10',
      CRITICAL: 'text-rose-400 bg-rose-500/10'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[priority] || map.MEDIUM}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FolderGit2 className="w-7 h-7 text-indigo-500" />
            Project Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Centralized hub for all your team projects, milestones, and supervision
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/projects/join"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <KeyRound className="w-4 h-4 text-amber-500" />
            Join with Code
          </Link>
          <Link
            to="/projects/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('MY_PROJECTS')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'MY_PROJECTS'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {user?.globalRole === 'FACULTY' ? 'Supervised Projects' : 'My Projects'}
          </button>
          <button
            onClick={() => setActiveTab('EXPLORE')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'EXPLORE'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Explore College Projects
          </button>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, title, domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          <FolderGit2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No projects found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {activeTab === 'MY_PROJECTS'
              ? "You haven't joined or created any projects yet. Start one or join with an invite code!"
              : 'No college-wide projects matching your search filter.'}
          </p>
          {activeTab === 'MY_PROJECTS' && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link
                to="/projects/create"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Create Project
              </Link>
              <Link
                to="/projects/join"
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Join with Code
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const daysLeft = Math.ceil(
              (new Date(proj.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={proj._id}
                className="flex flex-col justify-between rounded-xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/50 hover:shadow-md transition-all group"
              >
                <div className="space-y-3">
                  {/* Card Header: Code & Health */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                      {proj.projectCode}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getHealthBadge(proj.health)}
                      {getStatusBadge(proj.status)}
                    </div>
                  </div>

                  {/* Title & Domain */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-500 transition-colors">
                      {proj.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      Domain: <span className="text-slate-700 dark:text-slate-300">{proj.domain || 'General'}</span>
                    </p>
                  </div>

                  {/* Abstract */}
                  {proj.abstract && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {proj.abstract}
                    </p>
                  )}

                  {/* Tech Stack Pills */}
                  {proj.techStack && proj.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.techStack.slice(0, 4).map((tech, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {tech}
                        </span>
                      ))}
                      {proj.techStack.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800">
                          +{proj.techStack.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center text-xs mb-1 font-medium">
                      <span className="text-slate-500 dark:text-slate-400">Progress</span>
                      <span className="text-slate-900 dark:text-white">{proj.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(proj.progress || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {daysLeft >= 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`}
                    </span>
                    {getPriorityBadge(proj.priority)}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {proj.userProjectRole ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          {proj.userProjectRole}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Observer</span>
                      )}
                    </div>

                    <Link
                      to={`/projects/${proj._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"
                    >
                      Workspace <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

