import React, { useState, useEffect } from 'react';
import {
  Milestone as MilestoneIcon,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Trash2,
  Edit2,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { milestoneApi } from '../../../services/milestoneApi.js';
import toast from 'react-hot-toast';

export const MilestonesTab = ({ projectId, canManage = false }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'PENDING',
    deliverables: [],
    deadlineChangeReason: ''
  });
  const [deliverableInput, setDeliverableInput] = useState('');

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const res = await milestoneApi.listMilestones(projectId);
      setMilestones(res?.data?.milestones || res?.milestones || []);
    } catch (err) {
      toast.error('Failed to load project milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const handleOpenCreate = () => {
    setMilestoneToEdit(null);
    setFormData({
      title: '',
      description: '',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'PENDING',
      deliverables: [],
      deadlineChangeReason: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (ms) => {
    setMilestoneToEdit(ms);
    setFormData({
      title: ms.title || '',
      description: ms.description || '',
      dueDate: ms.dueDate ? new Date(ms.dueDate).toISOString().split('T')[0] : '',
      status: ms.status || 'PENDING',
      deliverables: ms.deliverables || [],
      deadlineChangeReason: ''
    });
    setShowModal(true);
  };

  const handleAddDeliverable = () => {
    if (deliverableInput.trim()) {
      setFormData({
        ...formData,
        deliverables: [...formData.deliverables, deliverableInput.trim()]
      });
      setDeliverableInput('');
    }
  };

  const handleRemoveDeliverable = (index) => {
    setFormData({
      ...formData,
      deliverables: formData.deliverables.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || formData.title.trim().length < 3) {
      toast.error('Milestone title must be at least 3 characters');
      return;
    }
    if (!formData.dueDate) {
      toast.error('Target deadline is required');
      return;
    }

    const isEditing = !!milestoneToEdit;
    const isDeadlineChanged =
      isEditing &&
      new Date(milestoneToEdit.dueDate).toISOString().split('T')[0] !== formData.dueDate;

    if (isDeadlineChanged && !formData.deadlineChangeReason.trim()) {
      toast.error('A reason is required when modifying a milestone target deadline');
      return;
    }

    try {
      setSaving(true);
      if (isEditing) {
        await milestoneApi.updateMilestone(projectId, milestoneToEdit._id, formData);
        toast.success('Milestone updated successfully');
      } else {
        await milestoneApi.createMilestone(projectId, formData);
        toast.success('Milestone created successfully');
      }
      setShowModal(false);
      fetchMilestones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save milestone');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ms) => {
    if (!confirm(`Are you sure you want to delete milestone "${ms.title}"? Tasks linked to it will be unlinked.`)) {
      return;
    }
    try {
      await milestoneApi.deleteMilestone(projectId, ms._id);
      toast.success('Milestone deleted successfully');
      fetchMilestones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete milestone');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-status-success/15 text-status-success border border-status-success/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-primary-container/15 text-amber-bright border border-primary-container/30">
            <Clock className="w-3.5 h-3.5 animate-spin" /> In Progress
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-status-error/15 text-status-error border border-status-error/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Delayed
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-surface-elevation-2 text-text-tertiary border border-border-glass">
            Pending
          </span>
        );
    }
  };

  // Compute telemetry metrics
  const totalCount = milestones.length;
  const completedCount = milestones.filter((m) => m.status === 'COMPLETED').length;
  const overallPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const strokeDashoffset = 226.2 - (226.2 * overallPercent) / 100;

  const upcoming = milestones
    .filter((m) => m.status !== 'COMPLETED' && m.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  const daysToUpcoming = upcoming
    ? Math.ceil((new Date(upcoming.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const allDeliverablesCount = milestones.reduce(
    (acc, m) => acc + (m.deliverables ? m.deliverables.length : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Academic Timeline & Health Banner */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-container via-amber-bright to-amber-light opacity-90" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Gauge & Progress */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 84 84">
                <circle
                  cx="42"
                  cy="42"
                  r="36"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="42"
                  cy="42"
                  r="36"
                  stroke="#FF6B00"
                  strokeWidth="6"
                  strokeDasharray="226.2"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-headline font-extrabold text-sm text-text-primary">
                  {overallPercent}%
                </span>
                <span className="font-mono text-[9px] text-text-tertiary uppercase">Done</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline text-sm font-bold text-text-primary">
                  Milestone Health Gauge
                </h3>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                {completedCount} of {totalCount} academic milestones verified
              </p>
              <span className="font-mono text-[11px] text-amber-light font-semibold block mt-1">
                {allDeliverablesCount} Active Deliverables
              </span>
            </div>
          </div>

          {/* Critical Path Countdown */}
          <div className="p-4 rounded-xl bg-surface-elevation-2 border border-border-glass flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                Critical Path Review
              </span>
              <p className="font-headline text-xs font-bold text-text-primary mt-1 truncate max-w-[170px]">
                {upcoming ? upcoming.title : 'All Milestones Completed'}
              </p>
              <span className="text-[11px] text-text-secondary font-mono mt-0.5 block">
                {upcoming ? new Date(upcoming.dueDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            {daysToUpcoming !== null && (
              <div className="text-right">
                <span
                  className={`font-mono text-lg font-extrabold ${
                    daysToUpcoming < 0 ? 'text-status-error' : 'text-amber-light'
                  }`}
                >
                  {daysToUpcoming < 0 ? `${Math.abs(daysToUpcoming)}d late` : `${daysToUpcoming}d left`}
                </span>
                <span className="text-[10px] text-text-tertiary block font-mono">Countdown</span>
              </div>
            )}
          </div>

          {/* Add Milestone CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            {canManage && (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary-container hover:bg-amber-bright text-white shadow-[0_0_15px_rgba(255,107,0,0.35)] transition-all"
              >
                <Plus className="w-4 h-4" /> Add Milestone
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Roadmap Cards (Left) + Mini Calendar & Governance Audit (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Milestones Roadmap List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-2xl bg-surface-elevation-1 animate-pulse border border-border-glass"
                />
              ))}
            </div>
          ) : milestones.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-surface-elevation-1 border border-border-glass">
              <MilestoneIcon className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-60" />
              <h3 className="font-headline text-sm font-bold text-text-primary">
                No milestones configured yet
              </h3>
              <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                Break down this project into verifiable milestones and track completion from linked tasks.
              </p>
              {canManage && (
                <button
                  onClick={handleOpenCreate}
                  className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-primary-container hover:bg-amber-bright text-white shadow-sm"
                >
                  Create First Milestone
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((ms, index) => {
                const daysLeft = Math.ceil(
                  (new Date(ms.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                const isOverdue = daysLeft < 0 && ms.status !== 'COMPLETED';

                return (
                  <div
                    key={ms._id}
                    className="p-5 rounded-2xl bg-surface-elevation-1 hover:bg-surface-elevation-2 border border-border-glass hover:border-amber-light/40 shadow-sm transition-all space-y-4 group"
                  >
                    {/* Header: Sequence, Title, Status & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-container-high text-amber-light border border-amber-light/20">
                            MILESTONE 0{index + 1}
                          </span>
                          <h3 className="font-headline text-base font-bold text-text-primary group-hover:text-amber-light transition-colors">
                            {ms.title}
                          </h3>
                          {getStatusBadge(ms.status)}
                        </div>
                        {ms.description && (
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {ms.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono text-xs font-semibold flex items-center gap-1.5 ${
                            isOverdue ? 'text-status-error font-bold' : 'text-text-secondary'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                          Due: {new Date(ms.dueDate).toLocaleDateString()}
                          {isOverdue && ` (${Math.abs(daysLeft)}d overdue)`}
                        </span>

                        {canManage && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(ms)}
                              className="p-1.5 rounded-lg text-text-tertiary hover:text-amber-light hover:bg-surface-elevation-2 transition-colors"
                              title="Edit milestone"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(ms)}
                              className="p-1.5 rounded-lg text-text-tertiary hover:text-status-error hover:bg-status-error/10 transition-colors"
                              title="Delete milestone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar from linked tasks */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-xs text-text-secondary">
                          Task Progress: {ms.completedTasks || 0} of {ms.totalTasks || 0} tasks completed
                        </span>
                        <span className="font-mono font-bold text-amber-light">
                          {ms.completionPercent || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-surface-elevation-3 rounded-full h-2 overflow-hidden border border-border-glass">
                        <div
                          className="bg-gradient-to-r from-primary-container to-amber-bright h-2 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,107,0,0.4)]"
                          style={{ width: `${ms.completionPercent || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Deliverables Checklist */}
                    {ms.deliverables && ms.deliverables.length > 0 && (
                      <div className="pt-2 border-t border-border-glass">
                        <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2">
                          Deliverable Checkpoints ({ms.deliverables.length}):
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {ms.deliverables.map((deliv, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-surface-elevation-2 border border-border-glass text-text-secondary hover:text-text-primary hover:border-amber-light/30 transition-all"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                              {deliv}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deadline Change History Viewer */}
                    {ms.deadlineHistory && ms.deadlineHistory.length > 0 && (
                      <div className="pt-2 border-t border-border-glass">
                        <details className="text-xs text-text-secondary">
                          <summary className="cursor-pointer font-semibold text-text-primary flex items-center gap-1.5 hover:text-amber-light">
                            <History className="w-3.5 h-3.5 text-amber-light" />
                            Deadline Governance Audit ({ms.deadlineHistory.length})
                          </summary>
                          <ul className="mt-2 space-y-1 pl-4 border-l-2 border-primary-container/40">
                            {ms.deadlineHistory.map((hist, i) => (
                              <li key={i} className="text-[11px] font-mono">
                                Extended from {new Date(hist.oldDate).toLocaleDateString()} to{' '}
                                <span className="font-bold text-amber-light">
                                  {new Date(hist.newDate).toLocaleDateString()}
                                </span>{' '}
                                by {hist.changedBy?.name || 'Leader'}: &ldquo;{hist.reason}&rdquo;
                              </li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: Timeline Schedule & Governance Audit Log */}
        <div className="space-y-6">
          {/* Milestone Schedule Cards */}
          <div className="p-5 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-sm space-y-3">
            <h3 className="font-headline text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-light" />
              Academic Review Schedule
            </h3>
            <div className="space-y-2.5">
              {milestones.length === 0 ? (
                <p className="text-xs text-text-tertiary italic">No scheduled reviews</p>
              ) : (
                milestones.map((m) => (
                  <div
                    key={m._id}
                    className="p-3 rounded-xl bg-surface-elevation-2 border border-border-glass flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-text-primary truncate max-w-[160px]">{m.title}</p>
                      <span className="font-mono text-[10px] text-text-tertiary">
                        {new Date(m.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        m.status === 'COMPLETED'
                          ? 'bg-status-success/15 text-status-success'
                          : m.status === 'IN_PROGRESS'
                          ? 'bg-primary-container/15 text-amber-bright'
                          : 'bg-surface-elevation-3 text-text-tertiary'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Institutional Deadline Governance Box */}
          <div className="p-5 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-sm space-y-3">
            <h3 className="font-headline text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-amber-bright" />
              Deadline Governance Log
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Every target deadline modification is strictly audited under institutional governance rules requiring formal supervisor justification.
            </p>
            <div className="p-3 rounded-xl bg-surface-elevation-2 border border-border-glass text-[11px] font-mono text-text-tertiary space-y-1">
              <div className="flex justify-between">
                <span>Governance Rule:</span>
                <span className="text-amber-light font-bold">STRICT_REASON</span>
              </div>
              <div className="flex justify-between">
                <span>Audit Status:</span>
                <span className="text-status-success font-bold">VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Milestone Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-surface-elevation-1 border border-border-glass p-6 space-y-5 shadow-2xl my-8 text-text-primary">
            <div className="flex items-center justify-between pb-3 border-b border-border-glass">
              <h3 className="font-headline text-base font-bold text-text-primary">
                {milestoneToEdit ? 'Edit Milestone' : 'Add New Milestone'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Milestone Title <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sensor Calibration & Telemetry Link"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-glass text-xs text-text-primary focus:outline-none focus:border-amber-light"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-border-glass text-xs text-text-primary focus:outline-none focus:border-amber-light"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELAYED">Delayed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Target Deadline <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-border-glass text-xs text-text-primary focus:outline-none focus:border-amber-light"
                    required
                  />
                </div>
              </div>

              {/* If deadline changed during edit, prompt for mandatory reason */}
              {milestoneToEdit &&
                new Date(milestoneToEdit.dueDate).toISOString().split('T')[0] !== formData.dueDate && (
                  <div className="p-3.5 rounded-xl bg-primary-container/10 border border-primary-container/30 space-y-1.5">
                    <label className="block text-xs font-bold text-amber-light">
                      Reason for Deadline Revision <span className="text-status-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Delayed sensor delivery from manufacturer"
                      value={formData.deadlineChangeReason}
                      onChange={(e) =>
                        setFormData({ ...formData, deadlineChangeReason: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-primary-container/40 text-xs text-text-primary focus:outline-none focus:border-amber-light"
                      required
                    />
                    <span className="text-[11px] font-mono text-amber-light/80 block">
                      This explanation will be logged in the milestone audit trail.
                    </span>
                  </div>
                )}

              <div>
                <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Scope, expected outcomes, or verification protocols..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-border-glass text-xs text-text-primary focus:outline-none focus:border-amber-light"
                />
              </div>

              {/* Deliverables Builder */}
              <div>
                <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Key Deliverables
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Assembled flight controller chassis"
                    value={deliverableInput}
                    onChange={(e) => setDeliverableInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDeliverable();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-surface-container-lowest border border-border-glass text-xs text-text-primary focus:outline-none focus:border-amber-light"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="px-4 py-2 rounded-xl bg-surface-elevation-2 hover:bg-surface-elevation-3 border border-border-glass text-xs font-semibold text-text-primary"
                  >
                    Add
                  </button>
                </div>

                {formData.deliverables.length > 0 && (
                  <ul className="space-y-1.5 max-h-28 overflow-y-auto">
                    {formData.deliverables.map((d, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between p-2 rounded-xl bg-surface-elevation-2 border border-border-glass text-xs text-text-secondary"
                      >
                        <span>{d}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDeliverable(i)}
                          className="text-text-tertiary hover:text-status-error"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border-glass">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border-glass text-text-secondary hover:text-text-primary hover:bg-surface-elevation-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary-container hover:bg-amber-bright text-white disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(255,107,0,0.35)]"
                >
                  {saving ? 'Saving...' : milestoneToEdit ? 'Update Milestone' : 'Create Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

