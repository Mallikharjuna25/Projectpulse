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
        return 'bg-status-error/15 text-status-error border-status-error/30';
      case 'HIGH':
        return 'bg-primary-container/15 text-amber-bright border-primary-container/30';
      case 'MEDIUM':
        return 'bg-status-info/15 text-status-info border-status-info/30';
      case 'LOW':
      default:
        return 'bg-surface-elevation-2 text-text-tertiary border-border-glass';
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
      className="p-3.5 rounded-xl bg-surface-elevation-2 hover:bg-surface-elevation-3 border border-border-glass hover:border-amber-light/40 transition-all duration-200 cursor-grab active:cursor-grabbing select-none group space-y-2.5 shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
    >
      {/* Header: Code & Priority */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-surface-container-high text-amber-light border border-amber-light/20">
          {task.taskCode}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase tracking-wider ${getPriorityBadge(
            task.priority
          )}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-headline text-xs font-semibold text-text-primary line-clamp-2 leading-relaxed group-hover:text-amber-light transition-colors">
        {task.title}
      </h4>

      {/* Acceptance Criteria progress pill */}
      {totalCriteria > 0 && (
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary">
          <CheckSquare className="w-3.5 h-3.5 text-amber-light" />
          <span>
            {completedCriteria}/{totalCriteria} criteria
          </span>
        </div>
      )}

      {/* Footer: Due date & Assignees stack */}
      <div className="flex items-center justify-between pt-2 border-t border-border-glass text-[11px]">
        {task.dueDate ? (
          <span
            className={`inline-flex items-center gap-1 font-mono text-[11px] ${
              isOverdue
                ? 'text-status-error font-bold'
                : 'text-text-secondary'
            }`}
          >
            {isOverdue ? (
              <AlertCircle className="w-3 h-3 text-status-error" />
            ) : (
              <Clock className="w-3 h-3 text-text-tertiary" />
            )}
            {new Date(task.dueDate).toLocaleDateString([], {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        ) : (
          <span className="text-text-tertiary font-mono text-[10px]">No due date</span>
        )}

        {/* Assignee Avatars */}
        {task.assignees && task.assignees.length > 0 ? (
          <div className="flex -space-x-1.5 overflow-hidden">
            {task.assignees.slice(0, 3).map((u) => (
              <div
                key={u._id}
                title={u.name}
                className="w-5 h-5 rounded-full bg-surface-elevation-3 text-amber-light border border-border-glass text-[9px] font-bold flex items-center justify-center shrink-0"
              >
                {u.name ? u.name[0] : 'U'}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-surface-elevation-2 text-text-tertiary text-[9px] font-bold flex items-center justify-center border border-border-glass">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-text-tertiary font-mono italic">Unassigned</span>
        )}
      </div>
    </div>
  );
};

