import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  ExternalLink,
  CheckCircle2,
  Clock,
  Unlink,
  Link as LinkIcon,
  Play,
  Sparkles,
  Code,
  Copy,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import { githubApi } from '../../../services/githubApi.js';
import { useSocket } from '../../../context/SocketContext.jsx';
import toast from 'react-hot-toast';

export const GithubTab = ({ projectId, project, isLeader }) => {
  const { socket } = useSocket();
  const [integration, setIntegration] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, push, pull_request

  // Modals
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);

  // Form states
  const [repoFullName, setRepoFullName] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Simulation Form
  const [simMessage, setSimMessage] = useState('fixes TASK-001 implement core authentication');
  const [simBranch, setSimBranch] = useState('main');

  const fetchStatusAndEvents = async () => {
    try {
      setLoading(true);
      const [statusRes, eventsRes] = await Promise.all([
        githubApi.getStatus(projectId),
        githubApi.listEvents(projectId)
      ]);

      setIntegration(statusRes?.data?.integration ?? statusRes?.integration ?? null);
      setEvents(eventsRes?.data?.events || eventsRes?.events || []);
    } catch {
      toast.error('Failed to load GitHub integration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndEvents();
  }, [projectId]);

  // Real-time Socket.IO listener for live commit / PR push
  useEffect(() => {
    if (socket && projectId) {
      const handleGithubEvent = (event) => {
        setEvents((prev) => [event, ...prev]);
        toast.success(`GitHub: New ${event.eventType} event received!`);
        githubApi.getStatus(projectId).then((res) => {
          setIntegration(res.data.integration);
        });
      };

      socket.on('github:event', handleGithubEvent);
      return () => {
        socket.off('github:event', handleGithubEvent);
      };
    }
  }, [socket, projectId]);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!repoFullName.trim() || !repoFullName.includes('/')) {
      toast.error('Please enter a valid owner/repo (e.g. projectpulse/backend)');
      return;
    }

    try {
      setSubmitting(true);
      const res = await githubApi.connect(projectId, {
        repoFullName: repoFullName.trim(),
        webhookSecret: webhookSecret.trim()
      });
      setIntegration(res.data.integration);
      setShowConnectModal(false);
      setRepoFullName('');
      setWebhookSecret('');
      toast.success('GitHub repository connected!');
      fetchStatusAndEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect repository');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect GitHub repository from this project?')) return;
    try {
      await githubApi.disconnect(projectId);
      setIntegration(null);
      setEvents([]);
      toast.success('Repository disconnected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disconnect');
    }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await githubApi.simulateWebhook(projectId, {
        message: simMessage.trim(),
        branch: simBranch.trim()
      });
      toast.success('Git commit pushed & task updated!');
      setShowSimulateModal(false);
      fetchStatusAndEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const copyWebhookUrl = () => {
    const origin = window.location.origin;
    const url = `${origin}/api/v1/projects/${projectId}/github/webhook`;
    navigator.clipboard.writeText(url);
    toast.success('Webhook URL copied to clipboard');
  };

  const isConnected = integration && integration.status === 'CONNECTED';
  const filteredEvents =
    activeTab === 'ALL'
      ? events
      : events.filter((e) => e.eventType === activeTab);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm">
              <GitBranch className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isConnected ? integration.repoFullName : 'GitHub Integration (Phase 2)'}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isConnected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {isConnected ? 'Connected' : 'Not Linked'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isConnected
                  ? `Linked by ${integration.connectedBy?.name || 'Team Leader'} on ${new Date(integration.connectedAt).toLocaleDateString()}`
                  : 'Link a GitHub repository to track commits, pull requests, and auto-complete tasks using commit messages.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isConnected ? (
              isLeader && (
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
                >
                  <LinkIcon className="w-4 h-4" /> Connect Repository
                </button>
              )
            ) : (
              <>
                <button
                  onClick={() => setShowSimulateModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                  title="Dispatch a test commit event to verify task auto-closure"
                >
                  <Play className="w-3.5 h-3.5" /> Test Event Dispatch
                </button>

                <a
                  href={integration.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Repo
                </a>

                {isLeader && (
                  <button
                    onClick={handleDisconnect}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Disconnect repository"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats Row if Connected */}
        {isConnected && (
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <GitCommit className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400">Total Commits</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {integration.stats?.commitsCount || 0}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400">Pull Requests</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {integration.stats?.pullRequestsCount || 0}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400">Linked Tasks</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {integration.stats?.linkedTasksCount || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* When Connected: Webhook Helper banner & Event Stream */}
      {isConnected ? (
        <div className="space-y-4">
          {/* Webhook Endpoint Callout */}
          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  GitHub Webhook URL:
                </span>{' '}
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  /api/v1/projects/{projectId}/github/webhook
                </span>
              </div>
            </div>
            <button
              onClick={copyWebhookUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-medium"
            >
              <Copy className="w-3.5 h-3.5" /> Copy URL
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: 'All Activity' },
              { id: 'push', label: 'Commits' },
              { id: 'pull_request', label: 'Pull Requests' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Events Stream */}
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              <GitCommit className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2 opacity-50" />
              No Git events recorded yet. Click "Simulate Push" above to test live event processing.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {ev.eventType === 'push' ? (
                          <GitCommit className="w-4 h-4 text-indigo-500" />
                        ) : (
                          <GitPullRequest className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {ev.sha || ev.eventType}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {ev.author?.name || ev.author?.username || 'Git User'}
                          </span>
                          {ev.branch && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              on {ev.branch}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(ev.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-mono pl-11">
                    {ev.message}
                  </p>

                  {/* Linked Tasks Badges */}
                  {ev.linkedTasks && ev.linkedTasks.length > 0 && (
                    <div className="pl-11 flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Linked Task:
                      </span>
                      {ev.linkedTasks.map((t) => (
                        <span
                          key={t._id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {t.taskCode}: {t.status}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Not Connected Guide Box */
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                How GitHub Task Linking Works
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Connect your repository to auto-link git commits to project tasks. Simply include the task code in your commit message:
              </p>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-xs text-slate-700 dark:text-slate-300 mt-2 space-y-1">
                <div>git commit -m "fixes TASK-001 implement auth controller"</div>
                <div>git commit -m "ref TASK-002 update responsive navigation"</div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Commits matching <span className="font-semibold text-emerald-500">fixes TASK-001</span> or <span className="font-semibold text-emerald-500">closes TASK-001</span> will automatically transition the task to <span className="font-semibold">COMPLETED</span> and advance your project progress!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-600" /> Connect GitHub Repository
              </h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Repository Name (owner/repo) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. college-org/drone-navigation"
                  value={repoFullName}
                  onChange={(e) => setRepoFullName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Webhook Secret (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave blank to auto-generate secret"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {submitting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulate Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-indigo-600" /> Dispatch Test Commit Event
              </h3>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Commit Message * (Include 'fixes TASK-001' to auto-complete task)
                </label>
                <input
                  type="text"
                  required
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  value={simBranch}
                  onChange={(e) => setSimBranch(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {submitting ? 'Pushing...' : 'Dispatch Git Push Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

