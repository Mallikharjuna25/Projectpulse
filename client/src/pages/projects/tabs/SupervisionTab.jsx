import React, { useState, useEffect } from 'react';
import {
  Award,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  Calendar,
  X,
  FileCheck2,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { supervisionApi } from '../../../services/supervisionApi.js';
import { userManagementApi } from '../../../services/userManagementApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export const SupervisionTab = ({ projectId, project, canManage = false, onRefresh }) => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    type: 'WEEKLY',
    content: '',
    blockers: '',
    nextSteps: '',
    weekNumber: 1
  });
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    decision: 'APPROVED',
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [updatesRes, feedbackRes] = await Promise.all([
        supervisionApi.listProgressUpdates(projectId),
        supervisionApi.listFeedback(projectId)
      ]);
      setUpdates(updatesRes?.data?.updates || updatesRes?.updates || []);
      setFeedback(feedbackRes?.data?.feedback || feedbackRes?.feedback || []);
    } catch (err) {
      toast.error('Failed to load supervision records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Load faculty list for guide request modal
  const handleOpenRequestModal = async () => {
    try {
      const res = await userManagementApi.getFacultyList();
      setFacultyList(res?.data?.users || res?.users || []);
      setShowRequestModal(true);
    } catch (err) {
      toast.error('Failed to load faculty directory');
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedFacultyId) {
      toast.error('Please select a faculty member');
      return;
    }
    try {
      setSubmittingRequest(true);
      await supervisionApi.requestFacultyGuide(projectId, {
        facultyId: selectedFacultyId,
        message: requestMessage.trim()
      });
      toast.success('Supervision request sent successfully!');
      setShowRequestModal(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit supervision request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!updateFormData.content.trim()) {
      toast.error('Content is required');
      return;
    }
    try {
      setSubmittingUpdate(true);
      await supervisionApi.createProgressUpdate(projectId, updateFormData);
      toast.success('Progress update recorded successfully');
      setShowUpdateModal(false);
      setUpdateFormData({
        type: 'WEEKLY',
        content: '',
        blockers: '',
        nextSteps: '',
        weekNumber: (updateFormData.weekNumber || 1) + 1
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record progress update');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewFormData.comment.trim()) {
      toast.error('Review feedback comment is required');
      return;
    }
    try {
      setSubmittingReview(true);
      await supervisionApi.submitFeedback(projectId, {
        entityType: 'PROJECT',
        decision: reviewFormData.decision,
        comment: reviewFormData.comment.trim()
      });
      toast.success('Review feedback submitted successfully');
      setShowReviewModal(false);
      setReviewFormData({ decision: 'APPROVED', comment: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isFacultyGuide =
    project.facultyGuideId?._id === user?._id || project.facultyGuideId === user?._id;
  const isFacultyOrAdmin =
    user?.globalRole === 'FACULTY' ||
    user?.globalRole === 'COLLEGE_ADMIN' ||
    user?.globalRole === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Current Faculty Guide Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center text-xl shrink-0 border border-purple-500/20">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Faculty Guide
              </span>
              {project.facultyGuideId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Active Supervision
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {project.facultyGuideId ? project.facultyGuideId.name : 'No Faculty Guide Assigned'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {project.facultyGuideId
                ? `${project.facultyGuideId.designation || 'Faculty Member'} • ${project.facultyGuideId.email}`
                : 'Projects must have a designated faculty guide to conduct reviews and sign off on submissions.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!project.facultyGuideId && canManage && (
            <button
              onClick={handleOpenRequestModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
            >
              <UserCheck className="w-4 h-4" /> Request Faculty Guide
            </button>
          )}

          {isFacultyOrAdmin && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all"
            >
              <FileCheck2 className="w-4 h-4" /> Submit Review Decision
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Progress Updates (Left) & Faculty Reviews (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Updates Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Team Standup & Progress Updates ({updates.length})
            </h3>
            <button
              onClick={() => setShowUpdateModal(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
            >
              <Plus className="w-3.5 h-3.5" /> Post Update
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800"
                />
              ))}
            </div>
          ) : updates.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No progress updates posted yet. Post your weekly accomplishments, blockers, and next steps.
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((up) => (
                <div
                  key={up._id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold flex items-center justify-center">
                        {up.authorId?.name ? up.authorId.name[0] : 'U'}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {up.authorId?.name}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-semibold">
                        Week {up.weekNumber} • {up.type}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(up.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {up.content}
                  </p>

                  {/* Blockers Callout */}
                  {up.blockers && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                      <div>
                        <strong>Blockers:</strong> {up.blockers}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {up.nextSteps && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <strong className="text-slate-700 dark:text-slate-300">Next Steps:</strong>{' '}
                      {up.nextSteps}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Faculty Reviews & Decisions Column */}
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-purple-500" />
              Faculty Reviews ({feedback.length})
            </h3>
          </div>

          {feedback.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No faculty review feedback submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((fb) => (
                <div
                  key={fb._id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        fb.decision === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : fb.decision === 'CHANGES_REQUESTED'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                      }`}
                    >
                      {fb.decision.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {fb.comment}
                  </p>

                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span>{fb.authorId?.name}</span>
                    <span>{fb.authorId?.designation || 'Reviewer'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Request Faculty Guide */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                Request Faculty Supervision
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Select Faculty Guide <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Choose Faculty Member --</option>
                  {facultyList.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.designation || 'Faculty'}) - {f.departmentId?.name || 'Department'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Message / Project Motivation
                </label>
                <textarea
                  rows={3}
                  placeholder="Introduce your project and explain why this professor's domain expertise is relevant..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest || !selectedFacultyId}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {submittingRequest ? 'Sending Request...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Post Progress Standup Update */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Record Progress Standup Update
              </h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Update Type
                  </label>
                  <select
                    value={updateFormData.type}
                    onChange={(e) =>
                      setUpdateFormData({ ...updateFormData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="WEEKLY">Weekly Standup</option>
                    <option value="DAILY">Daily Update</option>
                    <option value="MEETING_NOTE">Faculty Meeting Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Week Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={updateFormData.weekNumber}
                    onChange={(e) =>
                      setUpdateFormData({
                        ...updateFormData,
                        weekNumber: parseInt(e.target.value, 10) || 1
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  What was accomplished? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Completed tasks, architectural milestones reached, tests performed..."
                  value={updateFormData.content}
                  onChange={(e) =>
                    setUpdateFormData({ ...updateFormData, content: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Blockers or Hurdles (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Waiting on hardware sensor shipment, compiler bug"
                  value={updateFormData.blockers}
                  onChange={(e) =>
                    setUpdateFormData({ ...updateFormData, blockers: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Next Steps
                </label>
                <input
                  type="text"
                  placeholder="e.g. Implement trajectory planner module"
                  value={updateFormData.nextSteps}
                  onChange={(e) =>
                    setUpdateFormData({ ...updateFormData, nextSteps: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpdate}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {submittingUpdate ? 'Posting...' : 'Post Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Submit Faculty Review Decision */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-purple-500" />
                Submit Supervision Review
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Review Decision <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reviewFormData.decision}
                  onChange={(e) =>
                    setReviewFormData({ ...reviewFormData, decision: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="APPROVED">Approved (Good progress)</option>
                  <option value="CHANGES_REQUESTED">Changes Requested (Action needed)</option>
                  <option value="COMMENT">Comment Only (Guidance / Advisory)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Faculty Feedback Comments <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Detailed constructive feedback, architecture critique, or required adjustments..."
                  value={reviewFormData.comment}
                  onChange={(e) =>
                    setReviewFormData({ ...reviewFormData, comment: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

