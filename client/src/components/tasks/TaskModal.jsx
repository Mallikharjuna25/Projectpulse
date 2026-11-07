import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckSquare, Users, Calendar, Flag } from 'lucide-react';
import { taskApi } from '../../services/taskApi.js';
import toast from 'react-hot-toast';

export const TaskModal = ({
  projectId,
  teamMembers = [],
  taskToEdit = null,
  initialStatus = 'TODO',
  onClose,
  onSaved
}) => {
  const isEditing = !!taskToEdit;

  const [formData, setFormData] = useState({
    title: taskToEdit?.title || '',
    description: taskToEdit?.description || '',
    priority: taskToEdit?.priority || 'MEDIUM',
    status: taskToEdit?.status || initialStatus,
    dueDate: taskToEdit?.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : '',
    assignees: taskToEdit?.assignees?.map((a) => a._id || a) || [],
    acceptanceCriteria: taskToEdit?.acceptanceCriteria || []
  });

  const [newCriterion, setNewCriterion] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddCriterion = () => {
    if (newCriterion.trim()) {
      setFormData({
        ...formData,
        acceptanceCriteria: [
          ...formData.acceptanceCriteria,
          { text: newCriterion.trim(), isCompleted: false }
        ]
      });
      setNewCriterion('');
    }
  };

  const handleRemoveCriterion = (index) => {
    setFormData({
      ...formData,
      acceptanceCriteria: formData.acceptanceCriteria.filter((_, i) => i !== index)
    });
  };

  const handleToggleAssignee = (userId) => {
    const exists = formData.assignees.includes(userId);
    setFormData({
      ...formData,
      assignees: exists
        ? formData.assignees.filter((id) => id !== userId)
        : [...formData.assignees, userId]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || formData.title.trim().length < 3) {
      toast.error('Task title must be at least 3 characters');
      return;
    }

    try {
      setSaving(true);
      if (isEditing) {
        await taskApi.updateTask(projectId, taskToEdit._id, formData);
        toast.success('Task updated successfully');
      } else {
        await taskApi.createTask(projectId, formData);
        toast.success('Task created successfully');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isEditing ? `Edit ${taskToEdit.taskCode}` : 'Create New Task'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEditing ? 'Update specifications and assignments' : 'Add task to project Kanban board'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Implement Kalman Filter sensor fusion"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Target Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Technical details, notes, or implementation constraints..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          {/* Assignees Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Assign Team Members
            </label>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 p-2 space-y-1">
              {teamMembers && teamMembers.length > 0 ? (
                teamMembers.map((m) => {
                  const uid = m.userId?._id || m.userId;
                  const isChecked = formData.assignees.includes(uid);
                  return (
                    <label
                      key={uid}
                      className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center font-bold">
                          {m.userId?.name ? m.userId.name[0] : 'U'}
                        </div>
                        <span>{m.userId?.name}</span>
                        {m.userId?.rollNumber && (
                          <span className="text-[10px] text-slate-400">({m.userId.rollNumber})</span>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleAssignee(uid)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 p-2">No team members available</div>
              )}
            </div>
          </div>

          {/* Acceptance Criteria Checklist */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Acceptance Criteria
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="e.g. Unit tests pass with 90% coverage"
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCriterion();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddCriterion}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-xs font-semibold"
              >
                Add
              </button>
            </div>

            {formData.acceptanceCriteria.length > 0 && (
              <ul className="space-y-1.5 max-h-28 overflow-y-auto">
                {formData.acceptanceCriteria.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <span className="flex items-center gap-2">
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                      {c.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(i)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all shadow-sm"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

