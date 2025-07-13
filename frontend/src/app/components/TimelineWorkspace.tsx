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

function formatCategoryName(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
      const start = new Date(baseDate);
      return {
        start,
        daysPerColumn: 3,
        totalDays: 36,
        formatLabel: (date: Date) =>
          date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    }
    case "year": {
      const start = new Date(baseDate);
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

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day); // ✅ zero-indexed months
}

function getEventPosition(
  event: TimelineEvent,
  zoomConfig: any
): { startCol: number; span: number } | null {
  const eventStart = parseLocalDate(event.start);
  const eventEnd = parseLocalDate(event.end);
  const timelineStart = new Date(zoomConfig.start);
  timelineStart.setHours(0, 0, 0, 0);

  const timelineEnd = new Date(
    timelineStart.getTime() + zoomConfig.totalDays * 86400000
  );
  timelineEnd.setHours(23, 59, 59, 999); // Include entire end day

  // Exclude events that don't intersect the current visible timeline
  if (eventEnd < timelineStart || eventStart > timelineEnd) return null;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const daysPerCol = zoomConfig.daysPerColumn;

  const eventEndInclusive = new Date(eventEnd.getTime() + MS_PER_DAY);

  // Align visible event range
  const visibleStart = new Date(
    Math.max(eventStart.getTime(), timelineStart.getTime())
  );

  const visibleEnd = new Date(
    Math.min(eventEndInclusive.getTime(), timelineEnd.getTime())
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

  if (startCol > 6 || endCol < 0) return null;

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

  const sortedEvents = [...events].sort((a, b) => {
    const imp =
      getImportancePriority(a.importance) - getImportancePriority(b.importance);
    return imp !== 0
      ? imp
      : new Date(a.start).getTime() - new Date(b.start).getTime();
  });

  const placementOrder = [3, 5, 2, 6, 1, 7]; // 1A -> 3B

  // Track used rows per column
  const usedGrid: Record<number, Set<number>> = {};

  for (const event of sortedEvents) {
    const position = getEventPosition(event, zoomConfig);
    if (!position) continue;

    const { startCol, span } = position;

    let assignedRow: number | null = null;

    for (const row of placementOrder) {
      let rowFree = true;
      for (let col = startCol; col < startCol + span; col++) {
        if (!usedGrid[col]) usedGrid[col] = new Set();
        if (usedGrid[col].has(row)) {
          rowFree = false;
          break;
        }
      }

      if (rowFree) {
        assignedRow = row;
        // Mark this row as used across all columns it spans
        for (let col = startCol; col < startCol + span; col++) {
          usedGrid[col].add(row);
        }
        break;
      }
    }

    if (assignedRow !== null) {
      positioned.push({
        event,
        row: assignedRow,
        col: startCol,
        span,
      });
    }

    // If no row could be found (too many stacked events), it's intentionally hidden,
    // and "+X more" logic can show it's overflowed.
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
  const [editableEvent, setEditableEvent] = useState<TimelineEvent | null>(
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

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<TimelineEvent>;
    }) => updateTimelineEvent(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline", caseId] });
      setToastMessage("Event updated ✅");
      setShowEventModal(false); // 👈 Auto-close the modal
      setSelectedEvent(null); // 👈 Clear selected
      setEditableEvent(null); // 👈 Clear editable
    },

    onError: (err) => {
      setToastMessage(
        err instanceof Error ? err.message : "Failed to update event"
      );
    },
  });

  useEffect(() => {
    const container = timelineRef.current;
    if (!container) return;

    let lastScrollTime = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();

      // Throttle scroll speed (avoid updating too fast)
      if (now - lastScrollTime < 100) return;
      lastScrollTime = now;

      const direction = e.deltaY > 0 ? "next" : "prev";
      navigateTime(direction, 1); // ✅ Move 1 unit (i.e., 1 grid square)
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [zoom, currentDate]);

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

  const visibleEvents = uniqueFilteredEvents.filter(
    (event) => getEventPosition(event, zoomConfig) !== null
  );

  const positionedEvents = useMemo(
    () => stackEvents(visibleEvents, zoomConfig),
    [visibleEvents, zoomConfig]
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
      start: formData.start, // YYYY-MM-DD format, no timezone shift
      end: formData.end,
      importance: formData.importance as ImportanceLevel,
      category: formData.category.trim(),
      description: formData.description?.trim() || "",
    };

    console.log("Submitting sanitized event:", sanitized); // Debug

    createMutation.mutate(sanitized);
  };

  const navigateTime = (direction: "prev" | "next", steps = 1) => {
    const newDate = new Date(currentDate);
    const dir = direction === "next" ? 1 : -1;

    switch (zoom) {
      case "week":
        newDate.setDate(newDate.getDate() + dir * steps);
        break;
      case "month":
        newDate.setDate(newDate.getDate() + dir * steps * 3); // 3 days per col
        break;
      case "year":
        newDate.setDate(newDate.getDate() + dir * steps * 30); // 30 days per col
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
                              {getCategoryEmoji(category)}{" "}
                              {formatCategoryName(category)}
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
                {positionedEvents.map(({ event, row, col, span }, index) => {
                  return (
                    <div
                      key={`${event.id}-${index}`}
                      className={`z-10 p-1 m-0.5 rounded border-2 flex items-center justify-center overflow-hidden cursor-pointer transition-transform duration-150 ease-out transform hover:scale-105 hover:z-20 ${getImportanceColor(
                        event.importance
                      )}`}
                      style={{
                        gridColumn: `${col + 1} / ${col + span + 1}`,
                        gridRow: row,
                        contain: "layout paint",
                        transformOrigin:
                          col + span + 1 >= 7 ? "right center" : "center", // 👈 this is the fix
                      }}
                      onClick={() => {
                        setSelectedEvent(event);
                        setEditableEvent(event);
                        setShowEventModal(true);
                      }}
                      title={`${event.title} (${event.importance})`}
                    >
                      <div className="flex flex-col w-full h-full text-left p-1 overflow-hidden">
                        {/* Always visible label */}
                        <div
                          className="text-sm font-semibold text-white leading-tight mb-1 truncate"
                          title={`${formatCategoryName(event.category)}: ${
                            event.title
                          }`}
                        >
                          {getCategoryEmoji(event.category)}{" "}
                          {formatCategoryName(event.category)}: {event.title}
                        </div>

                        {/* Content with clipping */}
                        <div
                          className="text-[11px] text-white opacity-90 leading-snug relative flex-1"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 4,
                            whiteSpace: "normal", // ✅ allows multiline clamp
                            wordBreak: "break-word", // ✅ ensures long words wrap
                            maxHeight: "5.2em",
                          }}
                        >
                          {event.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                      value={formData.start}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          start: e.target.value,
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
                      value={formData.end}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          end: e.target.value,
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
        editableEvent &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">{editableEvent.title}</h3>
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
                    {parseLocalDate(editableEvent.start).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">
                    End:{" "}
                  </span>
                  <span className="text-sm text-gray-600">
                    {parseLocalDate(editableEvent.end).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                </div>

                {/* Editable Importance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importance
                  </label>
                  <select
                    value={editableEvent.importance}
                    onChange={(e) =>
                      setEditableEvent({
                        ...editableEvent,
                        importance: e.target.value as ImportanceLevel,
                      })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Editable Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editableEvent.category}
                    onChange={(e) =>
                      setEditableEvent({
                        ...editableEvent,
                        category: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1"
                  >
                    {[
                      "trial",
                      "hearing",
                      "motion",
                      "deposition",
                      "discovery",
                      "filing",
                      "deadline",
                      "client_meeting",
                      "internal_meeting",
                      "appeal",
                      "evidence",
                      "settlement",
                      "other",
                    ].map((category) => (
                      <option key={category} value={category}>
                        {getCategoryEmoji(category)}{" "}
                        {formatCategoryName(category)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Editable Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editableEvent.description}
                    onChange={(e) =>
                      setEditableEvent({
                        ...editableEvent,
                        description: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-2"
                    rows={4}
                  />
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
                    if (editableEvent) {
                      updateMutation.mutate({
                        id: editableEvent.id,
                        updates: {
                          description: editableEvent.description,
                          importance: editableEvent.importance,
                          category: editableEvent.category,
                        },
                      });
                    }
                  }}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Saving..." : "Save"}
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
