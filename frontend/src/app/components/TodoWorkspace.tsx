"use client";
// app/components/TodoWorkspace.tsx

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { supabase } from "@/utils/supabase";

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

interface TodoWorkspaceProps {
  userId: string;
  caseId: string;
}

type UrgencyColor = "green" | "yellow" | "red" | "darkred";
type SortOption = "urgency" | "date";

// Supabase functions
async function fetchTasks(caseId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function createTask(
  taskData: Omit<Task, "id" | "created_at">
): Promise<Task> {
  // Sanitize inputs
  const payload = {
    ...taskData,
    due_date: taskData.due_date ?? null,
    manual_color: taskData.manual_color ?? null,
    completed: taskData.completed ?? false,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateTask(
  id: string,
  updates: Partial<Omit<Task, "id" | "created_at">>
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

async function deleteAllTasks(caseId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("case_id", caseId);
  if (error) throw error;
}

// Helper functions
function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(task: Task): UrgencyColor {
  if (task.completed) return "green"; // Will be rendered as gray/empty

  if (!task.due_date || task.auto_urgency === false) {
    return task.manual_color || "green";
  }

  const daysUntil = getDaysUntilDue(task.due_date);

  if (daysUntil <= 0) return "darkred"; // Today or overdue
  if (daysUntil <= 2) return "red"; // 1-2 days
  if (daysUntil <= 5) return "yellow"; // 3-5 days
  return "green"; // >5 days
}

function getUrgencyOrder(color: UrgencyColor): number {
  switch (color) {
    case "darkred":
      return 0;
    case "red":
      return 1;
    case "yellow":
      return 2;
    case "green":
      return 3;
    default:
      return 4;
  }
}

function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  return [...tasks].sort((a, b) => {
    // Completed tasks always go to bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    if (sortBy === "urgency") {
      const aColor = getUrgencyColor(a);
      const bColor = getUrgencyColor(b);
      const aOrder = getUrgencyOrder(aColor);
      const bOrder = getUrgencyOrder(bColor);

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      // Same urgency - sort by due date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }

      // Tasks with due dates come before tasks without
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;

      return 0;
    }

    // Sort by date
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;
    return 0;
  });
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;

  return date.toLocaleDateString();
}

export default function TodoWorkspace({ userId, caseId }: TodoWorkspaceProps) {
  const queryClient = useQueryClient();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    due_date: "",
    auto_urgency: true,
  });

  // UI states
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("urgency");

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", caseId],
    queryFn: () => fetchTasks(caseId),
    enabled: !!caseId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", caseId] });
      setShowAddModal(false);
      resetForm();
      setError(null);
    },
    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? (err as any).message
          : JSON.stringify(err)
      );
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Task, "id" | "created_at">>;
    }) => updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", caseId] });
      setShowEditModal(false);
      setEditingTask(null);
      resetForm();
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to update task");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", caseId] });
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => deleteAllTasks(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", caseId] });
      setError(null);
    },
    onError: (err) => {
      setError(
        err instanceof Error ? err.message : "Failed to delete all tasks"
      );
    },
    onSettled: () => {
      setShowDeleteAllModal(false);
    },
  });

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: "",
      due_date: "",
      auto_urgency: false,
    });
  };

  const handleAddTask = () => {
    setShowAddModal(true);
    resetForm();
    setError(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      due_date: task.due_date || "",
      auto_urgency: task.auto_urgency ?? !!task.due_date,
    });
    setShowEditModal(true);
    setError(null);
  };

  const handleDeleteTask = (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Task name is required");
      return;
    }

    console.log("Creating task with:", {
      case_id: caseId,
      name: formData.name.trim(),
      due_date: formData.due_date || null,
      completed: false,
      manual_color: null,
    });

    createMutation.mutate({
      case_id: caseId,
      name: formData.name.trim(),
      due_date: formData.due_date || null,
      completed: false,
      manual_color: null,
      auto_urgency: !!formData.due_date,
    });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !formData.name.trim()) {
      setError("Task name is required");
      return;
    }

    updateMutation.mutate({
      id: editingTask.id,
      updates: {
        name: formData.name.trim(),
        due_date: formData.due_date || null,
        auto_urgency: formData.auto_urgency,
      },
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTaskComplete = (task: Task) => {
    updateMutation.mutate({
      id: task.id,
      updates: { completed: !task.completed },
    });
  };

  const cycleManualColor = (task: Task) => {
    if (task.completed || (task.due_date && task.auto_urgency)) return;

    const colors: UrgencyColor[] = ["green", "yellow", "red", "darkred"];
    const currentIndex = colors.indexOf(task.manual_color || "green");
    const nextColor = colors[(currentIndex + 1) % colors.length];

    updateMutation.mutate({
      id: task.id,
      updates: { manual_color: nextColor },
    });
  };

  const renderUrgencyBox = (task: Task) => {
    const color = getUrgencyColor(task);

    let bgColor = "";
    let onClick: (() => void) | undefined = undefined;

    if (task.completed) {
      bgColor = "bg-gray-300";
    } else {
      switch (color) {
        case "green":
          bgColor = "bg-green-400";
          break;
        case "yellow":
          bgColor = "bg-yellow-300";
          break;
        case "red":
          bgColor = "bg-orange-400";
          break;
        case "darkred":
          bgColor = "bg-red-800";
          break;
      }

      // Allow clicking only if no due date (manual color mode)
      if (!task.completed && (!task.auto_urgency || !task.due_date)) {
        onClick = () => cycleManualColor(task);
      }
    }

    return (
      <div
        className={`w-6 h-6 rounded ${bgColor} ${
          onClick ? "cursor-pointer hover:opacity-80" : ""
        }`}
        onClick={onClick}
        title={
          task.completed
            ? "Task completed"
            : task.due_date
            ? `Auto-colored based on due date`
            : "Click to change color"
        }
      />
    );
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const sortedTasks = sortTasks(tasks, sortBy);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">To-Do List</h2>
        <div className="flex items-center space-x-3">
          {/* Sort control */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="urgency">Urgency</option>
              <option value="date">Due Date</option>
            </select>
          </div>

          <button
            onClick={handleAddTask}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Task
          </button>
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            disabled={deleteAllMutation.isPending}
          >
            {deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Tasks table */}
      {sortedTasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            No tasks yet. Add your first task to get started.
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="overflow-x-auto whitespace-nowrap"
          style={{ maxWidth: "100%", overflowY: "hidden" }}
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.preventDefault();
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
        >
          <div className="min-w-[800px] bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
              <div className="col-span-1">Complete</div>
              <div className="col-span-5">Task Name</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-2">Urgency</div>
              <div className="col-span-2">Actions</div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-gray-200">
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskComplete(task)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="col-span-5">
                    <span
                      className={`font-medium ${
                        task.completed
                          ? "text-gray-500 line-through"
                          : "text-gray-900"
                      } block break-words whitespace-normal
`}
                    >
                      {task.name}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`text-sm ${
                        task.completed ? "text-gray-400" : "text-gray-600"
                      } break-words whitespace-normal block`}
                    >
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    {renderUrgencyBox(task)}
                  </div>
                  <div className="col-span-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
              <form onSubmit={handleSubmitAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date (optional)
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isPending ? "Adding..." : "Add Task"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={createMutation.isPending}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Edit Task Modal */}
      {showEditModal &&
        editingTask &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Edit Task</h3>
              <form onSubmit={handleSubmitEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date (optional)
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {formData.due_date && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoUrgency"
                      name="auto_urgency"
                      checked={formData.auto_urgency}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          auto_urgency: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="autoUrgency"
                      className="text-sm text-gray-700"
                    >
                      Automatically set urgency based on due date
                    </label>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? "Updating..." : "Update Task"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingTask(null);
                    }}
                    disabled={updateMutation.isPending}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Task Modal */}
      {showDeleteModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Delete Task
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this task? This action cannot
                  be undone.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (pendingDeleteId) {
                        deleteMutation.mutate(pendingDeleteId);
                        setShowDeleteModal(false);
                        setPendingDeleteId(null);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete All Tasks Modal */}
      {showDeleteAllModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Delete All Tasks
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>ALL tasks</strong> for
                  this case? This action cannot be undone.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteAllModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 font-medium"
                    disabled={deleteAllMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteAllMutation.mutate()}
                    className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 font-medium"
                    disabled={deleteAllMutation.isPending}
                  >
                    {deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
