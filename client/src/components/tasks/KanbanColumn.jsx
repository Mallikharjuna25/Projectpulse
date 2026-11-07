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

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border transition-colors min-h-[500px] w-full max-w-sm shrink-0 ${
        isOver
          ? 'border-indigo-500/60 bg-indigo-500/5'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {title}
          </h3>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {tasks.length}
          </span>
        </div>

        {canManage && onAddTask && (
          <button
            onClick={() => onAddTask(id)}
            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title={`Add task to ${title}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cards List */}
      <div className="p-3 flex-1 flex flex-col gap-2.5 overflow-y-auto">
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
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 dark:border-slate-800/60 rounded-xl">
            <span className="text-xs text-slate-400">No tasks</span>
            {canManage && onAddTask && (
              <button
                onClick={() => onAddTask(id)}
                className="mt-2 text-[11px] font-semibold text-indigo-500 hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add one
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

