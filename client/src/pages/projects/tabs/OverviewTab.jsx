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
          bg: 'bg-status-success/10 border-status-success/30 text-status-success',
          icon: CheckCircle2,
          title: 'On Track'
        };
      case 'AT_RISK':
        return {
          bg: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
          icon: AlertTriangle,
          title: 'At Risk'
        };
      case 'DELAYED':
        return {
          bg: 'bg-status-error/10 border-status-error/30 text-status-error',
          icon: Clock,
          title: 'Delayed'
        };
      default:
        return {
          bg: 'bg-surface-elevation-2 border-border-glass text-text-tertiary',
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
      <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${alert.bg} shadow-md`}>
        <AlertIcon className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-headline text-sm font-bold tracking-tight">System Health Status: {alert.title}</h4>
          <p className="text-xs mt-0.5 text-text-secondary leading-relaxed">{healthExplanation}</p>
        </div>
      </div>

      {/* Top 4 Quick Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-sm space-y-2">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">Progress</span>
            <CheckCircle2 className="w-4 h-4 text-amber-light" />
          </div>
          <div className="font-headline text-2xl font-extrabold text-text-primary">
            {project.progress || 0}%
          </div>
          <div className="w-full bg-surface-elevation-3 rounded-full h-2 overflow-hidden border border-border-glass">
            <div
              className="bg-gradient-to-r from-primary-container to-amber-bright h-2 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(255,107,0,0.4)]"
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-sm space-y-2">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">Days Remaining</span>
            <Calendar className="w-4 h-4 text-amber-bright" />
          </div>
          <div className="font-headline text-2xl font-extrabold text-text-primary">
            {daysRemaining >= 0 ? daysRemaining : '0'} <span className="text-xs font-normal text-text-tertiary">days</span>
          </div>
          <span className="font-mono text-[11px] text-text-secondary block">
            Due {new Date(project.deadline).toLocaleDateString()}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-sm space-y-2">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">Team Size</span>
            <Users className="w-4 h-4 text-status-info" />
          </div>
          <div className="font-headline text-2xl font-extrabold text-text-primary">
            {teamMembers?.length || 0} <span className="text-xs font-normal text-text-tertiary">members</span>
          </div>
          <button
            onClick={() => onSwitchTab('team')}
            className="font-mono text-[11px] text-amber-light hover:underline block font-semibold"
          >
            Manage Team &rarr;
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-sm space-y-2">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">Faculty Guide</span>
            <Award className="w-4 h-4 text-amber-light" />
          </div>
          <div className="font-headline text-sm font-bold text-text-primary truncate">
            {project.facultyGuideId ? project.facultyGuideId.name : 'Unassigned'}
          </div>
          <span className="font-mono text-[11px] text-text-tertiary block truncate">
            {project.facultyGuideId ? project.facultyGuideId.designation || 'Faculty Member' : 'Supervision pending'}
          </span>
        </div>
      </div>

      {/* SVG Sprint Burndown Trajectory Curve */}
      <div className="p-5 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-headline text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-light" />
              Sprint Velocity & Burndown Trajectory
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Ideal linear milestone pace vs live verified deliverables completion
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-text-tertiary">
              <span className="w-2.5 h-0.5 bg-text-tertiary inline-block" /> Ideal Pace
            </span>
            <span className="flex items-center gap-1.5 text-amber-light font-bold">
              <span className="w-2.5 h-0.5 bg-primary-container inline-block shadow-[0_0_6px_#FF6B00]" /> Actual Velocity
            </span>
          </div>
        </div>

        {/* SVG Graphic Curve */}
        <div className="w-full h-32 pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="amberGlowArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Ideal Line (Dashed) */}
            <line x1="10" y1="90" x2="490" y2="15" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
            {/* Shaded Area */}
            <path
              d="M 10 90 Q 150 75, 250 50 T 490 20 L 490 95 L 10 95 Z"
              fill="url(#amberGlowArea)"
            />
            {/* Actual Curve */}
            <path
              d="M 10 90 Q 150 75, 250 50 T 490 20"
              fill="transparent"
              stroke="#FF6B00"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Glowing Anchor Point */}
            <circle cx="250" cy="50" r="4" fill="#FFAE33" stroke="#FF6B00" strokeWidth="2" className="animate-pulse shadow-lg" />
          </svg>
        </div>
      </div>

      {/* Main Grid: Abstract & Objectives (Left) + Timeline / Tech Stack (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Abstract / Description Card */}
          <div className="p-6 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-sm space-y-4">
            <h3 className="font-headline text-xs font-bold text-text-primary uppercase tracking-wider">
              Project Abstract & Scope
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
              {project.abstract || project.description || 'No detailed abstract recorded for this project yet.'}
            </p>

            {project.objectives && project.objectives.length > 0 && (
              <div className="pt-4 border-t border-border-glass space-y-2">
                <h4 className="font-headline text-xs font-bold text-text-primary uppercase tracking-wider">
                  Key Objectives
                </h4>
                <ul className="space-y-2">
                  {project.objectives.map((obj, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-xs text-text-secondary"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container mt-1.5 shrink-0 shadow-[0_0_6px_#FF6B00]" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recent Activity Timeline Preview */}
          <div className="p-6 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-xs font-bold text-text-primary uppercase tracking-wider">
                Recent Team Activity
              </h3>
              <button
                onClick={() => onSwitchTab('activity')}
                className="font-mono text-xs text-amber-light hover:underline font-semibold"
              >
                View Full Feed &rarr;
              </button>
            </div>

            {recentActivities && recentActivities.length > 0 ? (
              <ul className="space-y-2.5">
                {recentActivities.slice(0, 5).map((act) => (
                  <li
                    key={act._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-elevation-2 border border-border-glass text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-surface-elevation-3 text-amber-light font-bold flex items-center justify-center shrink-0 border border-border-glass font-mono text-xs">
                        {act.actorId?.name ? act.actorId.name[0] : 'U'}
                      </div>
                      <div>
                        <span className="font-semibold text-text-primary">
                          {act.actorId?.name || 'User'}
                        </span>{' '}
                        <span className="text-text-secondary">{act.message}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-text-tertiary whitespace-nowrap pl-2">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-tertiary italic">No activities recorded yet.</p>
            )}
          </div>
        </div>

        {/* Right Sidebar: Tech Stack, Team Preview */}
        <div className="space-y-6">
          {/* Tech Stack Card */}
          <div className="p-5 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-sm space-y-3">
            <h3 className="font-headline text-xs font-bold text-text-primary uppercase tracking-wider">
              Technology Stack
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {project.techStack && project.techStack.length > 0 ? (
                project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-surface-elevation-2 text-amber-light border border-border-glass"
                  >
                    {tech}
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-tertiary italic">None specified</span>
              )}
            </div>
          </div>

          {/* Team Members Snapshot */}
          <div className="p-5 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-xs font-bold text-text-primary uppercase tracking-wider">
                Team Members ({teamMembers?.length || 0})
              </h3>
              <button
                onClick={() => onSwitchTab('team')}
                className="font-mono text-xs text-amber-light hover:underline font-semibold"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {teamMembers?.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between p-2 rounded-xl bg-surface-elevation-2 border border-border-glass"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-surface-elevation-3 text-[11px] font-bold flex items-center justify-center text-amber-light border border-border-glass">
                      {m.userId?.name ? m.userId.name[0] : 'M'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary line-clamp-1">
                        {m.userId?.name}
                      </p>
                      <p className="text-[10px] text-text-tertiary">
                        {m.responsibility || (m.projectRole === 'LEADER' ? 'Project Leader' : 'Team Member')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.projectRole === 'LEADER'
                        ? 'bg-amber-subtle text-amber-light border border-amber-light/20'
                        : 'bg-surface-elevation-3 text-text-tertiary border border-border-glass'
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

