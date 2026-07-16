"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import Button from "@/components/ui/Button";
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
  Trash2,
  X,
} from "lucide-react";

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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const stats = useMemo(() => {
    const published = resources.filter((item) => item.isPublished).length;
    const featured = resources.filter((item) => item.isFeatured).length;
    const subjects = new Set(resources.map((item) => item.subject).filter(Boolean)).size;

    return { published, featured, subjects };
  }, [resources]);

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    const data = await fetchApi("/ebook/list?role=admin");
    setIsLoading(false);

    if (data.success) {
      setResources(data.resources);
    } else {
      setErrorMsg(data.message || "Failed to load e-book resources.");
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
    setErrorMsg("");
    setSuccessMsg("");

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
        setSuccessMsg("Resource file uploaded.");
      } else {
        setErrorMsg(data.message || "Upload failed.");
      }
    } catch {
      setErrorMsg("Upload failed. Please check that XAMPP Apache is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const beginEditResource = (resource) => {
    setEditingId(resource.id);
    setSelectedFileName(resource.fileUrl ? "Current resource selected" : "");
    setErrorMsg("");
    setSuccessMsg("");
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
    setErrorMsg("");
    setSuccessMsg("");

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
      setSuccessMsg(response.message);
      resetForm();
      loadResources();
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setErrorMsg(response.message || "Failed to add resource.");
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!confirm("Delete this e-book resource from the library?")) return;

    setIsDeletingId(resourceId);
    setErrorMsg("");
    setSuccessMsg("");

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
      setSuccessMsg(response.message);
      loadResources();
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setErrorMsg(response.message || "Failed to delete resource.");
    }
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

        <div className="grid grid-cols-3 gap-3 min-w-[360px]">
          <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-white">Published</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.published}</p>
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
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Cover Image URL</label>
            <input
              value={form.coverUrl}
              onChange={(event) => updateField("coverUrl", event.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
            />
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
                    <tr key={resource.id} className={`border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 ${editingId === resource.id ? "bg-primary/5 dark:bg-primary/20" : ""}`}>
                      <td className="py-4 pr-4 min-w-[260px]">
                        <p className="font-semibold text-slate-800 dark:text-white text-[13px]">{resource.title}</p>
                        <p className="text-[11px] text-slate-400">{resource.author || "No author"} · {formatFileSize(resource.fileSize)}</p>
                      </td>
                      <td className="py-4 text-[12px] text-slate-600 dark:text-white">
                        <p className="font-medium">{resource.subject}</p>
                        <p className="text-[10px] text-gray-400 dark:text-white">{resource.level}</p>
                      </td>
                      <td className="py-4 text-[12px] text-slate-600 dark:text-white">{resource.category}</td>
                      <td className="py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider ${resource.isPublished ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50" : "bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-white border-gray-200 dark:border-slate-800"}`}>
                            {resource.isPublished ? "Published" : "Draft"}
                          </span>
                          {resource.isFeatured && <span className="text-[10px] font-bold text-amber-600">Featured</span>}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={getResourceHref(resource.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors inline-flex items-center"
                            title="Open resource"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => beginEditResource(resource)}
                            className="p-1.5 bg-primary/5 text-primary hover:bg-primary/10 rounded transition-colors inline-flex items-center"
                            title="Edit resource"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteResource(resource.id)}
                            disabled={isDeletingId === resource.id}
                            className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors inline-flex items-center disabled:opacity-50"
                            title="Delete resource"
                          >
                            {isDeletingId === resource.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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
    </div>
  );
}
