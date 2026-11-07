import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { projectApi } from '../../services/projectApi.js';
import toast from 'react-hot-toast';

export const JoinProjectPage = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!joinCode || joinCode.trim().length < 4) {
      toast.error('Please enter a valid join code');
      return;
    }

    try {
      setLoading(true);
      const res = await projectApi.requestJoinByCode(joinCode.trim().toUpperCase());
      setSuccessResult(res);
      toast.success('Join request sent successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid join code or error sending request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/projects"
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-amber-500" />
            Join Project Team
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter the 6-character team join code provided by your project leader
          </p>
        </div>
      </div>

      <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {successResult ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Request Submitted!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {successResult.message}
              </p>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSuccessResult(null);
                  setJoinCode('');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Join Another
              </button>
              <Link
                to="/projects"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Back to Projects
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Team Join Code
              </label>
              <input
                type="text"
                placeholder="e.g. 7A8B9C"
                maxLength={10}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full text-center font-mono text-2xl tracking-widest px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500/30 dark:border-indigo-500/40 focus:border-indigo-600 focus:outline-none uppercase font-bold text-indigo-600 dark:text-indigo-400 placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
              <span className="text-[11px] text-slate-400 mt-2 block text-center">
                Codes are unique to each project team and case-insensitive
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Approval Required:</strong> After submitting, your request will be queued in the Project Leader's dashboard for verification and approval.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !joinCode}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? 'Submitting Request...' : 'Submit Join Request'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

