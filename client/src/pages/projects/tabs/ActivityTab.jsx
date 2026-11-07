import React, { useState, useEffect } from 'react';
import {
  Clock,
  User,
  FolderGit2,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { projectApi } from '../../../services/projectApi.js';
import toast from 'react-hot-toast';

export const ActivityTab = ({ projectId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (filterType) params.type = filterType;
      const res = await projectApi.listActivities(projectId, params);
      setActivities(res?.data?.activities || res?.activities || []);
    } catch (err) {
      toast.error('Failed to load project activity feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [filterType]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'PROJECT_CREATED':
      case 'PROJECT_UPDATED':
        return <FolderGit2 className="w-4 h-4 text-indigo-500" />;
      case 'MEMBER_JOINED':
      case 'MEMBER_REMOVED':
        return <Users className="w-4 h-4 text-emerald-500" />;
      case 'TASK_CREATED':
      case 'TASK_COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-sky-500" />;
      case 'DEADLINE_CHANGED':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Activity Timeline & Audit Trail
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time chronological record of all team events, status adjustments, and project changes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Activities</option>
            <option value="PROJECT_CREATED">Project Creation</option>
            <option value="PROJECT_UPDATED">Project Updates</option>
            <option value="MEMBER_JOINED">Member Join Events</option>
            <option value="MEMBER_REMOVED">Member Removals</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No activities found matching the selected filter.
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-6 pl-6">
          {activities.map((act) => (
            <div key={act._id} className="relative group">
              {/* Dot Icon on timeline */}
              <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-sm">
                {getActivityIcon(act.type)}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {act.actorId?.name || 'System / User'}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">{act.message}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap pl-2">
                    {new Date(act.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

