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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-500 border border-sky-500/20">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> Delayed
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MilestoneIcon className="w-5 h-5 text-indigo-500" />
            Project Milestones & Deliverables
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key checkpoints and deliverables with completion percentage calculated from linked tasks
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Milestone
          </button>
        )}
      </div>

      {/* Milestones List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : milestones.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <MilestoneIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No milestones configured yet
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Break down this project into verifiable milestones and track completion from linked tasks.
          </p>
          {canManage && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Create First Milestone
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((ms) => {
            const daysLeft = Math.ceil(
              (new Date(ms.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            const isOverdue = daysLeft < 0 && ms.status !== 'COMPLETED';

            return (
              <div
                key={ms._id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 shadow-sm transition-all space-y-4"
              >
                {/* Header: Title, Status & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {ms.title}
                      </h3>
                      {getStatusBadge(ms.status)}
                    </div>
                    {ms.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {ms.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold flex items-center gap-1 ${
                        isOverdue ? 'text-rose-500 font-bold' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Due: {new Date(ms.dueDate).toLocaleDateString()}
                      {isOverdue && ` (${Math.abs(daysLeft)}d overdue)`}
                    </span>

                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(ms)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit milestone"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ms)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
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
                    <span className="text-slate-500 dark:text-slate-400">
                      Task Progress: {ms.completedTasks || 0} of {ms.totalTasks || 0} tasks completed
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {ms.completionPercent || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${ms.completionPercent || 0}%` }}
                    />
                  </div>
                </div>

                {/* Deliverables Checklist */}
                {ms.deliverables && ms.deliverables.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Target Deliverables:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {ms.deliverables.map((deliv, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          {deliv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deadline Change History Viewer */}
                {ms.deadlineHistory && ms.deadlineHistory.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <details className="text-xs text-slate-500 dark:text-slate-400">
                      <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:text-indigo-500">
                        <History className="w-3.5 h-3.5" />
                        Deadline Revision History ({ms.deadlineHistory.length})
                      </summary>
                      <ul className="mt-2 space-y-1 pl-4 border-l-2 border-indigo-500/30">
                        {ms.deadlineHistory.map((hist, i) => (
                          <li key={i} className="text-[11px]">
                            Extended from {new Date(hist.oldDate).toLocaleDateString()} to{' '}
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
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

      {/* Create / Edit Milestone Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {milestoneToEdit ? 'Edit Milestone' : 'Add New Milestone'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Milestone Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sensor Calibration & Telemetry Link"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELAYED">Delayed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Target Deadline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* If deadline changed during edit, prompt for mandatory reason */}
              {milestoneToEdit &&
                new Date(milestoneToEdit.dueDate).toISOString().split('T')[0] !== formData.dueDate && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                    <label className="block text-xs font-bold text-amber-600 dark:text-amber-400">
                      Reason for Deadline Revision <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Delayed sensor delivery from manufacturer"
                      value={formData.deadlineChangeReason}
                      onChange={(e) =>
                        setFormData({ ...formData, deadlineChangeReason: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-500/30 text-xs text-slate-900 dark:text-white"
                      required
                    />
                    <span className="text-[11px] text-amber-500/80 block">
                      This explanation will be logged in the milestone audit trail.
                    </span>
                  </div>
                )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Scope, expected outcomes, or verification protocols..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Deliverables Builder */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
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
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>

                {formData.deliverables.length > 0 && (
                  <ul className="space-y-1.5 max-h-24 overflow-y-auto">
                    {formData.deliverables.map((d, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <span>{d}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDeliverable(i)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all shadow-sm"
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

