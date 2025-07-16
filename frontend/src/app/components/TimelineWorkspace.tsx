"use client";
// app/components/TimelineWorkspace.tsx

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import {
  fetchTimelineEvents,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
} from "@/utils/supabase/timeline";

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
  document_ids?: string[];
}

interface TimelineWorkspaceProps {
  userId: string;
  caseId: string;
}

type ZoomLevel = "week" | "month" | "year";
type ImportanceLevel = "low" | "medium" | "high" | "critical";

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
      const start = new Date(baseDate);
      return {
        start,
        daysPerColumn: 1,
        totalDays: 12,
        formatLabel: (date: Date) => {
          const weekday = date.toLocaleDateString("en-US", {
            weekday: "short",
          }); // Mon
          const datePart = date.toLocaleDateString("en-US", {
            month: "long", // July
            day: "numeric",
            year: "numeric",
          }); // July 14, 2025
          return `${datePart} (${weekday})`;
        },
      };
    }

    case "month": {
      const start = new Date(baseDate);
      return {
        start,
        daysPerColumn: 3,
        totalDays: 36,
        formatLabel: (date: Date) =>
          date.toLocaleDateString("en-US", {
            month: "short", // Sep
            day: "numeric", // 17
            year: "numeric", // 2025
          }),
      };
    }

    case "year": {
      const start = new Date(baseDate);
      const year = start.getFullYear();
      const months: { start: Date; end: Date }[] = [];

      const centerMonth = start.getMonth(); // currentDate's month
      const centerYear = start.getFullYear();

      for (let offset = -3; offset <= 3; offset++) {
        const monthDate = new Date(centerYear, centerMonth + offset, 1);
        const monthStart = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          1
        );
        const monthEnd = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0
        ); // last day
        months.push({ start: monthStart, end: monthEnd });
      }

      return {
        start,
        months,
        daysPerColumn: null, // Not used
        totalDays: null, // Not used
        formatLabel: (_: any, index: number) =>
          months[index].start.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
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

  if (zoomConfig.months) {
    const colStart = zoomConfig.months.findIndex(
      (m: any) => eventStart >= m.start && eventStart <= m.end
    );
    const colEnd = zoomConfig.months.findIndex(
      (m: any) => eventEnd >= m.start && eventEnd <= m.end
    );

    if (colStart < 0 || colEnd < 0) return null;

    return {
      startCol: colStart,
      span: colEnd - colStart + 1,
    };
  }

  const MS_PER_DAY = 86400000;
  const timelineStart = new Date(zoomConfig.start);
  timelineStart.setHours(0, 0, 0, 0);
  const timelineEnd = new Date(
    timelineStart.getTime() + zoomConfig.totalDays * MS_PER_DAY
  );
  timelineEnd.setHours(23, 59, 59, 999);

  if (eventEnd < timelineStart || eventStart > timelineEnd) return null;

  const daysPerCol = zoomConfig.daysPerColumn;
  const eventEndInclusive = new Date(eventEnd.getTime() + MS_PER_DAY);

  const visibleStart = new Date(
    Math.max(eventStart.getTime(), timelineStart.getTime())
  );
  const visibleEnd = new Date(
    Math.min(eventEndInclusive.getTime(), timelineEnd.getTime())
  );

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
  const prevZoom = useRef<ZoomLevel>("month"); // default start

  // State
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

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

  const [showFilter, setShowFilter] = useState(false);

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

  const [overflowEvents, setOverflowEvents] = useState<TimelineEvent[] | null>(
    null
  );
  const [overflowLabel, setOverflowLabel] = useState<string | null>(null);

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
      document_ids: [],
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
        newDate.setMonth(newDate.getMonth() + dir * steps); // ← correct
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
              <div className="absolute z-50 top-2 left-2 right-2 flex justify-between items-center flex-wrap gap-2 text-sm pointer-events-none">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Navigation */}
                  <button
                    onClick={() => {
                      const today = new Date();
                      if (zoom === "week") {
                        today.setDate(today.getDate() - 3); // center week
                      } else if (zoom === "month") {
                        today.setDate(today.getDate() - 9); // center month (3 days/col × 3 cols before = 9)
                      }
                      setCurrentDate(today);
                    }}
                    className="px-2 py-1 rounded border bg-white text-blue-600 hover:bg-blue-50 pointer-events-auto"
                  >
                    Today
                  </button>
                  <div className="flex gap-0 pointer-events-auto">
                    {/* Zoom */}
                    {(["week", "month", "year"] as ZoomLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          const adjusted = new Date(currentDate);

                          if (prevZoom.current !== "year") {
                            if (level === "week" && prevZoom.current !== "week")
                              adjusted.setDate(adjusted.getDate() + 6);
                            if (
                              level === "month" &&
                              prevZoom.current !== "month"
                            )
                              adjusted.setDate(adjusted.getDate() - 6);
                          }

                          setCurrentDate(adjusted);
                          setZoom(level);
                          prevZoom.current = level; // 👈 update previous zoom
                        }}
                        className={`px-2 py-1 rounded border capitalize ${
                          zoom === level
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter Toggle */}
                  <div className="relative pointer-events-auto">
                    <button
                      className={`px-2 py-1 rounded border bg-white text-gray-700 hover:bg-gray-100 ${
                        showFilter ? "ring-2 ring-blue-300" : ""
                      }`}
                      onClick={() => setShowFilter((prev) => !prev)}
                    >
                      Filter ⌄
                    </button>

                    {showFilter && (
                      <div className="absolute mt-1 bg-white border rounded shadow p-4 space-y-4 z-30 w-35 pointer-events-auto">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold text-gray-700">
                            Filters
                          </p>
                          <button
                            className="text-gray-500 text-lg hover:text-gray-800"
                            onClick={() => setShowFilter(false)}
                          >
                            ✕
                          </button>
                        </div>

                        {/* Importance */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Importance
                          </p>
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
                            <p className="text-xs text-gray-500 mb-1">
                              Categories
                            </p>
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
                    )}
                  </div>

                  {/* Delete All */}
                  <button
                    onClick={() => setShowDeleteAllModal(true)}
                    className="px-3 py-1 rounded pointer-events-auto bg-red-600 text-white hover:bg-red-700"
                  >
                    🗑️ Delete All
                  </button>

                  {/* Add Event */}
                  <button
                    onClick={() => {
                      setShowAddModal(true);
                      resetForm();
                    }}
                    className="px-3 py-1 rounded pointer-events-auto bg-blue-600 text-white hover:bg-blue-700"
                  >
                    + Add
                  </button>
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
                      className={`${
                        isLabelRow
                          ? "bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center px-2 py-3"
                          : "bg-white"
                      }`}
                      style={{
                        gridRow: row,
                        gridColumn: col,
                      }}
                    >
                      {isLabelRow && (
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="text-xs sm:text-sm font-medium text-gray-800 text-center leading-snug tracking-tight">
                            {zoom === "year"
                              ? zoomConfig.formatLabel(null, col - 1)
                              : zoomConfig.formatLabel(
                                  new Date(
                                    zoomConfig.start.getTime() +
                                      (col - 1) *
                                        zoomConfig.daysPerColumn *
                                        86400000
                                  )
                                )}
                          </div>
                          {(() => {
                            const colIndex = col - 1;

                            if (zoom === "year") {
                              const monthRange = zoomConfig.months[colIndex];
                              if (!monthRange) return null;

                              const { start: monthStart, end: monthEnd } =
                                monthRange;

                              const eventsInMonth = filteredEvents.filter(
                                (e) => {
                                  const eventStart = parseLocalDate(e.start);
                                  const eventEnd = parseLocalDate(e.end);
                                  return (
                                    eventStart <= monthEnd &&
                                    eventEnd >= monthStart
                                  );
                                }
                              );

                              const overflowCount =
                                eventsInMonth.length > 6
                                  ? eventsInMonth.length - 6
                                  : 0;

                              if (overflowCount > 0) {
                                return (
                                  <button
                                    className="text-[10px] text-blue-600 font-medium underline"
                                    onClick={() => {
                                      setOverflowEvents(eventsInMonth);
                                      setOverflowLabel(
                                        monthStart.toLocaleDateString("en-US", {
                                          month: "short",
                                          year: "numeric",
                                        })
                                      );
                                    }}
                                  >
                                    +{overflowCount} more
                                  </button>
                                );
                              }
                            } else {
                              const columnStart = new Date(
                                zoomConfig.start.getTime() +
                                  colIndex * zoomConfig.daysPerColumn * 86400000
                              );
                              const columnEnd = new Date(
                                columnStart.getTime() +
                                  zoomConfig.daysPerColumn * 86400000
                              );

                              const eventsInCol = filteredEvents.filter((e) => {
                                const eventStart = parseLocalDate(e.start);
                                const eventEnd = parseLocalDate(e.end);
                                return (
                                  eventStart < columnEnd &&
                                  eventEnd >= columnStart
                                );
                              });

                              const overflowCount =
                                eventsInCol.length > 6
                                  ? eventsInCol.length - 6
                                  : 0;

                              if (overflowCount > 0) {
                                return (
                                  <button
                                    className="text-[10px] text-blue-600 font-medium underline"
                                    onClick={() => {
                                      setOverflowEvents(eventsInCol);
                                      if (zoom === "month") {
                                        const columnStartStr =
                                          columnStart.toLocaleDateString(
                                            "en-US",
                                            {
                                              month: "long",
                                              day: "numeric",
                                            }
                                          );

                                        const columnEnd = new Date(
                                          columnStart.getTime() +
                                            zoomConfig.daysPerColumn *
                                              86400000 -
                                            86400000
                                        );

                                        const columnEndStr =
                                          columnEnd.toLocaleDateString(
                                            "en-US",
                                            {
                                              month: "long",
                                              day: "numeric",
                                            }
                                          );

                                        setOverflowLabel(
                                          `${columnStartStr} – ${columnEndStr}`
                                        );
                                      } else {
                                        setOverflowLabel(
                                          zoomConfig.formatLabel(columnStart)
                                        );
                                      }
                                    }}
                                  >
                                    +{overflowCount} more
                                  </button>
                                );
                              }
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
                          row >= 7
                            ? "center bottom"
                            : col + span + 1 >= 7
                            ? "right center"
                            : "center",
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

      {showDeleteAllModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-black">
                Confirm Delete All
              </h3>
              <p className="text-sm text-gray-700 mb-6">
                Are you sure you want to delete <strong>all events</strong> in
                this case? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setIsDeletingAll(true);
                    try {
                      await Promise.all(
                        events.map((event) => deleteTimelineEvent(event.id))
                      );
                      queryClient.invalidateQueries({
                        queryKey: ["timeline", caseId],
                      });
                      setToastMessage("All events deleted ✅");
                    } catch (err) {
                      setToastMessage(
                        err instanceof Error
                          ? err.message
                          : "Failed to delete all events"
                      );
                    } finally {
                      setIsDeletingAll(false);
                      setShowDeleteAllModal(false);
                    }
                  }}
                  disabled={isDeletingAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeletingAll ? "Deleting..." : "Yes, Delete All"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

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
                      <option value="low">🟩 Low</option>
                      <option value="medium">🟨 Medium</option>
                      <option value="high">🟧 High</option>
                      <option value="critical">🟥 Critical</option>
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
                    <option value="low">🟩 Low</option>
                    <option value="medium">🟨 Medium</option>
                    <option value="high">🟧 High</option>
                    <option value="critical">🟥 Critical</option>
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

              {/* Related Documents (Static for now) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Related Documents
                </label>
                <ul className="text-sm text-blue-600 underline space-y-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => alert("TODO: link to document")}
                      className="hover:text-blue-800"
                    >
                      📄 Placeholder Doc 1
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => alert("TODO: link to document")}
                      className="hover:text-blue-800"
                    >
                      📄 Placeholder Doc 2
                    </button>
                  </li>
                </ul>
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

      {/* Overflow Events Modal */}
      {overflowEvents &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/40 px-4 py-8 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-auto p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Events on {overflowLabel}
                </h2>
                <button
                  onClick={() => setOverflowEvents(null)}
                  className="text-gray-600 text-2xl hover:text-gray-900"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {overflowEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event);
                      setEditableEvent(event);
                      setShowEventModal(true);
                      setOverflowEvents(null);
                    }}
                    className={`rounded border-2 p-4 cursor-pointer transition hover:scale-[1.01] ${getImportanceColor(
                      event.importance
                    )}`}
                  >
                    <div className="text-sm font-semibold text-white mb-2 whitespace-pre-wrap break-words">
                      {getCategoryEmoji(event.category)}{" "}
                      {formatCategoryName(event.category)}: {event.title}
                    </div>
                    <div className="text-sm text-white whitespace-pre-wrap break-words">
                      {event.description}
                    </div>
                  </div>
                ))}

                {overflowEvents.length === 0 && (
                  <p className="text-gray-500 text-sm">No events found.</p>
                )}
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
