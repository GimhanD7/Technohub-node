"use client";

import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Tags, Plus, Trash2, Edit3, Loader2, AlertTriangle } from "lucide-react";
import { CustomDialog } from "@/components/ui/CustomDialog";

export default function CourseCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'info', title: '', message: '', isAlertOnly: false, onConfirm: null, onCancel: null });

  const showAlert = (title, message, type = 'error') => {
    if (type === 'error') {
      toast.error(`${title}: ${message}`);
    } else if (type === 'success') {
      toast.success(`${title}: ${message}`);
    } else {
      toast(`${title}: ${message}`);
    }
  };

  const loadCategories = async () => {
    setIsLoading(true);
    const data = await fetchApi("/course/manage_categories");
    if (data.success) {
      setCategories(data.categories || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    const user = JSON.parse(localStorage.getItem("techno_hub_user"));
    
    const method = editCategoryId ? "PUT" : "POST";
    const body = editCategoryId 
      ? { id: editCategoryId, name: newCategoryName, user_id: user?.id }
      : { name: newCategoryName, user_id: user?.id };

    const data = await fetchApi("/course/manage_categories", {
      method,
      body: JSON.stringify(body)
    });

    if (data.success) {
      showAlert("Success", editCategoryId ? "Category updated successfully" : "Category added successfully", "success");
      setNewCategoryName("");
      setEditCategoryId(null);
      setShowAddModal(false);
      loadCategories();
    } else {
      showAlert("Error", data.message || (editCategoryId ? "Failed to update category" : "Failed to add category"), "error");
    }
    setIsSubmitting(false);
  };

  const openEditModal = (cat) => {
    setEditCategoryId(cat.id);
    setNewCategoryName(cat.name);
    setShowAddModal(true);
  };

  const handleDelete = (id, name) => {
    setDialogState({
      isOpen: true,
      type: "warning",
      title: "Delete Category",
      message: `Are you sure you want to delete the category "${name}"? This cannot be undone.`,
      isAlertOnly: false,
      onConfirm: async () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        const user = JSON.parse(localStorage.getItem("techno_hub_user"));
        const data = await fetchApi("/course/manage_categories", {
          method: "DELETE",
          body: JSON.stringify({ id, user_id: user?.id })
        });
        if (data.success) {
          showAlert("Deleted", "Category deleted successfully.", "success");
          loadCategories();
        } else {
          showAlert("Error", data.message || "Failed to delete category.", "error");
        }
      },
      onCancel: () => setDialogState(prev => ({ ...prev, isOpen: false }))
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      <CustomDialog {...dialogState} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Tags className="w-6 h-6 text-primary" /> Course Categories
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-1">Manage global categories used to group courses.</p>
        </div>
        <button 
          onClick={() => { setEditCategoryId(null); setNewCategoryName(""); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded shadow-sm hover:bg-primary/90 text-[13px] font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 sticky top-0 z-10">
                <th className="py-3 px-5 font-bold w-16">ID</th>
                <th className="py-3 px-5 font-bold">Category Name</th>
                <th className="py-3 px-5 font-bold">Slug</th>
                <th className="py-3 px-5 font-bold">Created At</th>
                <th className="py-3 px-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-600 dark:text-slate-300 divide-y divide-gray-100 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500 dark:text-slate-400 italic">No categories found. Click "Add Category" to create one.</td>
                </tr>
              ) : (
                categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs">{cat.id}</td>
                    <td className="py-3 px-5 font-semibold text-slate-800 dark:text-white">{cat.name}</td>
                    <td className="py-3 px-5 text-gray-500 dark:text-slate-400">{cat.slug}</td>
                    <td className="py-3 px-5 whitespace-nowrap">{new Date(cat.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-5 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Edit Category"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-white">{editCategoryId ? "Edit Category" : "Add New Category"}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider mb-1.5">Category Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Information Technology"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-gray-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a] dark:text-white"
                />
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5 flex items-start gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Note: Deleting a category later will fail if it's already used by courses.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors focus:outline-none">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors disabled:opacity-70 focus:outline-none">
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (editCategoryId ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />)}
                  {editCategoryId ? "Save Changes" : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
