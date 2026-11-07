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
      {/* Workspace Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Link
                to="/projects"
                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
              </Link>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {project.projectCode}
              </span>
              <span className="text-xs text-slate-400">
                {project.collegeId?.collegeName}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {project.title}
            </h1>
          </div>

          {/* Health & Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {project.status}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                project.health === 'ON_TRACK'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : project.health === 'AT_RISK'
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}
            >
              {project.health.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.name}
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {tab.sprint && (
                  <span
                    className={`px-1 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider ${
                      isActive ? 'bg-indigo-700/60 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.sprint}
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

