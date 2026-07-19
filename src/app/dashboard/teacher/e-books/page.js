"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";
import {
  AlertCircle, ArrowUpToLine, BookOpen, CheckCircle2, Clock, Edit3,
  ExternalLink, FileText, Info, Loader2, Lock, Plus, RefreshCw,
  Save, ShieldAlert, Trash2, Unlock, X, XCircle,
} from "lucide-react";

const initialForm = {
  title: "", author: "", subject: "", category: "E-Book",
  level: "Advanced Level", description: "", fileUrl: "", coverUrl: "",
  fileType: "", fileSize: "",
};

function formatFileSize(size) {
  if (!size) return "External";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getResourceHref(fileUrl) {
  if (!fileUrl) return "#";
  if (fileUrl.startsWith("http")) return fileUrl;
  return `${API_BASE_URL.replace("/api", "")}${fileUrl}`;
}

const StatusBadge = ({ status }) => {
  const map = {
    pending:  { bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400", label: "Pending" },
    approved: { bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400", label: "Approved" },
    rejected: { bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400", label: "Rejected" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider ${s.bg}`}>
      {s.label}
    </span>
  );
};

export default function TeacherEBooksPage() {
  const [user] = useState(() => {
    if (typeof window === "undefined") return null;
    const s = localStorage.getItem("techno_hub_user");
    return s ? JSON.parse(s) : null;
  });

  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [dialogState, setDialogState] = useState({ isOpen: false, type: "info", title: "", message: "", isAlertOnly: false, onConfirm: null, onCancel: null });

  const stats = useMemo(() => {
    const approved = resources.filter(r => r.approvalStatus === "approved").length;
    const pending  = resources.filter(r => r.approvalStatus === "pending").length;
    const rejected = resources.filter(r => r.approvalStatus === "rejected").length;
    return { approved, pending, rejected, total: resources.length };
  }, [resources]);

  const loadResources = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg("");
    const data = await fetchApi(`/ebook/list?role=teacher&teacher_id=${user.id}`);
    setIsLoading(false);
    if (data.success) setResources(data.resources);
    else setErrorMsg(data.message || "Failed to load resources.");
  }, [user]);

  useEffect(() => {
    const t = window.setTimeout(() => loadResources(), 0);
    return () => window.clearTimeout(t);
  }, [loadResources]);

  const updateField = (field, value) => setForm(c => ({ ...c, [field]: value }));
  const resetForm = () => { setForm(initialForm); setEditingId(null); setSelectedFileName(""); setShowForm(false); };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setErrorMsg("");
    const uploadData = new FormData();
    uploadData.append("resource", file);
    try {
      const response = await fetch(`${API_BASE_URL}/ebook/upload`, { method: "POST", body: uploadData });
      const data = await response.json();
      if (data.success) {
        setSelectedFileName(data.fileName);
        setForm(c => ({ ...c, fileUrl: data.fileUrl, fileType: data.fileType, fileSize: data.fileSize }));
      } else setErrorMsg(data.message || "Upload failed.");
    } catch { setErrorMsg("Upload failed."); }
    finally { setIsUploading(false); }
  };

  const beginEdit = (resource) => {
    if (!resource.teacherEditable) {
      setDialogState({
        isOpen: true, type: "warning", title: "Edit Not Allowed",
        message: "The admin has not granted edit permission for this resource. You can request the admin to enable editing.",
        isAlertOnly: true,
        onCancel: () => setDialogState(s => ({ ...s, isOpen: false }))
      });
      return;
    }
    setEditingId(resource.id);
    setSelectedFileName(resource.fileUrl ? "Current resource" : "");
    setForm({
      title: resource.title || "", author: resource.author || "",
      subject: resource.subject || "", category: resource.category || "E-Book",
      level: resource.level || "Advanced Level", description: resource.description || "",
      fileUrl: resource.fileUrl || "", coverUrl: resource.coverUrl || "",
      fileType: resource.fileType || "", fileSize: resource.fileSize || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true); setErrorMsg(""); setSuccessMsg("");
    const res = await fetchApi(editingId ? "/ebook/update" : "/ebook/create", {
      method: "POST",
      body: JSON.stringify({ ...form, resourceId: editingId, userId: user.id, role: "teacher" }),
    });
    setIsSaving(false);
    if (res.success) {
      setSuccessMsg(res.message);
      resetForm();
      loadResources();
      setTimeout(() => setSuccessMsg(""), 4000);
    } else setErrorMsg(res.message || "Failed to save resource.");
  };

  const confirmDelete = (resourceId) => {
    setDialogState({
      isOpen: true, type: "warning", title: "Delete Resource?",
      message: "Are you sure you want to permanently delete this resource?",
      isAlertOnly: false,
      onConfirm: async () => { setDialogState(p => ({ ...p, isOpen: false })); await executeDelete(resourceId); },
      onCancel: () => setDialogState(p => ({ ...p, isOpen: false }))
    });
  };

  const executeDelete = async (resourceId) => {
    setIsDeletingId(resourceId);
    const res = await fetchApi("/ebook/delete", {
      method: "POST",
      body: JSON.stringify({ id: resourceId, role: "teacher", userId: user.id }),
    });
    setIsDeletingId(null);
    if (res.success) { setSuccessMsg("Resource deleted."); loadResources(); setTimeout(() => setSuccessMsg(""), 3000); }
    else setErrorMsg(res.message || "Delete failed.");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-[20px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            My E-Book Library
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Submit resources for admin approval. Approved resources will be visible in the public e-book library.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Approved", value: stats.approved, color: "text-green-600" },
              { label: "Pending",  value: stats.pending,  color: "text-amber-600" },
              { label: "Rejected", value: stats.rejected, color: "text-red-500" },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg p-3 text-center min-w-[80px]">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-slate-400">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); setSelectedFileName(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Resource
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl flex gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium rounded-xl flex gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" /> {successMsg}
        </div>
      )}

      {/* Info banner about pending workflow */}
      <div className="flex gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-xs">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>Resources you submit will be marked <strong>Pending</strong> until an admin reviews and approves them. Once approved they appear in the public E-Book Library. If rejected, you can see the reason below. Editing is only possible if the admin enables it for that resource.</p>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {editingId ? <Edit3 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
              {editingId ? "Edit Resource" : "Submit New Resource"}
              {editingId && <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">Saving will reset to Pending review</span>}
            </h2>
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Title *</label>
            <input value={form.title} onChange={e => updateField("title", e.target.value)} required
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Author</label>
              <input value={form.author} onChange={e => updateField("author", e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Subject *</label>
              <input value={form.subject} onChange={e => updateField("subject", e.target.value)} required
                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <select value={form.category} onChange={e => updateField("category", e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white">
                {["E-Book","Revision Guide","Workbook","Past Paper","Presentation","Handout"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Level</label>
              <select value={form.level} onChange={e => updateField("level", e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white">
                {["Beginner","Intermediate","Advanced Level","Professional"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => updateField("description", e.target.value)} rows={3}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white resize-none" />
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-4">
            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Resource File *</label>
            <label className="flex items-center justify-center gap-2 h-11 rounded-lg bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:border-primary hover:text-primary transition-colors">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpToLine className="w-4 h-4" />}
              {selectedFileName || "Upload PDF, document, or image"}
              <input type="file" onChange={handleUpload} className="hidden" />
            </label>
            <input value={form.fileUrl} onChange={e => updateField("fileUrl", e.target.value)}
              placeholder="Or paste an external resource link"
              required
              className="w-full mt-3 rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Cover Image URL</label>
            <input value={form.coverUrl} onChange={e => updateField("coverUrl", e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white" />
          </div>

          <button type="submit" disabled={isSaving || isUploading}
            className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 text-sm">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isSaving ? "Saving..." : editingId ? "Update Resource" : "Submit for Approval"}
          </button>
        </form>
      )}

      {/* Resource List */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/40 dark:bg-slate-800/30">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> My Submitted Resources ({stats.total})
          </h3>
          <button onClick={loadResources} className="text-xs text-primary font-medium hover:text-secondary flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Reload
          </button>
        </div>

        {isLoading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : resources.length === 0 ? (
          <div className="p-16 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-slate-500">You haven't submitted any resources yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {resources.map(resource => (
              <div key={resource.id} className="p-5 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-slate-800 dark:text-white text-[13px]">{resource.title}</p>
                      <StatusBadge status={resource.approvalStatus} />
                      {resource.teacherEditable && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Edit Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {resource.author || "No author"} · {resource.subject} · {resource.level} · {formatFileSize(resource.fileSize)}
                    </p>

                    {/* Rejection reason */}
                    {resource.approvalStatus === "rejected" && resource.rejectionReason && (
                      <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-700 dark:text-red-400">
                          <span className="font-bold">Rejection reason: </span>{resource.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a href={getResourceHref(resource.fileUrl)} target="_blank" rel="noreferrer"
                      className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded transition-colors" title="Open">
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {resource.teacherEditable ? (
                      <button onClick={() => beginEdit(resource)}
                        className="p-1.5 bg-primary/5 text-primary hover:bg-primary/10 rounded transition-colors" title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => beginEdit(resource)}
                        className="p-1.5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 rounded cursor-not-allowed" title="Edit locked by admin">
                        <Lock className="w-4 h-4" />
                      </button>
                    )}

                    <button onClick={() => confirmDelete(resource.id)} disabled={isDeletingId === resource.id}
                      className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded transition-colors disabled:opacity-50" title="Delete">
                      {isDeletingId === resource.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CustomDialog {...dialogState} />
    </div>
  );
}
