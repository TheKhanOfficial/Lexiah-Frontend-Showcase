"use client";
// app/components/TimelineWorkspace.tsx

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { supabase } from "@/utils/supabase";

// Types
interface TimelineEvent {
  id: string;
  case_id: string;
  title: string;
  start: string;
  end: string;
  importance: "low" | "medium" | "high" | "critical";
  category: string;
  created_at: string;
}

interface TimelineWorkspaceProps {
  userId: string;
  caseId: string;
}

type ZoomLevel = "week" | "month" | "year";
type ImportanceLevel = "low" | "medium" | "high" | "critical";

// Supabase functions
async function fetchTimelineEvents(caseId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from("timeline_events")
    .select("*")
    .eq("case_id", caseId)
    .order("start", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function createTimelineEvent(
  eventData: Omit<TimelineEvent, "id" | "created_at">
): Promise<TimelineEvent> {
  const { data, error } = await supabase
    .from("timeline_events")
    .insert([eventData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateTimelineEvent(
  id: string,
  updates: Partial<Omit<TimelineEvent, "id" | "created_at">>
): Promise<TimelineEvent> {
  const { data, error } = await supabase
    .from("timeline_events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteTimelineEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("timeline_events")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// Helper functions
function getImportanceColor(importance: ImportanceLevel): string {
  switch (importance) {
    case "critical":
      return "bg-red-800 border-red-900";
    case "high":
      return "bg-orange-500 border-orange-600";
    case "medium":
      return "bg-yellow-400 border-yellow-500";
    case "low":
      return "bg-green-400 border-green-500";
  }
}

function getImportancePriority(importance: ImportanceLevel): number {
  switch (importance) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
  }
}

function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    court: "⚖️",
    discovery: "🔍",
    admin: "📋",
    meeting: "🤝",
    deadline: "⏰",
    filing: "📄",
    deposition: "🎯",
    motion: "📝",
    hearing: "👥",
    settlement: "🤝",
  };
  return emojiMap[category.toLowerCase()] || "📅";
}

function getZoomConfig(zoom: ZoomLevel, currentDate: Date) {
  const baseDate = new Date(currentDate);
  baseDate.setHours(0, 0, 0, 0);

  switch (zoom) {
    case "week": {
      // Start from beginning of week (Sunday)
      const start = new Date(baseDate);
      start.setDate(baseDate.getDate() - baseDate.getDay());
      return {
        start,
        daysPerColumn: 1,
        totalDays: 12,
        formatLabel: (date: Date) =>
          date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "numeric",
            day: "numeric",
          }),
      };
    }
    case "month": {
      // Start from beginning of month
      const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      return {
        start,
        daysPerColumn: 3,
        totalDays: 36,
        formatLabel: (date: Date) =>
          date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    }
    case "year": {
      // Start from beginning of year
      const start = new Date(baseDate.getFullYear(), 0, 1);
      return {
        start,
        daysPerColumn: 30, // Approximate month
        totalDays: 365,
        formatLabel: (date: Date) =>
          date.toLocaleDateString("en-US", { month: "short" }),
      };
    }
  }
}

function getEventPosition(
  event: TimelineEvent,
  zoomConfig: any
): { startCol: number; span: number } | null {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const timelineStart = zoomConfig.start;
  const timelineEnd = new Date(
    timelineStart.getTime() + zoomConfig.totalDays * 24 * 60 * 60 * 1000
  );

  // Check if event overlaps with visible timeline
  if (eventEnd < timelineStart || eventStart > timelineEnd) {
    return null;
  }

  const startMs = Math.max(eventStart.getTime(), timelineStart.getTime());
  const endMs = Math.min(eventEnd.getTime(), timelineEnd.getTime());

  const startDayOffset = Math.floor(
    (startMs - timelineStart.getTime()) / (24 * 60 * 60 * 1000)
  );
  const endDayOffset = Math.ceil(
    (endMs - timelineStart.getTime()) / (24 * 60 * 60 * 1000)
  );

  const startCol = Math.floor(startDayOffset / zoomConfig.daysPerColumn);
  const endCol = Math.floor((endDayOffset - 1) / zoomConfig.daysPerColumn);

  return {
    startCol: Math.max(0, Math.min(6, startCol)),
    span: Math.max(1, Math.min(7 - startCol, endCol - startCol + 1)),
  };
}

function stackEvents(
  events: TimelineEvent[],
  zoomConfig: any
): Array<{ event: TimelineEvent; row: number; col: number; span: number }> {
  const positioned: Array<{
    event: TimelineEvent;
    row: number;
    col: number;
    span: number;
  }> = [];

  // Sort by importance (critical first) then by start date
  const sortedEvents = [...events].sort((a, b) => {
    const priorityDiff =
      getImportancePriority(a.importance) - getImportancePriority(b.importance);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });

  for (const event of sortedEvents) {
    const position = getEventPosition(event, zoomConfig);
    if (!position) continue;

    const { startCol, span } = position;

    // Find available row (1-4 for top, 6-9 for bottom)
    let targetRow = -1;
    const isHighPriority =
      event.importance === "critical" || event.importance === "high";
    const rowsToCheck = isHighPriority
      ? [4, 3, 5, 2, 6, 1, 7] // center out from row 4
      : [5, 6, 7, 3, 2, 1]; // bottom first for low/medium

    for (const row of rowsToCheck) {
      const hasConflict = positioned.some((p) => {
        if (p.row !== row) return false;
        const pEnd = p.col + p.span - 1;
        const eventEnd = startCol + span - 1;
        return !(eventEnd < p.col || startCol > pEnd);
      });

      if (!hasConflict) {
        targetRow = row;
        break;
      }
    }

    if (targetRow !== -1) {
      positioned.push({ event, row: targetRow, col: startCol, span });
    }
  }

  return positioned;
}

export default function TimelineWorkspace({
  userId,
  caseId,
}: TimelineWorkspaceProps) {
  const queryClient = useQueryClient();
  const timelineRef = useRef<HTMLDivElement>(null);

  // State
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null
  );

  const [importanceFilters, setImportanceFilters] = useState<
    Set<ImportanceLevel>
  >(new Set(["low", "medium", "high", "critical"]));

  const [categoryFilters, setCategoryFilters] = useState<Set<string>>(
    new Set()
  );

  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    start: "",
    end: "",
    importance: "medium" as ImportanceLevel,
    category: "admin",
  });

  // Fetch events
  const { data: eventsData = [], isFetching } = useQuery({
    queryKey: ["timeline_events", caseId],
    queryFn: () => fetchTimelineEvents(caseId),
    enabled: !!caseId,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const events = eventsData ?? []; // never block render

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTimelineEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline_events", caseId] });
      setShowAddModal(false);
      resetForm();
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create event");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTimelineEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline_events", caseId] });
      setShowEventModal(false);
      setSelectedEvent(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    },
  });

  useEffect(() => {
    if (categoryFilters.size === 0 && events.length > 0) {
      setCategoryFilters(new Set(events.map((e) => e.category)));
    }
  }, [events, categoryFilters]);

  // Get unique categories
  const allCategories = Array.from(new Set(events.map((e) => e.category)));

  // Filter events
  const filteredEvents = events.filter(
    (event) =>
      importanceFilters.has(event.importance) &&
      categoryFilters.has(event.category)
  );

  const zoomConfig = useMemo(
    () => getZoomConfig(zoom, currentDate),
    [zoom, currentDate]
  );

  const positionedEvents = useMemo(
    () => stackEvents(filteredEvents, zoomConfig),
    [filteredEvents, zoomConfig]
  );

  // Form handlers
  const resetForm = () => {
    setFormData({
      title: "",
      start: "",
      end: "",
      importance: "medium",
      category: "admin",
    });
    setError(null);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.start || !formData.end) {
      setError("Title, start, and end dates are required");
      return;
    }

    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);

    if (endDate <= startDate) {
      setError("End date must be after start date");
      return;
    }

    createMutation.mutate({
      case_id: caseId,
      title: formData.title.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      importance: formData.importance,
      category: formData.category,
    });
  };

  const navigateTime = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);

    switch (zoom) {
      case "week":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
      case "year":
        newDate.setFullYear(
          newDate.getFullYear() + (direction === "next" ? 1 : -1)
        );
        break;
    }

    setCurrentDate(newDate);
  };

  const toggleImportanceFilter = (importance: ImportanceLevel) => {
    const newFilters = new Set(importanceFilters);
    if (newFilters.has(importance)) {
      newFilters.delete(importance);
    } else {
      newFilters.add(importance);
    }
    setImportanceFilters(newFilters);
  };

  const toggleCategoryFilter = (category: string) => {
    const newFilters = new Set(categoryFilters);
    if (newFilters.has(category)) {
      newFilters.delete(category);
    } else {
      newFilters.add(category);
    }
    setCategoryFilters(newFilters);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">Timeline</h2>

            {/* Zoom controls */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              {(["week", "month", "year"] as ZoomLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setZoom(level)}
                  className={`px-3 py-1 text-sm font-medium capitalize ${
                    zoom === level
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateTime("prev")}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Today
              </button>
              <button
                onClick={() => navigateTime("next")}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setShowAddModal(true);
              resetForm();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Event
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Importance filters */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">
              Importance:
            </span>
            <div className="flex space-x-1">
              {(["low", "medium", "high", "critical"] as ImportanceLevel[]).map(
                (level) => (
                  <button
                    key={level}
                    onClick={() => toggleImportanceFilter(level)}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      importanceFilters.has(level)
                        ? getImportanceColor(level) + " scale-110"
                        : "bg-gray-200 border-gray-300"
                    }`}
                    title={level}
                  />
                )
              )}
            </div>
          </div>

          {/* Category filters */}
          {allCategories.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">
                Categories:
              </span>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategoryFilter(category)}
                    className={`px-3 py-1 text-sm rounded-full border transition-all ${
                      categoryFilters.has(category)
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-gray-100 text-gray-600 border-gray-300"
                    }`}
                  >
                    {getCategoryEmoji(category)} {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 relative min-h-0">
            <div
              ref={timelineRef}
              className="absolute inset-0 overflow-auto bg-white"
            >
              <div
                className="grid w-full h-full"
                style={{
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gridTemplateRows: "repeat(7, 1fr)",
                }}
              >
                {/* Timeline columns */}
                {Array.from({ length: 7 * 7 }, (_, i) => {
                  const row = Math.floor(i / 7) + 1;
                  const col = (i % 7) + 1;

                  const isLabelRow = row === 4; // row 5 is the label row

                  return (
                    <div
                      key={`cell-${row}-${col}`}
                      className={`border border-gray-200 ${
                        isLabelRow
                          ? "bg-gray-100 flex items-center justify-center p-1"
                          : "bg-white"
                      }`}
                      style={{
                        gridRow: row,
                        gridColumn: col,
                      }}
                    >
                      {isLabelRow && (
                        <div className="text-xs font-medium text-gray-700 text-center">
                          {zoomConfig.formatLabel(
                            new Date(
                              zoomConfig.start.getTime() +
                                (col - 1) *
                                  zoomConfig.daysPerColumn *
                                  24 *
                                  60 *
                                  60 *
                                  1000
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Events */}
                {positionedEvents.map(({ event, row, col, span }, index) => (
                  <div
                    key={`${event.id}-${index}`}
                    className={`absolute z-10 p-1 m-0.5 rounded border-2 cursor-pointer transition-all hover:scale-105 hover:z-20 ${getImportanceColor(
                      event.importance
                    )}`}
                    style={{
                      gridColumn: `${col + 1} / span ${span}`,
                      gridRow: row,
                    }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowEventModal(true);
                    }}
                    title={`${event.title} (${event.importance})`}
                  >
                    <div className="text-xs text-white font-medium truncate">
                      {getCategoryEmoji(event.category)} {event.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Timeline Event</h3>

              <form onSubmit={handleSubmitAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Event title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start}
                      onChange={(e) =>
                        setFormData({ ...formData, start: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end}
                      onChange={(e) =>
                        setFormData({ ...formData, end: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Importance
                    </label>
                    <select
                      value={formData.importance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          importance: e.target.value as ImportanceLevel,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="court">Court</option>
                      <option value="discovery">Discovery</option>
                      <option value="admin">Admin</option>
                      <option value="meeting">Meeting</option>
                      <option value="deadline">Deadline</option>
                      <option value="filing">Filing</option>
                      <option value="deposition">Deposition</option>
                      <option value="motion">Motion</option>
                      <option value="hearing">Hearing</option>
                      <option value="settlement">Settlement</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Event Detail Modal */}
      {showEventModal &&
        selectedEvent &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Start:{" "}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(selectedEvent.start).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">
                    End:{" "}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(selectedEvent.end).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Importance:{" "}
                  </span>
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${getImportanceColor(
                      selectedEvent.importance
                    )} mr-2`}
                  />
                  <span className="text-sm text-gray-600 capitalize">
                    {selectedEvent.importance}
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Category:{" "}
                  </span>
                  <span className="text-sm text-gray-600">
                    {getCategoryEmoji(selectedEvent.category)}{" "}
                    {selectedEvent.category}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm("Are you sure you want to delete this event?")
                    ) {
                      deleteMutation.mutate(selectedEvent.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
