import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { KanbanCard } from './KanbanCard.jsx';

export const KanbanColumn = ({
  id,
  title,
  color,
  tasks,
  onTaskClick,
  onAddTask,
  canManage
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { columnId: id }
  });

  const getStatusDot = (colId) => {
    switch (colId) {
      case 'IN_PROGRESS':
        return 'bg-primary-container shadow-[0_0_8px_#FF6B00] animate-pulse';
      case 'IN_REVIEW':
        return 'bg-status-info shadow-[0_0_8px_#38BDF8]';
      case 'COMPLETED':
        return 'bg-status-success shadow-[0_0_8px_#10B981]';
      case 'TODO':
      default:
        return 'bg-slate-500';
    }
  };

  const isCurrentActiveCol = id === 'IN_PROGRESS';

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl bg-surface-elevation-1/90 border transition-all min-h-[520px] w-full max-w-sm shrink-0 shadow-lg ${
        isOver
          ? 'border-primary-container/80 bg-surface-elevation-2/90 shadow-[0_0_24px_rgba(255,107,0,0.15)]'
          : isCurrentActiveCol
          ? 'border-border-amber-glow shadow-[0_0_20px_rgba(255,107,0,0.06)]'
          : 'border-border-glass'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-border-glass">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${getStatusDot(id)}`} />
          <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-text-primary">
            {title}
          </h3>
          <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-surface-elevation-2 text-text-secondary border border-border-glass">
            {tasks.length}
          </span>
        </div>

        {canManage && onAddTask && (
          <button
            onClick={() => onAddTask(id)}
            className="p-1 rounded-lg text-text-tertiary hover:text-amber-light hover:bg-surface-elevation-2 transition-colors"
            title={`Add task to ${title}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cards List */}
      <div className="p-3 flex-1 flex flex-col gap-3 overflow-y-auto">
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task._id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-border-glass rounded-xl">
            <span className="text-xs text-text-tertiary font-medium">No tasks in this lane</span>
            {canManage && onAddTask && (
              <button
                onClick={() => onAddTask(id)}
                className="mt-2 text-xs font-semibold text-amber-light hover:text-amber-bright inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add a task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

