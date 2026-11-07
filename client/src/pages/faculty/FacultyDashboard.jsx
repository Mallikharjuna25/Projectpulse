import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Users,
  AlertTriangle,
  FileCheck2,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  XCircle,
  Award,
  RefreshCw
} from 'lucide-react';
import { supervisionApi } from '../../services/supervisionApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Response modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseDecision, setResponseDecision] = useState('ACCEPTED');
  const [responseNote, setResponseNote] = useState('');
  const [responding, setResponding] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await supervisionApi.getFacultyDashboardStats();
      setData(res?.data || res);
    } catch (err) {
      toast.error('Failed to load faculty supervision statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleOpenResponse = (req, decision) => {
    setSelectedRequest(req);
    setResponseDecision(decision);
    setResponseNote('');
  };

  const handleConfirmResponse = async (e) => {
    e.preventDefault();
    try {
      setResponding(true);
      await supervisionApi.respondFacultyRequest(selectedRequest._id, {
        decision: responseDecision,
        responseNote: responseNote.trim()
      });
      toast.success(
        `Supervision request ${responseDecision === 'ACCEPTED' ? 'accepted' : 'declined'}`
      );
      setSelectedRequest(null);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request');
    } finally {
      setResponding(false);
    }
  };

  const getHealthBadge = (health) => {
    switch (health) {
      case 'ON_TRACK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> On Track
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> At Risk
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Clock className="w-3 h-3" /> Delayed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400">
            {health}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Faculty Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 text-white shadow-lg">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider text-purple-200 font-bold flex items-center gap-1.5">
            <Award className="w-4 h-4 text-purple-300" />
            Faculty Guide Portal • {user?.designation || 'Professor'}
          </span>
          <h1 className="text-2xl font-black tracking-tight">{user?.name}</h1>
          <p className="text-xs text-purple-100 max-w-xl">
            Supervise project teams, verify milestone completions, track student blockers, and conduct academic reviews.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium">
            Supervision Capacity:{' '}
            <span className="font-bold text-white">
              {data?.supervisedCount || 0} / {data?.capacity || 5} slots
            </span>
          </div>
          <button
            onClick={fetchStats}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Supervised Projects</span>
            <FolderGit2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.supervisedCount || 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active project teams</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Requests</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500 mt-1">
            {data?.pendingRequestsCount || 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting your response</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Reviews Conducted</span>
            <FileCheck2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {data?.totalReviews || 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Formal feedback records</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Capacity</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500 mt-1">
            {data?.capacityAvailable || 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Open supervision slots</span>
        </div>
      </div>

      {/* Pending Supervision Requests Queue */}
      {data?.pendingRequests && data.pendingRequests.length > 0 && (
        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" />
              Pending Supervision Requests ({data.pendingRequests.length})
            </h2>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Action Required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.pendingRequests.map((req) => (
              <div
                key={req._id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      {req.projectId?.projectCode}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {req.projectId?.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Leader: <span className="font-semibold text-slate-700 dark:text-slate-300">{req.requestedBy?.name}</span> ({req.requestedBy?.rollNumber})
                  </p>

                  {req.message && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      &ldquo;{req.message}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenResponse(req, 'REJECTED')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleOpenResponse(req, 'ACCEPTED')}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    Accept Supervision
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supervised Projects Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-purple-500" />
            Supervised Project Teams ({data?.supervisedProjects?.length || 0})
          </h2>
          <Link
            to="/projects"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            Explore All Projects &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : !data?.supervisedProjects || data.supervisedProjects.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            You are not currently supervising any active projects. Accept student requests or wait for admin assignments.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.supervisedProjects.map((proj) => {
              const daysLeft = Math.ceil(
                (new Date(proj.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={proj._id}
                  className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-purple-500/40 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                        {proj.projectCode}
                      </span>
                      {getHealthBadge(proj.health)}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Team: {proj.teamId?.name || 'Project Team'}
                    </p>

                    {/* Progress bar */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-slate-400">Progress</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {proj.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full"
                          style={{ width: `${proj.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {daysLeft >= 0 ? `${daysLeft}d left` : `${Math.abs(daysLeft)}d overdue`}
                    </span>
                    <Link
                      to={`/projects/${proj._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500"
                    >
                      Workspace <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Response Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {responseDecision === 'ACCEPTED' ? 'Accept Supervision' : 'Decline Supervision'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Project: <strong>{selectedRequest.projectId?.title}</strong> ({selectedRequest.projectId?.projectCode})
            </p>

            <form onSubmit={handleConfirmResponse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Response Note to Students (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    responseDecision === 'ACCEPTED'
                      ? 'Looking forward to meeting with your team...'
                      : 'Unable to take on additional projects due to schedule...'
                  }
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={responding}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold text-white ${
                    responseDecision === 'ACCEPTED'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {responding ? 'Processing...' : `Confirm ${responseDecision}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
