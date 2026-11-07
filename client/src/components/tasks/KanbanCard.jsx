import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, CheckSquare, Clock, AlertCircle } from 'lucide-react';

export const KanbanCard = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task._id,
    data: { task }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'MEDIUM':
        return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      case 'LOW':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const completedCriteria = (task.acceptanceCriteria || []).filter((c) => c.isCompleted).length;
  const totalCriteria = (task.acceptanceCriteria || []).length;

  const isOverdue =
    task.status !== 'COMPLETED' &&
    task.dueDate &&
    new Date() > new Date(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none group space-y-2.5"
    >
      {/* Header: Code & Priority */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
          {task.taskCode}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getPriorityBadge(
            task.priority
          )}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-relaxed group-hover:text-indigo-500 transition-colors">
        {task.title}
      </h4>

      {/* Acceptance Criteria progress pill */}
      {totalCriteria > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            {completedCriteria}/{totalCriteria} criteria
          </span>
        </div>
      )}

      {/* Footer: Due date & Assignees stack */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
        {task.dueDate ? (
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              isOverdue
                ? 'text-rose-500 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {isOverdue ? (
              <AlertCircle className="w-3 h-3 text-rose-500" />
            ) : (
              <Clock className="w-3 h-3 text-slate-400" />
            )}
            {new Date(task.dueDate).toLocaleDateString([], {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        ) : (
          <span className="text-slate-400 text-[10px]">No due date</span>
        )}

        {/* Assignee Avatars */}
        {task.assignees && task.assignees.length > 0 ? (
          <div className="flex -space-x-1.5 overflow-hidden">
            {task.assignees.slice(0, 3).map((u) => (
              <div
                key={u._id}
                title={u.name}
                className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-white dark:border-slate-900 text-[9px] font-bold flex items-center justify-center shrink-0"
              >
                {u.name ? u.name[0] : 'U'}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-bold flex items-center justify-center border border-white dark:border-slate-900">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Unassigned</span>
        )}
      </div>
    </div>
  );
};

