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
      {/* Supervising Faculty Profile Banner */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-container via-amber-bright to-amber-light opacity-90" />

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-elevation-2 border border-border-glass text-amber-light font-bold flex items-center justify-center text-xl shrink-0 shadow-[0_0_15px_rgba(255,107,0,0.15)]">
            {project.facultyGuideId ? (
              <span className="font-headline font-bold text-2xl">
                {project.facultyGuideId.name ? project.facultyGuideId.name[0] : 'F'}
              </span>
            ) : (
              <Award className="w-8 h-8 text-amber-bright" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-light">
                Supervising Faculty Guide
              </span>
              {project.facultyGuideId ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-status-success/15 text-status-success border border-status-success/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" /> Active Supervision
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-status-warning/15 text-status-warning border border-status-warning/30">
                  <AlertTriangle className="w-3 h-3" /> Supervision Unassigned
                </span>
              )}
            </div>

            <h3 className="font-headline text-xl font-bold text-text-primary mt-1">
              {project.facultyGuideId ? project.facultyGuideId.name : 'No Faculty Guide Assigned'}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {project.facultyGuideId
                ? `${project.facultyGuideId.designation || 'Faculty Member'} • ${project.facultyGuideId.email}`
                : 'Projects must have an assigned institutional faculty guide to conduct milestone reviews and sign off on submissions.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!project.facultyGuideId && canManage && (
            <button
              onClick={handleOpenRequestModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary-container hover:bg-amber-bright text-white shadow-[0_0_15px_rgba(255,107,0,0.35)] transition-all"
            >
              <UserCheck className="w-4 h-4" /> Request Faculty Guide
            </button>
          )}

          {isFacultyOrAdmin && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary-container hover:bg-amber-bright text-white shadow-[0_0_15px_rgba(255,107,0,0.35)] transition-all"
            >
              <FileCheck2 className="w-4 h-4" /> Submit Review Decision
            </button>
          )}
        </div>
      </div>

      {/* Version Timeline & Release Verification Strip */}
      <div className="p-4 rounded-2xl bg-surface-elevation-1 border border-border-glass flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-tertiary">
            Review Milestones:
          </span>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1 rounded-xl bg-surface-elevation-2 border border-border-glass text-text-secondary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-success" /> v1.0 Proposal (Approved)
            </span>
            <span className="px-3 py-1 rounded-xl bg-surface-elevation-2 border border-border-glass text-text-secondary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-success" /> v2.0 Mid-Review (Approved)
            </span>
            <span className="px-3 py-1 rounded-xl bg-amber-subtle border border-amber-light/30 text-amber-light font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,107,0,0.15)]">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" /> v2.1 Current Draft (Active)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-text-tertiary">
          <ShieldCheck className="w-4 h-4 text-amber-light" />
          <span>ABET / ISO-29110 Standard Compliant</span>
        </div>
      </div>

      {/* Main Grid: Progress Updates (Left) & Faculty Reviews + Scorecard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Updates & Standups Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-glass">
            <h3 className="font-headline text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-light" />
              Team Standup & Progress Updates ({updates.length})
            </h3>
            <button
              onClick={() => setShowUpdateModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-elevation-2 hover:bg-surface-elevation-3 border border-border-glass text-amber-light hover:text-amber-bright transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Post Standup
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-surface-elevation-1 animate-pulse border border-border-glass"
                />
              ))}
            </div>
          ) : updates.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-surface-elevation-1 border border-border-glass text-xs text-text-tertiary">
              No progress updates posted yet. Record your weekly standup accomplishments, blockers, and next steps.
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((up) => (
                <div
                  key={up._id}
                  className="p-5 rounded-2xl bg-surface-elevation-1 hover:bg-surface-elevation-2 border border-border-glass shadow-sm space-y-3 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-surface-elevation-3 text-amber-light font-bold flex items-center justify-center text-xs border border-border-glass">
                        {up.authorId?.name ? up.authorId.name[0] : 'U'}
                      </div>
                      <span className="font-semibold text-text-primary">
                        {up.authorId?.name}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-amber-subtle text-amber-light font-bold border border-amber-light/20">
                        Week {up.weekNumber} • {up.type}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-text-tertiary">
                      {new Date(up.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {up.content}
                  </p>

                  {/* Blockers Callout */}
                  {up.blockers && (
                    <div className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/30 text-xs text-status-error space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-status-error" />
                        <span>BLOCKERS IDENTIFIED:</span>
                      </div>
                      <p className="text-text-primary pl-5">{up.blockers}</p>
                    </div>
                  )}

                  {/* Next Steps */}
                  {up.nextSteps && (
                    <div className="text-xs text-text-secondary pt-1 font-mono">
                      <strong className="text-amber-light">Next Steps:</strong> {up.nextSteps}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Faculty Reviews & Formal Rubric Scorecard */}
        <div className="space-y-6">
          {/* ABET / Formal Evaluation Scorecard */}
          <div className="p-5 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-sm space-y-3">
            <h3 className="font-headline text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-light" />
                ABET Rubric Scorecard
              </span>
              <span className="font-mono text-amber-light font-bold">4.8 / 5.0</span>
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-text-secondary">
                <span>1. Requirements & Analysis</span>
                <span className="text-status-success font-bold">96%</span>
              </div>
              <div className="w-full bg-surface-elevation-3 rounded-full h-1.5">
                <div className="bg-status-success h-1.5 rounded-full" style={{ width: '96%' }} />
              </div>

              <div className="flex justify-between items-center text-text-secondary pt-1">
                <span>2. Architecture & Code Quality</span>
                <span className="text-amber-light font-bold">92%</span>
              </div>
              <div className="w-full bg-surface-elevation-3 rounded-full h-1.5">
                <div className="bg-primary-container h-1.5 rounded-full" style={{ width: '92%' }} />
              </div>

              <div className="flex justify-between items-center text-text-secondary pt-1">
                <span>3. Verification & Testing</span>
                <span className="text-status-success font-bold">98%</span>
              </div>
              <div className="w-full bg-surface-elevation-3 rounded-full h-1.5">
                <div className="bg-status-success h-1.5 rounded-full" style={{ width: '98%' }} />
              </div>
            </div>
          </div>

          {/* Faculty Reviews Stream */}
          <div className="space-y-3">
            <div className="pb-2 border-b border-border-glass">
              <h3 className="font-headline text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-bright" />
                Supervisor Reviews ({feedback.length})
              </h3>
            </div>

            {feedback.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-surface-elevation-1 border border-border-glass text-xs text-text-tertiary">
                No formal faculty review decisions recorded yet.
              </div>
            ) : (
              feedback.map((fb) => (
                <div
                  key={fb._id}
                  className="p-4 rounded-xl bg-surface-elevation-1 hover:bg-surface-elevation-2 border border-border-glass shadow-sm space-y-2.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border ${
                        fb.decision === 'APPROVED'
                          ? 'bg-status-success/15 text-status-success border-status-success/30'
                          : fb.decision === 'CHANGES_REQUESTED'
                          ? 'bg-status-error/15 text-status-error border-status-error/30'
                          : 'bg-status-info/15 text-status-info border-status-info/30'
                      }`}
                    >
                      {fb.decision.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[10px] text-text-tertiary">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">
                    {fb.comment}
                  </p>

                  <div className="text-[11px] text-text-tertiary pt-2 border-t border-border-glass flex items-center justify-between font-mono">
                    <span className="text-text-primary font-semibold">{fb.authorId?.name}</span>
                    <span>{fb.authorId?.designation || 'Supervisor'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Request Faculty Guide */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface-elevation-1 border border-border-glass p-6 space-y-4 shadow-2xl text-text-primary">
            <div className="flex items-center justify-between pb-3 border-b border-border-glass">
              <h3 className="font-headline text-base font-bold text-text-primary flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-light" />
                Request Faculty Supervision
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Select Faculty Guide <span className="text-status-error">*</span>
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-glass text-xs text-text-primary focus:outline-none focus:border-amber-light"
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
                <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Message / Project Motivation
                </label>
                <textarea
                  rows={3}
                  placeholder="Introduce your project and explain why this professor's domain expertise is relevant..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-glass text-xs text-text-primary focus:outline-none focus:border-amber-light"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-border-glass">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border-glass text-text-secondary hover:text-text-primary hover:bg-surface-elevation-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest || !selectedFacultyId}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary-container hover:bg-amber-bright text-white disabled:opacity-50 shadow-[0_0_12px_rgba(255,107,0,0.35)]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface-elevation-1 border border-border-glass p-6 space-y-4 shadow-2xl text-text-primary">
            <div className="flex items-center justify-between pb-3 border-b border-border-glass">
              <h3 className="font-headline text-base font-bold text-text-primary">
                Record Progress Standup Update
              </h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Update Type
                  </label>
                  <select
                    value={updateFormData.type}
                    onChange={(e) =>
                      setUpdateFormData({ ...updateFormData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-border-glass text-xs text-text-primary focus:outline-none focus:border-amber-light"
                  >
                    <option value="WEEKLY">Weekly Standup</option>
                    <option value="DAILY">Daily Update</option>
                    <option value="MEETING_NOTE">Faculty Meeting Note</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
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
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-border-glass text-xs text-text-primary focus:outline-none focus:border-amber-light"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  What was accomplished? <span className="text-status-error">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Completed tasks, architectural milestones reached, tests performed..."
                  value={updateFormData.content}
                  onChange={(e) =>
                    setUpdateFormData({ ...updateFormData, content: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-glass text-xs text-text-primary focus:outline-none focus:border-amber-light"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
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
                <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Next Steps
                </label>
                <input
                  type="text"
                  placeholder="e.g. Implement trajectory planner module"
                  value={updateFormData.nextSteps}
                  onChange={(e) =>
                    setUpdateFormData({ ...updateFormData, nextSteps: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-glass text-xs text-text-primary focus:outline-none focus:border-amber-light"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-border-glass">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border-glass text-text-secondary hover:text-text-primary hover:bg-surface-elevation-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpdate}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary-container hover:bg-amber-bright text-white disabled:opacity-50 shadow-[0_0_12px_rgba(255,107,0,0.35)]"
                >
                  {submittingUpdate ? 'Posting...' : 'Post Standup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Submit Faculty Review Decision */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-surface-elevation-1 border border-border-glass p-6 space-y-4 shadow-2xl text-text-primary">
            <div className="flex items-center justify-between pb-3 border-b border-border-glass">
              <h3 className="font-headline text-base font-bold text-text-primary flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-light" />
                Submit Supervision Review
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Review Decision <span className="text-status-error">*</span>
                </label>
                <select
                  value={reviewFormData.decision}
                  onChange={(e) =>
                    setReviewFormData({ ...reviewFormData, decision: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-glass text-xs text-text-primary focus:outline-none focus:border-amber-light"
                >
                  <option value="APPROVED">Approved (Good progress)</option>
                  <option value="CHANGES_REQUESTED">Changes Requested (Action needed)</option>
                  <option value="COMMENT">Comment Only (Guidance / Advisory)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Faculty Feedback Comments <span className="text-status-error">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Detailed constructive feedback, architecture critique, or required adjustments..."
                  value={reviewFormData.comment}
                  onChange={(e) =>
                    setReviewFormData({ ...reviewFormData, comment: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-glass text-xs text-text-primary focus:outline-none focus:border-amber-light"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-border-glass">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border-glass text-text-secondary hover:text-text-primary hover:bg-surface-elevation-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary-container hover:bg-amber-bright text-white disabled:opacity-50 shadow-[0_0_12px_rgba(255,107,0,0.35)]"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

