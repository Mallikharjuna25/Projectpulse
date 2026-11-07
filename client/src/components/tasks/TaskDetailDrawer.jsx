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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-200">
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {task.taskCode}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {task.priority} Priority
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title & Quick Status */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h2>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <select
                value={task.status}
                onChange={(e) => handleQuickStatusChange(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date & Overdue Badge */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" /> Target Deadline:
            </span>
            <span className={`font-semibold ${isOverdue ? 'text-rose-500 flex items-center gap-1' : 'text-slate-900 dark:text-white'}`}>
              {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None set'}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Description
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {task.description}
              </p>
            </div>
          )}

          {/* Interactive Acceptance Criteria */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Acceptance Criteria
              </h4>
              <span className="text-[11px] text-slate-400">
                {(task.acceptanceCriteria || []).filter((c) => c.isCompleted).length}/
                {(task.acceptanceCriteria || []).length} completed
              </span>
            </div>

            {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 ? (
              <ul className="space-y-1.5">
                {task.acceptanceCriteria.map((c, i) => (
                  <li
                    key={c._id || i}
                    onClick={() => !toggling && handleToggleCriterion(i)}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 cursor-pointer hover:border-indigo-500/40 transition-colors"
                  >
                    {c.isCompleted ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-xs ${
                        c.isCompleted
                          ? 'line-through text-slate-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {c.text}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">No acceptance criteria defined.</p>
            )}
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Assignees
            </h4>
            {task.assignees && task.assignees.length > 0 ? (
              <div className="space-y-1.5">
                {task.assignees.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px]">
                      {u.name ? u.name[0] : 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                      {u.rollNumber && (
                        <p className="text-[10px] text-slate-400 font-mono">{u.rollNumber}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No assignees</p>
            )}
          </div>

          {/* Status History Audit Trail */}
          {task.statusHistory && task.statusHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" /> Status History
              </h4>
              <div className="space-y-1 max-h-28 overflow-y-auto border-l border-slate-200 dark:border-slate-800 ml-2 pl-3">
                {task.statusHistory.map((h, i) => (
                  <div key={i} className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
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
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {canManage ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Task
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(task)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

