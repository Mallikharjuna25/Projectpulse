import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Calendar as CalendarIcon,
  Filter,
  FolderGit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Milestone as MilestoneIcon,
  ArrowRight,
  X
} from 'lucide-react';
import { milestoneApi } from '../../services/milestoneApi.js';
import toast from 'react-hot-toast';

export const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showProjects, setShowProjects] = useState(true);
  const [showMilestones, setShowMilestones] = useState(true);
  const [showTasks, setShowTasks] = useState(true);

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await milestoneApi.getCalendarEvents();
      setEvents(res?.data?.events || res?.events || []);
    } catch (err) {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    const type = e.extendedProps?.type;
    if (type === 'PROJECT' && !showProjects) return false;
    if (type === 'MILESTONE' && !showMilestones) return false;
    if (type === 'TASK' && !showTasks) return false;
    return true;
  });

  const handleEventClick = (info) => {
    info.jsEvent.preventDefault();
    setSelectedEvent(info.event);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-7 h-7 text-indigo-500" />
          Academic Project Calendar
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Synchronized institutional schedule of project deliverables, milestone targets, and task due dates
        </p>
      </div>

      {/* Legend & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Filter Checkboxes */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filter Types:
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showProjects}
              onChange={(e) => setShowProjects(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Project Deadlines
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showMilestones}
              onChange={(e) => setShowMilestones(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Milestones
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showTasks}
              onChange={(e) => setShowTasks(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Tasks
            </span>
          </label>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Overdue
          </span>
        </div>
      </div>

      {/* Calendar Board Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {loading ? (
          <div className="h-[600px] rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
        ) : (
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,today,next',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={filteredEvents}
              eventClick={handleEventClick}
              height="auto"
              dayMaxEvents={3}
              editable={false}
              selectable={false}
            />
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {selectedEvent.extendedProps?.type || 'EVENT'}
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                {selectedEvent.title}
              </h3>

              <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedEvent.start ? new Date(selectedEvent.start).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                {selectedEvent.extendedProps?.projectTitle && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400">Project:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedEvent.extendedProps.projectTitle}
                    </span>
                  </div>
                )}

                {selectedEvent.extendedProps?.status && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-semibold uppercase tracking-wider text-indigo-500">
                      {selectedEvent.extendedProps.status}
                    </span>
                  </div>
                )}

                {selectedEvent.extendedProps?.completionPercent !== undefined && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400">Progress:</span>
                    <span className="font-semibold text-emerald-500">
                      {selectedEvent.extendedProps.completionPercent}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
              {selectedEvent.extendedProps?.projectId && (
                <Link
                  to={`/projects/${selectedEvent.extendedProps.projectId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Workspace <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

