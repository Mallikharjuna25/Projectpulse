import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FolderGit2,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { taskApi } from '../../services/taskApi.js';
import toast from 'react-hot-toast';

export const TasksListPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await taskApi.getMyTasks(params);
      setTasks(res?.data?.tasks || res?.tasks || []);
    } catch (err) {
      toast.error('Failed to load your assigned tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const filteredTasks = tasks.filter((t) => {
    if (!search) return true;
    return (
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.taskCode.toLowerCase().includes(search.toLowerCase()) ||
      t.projectId?.title?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalAssigned = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueCount = tasks.filter(
    (t) => t.status !== 'COMPLETED' && t.dueDate && new Date() > new Date(t.dueDate)
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <CheckSquare className="w-7 h-7 text-indigo-500" />
          My Assigned Tasks
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track and deliver tasks assigned to you across all your academic project teams
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Total Assigned</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalAssigned}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">In Progress</span>
          <div className="text-2xl font-bold text-sky-500 mt-1">
            {inProgressCount}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Overdue</span>
          <div className="text-2xl font-bold text-rose-500 mt-1">
            {overdueCount}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Completed</span>
          <div className="text-2xl font-bold text-emerald-500 mt-1">
            {completedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by task title, code, or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <CheckSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No assigned tasks found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You currently have no tasks assigned matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => {
            const isOverdue =
              t.status !== 'COMPLETED' && t.dueDate && new Date() > new Date(t.dueDate);
            const completedCountCriteria = (t.acceptanceCriteria || []).filter(
              (c) => c.isCompleted
            ).length;
            const totalCountCriteria = (t.acceptanceCriteria || []).length;

            return (
              <div
                key={t._id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      {t.taskCode}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Project:
                    </span>
                    <Link
                      to={`/projects/${t.projectId?._id}`}
                      className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-500 flex items-center gap-1"
                    >
                      <FolderGit2 className="w-3.5 h-3.5" />
                      {t.projectId?.title || 'Project'} ({t.projectId?.projectCode})
                    </Link>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    {t.dueDate && (
                      <span
                        className={`inline-flex items-center gap-1 ${
                          isOverdue ? 'text-rose-500 font-bold' : ''
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Due {new Date(t.dueDate).toLocaleDateString()}
                        {isOverdue && ' (Overdue)'}
                      </span>
                    )}

                    {totalCountCriteria > 0 && (
                      <span className="inline-flex items-center gap-1 text-indigo-500">
                        <CheckSquare className="w-3.5 h-3.5" />
                        {completedCountCriteria}/{totalCountCriteria} criteria met
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {t.priority}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      t.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : t.status === 'IN_PROGRESS'
                        ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                        : t.status === 'IN_REVIEW'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>

                  <Link
                    to={`/projects/${t.projectId?._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    Open Kanban <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

