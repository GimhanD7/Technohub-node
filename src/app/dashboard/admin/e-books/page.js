"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button";
import { CustomDialog } from "@/components/ui/CustomDialog";
import {
  AlertCircle,
  ArrowUpToLine,
  BookOpen,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Unlock,
  Lock,
  X,
} from "lucide-react";
import { Upload } from "lucide-react";

const initialForm = {
  title: "",
  author: "",
  subject: "",
  category: "E-Book",
  level: "Advanced Level",
  description: "",
  fileUrl: "",
  coverUrl: "",
  fileType: "",
  fileSize: "",
  isFeatured: false,
  isPublished: true,
};

const ApprovalBadge = ({ status }) => {
  const map = {
    pending:  { bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400", label: "Pending" },
    approved: { bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400", label: "Approved" },
    rejected: { bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400", label: "Rejected" },
  };
  const s = map[status] || map.approved;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider ${s.bg}`}>{s.label}</span>;
};

function formatFileSize(size) {
  if (!size) return "External";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getResourceHref(fileUrl) {
  if (!fileUrl) return "#";
  if (fileUrl.startsWith("http")) return fileUrl;
  return `${API_BASE_URL.replace('/api', '')}${fileUrl}`;
}

export default function AdminEBooksPage() {
  const [user] = useState(() => {
    if (typeof window === "undefined") return null;
    const savedUser = localStorage.getItem("techno_hub_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'info', title: '', message: '', isAlertOnly: false, onConfirm: null, onCancel: null });

  const stats = useMemo(() => {
    const published = resources.filter((item) => item.isPublished).length;
    const featured  = resources.filter((item) => item.isFeatured).length;
    const pending   = resources.filter((item) => item.approvalStatus === "pending").length;
    const subjects  = new Set(resources.map((item) => item.subject).filter(Boolean)).size;
    return { published, featured, pending, subjects };
  }, [resources]);

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchApi("/ebook/list?role=admin");
    setIsLoading(false);

    if (data.success) {
      setResources(data.resources);
    } else {
      toast.error(data.message || "Failed to load e-book resources.");
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadResources();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadResources]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setSelectedFileName("");
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const uploadData = new FormData();
    uploadData.append("resource", file);

    try {
      const response = await fetch(`${API_BASE_URL}/ebook/upload`, {
        method: "POST",
        body: uploadData,
      });
      const data = await response.json();

      if (data.success) {
        setSelectedFileName(data.fileName);
        setForm((current) => ({
          ...current,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          fileSize: data.fileSize,
        }));
        toast.success("Resource file uploaded successfully!");
      } else {
        toast.error(data.message || "Upload failed.");
      }
    } catch (error) {
      toast.error("Upload failed. Please check that XAMPP Apache is running.");
    } finally {
      setIsUploading(false);
    }
  };


  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCoverUploading(true);

    const uploadData = new FormData();
    uploadData.append("resource", file);

    try {
      const response = await fetch(`${API_BASE_URL}/ebook/upload`, {
        method: "POST",
        body: uploadData,
      });
      const data = await response.json();

      if (data.success) {
        setForm((current) => ({ ...current, coverUrl: data.fileUrl }));
        toast.success("Cover image uploaded successfully!");
      } else {
        toast.error(data.message || "Upload failed.");
      }
    } catch (error) {
      toast.error("Upload failed.");
    } finally {
      setIsCoverUploading(false);
    }
  };

  const beginEditResource = (resource) => {
    setEditingId(resource.id);
    setSelectedFileName(resource.fileUrl ? "Current resource selected" : "");
    setForm({
      title: resource.title || "",
      author: resource.author || "",
      subject: resource.subject || "",
      category: resource.category || "E-Book",
      level: resource.level || "Advanced Level",
      description: resource.description || "",
      fileUrl: resource.fileUrl || "",
      coverUrl: resource.coverUrl || "",
      fileType: resource.fileType || "",
      fileSize: resource.fileSize || "",
      isFeatured: Boolean(resource.isFeatured),
      isPublished: Boolean(resource.isPublished),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveResource = async (event) => {
    event.preventDefault();

    if (!user) return;
    setIsSaving(true);

    const response = await fetchApi(editingId ? "/ebook/update" : "/ebook/create", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        resourceId: editingId,
        userId: user.id,
        role: user.role,
      }),
    });

    setIsSaving(false);

    if (response.success) {
      toast.success(response.message);
      resetForm();
      loadResources();
    } else {
      toast.error(response.message || "Failed to add resource.");
    }
  };

  const executeDeleteResource = async (resourceId) => {
    setIsDeletingId(resourceId);

    const response = await fetchApi("/ebook/delete", {
      method: "POST",
      body: JSON.stringify({
        resourceId,
        role: user.role,
      }),
    });

    setIsDeletingId(null);

    if (response.success) {
      if (editingId === resourceId) resetForm();
      toast.success(response.message);
      loadResources();
    } else {
      toast.error(response.message || "Failed to delete resource.");
    }
  };

  const handleDeleteResource = (resourceId) => {
    setDialogState({
      isOpen: true,
      type: 'warning',
      title: 'Delete E-Book Resource?',
      message: 'Are you sure you want to permanently delete this e-book resource from the library?',
      isAlertOnly: false,
      onConfirm: async () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        await executeDeleteResource(resourceId);
      },
      onCancel: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleApprove = async (resourceId) => {
    const res = await fetchApi("/ebook/approve", { method: "POST", body: JSON.stringify({ id: resourceId }) });
    if (res.success) { toast.success("Resource approved and published!"); loadResources(); }
    else toast.error(res.message || "Approval failed.");
  };

  const handleReject = (resourceId) => {
    let rejectionReason = "";
    setDialogState({
      isOpen: true, type: "warning", title: "Reject Resource",
      message: "Please provide a reason for rejection:",
      isAlertOnly: false,
      inputValue: "",
      showInput: true,
      onConfirm: async (reason) => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        if (!reason?.trim()) { toast.error("Rejection reason is required."); return; }
        const res = await fetchApi("/ebook/reject", { method: "POST", body: JSON.stringify({ id: resourceId, reason }) });
        if (res.success) { toast.success("Resource rejected successfully!"); loadResources(); }
        else toast.error(res.message || "Rejection failed.");
      },
      onCancel: () => setDialogState(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleToggleEditable = async (resourceId) => {
    const res = await fetchApi("/ebook/toggle_editable", { method: "POST", body: JSON.stringify({ id: resourceId }) });
    if (res.success) { toast.success(`Teacher edit ${res.teacherEditable ? "enabled" : "disabled"}!`); loadResources(); }
    else toast.error(res.message || "Toggle failed.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-[20px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            E-Book Library Manager
          </h1>
          <p className="text-xs text-gray-500 dark:text-white">Add and manage digital learning resources shown in the public e-book library.</p>
        </div>

        <div className="grid grid-cols-4 gap-3 min-w-[480px]">
          <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-white">Published</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.published}</p>
          </div>
          <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-white">Pending</p>
            <p className="text-xl font-bold text-amber-500">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-white">Featured</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.featured}</p>
          </div>
          <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-white">Subjects</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.subjects}</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-xl flex gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-xl flex gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="grid xl:grid-cols-[410px_1fr] gap-6 items-start">
        <form onSubmit={handleSaveResource} className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {editingId ? <Edit3 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
              {editingId ? "Edit Resource" : "Add Resource"}
            </h2>
            {editingId ? (
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-red-600">
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            ) : (
              <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white font-bold">Admin</span>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Title</label>
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Author</label>
              <input
                value={form.author}
                onChange={(event) => updateField("author", event.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Subject</label>
              <input
                value={form.subject}
                onChange={(event) => updateField("subject", event.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
              >
                <option>E-Book</option>
                <option>Revision Guide</option>
                <option>Workbook</option>
                <option>Past Paper</option>
                <option>Presentation</option>
                <option>Handout</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Level</label>
              <select
                value={form.level}
                onChange={(event) => updateField("level", event.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced Level</option>
                <option>Professional</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] resize-none"
            />
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-4">
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-2">Resource File</label>
            <label className="flex items-center justify-center gap-2 h-11 rounded-lg bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-white cursor-pointer hover:border-primary hover:text-primary transition-colors">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpToLine className="w-4 h-4" />}
              {selectedFileName || "Upload PDF, document, or image"}
              <input type="file" onChange={handleUpload} className="hidden" />
            </label>
            <input
              value={form.fileUrl}
              onChange={(event) => updateField("fileUrl", event.target.value)}
              placeholder="Or paste an external resource link"
              className="w-full mt-3 rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] bg-white dark:bg-[#1e293b]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Cover Image URL / File</label>
            <div className="flex gap-2">
              <input
                value={form.coverUrl}
                onChange={(event) => updateField("coverUrl", event.target.value)}
                placeholder="Image URL"
                className="flex-1 rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
              />
              <label className="flex items-center justify-center px-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-[12px] font-semibold text-slate-600 dark:text-white cursor-pointer hover:border-primary hover:text-primary transition-colors">
                {isCoverUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Upload</span>
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-white">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => updateField("isFeatured", event.target.checked)}
                className="rounded border-gray-300 dark:border-slate-700"
              />
              Featured
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => updateField("isPublished", event.target.checked)}
                className="rounded border-gray-300 dark:border-slate-700"
              />
              Published
            </label>
          </div>

          <button type="submit" disabled={isSaving || isUploading} className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isSaving ? "Saving..." : editingId ? "Update Resource" : "Add to Library"}
          </button>
        </form>

        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/40 dark:bg-slate-800/30">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Library Resources
            </h3>
            <button
              onClick={loadResources}
              className="text-xs text-primary font-medium hover:text-secondary flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload
            </button>
          </div>

          {isLoading ? (
            <div className="p-20 flex justify-center text-slate-500 dark:text-white">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-400 dark:text-white font-semibold">
                    <th className="pb-3">Resource</th>
                    <th className="pb-3">Subject</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr key={resource.id} className={`border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 ${editingId === resource.id ? "bg-primary/5 dark:bg-primary/20" : ""} ${resource.approvalStatus === "pending" ? "bg-amber-50/40 dark:bg-amber-900/10" : ""}`}>
                      <td className="py-4 pr-4 min-w-[260px]">
                        <p className="font-semibold text-slate-800 dark:text-white text-[13px]">{resource.title}</p>
                        <p className="text-[11px] text-slate-400">{resource.author || "No author"} · {formatFileSize(resource.fileSize)}</p>
                        {resource.creatorName && (
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">By: {resource.creatorName} ({resource.creatorRole})</p>
                        )}
                      </td>
                      <td className="py-4 text-[12px] text-slate-600 dark:text-white">
                        <p className="font-medium">{resource.subject}</p>
                        <p className="text-[10px] text-gray-400 dark:text-white">{resource.level}</p>
                      </td>
                      <td className="py-4 text-[12px] text-slate-600 dark:text-white">{resource.category}</td>
                      <td className="py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <ApprovalBadge status={resource.approvalStatus} />
                          {resource.isPublished && resource.approvalStatus === "approved" && <span className="text-[10px] font-bold text-green-600 dark:text-green-400">Live</span>}
                          {resource.isFeatured && <span className="text-[10px] font-bold text-amber-600">Featured</span>}
                          {resource.teacherEditable && <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400">Edit On</span>}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {/* Approve/Reject for pending */}
                          {resource.approvalStatus === "pending" && (
                            <>
                              <button onClick={() => handleApprove(resource.id)}
                                className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 rounded text-[10px] font-bold flex items-center gap-1 transition-colors" title="Approve">
                                <ShieldCheck className="w-3 h-3" /> Approve
                              </button>
                              <button onClick={() => handleReject(resource.id)}
                                className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded text-[10px] font-bold flex items-center gap-1 transition-colors" title="Reject">
                                <ShieldAlert className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}
                          {/* Toggle teacher editable (only for teacher-uploaded resources) */}
                          {resource.creatorRole === "teacher" && resource.approvalStatus === "approved" && (
                            <button onClick={() => handleToggleEditable(resource.id)}
                              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${resource.teacherEditable ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100" : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100"}`}
                              title={resource.teacherEditable ? "Lock teacher edit" : "Allow teacher edit"}>
                              {resource.teacherEditable ? <><Unlock className="w-3 h-3" /> Lock Edit</> : <><Lock className="w-3 h-3" /> Allow Edit</>}
                            </button>
                          )}
                          <a href={getResourceHref(resource.fileUrl)} target="_blank" rel="noreferrer"
                            className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors inline-flex items-center" title="Open resource">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button onClick={() => beginEditResource(resource)}
                            className="p-1.5 bg-primary/5 text-primary hover:bg-primary/10 rounded transition-colors inline-flex items-center" title="Edit resource">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteResource(resource.id)} disabled={isDeletingId === resource.id}
                            className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors inline-flex items-center disabled:opacity-50" title="Delete resource">
                            {isDeletingId === resource.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {resources.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-xs text-gray-400 dark:text-white">
                        No e-book resources have been added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <CustomDialog {...dialogState} />
    </div>
  );
}
