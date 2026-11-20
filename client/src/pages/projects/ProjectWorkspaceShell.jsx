import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderGit2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  CheckSquare,
  Milestone as MilestoneIcon,
  Award,
  FileText,
  MessageSquare,
  Activity as ActivityIcon,
  Sliders,
  Copy,
  Calendar,
  Sparkles,
  GitBranch
} from 'lucide-react';
import { projectApi } from '../../services/projectApi.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { OverviewTab } from './tabs/OverviewTab.jsx';
import { TeamTab } from './tabs/TeamTab.jsx';
import { ActivityTab } from './tabs/ActivityTab.jsx';
import { SettingsTab } from './tabs/SettingsTab.jsx';
import { KanbanTab } from './tabs/KanbanTab.jsx';
import { MilestonesTab } from './tabs/MilestonesTab.jsx';
import { SupervisionTab } from './tabs/SupervisionTab.jsx';
import { DocumentsTab } from './tabs/DocumentsTab.jsx';
import { DiscussionsTab } from './tabs/DiscussionsTab.jsx';
import { GithubTab } from './tabs/GithubTab.jsx';
import toast from 'react-hot-toast';

export const ProjectWorkspaceShell = () => {
  const { projectId } = useParams();
  const { socket } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await projectApi.getProjectOverview(projectId);
      const overviewData = res?.data || res;
      setData(overviewData);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load project workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [projectId]);

  // Join project Socket room
  useEffect(() => {
    if (socket && projectId) {
      socket.emit('join:project', projectId);

      socket.on('activity:new', () => {
        fetchOverview();
      });

      return () => {
        socket.emit('leave:project', projectId);
        socket.off('activity:new');
      };
    }
  }, [socket, projectId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <FolderGit2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Project Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">This project does not exist or you do not have permission to view it.</p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
      </div>
    );
  }

  const { project, currentUserRole } = data;
  const isLeader = currentUserRole === 'LEADER';

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FolderGit2 },
    { id: 'team', name: 'Team', icon: Users, badge: data.teamMembers?.length },
    { id: 'tasks', name: 'Tasks & Kanban', icon: CheckSquare },
    { id: 'milestones', name: 'Milestones', icon: MilestoneIcon },
    { id: 'supervision', name: 'Supervision', icon: Award },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'discussions', name: 'Discussions', icon: MessageSquare },
    { id: 'github', name: 'GitHub', icon: GitBranch },
    { id: 'activity', name: 'Activity Feed', icon: ActivityIcon },
    ...(isLeader ? [{ id: 'settings', name: 'Settings', icon: Sliders }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Top Banner with Obsidian Dark & Neon Amber Glow */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-5">
        {/* Subtle Ambient Amber Glow Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-container via-amber-bright to-amber-light opacity-90" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                to="/projects"
                className="font-medium text-text-secondary hover:text-amber-light flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
              </Link>
              <span className="text-text-tertiary">•</span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-subtle text-amber-light border border-amber-light/20">
                {project.projectCode}
              </span>
              {project.collegeId?.collegeName && (
                <>
                  <span className="text-text-tertiary">•</span>
                  <span className="px-2 py-0.5 rounded bg-surface-elevation-2 font-mono text-[11px] text-text-secondary border border-border-glass">
                    {project.collegeId.collegeName}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-headline text-2xl lg:text-3xl font-extrabold tracking-tight text-text-primary">
                {project.title}
              </h1>
            </div>
          </div>

          {/* Right telemetry & meta badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Pulse Beacon */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-elevation-2 border border-border-glass">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
              </span>
              <span className="font-mono text-[11px] text-text-secondary uppercase tracking-wider font-semibold">Live Pulse</span>
            </div>

            {/* Team Join Code Copy Pill */}
            {(data.team?.joinCode || project.joinCode) && (
              <button
                onClick={() => {
                  const code = data.team?.joinCode || project.joinCode;
                  navigator.clipboard.writeText(code);
                  toast.success(`Team code ${code} copied!`);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-elevation-2 hover:bg-surface-elevation-3 border border-border-glass text-xs text-text-secondary hover:text-amber-light transition-all"
                title="Click to copy Team Join Code"
              >
                <span className="text-text-tertiary font-mono text-[10px] uppercase">Join Code:</span>
                <span className="font-mono font-bold text-amber-light">{data.team?.joinCode || project.joinCode}</span>
                <Copy className="w-3 h-3 text-text-tertiary ml-0.5" />
              </button>
            )}

            {/* Health Badge */}
            <span
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
                project.health === 'ON_TRACK'
                  ? 'bg-status-success/10 text-status-success border-status-success/30'
                  : project.health === 'AT_RISK'
                  ? 'bg-status-warning/10 text-status-warning border-status-warning/30'
                  : 'bg-status-error/10 text-status-error border-status-error/30'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {project.health?.replace('_', ' ')}
            </span>

            {/* Project Status */}
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-surface-elevation-2 text-text-secondary border border-border-glass">
              {project.status?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-border-glass scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary-container text-white font-semibold shadow-[0_0_16px_rgba(255,107,0,0.35)] border border-primary-container'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevation-2 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-text-tertiary'}`} />
                <span>{tab.name}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                      isActive
                        ? 'bg-black/30 text-white'
                        : 'bg-surface-elevation-2 text-text-tertiary border border-border-glass'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <OverviewTab data={data} onSwitchTab={setActiveTab} />
      )}
      {activeTab === 'team' && (
        <TeamTab data={data} onRefresh={fetchOverview} />
      )}
      {activeTab === 'tasks' && (
        <KanbanTab
          projectId={projectId}
          teamMembers={data.teamMembers}
          canManage={isLeader}
        />
      )}
      {activeTab === 'milestones' && (
        <MilestonesTab projectId={projectId} canManage={isLeader} />
      )}
      {activeTab === 'supervision' && (
        <SupervisionTab
          projectId={projectId}
          project={project}
          canManage={isLeader}
          onRefresh={fetchOverview}
        />
      )}
      {activeTab === 'documents' && (
        <DocumentsTab
          projectId={projectId}
          project={project}
          currentUserRole={currentUserRole}
          isLeader={isLeader}
        />
      )}
      {activeTab === 'discussions' && (
        <DiscussionsTab
          projectId={projectId}
          project={project}
          teamMembers={data.teamMembers}
          isLeader={isLeader}
        />
      )}
      {activeTab === 'github' && (
        <GithubTab
          projectId={projectId}
          project={project}
          isLeader={isLeader}
        />
      )}
      {activeTab === 'activity' && (
        <ActivityTab projectId={projectId} />
      )}
      {activeTab === 'settings' && isLeader && (
        <SettingsTab data={data} onRefresh={fetchOverview} />
      )}
    </div>
  );
};

