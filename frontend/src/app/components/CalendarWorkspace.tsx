"use client";
// app/components/CalendarWorkspace.tsx

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { supabase } from "@/utils/supabase";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarApi, EventInput, DateSelectArg } from "@fullcalendar/core";

// Types
interface Task {
  id: string;
  case_id: string;
  name: string;
  due_date: string | null;
  completed: boolean;
  manual_color: "green" | "yellow" | "red" | "darkred" | null;
  auto_urgency: boolean;
  created_at: string;
}

interface CalendarEvent {
  id: string;
  case_id: string;
  title: string;
  start: string;
  end: string;
  created_at: string;
}

interface CalendarWorkspaceProps {
  userId: string;
  caseId: string;
}

type UrgencyColor = "green" | "yellow" | "red" | "darkred";
type CalendarView = "dayGridMonth" | "timeGridWeek";

// Supabase functions for tasks
async function fetchTasks(caseId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Supabase functions for calendar events
async function fetchCalendarEvents(caseId: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function createCalendarEvent(
  eventData: Omit<CalendarEvent, "id" | "created_at">
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from("calendar_events")
    .insert([eventData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateCalendarEvent(
  id: string,
  updates: Partial<Omit<CalendarEvent, "id" | "created_at">>
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from("calendar_events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteCalendarEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

function toLocalISOString(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 19); // yyyy-mm-ddThh:mm:ss
}

// Helper functions
function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getTaskUrgencyColor(task: Task): UrgencyColor {
  if (task.completed) return "green";

  if (!task.due_date || task.auto_urgency === false) {
    return task.manual_color || "green";
  }

  const daysUntil = getDaysUntilDue(task.due_date);

  if (daysUntil <= 0) return "darkred"; // Today or overdue
  if (daysUntil <= 2) return "red"; // 1-2 days
  if (daysUntil <= 5) return "yellow"; // 3-5 days
  return "green"; // >5 days
}

function getTaskEventColor(urgency: UrgencyColor): string {
  switch (urgency) {
    case "darkred":
      return "#7F1D1D"; // Dark red
    case "red":
      return "#DC2626"; // Red
    case "yellow":
      return "#D97706"; // Amber
    case "green":
      return "#059669"; // Emerald
    default:
      return "#059669";
  }
}

function isAllDayEvent(start: string, end: string): boolean {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startsExactlyAtMidnight =
    startDate.getHours() === 0 &&
    startDate.getMinutes() === 0 &&
    startDate.getSeconds() === 0;

  const endsExactlyAtMidnight =
    endDate.getHours() === 0 &&
    endDate.getMinutes() === 0 &&
    endDate.getSeconds() === 0;

  // Calculate full-day span excluding the first and last day if partial
  const startDay = new Date(startDate);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(endDate);
  endDay.setHours(0, 0, 0, 0);

  const diffDays =
    (endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24);

  // Only all-day if it starts AND ends exactly at midnight AND spans at least 1 day
  return startsExactlyAtMidnight && endsExactlyAtMidnight && diffDays >= 1;
}

export default function CalendarWorkspace({
  userId,
  caseId,
}: CalendarWorkspaceProps) {
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar>(null);

  // State
  const [currentView, setCurrentView] = useState<CalendarView>("dayGridMonth");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateSelectArg | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    start: "",
    end: "",
    isAllDay: false,
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [showEventModal, setShowEventModal] = useState(false);
  const deleteEventMutation = useMutation({
    mutationFn: deleteCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar_events", caseId] });
      setShowEventModal(false);
      setSelectedEvent(null);
    },
    onError: (err) => {
      console.error("Delete failed:", err);
    },
  });

  // Fetch tasks and calendar events
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks", caseId],
    queryFn: () => fetchTasks(caseId),
    enabled: !!caseId,
  });

  const { data: calendarEvents = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ["calendar_events", caseId],
    queryFn: () => fetchCalendarEvents(caseId),
    enabled: !!caseId,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: createCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar_events", caseId] });
      setShowAddModal(false);
      resetForm();
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create event");
    },
  });

  // Transform data for FullCalendar
  const calendarEventsForFC: EventInput[] = [
    // Task events (all-day)
    ...tasks
      .filter((task) => task.due_date && !task.completed)
      .map((task) => ({
        id: `task-${task.id}`,
        title: `📋 ${task.name}`,
        start: task.due_date,
        allDay: true,
        backgroundColor: getTaskEventColor(getTaskUrgencyColor(task)),
        borderColor: getTaskEventColor(getTaskUrgencyColor(task)),
        classNames: ["task-event"],
        extendedProps: {
          type: "task",
          taskId: task.id,
          urgency: getTaskUrgencyColor(task),
        },
      })),
    // Calendar events (timed)
    ...calendarEvents.flatMap((event) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const oneDay = 24 * 60 * 60 * 1000;

      const startMidnight = new Date(start);
      startMidnight.setHours(0, 0, 0, 0);

      const endMidnight = new Date(end);
      endMidnight.setHours(0, 0, 0, 0);

      const events: EventInput[] = [];

      // Timed start part (if not midnight)
      if (start.getTime() > startMidnight.getTime()) {
        const endOfStart = new Date(startMidnight.getTime() + oneDay);
        events.push({
          id: `${event.id}-start`,
          title: event.title,
          start: start.toISOString(),
          end: end < endOfStart ? end.toISOString() : endOfStart.toISOString(),
          allDay: false,
          backgroundColor: "#2563EB",
          borderColor: "#2563EB",
          classNames: ["calendar-event"],
          extendedProps: { type: "calendar", eventId: event.id },
        });
      }

      // All-day in-between days
      let current = new Date(startMidnight.getTime() + oneDay);
      while (current < endMidnight) {
        const next = new Date(current.getTime() + oneDay);
        events.push({
          id: `${event.id}-allday-${current.toISOString()}`,
          title: event.title,
          start: current.toISOString(),
          end: next.toISOString(),
          allDay: true,
          backgroundColor: "#2563EB",
          borderColor: "#2563EB",
          classNames: ["calendar-event"],
          extendedProps: { type: "calendar", eventId: event.id },
        });
        current = next;
      }

      // Timed end part (if not exactly midnight)
      if (end.getTime() > endMidnight.getTime()) {
        events.push({
          id: `${event.id}-end`,
          title: event.title,
          start: endMidnight.toISOString(),
          end: end.toISOString(),
          allDay: false,
          backgroundColor: "#2563EB",
          borderColor: "#2563EB",
          classNames: ["calendar-event"],
          extendedProps: { type: "calendar", eventId: event.id },
        });
      }

      return events;
    }),
  ];

  // Form handlers
  const resetForm = () => {
    setFormData({
      title: "",
      start: "",
      end: "",
      isAllDay: false,
      notes: "",
    });
    setSelectedDate(null);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (currentView !== "timeGridWeek") return; // Only allow selection in week view

    const startDate = selectInfo.start;
    const endDate = selectInfo.end;

    setSelectedDate(selectInfo);
    setFormData({
      title: "",
      start: toLocalISOString(startDate),
      end: toLocalISOString(endDate),
      isAllDay: selectInfo.allDay,
      notes: "",
    });
    setShowAddModal(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.start) {
      setError("Title and start time are required");
      return;
    }

    const startDate = new Date(formData.start);
    const endDate = formData.end
      ? new Date(formData.end)
      : new Date(startDate.getTime() + 60 * 60 * 1000);

    if (endDate <= startDate) {
      setError("End time must be after start time");
      return;
    }

    const eventData = {
      case_id: caseId,
      title: formData.title.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      notes: formData.notes.trim() || null,
    };

    createEventMutation.mutate(eventData);
  };

  const handleViewChange = (newView: CalendarView) => {
    setCurrentView(newView);
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(newView);
    }
  };

  const handleTodayClick = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
    }
  };

  const handlePrevClick = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.prev();
    }
  };

  const handleNextClick = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.next();
    }
  };

  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) =>
      updateCalendarEvent(selectedEvent!.id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar_events", caseId] });
    },
  });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (calendarRef.current) {
        calendarRef.current.getApi().updateSize();
      }
    });
    const el = document.getElementById("calendar-container");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Loading state
  if (isLoadingTasks || isLoadingEvents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>

          {/* Navigation controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTodayClick}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={handlePrevClick}
              className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              ‹
            </button>
            <button
              onClick={handleNextClick}
              className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              ›
            </button>
          </div>
        </div>

        {/* View toggle and add button */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewChange("dayGridMonth")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                currentView === "dayGridMonth"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => handleViewChange("timeGridWeek")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                currentView === "timeGridWeek"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Week
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Event
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Calendar */}
      <div className="flex-1 p-4 overflow-auto">
        <div
          style={{ height: "800px" }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div
            id="calendar-container"
            style={{ height: "100%", minHeight: "600px" }}
          >
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={currentView}
              headerToolbar={false}
              height="100%"
              events={calendarEventsForFC}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              timeZone="local"
              select={handleDateSelect}
              dateClick={(info) => {
                if (currentView === "dayGridMonth") {
                  const calendarApi = calendarRef.current?.getApi();
                  if (calendarApi) {
                    calendarApi.changeView("timeGridWeek", info.date);
                    setCurrentView("timeGridWeek");
                  }
                }
              }}
              eventClassNames="cursor-pointer"
              eventContent={(eventInfo) => {
                const isTask = eventInfo.event.extendedProps.type === "task";
                return (
                  <div className="p-1 text-xs font-medium truncate">
                    {eventInfo.event.title}
                    {isTask && (
                      <span className="ml-1 opacity-75">
                        ({eventInfo.event.extendedProps.urgency})
                      </span>
                    )}
                  </div>
                );
              }}
              dayCellClassNames="hover:bg-gray-50 transition-colors"
              eventClick={(clickInfo) => {
                const type = clickInfo.event.extendedProps.type;
                if (type !== "calendar") return;

                const eventId = clickInfo.event.extendedProps.eventId;
                const full = calendarEvents.find((e) => e.id === eventId);
                if (full) {
                  setSelectedEvent(full);
                  setShowEventModal(true);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-gray-600">Calendar Events</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-600 rounded"></div>
            <span className="text-gray-600">Low Priority Tasks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-600 rounded"></div>
            <span className="text-gray-600">Medium Priority Tasks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span className="text-gray-600">High Priority Tasks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-900 rounded"></div>
            <span className="text-gray-600">Urgent Tasks</span>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Add New Event</h3>
              <form onSubmit={handleSubmitAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="start"
                    value={formData.start}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="end"
                    value={formData.end}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={createEventMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {createEventMutation.isPending ? "Adding..." : "Add Event"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={createEventMutation.isPending}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      {showEventModal &&
        selectedEvent &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Event Details</h3>

              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Title</p>
                  <p className="text-base font-medium text-gray-900">
                    {selectedEvent.title}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="text-base text-gray-900">
                    {new Date(selectedEvent.start).toLocaleString()} —{" "}
                    {new Date(selectedEvent.end).toLocaleString()}
                  </p>
                </div>

                {selectedEvent.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <textarea
                      value={selectedEvent.notes || ""}
                      onChange={(e) => {
                        setSelectedEvent((prev) =>
                          prev ? { ...prev, notes: e.target.value } : prev
                        );
                      }}
                      rows={4}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  onClick={() => {
                    deleteEventMutation.mutate(selectedEvent.id);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    if (selectedEvent) {
                      updateNotesMutation.mutate(selectedEvent.notes || "");
                    }
                    setShowEventModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
