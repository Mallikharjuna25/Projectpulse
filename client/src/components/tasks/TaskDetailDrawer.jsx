import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckSquare,
  Square,
  Users,
  Edit2,
  Trash2,
  AlertCircle,
  History,
  ShieldAlert
} from 'lucide-react';
import { taskApi } from '../../services/taskApi.js';
import toast from 'react-hot-toast';

export const TaskDetailDrawer = ({
  projectId,
  task,
  onClose,
  onEdit,
  onDeleted,
  onUpdated,
  canManage
}) => {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggleCriterion = async (index) => {
    try {
      setToggling(true);
      const res = await taskApi.toggleAcceptanceCriteria(projectId, task._id, index);
      onUpdated(res.data);
    } catch (err) {
      toast.error('Failed to update acceptance criterion');
    } finally {
      setToggling(false);
    }
  };

  const handleQuickStatusChange = async (newStatus) => {
    try {
      const res = await taskApi.moveTask(projectId, task._id, {
        status: newStatus,
        order: 0
      });
      toast.success(`Task moved to ${newStatus}`);
      onUpdated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move task');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${task.taskCode}?`)) return;
    try {
      setDeleting(true);
      await taskApi.deleteTask(projectId, task._id);
      toast.success('Task deleted successfully');
      onDeleted(task._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const isOverdue =
    task.status !== 'COMPLETED' &&
    task.dueDate &&
    new Date() > new Date(task.dueDate);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-lg h-full bg-surface-elevation-1 border-l border-border-glass shadow-2xl flex flex-col justify-between overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-200 text-text-primary">
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-border-glass">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-container-high text-amber-light border border-amber-light/20">
                {task.taskCode}
              </span>
              <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold uppercase tracking-wider bg-surface-elevation-2 text-text-secondary border border-border-glass">
                {task.priority} Priority
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-elevation-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title & Quick Status */}
          <div className="space-y-3">
            <h2 className="font-headline text-lg font-bold text-text-primary leading-snug">
              {task.title}
            </h2>

            <div className="flex items-center gap-2.5">
              <span className="text-xs text-text-tertiary font-mono">Status:</span>
              <select
                value={task.status}
                onChange={(e) => handleQuickStatusChange(e.target.value)}
                className="text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-surface-elevation-2 border border-border-glass text-amber-light focus:outline-none focus:border-amber-light"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date & Overdue Badge */}
          <div className="p-3.5 rounded-xl bg-surface-elevation-2 border border-border-glass flex items-center justify-between text-xs">
            <span className="text-text-secondary flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-text-tertiary" /> Target Deadline:
            </span>
            <span className={`font-mono font-semibold ${isOverdue ? 'text-status-error flex items-center gap-1' : 'text-text-primary'}`}>
              {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-status-error" />}
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None set'}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <div className="space-y-1.5">
              <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-text-secondary">
                Specification & Details
              </h4>
              <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed bg-surface-elevation-2/60 p-3.5 rounded-xl border border-border-glass">
                {task.description}
              </p>
            </div>
          )}

          {/* Interactive Acceptance Criteria */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-text-secondary">
                Acceptance Criteria
              </h4>
              <span className="text-[11px] font-mono text-amber-light font-semibold">
                {(task.acceptanceCriteria || []).filter((c) => c.isCompleted).length}/
                {(task.acceptanceCriteria || []).length} completed
              </span>
            </div>

            {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 ? (
              <ul className="space-y-2">
                {task.acceptanceCriteria.map((c, i) => (
                  <li
                    key={c._id || i}
                    onClick={() => !toggling && handleToggleCriterion(i)}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-elevation-2 hover:bg-surface-elevation-3 border border-border-glass cursor-pointer hover:border-amber-light/30 transition-all"
                  >
                    {c.isCompleted ? (
                      <CheckSquare className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-xs ${
                        c.isCompleted
                          ? 'line-through text-text-tertiary'
                          : 'text-text-primary'
                      }`}
                    >
                      {c.text}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-tertiary italic">No acceptance criteria defined.</p>
            )}
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-text-secondary">
              Assignees
            </h4>
            {task.assignees && task.assignees.length > 0 ? (
              <div className="space-y-1.5">
                {task.assignees.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-elevation-2 border border-border-glass text-xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-surface-elevation-3 text-amber-light font-bold flex items-center justify-center text-[10px] border border-border-glass">
                      {u.name ? u.name[0] : 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{u.name}</p>
                      {u.rollNumber && (
                        <p className="text-[10px] text-text-tertiary font-mono">{u.rollNumber}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-tertiary italic">No assignees</p>
            )}
          </div>

          {/* Status History Audit Trail */}
          {task.statusHistory && task.statusHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-headline text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-amber-light" /> Status History & Audit Trail
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto border-l border-border-glass ml-2 pl-3">
                {task.statusHistory.map((h, i) => (
                  <div key={i} className="text-[11px] text-text-secondary font-mono">
                    <span className="font-bold text-amber-light">
                      {h.status}
                    </span>{' '}
                    by {h.changedBy?.name || 'User'} on{' '}
                    {new Date(h.changedAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border-glass">
          {canManage ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-error hover:text-red-400 p-2 rounded-xl hover:bg-status-error/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Task
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(task)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-container hover:bg-amber-bright text-white shadow-[0_0_12px_rgba(255,107,0,0.3)] transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

