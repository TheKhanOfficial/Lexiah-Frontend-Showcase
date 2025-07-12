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
  description: string;
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
    .from("timeline")
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
    .from("timeline")
    .insert([eventData])
    .select()
    .single();

  console.log("Supabase insert response:", { data, error, eventData });

  if (error) throw error;
  return data;
}

async function updateTimelineEvent(
  id: string,
  updates: Partial<Omit<TimelineEvent, "id" | "created_at">>
): Promise<TimelineEvent> {
  const { data, error } = await supabase
    .from("timeline")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteTimelineEvent(id: string): Promise<void> {
  const { error } = await supabase.from("timeline").delete().eq("id", id);
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
    trial: "⚖️",
    hearing: "👨‍⚖️",
    discovery: "🔍",
    client_meeting: "🤝",
    internal_meeting: "👥",
    deadline: "⏰",
    filing: "📄",
    deposition: "🎙️",
    motion: "📝",
    appeal: "🔁",
    evidence: "📸",
    settlement: "💼",
    other: "📌",
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

  // Exclude events that don't intersect the current visible timeline
  if (eventEnd < timelineStart || eventStart > timelineEnd) return null;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const daysPerCol = zoomConfig.daysPerColumn;

  // Align visible event range
  const visibleStart = new Date(
    Math.max(eventStart.getTime(), timelineStart.getTime())
  );
  const visibleEnd = new Date(
    Math.min(eventEnd.getTime(), timelineEnd.getTime())
  );

  // Offset in days from start of timeline
  const startOffsetDays = Math.floor(
    (visibleStart.getTime() - timelineStart.getTime()) / MS_PER_DAY
  );
  const endOffsetDays = Math.ceil(
    (visibleEnd.getTime() - timelineStart.getTime()) / MS_PER_DAY
  );

  const startCol = Math.floor(startOffsetDays / daysPerCol);
  const endCol = Math.floor((endOffsetDays - 1) / daysPerCol);
  const span = Math.max(1, endCol - startCol + 1);

  return {
    startCol: startCol,
    span: span,
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

  // Sort by priority, then start date
  const sortedEvents = [...events].sort((a, b) => {
    const imp =
      getImportancePriority(a.importance) - getImportancePriority(b.importance);
    return imp !== 0
      ? imp
      : new Date(a.start).getTime() - new Date(b.start).getTime();
  });

  const placementOrder = [3, 5, 2, 6, 1, 7]; // 1A=3, 1B=5, 2A=2, 2B=6, 3A=1, 3B=7
  const colRowMap: Record<number, Set<number>> = {}; // Keep track of used rows per column

  for (const event of sortedEvents) {
    const position = getEventPosition(event, zoomConfig);
    if (!position) continue;

    const { startCol, span } = position;
    const col = startCol;

    if (!colRowMap[col]) colRowMap[col] = new Set();

    let assignedRow: number | null = null;
    for (const row of placementOrder) {
      if (!colRowMap[col].has(row)) {
        assignedRow = row;
        break;
      }
    }

    if (assignedRow === null) {
      // Overflow, don't render on grid, let "+X more" handle it
      continue;
    }

    // Mark this row used for all columns it spans
    for (let i = col; i < col + span; i++) {
      if (!colRowMap[i]) colRowMap[i] = new Set();
      colRowMap[i].add(assignedRow);
    }

    positioned.push({
      event,
      row: assignedRow,
      col,
      span,
    });
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    start: "",
    end: "",
    importance: "medium" as ImportanceLevel,
    category: "trial",
    description: "", // ← ✅ Add this line
  });

  // Fetch events
  const { data: eventsData = [], isFetching } = useQuery({
    queryKey: ["timeline", caseId],
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
      queryClient.invalidateQueries({ queryKey: ["timeline", caseId] });
      setShowAddModal(false);
      resetForm();
      setError(null);
    },
    onError: (err) => {
      setShowAddModal(false);
      setToastMessage(
        err instanceof Error ? err.message : "Failed to create event"
      );
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTimelineEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline", caseId] });
      setShowEventModal(false);
      setSelectedEvent(null);
    },
    onError: (err) => {
      setToastMessage(
        err instanceof Error ? err.message : "Failed to delete event"
      );
    },
  });

  useEffect(() => {
    const current = new Set(categoryFilters);
    let updated = false;

    for (const e of events) {
      if (!current.has(e.category)) {
        current.add(e.category);
        updated = true;
      }
    }

    if (updated) setCategoryFilters(current);
  }, [events]);

  // Get unique categories
  const allCategories = Array.from(new Set(events.map((e) => e.category)));

  // Filter events
  const filteredEvents = events.filter(
    (event) =>
      importanceFilters.has(event.importance) &&
      categoryFilters.has(event.category)
  );

  const uniqueFilteredEvents = Array.from(
    new Map(filteredEvents.map((e) => [e.id, e])).values()
  );

  const zoomConfig = useMemo(
    () => getZoomConfig(zoom, currentDate),
    [zoom, currentDate]
  );

  const positionedEvents = useMemo(
    () => stackEvents(uniqueFilteredEvents, zoomConfig),
    [uniqueFilteredEvents, zoomConfig]
  );

  // Form handlers
  const resetForm = () => {
    setFormData({
      title: "",
      start: "",
      end: "",
      importance: "medium",
      category: "trial",
      description: "", // ← ✅ Add this line
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

    if (endDate < startDate) {
      setError("End date must be after start date");
      return;
    }

    const sanitized = {
      case_id: caseId,
      title: formData.title.trim(),
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
      importance: formData.importance as ImportanceLevel,
      category: formData.category.trim(),
      description: formData.description?.trim() || "",
    };

    console.log("Submitting sanitized event:", sanitized); // Debug

    createMutation.mutate(sanitized);
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

  console.log("Current filters:", Array.from(categoryFilters));
  console.log("All categories in events:", allCategories);

  return (
    <div className="h-full flex flex-col">
      {/* Timeline */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 relative min-h-0">
            <div
              ref={timelineRef}
              className="absolute inset-0 overflow-auto bg-white"
            >
              {/* Disjoint Controls Inline with Timeline */}
              <div className="absolute z-20 top-2 left-2 flex flex-wrap gap-2 text-sm">
                {/* Navigation */}
                <button
                  onClick={() => navigateTime("prev")}
                  className="px-2 py-1 rounded border text-gray-700 hover:bg-gray-100"
                >
                  ←
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-2 py-1 rounded border text-blue-600 hover:bg-blue-50"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateTime("next")}
                  className="px-2 py-1 rounded border text-gray-700 hover:bg-gray-100"
                >
                  →
                </button>

                {/* Zoom */}
                {(["week", "month", "year"] as ZoomLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setZoom(level)}
                    className={`px-2 py-1 rounded border capitalize ${
                      zoom === level
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {level}
                  </button>
                ))}

                {/* Add Event */}
                <button
                  onClick={() => {
                    setShowAddModal(true);
                    resetForm();
                  }}
                  className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  + Add
                </button>

                {/* Filter Toggle */}
                <div className="relative group">
                  <button className="px-2 py-1 rounded border text-gray-700 hover:bg-gray-100">
                    Filter ⌄
                  </button>

                  {/* Dropdown */}
                  <div className="absolute mt-1 hidden group-hover:block bg-white border rounded shadow p-2 space-y-3 z-30">
                    {/* Importance */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Importance</p>
                      <div className="flex gap-1">
                        {(
                          [
                            "low",
                            "medium",
                            "high",
                            "critical",
                          ] as ImportanceLevel[]
                        ).map((level) => (
                          <button
                            key={level}
                            onClick={() => toggleImportanceFilter(level)}
                            className={`w-6 h-6 rounded border-2 ${
                              importanceFilters.has(level)
                                ? getImportanceColor(level)
                                : "bg-gray-200 border-gray-300"
                            }`}
                            title={level}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Categories */}
                    {allCategories.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Categories</p>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {allCategories.map((category) => (
                            <button
                              key={category}
                              onClick={() => toggleCategoryFilter(category)}
                              className={`px-2 py-0.5 text-xs rounded border ${
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
                </div>
              </div>

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
                        <div className="flex flex-col items-center justify-center space-y-0.5">
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
                          {(() => {
                            const colIndex = col - 1;
                            const totalEvents = events.filter((e) => {
                              const pos = getEventPosition(e, zoomConfig);
                              return pos && pos.startCol === colIndex;
                            });
                            const overflow = totalEvents.length - 6;
                            if (overflow > 0) {
                              return (
                                <div className="text-[10px] text-blue-600 font-medium">
                                  +{overflow} more
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Events */}
                {positionedEvents.map(({ event, row, col, span }, index) => (
                  <div
                    key={`${event.id}-${index}`}
                    className={`z-10 p-1 m-0.5 rounded border-2 flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:scale-105 hover:z-20 ${getImportanceColor(
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Timeline Event</h3>

              <form onSubmit={handleSubmitAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Event title"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Event description"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start.split("T")[0]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          start: `${e.target.value}T00:00:00Z`,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.end.split("T")[0]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          end: `${e.target.value}T00:00:00Z`,
                        })
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
                      required
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
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="trial">⚖️Trial</option>
                      <option value="hearing">👨‍⚖️Hearing</option>
                      <option value="motion">📝Motion</option>
                      <option value="deposition">🎙️Deposition</option>
                      <option value="discovery">🔍Discovery</option>
                      <option value="filing">📄Filing</option>
                      <option value="deadline">⏰Deadline</option>
                      <option value="client_meeting">🤝Client Meeting</option>
                      <option value="internal_meeting">
                        👥Internal Meeting
                      </option>
                      <option value="appeal">🔁Appeal</option>
                      <option value="evidence">📸Evidence</option>
                      <option value="settlement">💼Settlement</option>
                      <option value="other">📌Other</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm font-medium text-center">
                    {error}
                  </div>
                )}

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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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

                {selectedEvent.description && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Description:{" "}
                    </span>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
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
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-sm px-4 py-2 rounded shadow-lg z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
