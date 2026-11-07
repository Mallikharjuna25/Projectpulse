import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { projectApi } from '../../../services/projectApi.js';
import toast from 'react-hot-toast';

export const SettingsTab = ({ data, onRefresh }) => {
  const navigate = useNavigate();
  const { project, currentUserRole } = data;
  const isLeader = currentUserRole === 'LEADER';

  const [formData, setFormData] = useState({
    title: project.title || '',
    domain: project.domain || '',
    abstract: project.abstract || '',
    priority: project.priority || 'MEDIUM',
    status: project.status || 'PLANNING',
    visibility: project.visibility || 'COLLEGE',
    deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
    deadlineChangeReason: ''
  });

  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const isDeadlineChanged =
    formData.deadline !== (project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLeader) {
      toast.error('Only the Project Leader can modify project settings');
      return;
    }

    if (isDeadlineChanged && !formData.deadlineChangeReason.trim()) {
      toast.error('Please provide a reason for changing the target deadline');
      return;
    }

    try {
      setSaving(true);
      await projectApi.updateProject(project._id, formData);
      toast.success('Project settings updated successfully!');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project settings');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveProject = async () => {
    if (!confirm('Are you sure you want to archive this project? It will be marked as inactive and hidden from active views.')) {
      return;
    }
    try {
      setArchiving(true);
      await projectApi.deleteProject(project._id);
      toast.success('Project archived successfully');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive project');
    } finally {
      setArchiving(false);
    }
  };

  if (!isLeader) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
        <Sliders className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Settings Restricted
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Only designated Project Leaders have access to modify project settings and configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* General Project Settings Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            General Project Configuration
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Update project metadata, workflow status, visibility, and milestone deadlines
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Project Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Domain / Field
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Project Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="COLLEGE">Visible to College</option>
                <option value="PRIVATE">Private to Team</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Abstract
            </label>
            <textarea
              rows={3}
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Target Deadline
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          {/* If deadline changed, prompt for audit change reason */}
          {isDeadlineChanged && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
              <label className="block text-xs font-bold text-amber-600 dark:text-amber-400">
                Reason for Deadline Modification <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Extended for hardware testing cycle"
                value={formData.deadlineChangeReason}
                onChange={(e) => setFormData({ ...formData, deadlineChangeReason: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-500/30 text-xs text-slate-900 dark:text-white"
                required
              />
              <span className="text-[11px] text-amber-500/80 block">
                This reason will be logged in the project change audit history.
              </span>
            </div>
          )}

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Archive / Delete Project */}
      <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Archiving a project will mark it as read-only and remove it from active dashboards.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleArchiveProject}
            disabled={archiving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {archiving ? 'Archiving...' : 'Archive Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

