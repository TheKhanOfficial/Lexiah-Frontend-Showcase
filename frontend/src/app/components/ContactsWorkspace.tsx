"use client";
// app/components/ContactsWorkspace.tsx

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { supabase, deleteAllContacts } from "@/utils/supabase";
import { useRef, useEffect } from "react";

// Types
interface Contact {
  id: string;
  case_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
}

interface ContactsWorkspaceProps {
  userId: string;
  caseId: string;
}

// Supabase functions
async function fetchContacts(caseId: string): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function createContact(
  contactData: Omit<Contact, "id" | "created_at">
): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .insert([
      {
        ...contactData,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateContact(
  id: string,
  updates: Partial<Omit<Contact, "id" | "created_at">>
): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from("contacts").delete().eq("id", id);

  if (error) throw error;
}

export default function ContactsWorkspace({
  userId,
  caseId,
}: ContactsWorkspaceProps) {
  const queryClient = useQueryClient();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", caseId],
    queryFn: () => fetchContacts(caseId),
    enabled: !!caseId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", caseId] });
      setShowAddModal(false);
      resetForm();
      setError(null);
    },
    onError: (err) => {
      console.error("❌ Contact creation error:", err);
      setError(err instanceof Error ? err.message : "Failed to create contact");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Contact, "id" | "created_at">>;
    }) => updateContact(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", caseId] });
      setShowEditModal(false);
      setEditingContact(null);
      resetForm();
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to update contact");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", caseId] });
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to delete contact");
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => deleteAllContacts(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", caseId] });
      setError(null);
    },
    onError: (err) => {
      setError(
        err instanceof Error ? err.message : "Failed to delete all contacts"
      );
    },
    onSettled: () => {
      // ✅ always close modal after mutation is finished
      setShowDeleteAllModal(false);
    },
  });

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
  };

  const handleAddContact = () => {
    setShowAddModal(true);
    resetForm();
    setError(null);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone || "",
      email: contact.email || "",
      address: contact.address || "",
      notes: contact.notes || "",
    });
    setShowEditModal(true);
    setError(null);
  };

  const handleDeleteContact = (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    createMutation.mutate({
      case_id: caseId,
      name: formData.name.trim(),
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      notes: formData.notes.trim() || null,
    });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || !formData.name.trim()) {
      setError("Name is required");
      return;
    }

    updateMutation.mutate({
      id: editingContact.id,
      updates: {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
      },
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
        <div className="flex space-x-3">
          <button
            onClick={handleAddContact}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Contact
          </button>
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-[#f9fafb] rounded-lg hover:bg-red-700transition-colors"
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

      {/* Contacts table */}
      {contacts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            No contacts yet. Add your first contact to get started.
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
          <div className="min-w-[900px] bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Address</div>
              <div className="col-span-1">Notes</div>
              <div className="col-span-1">Actions</div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-gray-200">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-3">
                    <span className="font-medium text-gray-900 truncate block">
                      {contact.name}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 break-words whitespace-normal block">
                      {contact.phone || "—"}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-gray-600 break-words whitespace-normal block">
                      {contact.email || "—"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 text-sm break-words whitespace-normal block">
                      {contact.address || "—"}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-gray-600 text-sm whitespace-pre-wrap break-words block">
                      {contact.notes || "—"}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
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

      {/* Add Contact Modal */}
      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Add New Contact</h3>
              <form onSubmit={handleSubmitAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
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
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    disabled={createMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isPending ? "Adding..." : "Add Contact"}
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

      {/* Edit Contact Modal */}
      {showEditModal &&
        editingContact &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Edit Contact</h3>
              <form onSubmit={handleSubmitEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
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
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    disabled={updateMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateMutation.isPending
                      ? "Updating..."
                      : "Update Contact"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingContact(null);
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
      {showDeleteModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Delete Contact
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this contact? This action
                  cannot be undone.
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
      {showDeleteAllModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Delete All Contacts
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>ALL contacts</strong>{" "}
                  for this case? This action cannot be undone.
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
                    className="px-4 py-2 bg-red-600 text-[#f9fafb] rounded-full hover:bg-red-700 font-medium"
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
