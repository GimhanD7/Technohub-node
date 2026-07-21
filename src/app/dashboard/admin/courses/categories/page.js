"use client";

import { toast } from "react-hot-toast";
import { useState, useEffect, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { Tags, Plus, Trash2, Edit3, Loader2, AlertTriangle, Search, RefreshCw, BookOpen, FolderOpen, CalendarDays, X, ArrowUpDown } from "lucide-react";
import { CustomDialog } from "@/components/ui/CustomDialog";

export default function CourseCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  
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
    const loadTimer = window.setTimeout(loadCategories, 0);
    return () => window.clearTimeout(loadTimer);
  }, []);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(query) || category.slug.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const totalAssignedCourses = useMemo(() => (
    categories.reduce((total, category) => total + (category.course_count || 0), 0)
  ), [categories]);

  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((first, second) => {
      let firstValue = first[sortConfig.key];
      let secondValue = second[sortConfig.key];

      if (sortConfig.key === "course_count") {
        firstValue = firstValue || 0;
        secondValue = secondValue || 0;
      } else if (sortConfig.key === "created_at") {
        firstValue = new Date(firstValue).getTime();
        secondValue = new Date(secondValue).getTime();
      } else {
        firstValue = String(firstValue || "").toLowerCase();
        secondValue = String(secondValue || "").toLowerCase();
      }

      if (firstValue === secondValue) return 0;
      const result = firstValue > secondValue ? 1 : -1;
      return sortConfig.direction === "asc" ? result : -result;
    });
  }, [filteredCategories, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCategories();
    setIsRefreshing(false);
  };

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
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12">
      <CustomDialog {...dialogState} />

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-primary/90 px-6 py-7 sm:px-8 text-white shadow-lg">
        <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/15">
            <Tags className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Course Categories
          </h1>
          <p className="text-[13px] text-slate-200 mt-1 max-w-xl">Create a clean course structure so learners can find the right content quickly.</p>
        </div>
        <button 
          onClick={() => { setEditCategoryId(null); setNewCategoryName(""); setShowAddModal(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-900 rounded-xl shadow-sm hover:bg-slate-100 text-[13px] font-bold transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-5 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><FolderOpen className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-slate-900 dark:text-white">{categories.length}</p><p className="text-[12px] text-slate-500 dark:text-slate-400">Total categories</p></div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-5 shadow-sm flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><BookOpen className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-slate-900 dark:text-white">{totalAssignedCourses}</p><p className="text-[12px] text-slate-500 dark:text-slate-400">Categorized courses</p></div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 min-h-[420px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div><h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Category library</h2><p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{filteredCategories.length} of {categories.length} categories</p></div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search categories..." className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-[13px] outline-none focus:border-primary dark:text-white" />
            </div>
            <button onClick={handleRefresh} disabled={isRefreshing} title="Refresh categories" className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} /></button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="w-7 h-7 text-primary animate-spin" /></div>
        ) : filteredCategories.length === 0 ? (
          <div className="h-64 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center px-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3"><Tags className="w-5 h-5 text-slate-400" /></div>
            <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">{searchQuery ? "No matching categories" : "No categories yet"}</p>
            <p className="text-[12px] text-slate-500 mt-1">{searchQuery ? "Try another name or slug." : "Add your first category to organize courses."}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="w-20 px-5 py-3.5">No.</th>
                    {[
                      ["name", "Category"],
                      ["slug", "Slug"],
                      ["course_count", "Courses"],
                      ["created_at", "Created"]
                    ].map(([key, label]) => (
                      <th key={key} className="px-5 py-3.5">
                        <button type="button" onClick={() => handleSort(key)} className={`inline-flex items-center gap-1.5 hover:text-primary transition-colors ${sortConfig.key === key ? "text-primary" : ""}`}>
                          {label}
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      </th>
                    ))}
                    <th className="w-28 px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedCategories.map((cat, index) => (
                    <tr key={cat.id} className="group bg-white dark:bg-[#0f172a] hover:bg-primary/[0.035] dark:hover:bg-primary/5 transition-colors">
                      <td className="px-5 py-4">
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-primary/10 px-2 text-[12px] font-bold text-primary">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"><Tags className="w-4 h-4" /></div>
                          <div>
                            <p className="text-[13px] font-bold text-slate-900 dark:text-white">{cat.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Category ID: {cat.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><code className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[11px] text-slate-600 dark:text-slate-300">/{cat.slug}</code></td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <BookOpen className="w-3.5 h-3.5" /> {cat.course_count || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400"><CalendarDays className="w-3.5 h-3.5" /> {new Date(cat.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(cat)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title={`Edit ${cat.name}`} aria-label={`Edit ${cat.name}`}><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(cat.id, cat.name)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title={`Delete ${cat.name}`} aria-label={`Delete ${cat.name}`}><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-white">{editCategoryId ? "Edit Category" : "Add New Category"}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
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
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Note: Deleting a category later will fail if it&apos;s already used by courses.
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
