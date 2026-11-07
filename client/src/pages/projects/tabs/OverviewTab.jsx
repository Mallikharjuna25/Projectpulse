import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Award,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const OverviewTab = ({ data, onSwitchTab }) => {
  const { project, teamMembers, recentActivities, daysRemaining, healthExplanation } = data;

  const getHealthAlert = (health) => {
    switch (health) {
      case 'ON_TRACK':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
          icon: CheckCircle2,
          title: 'On Track'
        };
      case 'AT_RISK':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
          icon: AlertTriangle,
          title: 'At Risk'
        };
      case 'DELAYED':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
          icon: Clock,
          title: 'Delayed'
        };
      default:
        return {
          bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
          icon: Clock,
          title: health
        };
    }
  };

  const alert = getHealthAlert(project.health);
  const AlertIcon = alert.icon;

  return (
    <div className="space-y-6">
      {/* Health Status Explanation Banner */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${alert.bg}`}>
        <AlertIcon className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold">Health Status: {alert.title}</h4>
          <p className="text-xs mt-0.5 opacity-90">{healthExplanation}</p>
        </div>
      </div>

      {/* Top 4 Quick Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Progress</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {project.progress || 0}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Days Remaining</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {daysRemaining >= 0 ? daysRemaining : '0'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Due {new Date(project.deadline).toLocaleDateString()}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Team Size</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {teamMembers?.length || 0}
          </div>
          <button
            onClick={() => onSwitchTab('team')}
            className="text-[11px] text-indigo-500 hover:underline mt-1 block font-medium"
          >
            Manage Team &rarr;
          </button>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Faculty Guide</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {project.facultyGuideId ? project.facultyGuideId.name : 'Unassigned'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {project.facultyGuideId ? project.facultyGuideId.designation || 'Faculty' : 'Supervision pending'}
          </span>
        </div>
      </div>

      {/* Main Grid: Abstract & Objectives (Left) + Timeline / Tech Stack (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Abstract / Description Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Project Abstract & Scope
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {project.abstract || project.description || 'No detailed abstract recorded for this project yet.'}
            </p>

            {project.objectives && project.objectives.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Key Objectives
                </h4>
                <ul className="space-y-1.5">
                  {project.objectives.map((obj, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recent Activity Timeline Preview */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Team Activity
              </h3>
              <button
                onClick={() => onSwitchTab('activity')}
                className="text-xs text-indigo-500 hover:underline font-semibold"
              >
                View Full Feed &rarr;
              </button>
            </div>

            {recentActivities && recentActivities.length > 0 ? (
              <ul className="space-y-3">
                {recentActivities.slice(0, 5).map((act) => (
                  <li
                    key={act._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center shrink-0">
                        {act.actorId?.name ? act.actorId.name[0] : 'U'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {act.actorId?.name || 'User'}
                        </span>{' '}
                        <span className="text-slate-600 dark:text-slate-400">{act.message}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap pl-2">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">No activities recorded yet.</p>
            )}
          </div>
        </div>

        {/* Right Sidebar: Tech Stack, Team Preview */}
        <div className="space-y-6">
          {/* Tech Stack Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Technology Stack
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {project.techStack && project.techStack.length > 0 ? (
                project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {tech}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">None specified</span>
              )}
            </div>
          </div>

          {/* Team Members Snapshot */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Team Members ({teamMembers?.length || 0})
              </h3>
              <button
                onClick={() => onSwitchTab('team')}
                className="text-xs text-indigo-500 hover:underline font-semibold"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {teamMembers?.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-[11px] font-bold flex items-center justify-center text-slate-700 dark:text-slate-300">
                      {m.userId?.name ? m.userId.name[0] : 'M'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {m.userId?.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {m.responsibility || (m.projectRole === 'LEADER' ? 'Project Leader' : 'Team Member')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      m.projectRole === 'LEADER'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {m.projectRole}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

