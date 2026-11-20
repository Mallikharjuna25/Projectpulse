import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import {
  Plus,
  Search,
  Filter,
  Users,
  CheckCircle2,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { KanbanColumn } from '../../../components/tasks/KanbanColumn.jsx';
import { KanbanCard } from '../../../components/tasks/KanbanCard.jsx';
import { TaskModal } from '../../../components/tasks/TaskModal.jsx';
import { TaskDetailDrawer } from '../../../components/tasks/TaskDetailDrawer.jsx';
import { taskApi } from '../../../services/taskApi.js';
import { useSocket } from '../../../context/SocketContext.jsx';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'bg-slate-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-sky-500' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-amber-500' },
  { id: 'COMPLETED', title: 'Completed', color: 'bg-emerald-500' }
];

export const KanbanTab = ({ projectId, teamMembers = [], canManage = false }) => {
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Drag and drop state
  const [activeTask, setActiveTask] = useState(null);

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [targetColumnForNew, setTargetColumnForNew] = useState('TODO');
  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState(null);

  // Configure pointer sensor with activation distance to permit clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    })
  );

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterAssignee) params.assigneeId = filterAssignee;
      if (filterPriority) params.priority = filterPriority;
      if (search) params.search = search;

      const res = await taskApi.listProjectTasks(projectId, params);
      setTasks(res?.data?.tasks || res?.tasks || []);
    } catch (err) {
      toast.error('Failed to load project tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId, filterAssignee, filterPriority]);

  // Real-time socket sync
  useEffect(() => {
    if (socket && projectId) {
      const handleTaskCreated = (newTask) => {
        setTasks((prev) => {
          if (prev.some((t) => t._id === newTask._id)) return prev;
          return [...prev, newTask];
        });
      };

      const handleTaskMoved = ({ taskId, newStatus, newOrder, task }) => {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, ...task, status: newStatus, order: newOrder } : t))
        );
      };

      const handleTaskUpdated = (updatedTask) => {
        setTasks((prev) =>
          prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
        );
        setSelectedTaskForDrawer((prev) => (prev?._id === updatedTask._id ? updatedTask : prev));
      };

      const handleTaskDeleted = ({ taskId }) => {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        setSelectedTaskForDrawer((prev) => (prev?._id === taskId ? null : prev));
      };

      socket.on('task:created', handleTaskCreated);
      socket.on('task:moved', handleTaskMoved);
      socket.on('task:updated', handleTaskUpdated);
      socket.on('task:deleted', handleTaskDeleted);

      return () => {
        socket.off('task:created', handleTaskCreated);
        socket.off('task:moved', handleTaskMoved);
        socket.off('task:updated', handleTaskUpdated);
        socket.off('task:deleted', handleTaskDeleted);
      };
    }
  }, [socket, projectId]);

  // Filter tasks locally by search text
  const filteredTasks = tasks.filter((t) => {
    if (!search) return true;
    const match =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.taskCode.toLowerCase().includes(search.toLowerCase());
    return match;
  });

  // Group tasks by column sorted by order
  const getTasksByColumn = (columnId) => {
    return filteredTasks
      .filter((t) => t.status === columnId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id;
    const currentTask = tasks.find((t) => t._id === activeTaskId);
    if (!currentTask) return;

    let targetColumnId;
    let targetOrder = 0;

    // Check if dropped directly onto a column container
    if (COLUMNS.some((col) => col.id === over.id)) {
      targetColumnId = over.id;
      const colTasks = getTasksByColumn(targetColumnId);
      targetOrder = colTasks.length;
    } else {
      // Dropped onto another card
      const overTask = tasks.find((t) => t._id === over.id);
      if (!overTask) return;
      targetColumnId = overTask.status;
      const colTasks = getTasksByColumn(targetColumnId);
      const overIndex = colTasks.findIndex((t) => t._id === overTask._id);
      targetOrder = overIndex >= 0 ? overIndex : 0;
    }

    if (currentTask.status === targetColumnId && currentTask.order === targetOrder) {
      return;
    }

    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => {
        if (t._id === activeTaskId) {
          return { ...t, status: targetColumnId, order: targetOrder };
        }
        return t;
      })
    );

    try {
      await taskApi.moveTask(projectId, activeTaskId, {
        status: targetColumnId,
        order: targetOrder
      });
    } catch (err) {
      toast.error('Failed to update task position');
      setTasks(previousTasks); // Rollback on failure
    }
  };

  return (
    <div className="space-y-6">
      {/* Kanban Filter & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface-container-lowest border border-border-glass text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-amber-light transition-all"
            />
          </div>

          {/* Filter Assignee */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-border-glass text-text-secondary focus:outline-none focus:border-amber-light transition-all"
          >
            <option value="">All Assignees</option>
            {teamMembers.map((m) => (
              <option key={m.userId?._id} value={m.userId?._id}>
                {m.userId?.name}
              </option>
            ))}
          </select>

          {/* Filter Priority */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-border-glass text-text-secondary focus:outline-none focus:border-amber-light transition-all"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            className="p-2 rounded-xl border border-border-glass hover:bg-surface-elevation-2 text-text-secondary hover:text-amber-light transition-colors"
            title="Refresh board"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {canManage && (
            <button
              onClick={() => {
                setTaskToEdit(null);
                setTargetColumnForNew('TODO');
                setShowTaskModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-container hover:bg-amber-bright text-white shadow-[0_0_12px_rgba(255,107,0,0.3)] transition-all"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Container */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                color={col.color}
                tasks={getTasksByColumn(col.id)}
                onTaskClick={(task) => setSelectedTaskForDrawer(task)}
                onAddTask={(colId) => {
                  setTaskToEdit(null);
                  setTargetColumnForNew(colId);
                  setShowTaskModal(true);
                }}
                canManage={canManage}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="rotate-2 scale-105 shadow-2xl">
                <KanbanCard task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Task Create / Edit Modal */}
      {showTaskModal && (
        <TaskModal
          projectId={projectId}
          teamMembers={teamMembers}
          taskToEdit={taskToEdit}
          initialStatus={targetColumnForNew}
          onClose={() => setShowTaskModal(false)}
          onSaved={fetchTasks}
        />
      )}

      {/* Task Detail Drawer */}
      {selectedTaskForDrawer && (
        <TaskDetailDrawer
          projectId={projectId}
          task={selectedTaskForDrawer}
          canManage={canManage}
          onClose={() => setSelectedTaskForDrawer(null)}
          onEdit={(task) => {
            setSelectedTaskForDrawer(null);
            setTaskToEdit(task);
            setShowTaskModal(true);
          }}
          onDeleted={fetchTasks}
          onUpdated={(updated) => {
            setSelectedTaskForDrawer(updated);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
};

