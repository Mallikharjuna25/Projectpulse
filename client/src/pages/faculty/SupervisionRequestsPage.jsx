import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Filter,
  MessageSquare,
  FolderGit2
} from 'lucide-react';
import { supervisionApi } from '../../services/supervisionApi.js';
import toast from 'react-hot-toast';

export const SupervisionRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await supervisionApi.listFacultyRequests(params);
      setRequests(res?.data?.requests || res?.requests || []);
    } catch (err) {
      toast.error('Failed to load supervision requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleRespond = async (requestId, decision) => {
    const note = prompt(
      decision === 'ACCEPTED'
        ? 'Enter an optional welcome note for the team:'
        : 'Enter a reason for declining this request:'
    );
    if (note === null) return; // User cancelled prompt

    try {
      await supervisionApi.respondFacultyRequest(requestId, {
        decision,
        responseNote: note.trim()
      });
      toast.success(
        `Supervision request ${decision === 'ACCEPTED' ? 'accepted' : 'declined'} successfully`
      );
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/faculty"
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-500" />
            Supervision Requests Queue
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review student project supervision applications and manage institutional guide assignments
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Declined</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No supervision requests found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You currently have no project supervision applications matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {req.projectId?.projectCode}
                  </span>
                  <span className="text-xs text-slate-500">
                    Submitted {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      req.status === 'ACCEPTED'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : req.status === 'REJECTED'
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {req.projectId?.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Student Leader: <span className="font-semibold text-slate-800 dark:text-slate-200">{req.requestedBy?.name}</span> ({req.requestedBy?.email})
                </p>

                {req.message && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    &ldquo;{req.message}&rdquo;
                  </p>
                )}

                {req.responseNote && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-500/5 p-2 rounded-lg border border-purple-500/20">
                    Response Note: {req.responseNote}
                  </p>
                )}
              </div>

              {req.status === 'PENDING' ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRespond(req._id, 'REJECTED')}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleRespond(req._id, 'ACCEPTED')}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    Accept
                  </button>
                </div>
              ) : (
                <Link
                  to={`/projects/${req.projectId?._id}`}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0"
                >
                  View Workspace
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

