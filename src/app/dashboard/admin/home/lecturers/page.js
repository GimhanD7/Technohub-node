"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, BASE_URL, fetchApi } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
  UsersRound,
} from "lucide-react";

const getFullImageUrl = (url) => url?.startsWith('/uploads/') ? `${BASE_URL}${url}` : url;

const initialLecturer = {
  name: "",
  subject: "",
  focus: "",
  imageUrl: "",
  initials: "",
  sortOrder: 0,
  isActive: true,
};

export default function HomePageLecturersManager() {
  const [user] = useState(() => {
    if (typeof window === "undefined") return null;
    const savedUser = localStorage.getItem("techno_hub_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [lecturers, setLecturers] = useState([]);
  const [lecturerForm, setLecturerForm] = useState(initialLecturer);
  const [editingLecturerId, setEditingLecturerId] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'info', title: '', message: '', isAlertOnly: false, onConfirm: null, onCancel: null });

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    const data = await fetchApi("/home/get_content?role=admin");
    setIsLoading(false);

    if (data.success) {
      setLecturers(data.lecturers || []);
    } else {
      setErrorMsg(data.message || "Failed to load lecturer cards.");
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadContent();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadContent]);

  const updateLecturerField = (field, value) => {
    setLecturerForm((current) => ({ ...current, [field]: value }));
  };

  const uploadImage = async (file, onUploaded) => {
    if (!file) return;
    setIsUploading(true);
    setErrorMsg("");
    const uploadData = new FormData();
    uploadData.append("image", file);

    try {
      const response = await fetch(`${API_BASE_URL}/home/upload`, {
        method: "POST",
        body: uploadData,
      });
      const data = await response.json();
      if (data.success) {
        onUploaded(data.url);
        setSuccessMsg("Image uploaded.");
      } else {
        setErrorMsg(data.message || "Image upload failed.");
      }
    } catch {
      setErrorMsg("Image upload failed. Please check that XAMPP Apache is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const saveLecturer = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const response = await fetchApi("/home/save_lecturer", {
      method: "POST",
      body: JSON.stringify({
        ...lecturerForm,
        lecturerId: editingLecturerId,
        role: user?.role,
      }),
    });

    setIsSaving(false);
    if (response.success) {
      setSuccessMsg(response.message);
      setLecturerForm(initialLecturer);
      setEditingLecturerId(null);
      loadContent();
    } else {
      setErrorMsg(response.message || "Failed to save lecturer.");
    }
  };

  const executeDelete = async (lecturerId) => {
    const response = await fetchApi("/home/delete_lecturer", {
      method: "POST",
      body: JSON.stringify({ lecturerId, role: user?.role }),
    });
    if (response.success) loadContent();
    else setErrorMsg(response.message || "Failed to delete lecturer.");
  };

  const deleteLecturer = (lecturerId) => {
    setDialogState({
      isOpen: true,
      type: 'warning',
      title: 'Delete Lecturer Card?',
      message: 'Are you sure you want to permanently delete this lecturer profile card? This action cannot be undone.',
      isAlertOnly: false,
      onConfirm: async () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        await executeDelete(lecturerId);
      },
      onCancel: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const editLecturer = (lecturer) => {
    setEditingLecturerId(lecturer.id);
    setLecturerForm({
      name: lecturer.name || "",
      subject: lecturer.subject || "",
      focus: lecturer.focus || "",
      imageUrl: lecturer.imageUrl || "",
      initials: lecturer.initials || "",
      sortOrder: lecturer.sortOrder || 0,
      isActive: Boolean(lecturer.isActive),
    });
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-[20px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-primary" />
            Lecturer Cards
          </h1>
          <p className="text-xs text-gray-500 dark:text-white">Manage the lecturer profiles displayed on the homepage.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 dark:border-red-900/50 text-red-600 text-sm font-medium rounded-lg flex gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 dark:border-green-900/50 text-green-700 text-sm font-medium rounded-lg flex gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}

      <section className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            {editingLecturerId ? "Edit Lecturer" : "Add New Lecturer"}
          </h2>
          <button onClick={loadContent} className="inline-flex items-center gap-2 text-xs font-bold text-primary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <form onSubmit={saveLecturer} className="grid lg:grid-cols-2 gap-4 mb-8">
          <input value={lecturerForm.name ?? ""} onChange={(event) => updateLecturerField("name", event.target.value)} placeholder="Lecturer name" className="rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" required />
          <input value={lecturerForm.subject ?? ""} onChange={(event) => updateLecturerField("subject", event.target.value)} placeholder="Subject" className="rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" required />
          <textarea value={lecturerForm.focus ?? ""} onChange={(event) => updateLecturerField("focus", event.target.value)} placeholder="Details" rows={3} className="lg:col-span-2 rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a] resize-none" />
          <input value={lecturerForm.imageUrl ?? ""} onChange={(event) => updateLecturerField("imageUrl", event.target.value)} placeholder="Lecturer image URL" className="rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
          <input value={lecturerForm.initials ?? ""} onChange={(event) => updateLecturerField("initials", event.target.value)} placeholder="Initials (e.g. NJ)" className="rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
          <input type="number" value={lecturerForm.sortOrder ?? 0} onChange={(event) => updateLecturerField("sortOrder", event.target.value)} placeholder="Order" className="rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-white bg-gray-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-800">
            <input type="checkbox" checked={lecturerForm.isActive} onChange={(event) => updateLecturerField("isActive", event.target.checked)} className="accent-primary w-4 h-4" />
            Active Display
          </label>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary transition-colors">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            Upload Lecturer Image
            <input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0], (url) => updateLecturerField("imageUrl", url))} className="hidden" />
          </label>
          <div className="lg:col-span-2 flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Button type="submit" className="gap-2 w-full sm:w-auto" disabled={isSaving || isUploading}>
              {editingLecturerId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingLecturerId ? "Update Lecturer" : "Save New Lecturer"}
            </Button>
            {editingLecturerId && (
              <button type="button" onClick={() => { setEditingLecturerId(null); setLecturerForm(initialLecturer); }} className="text-sm font-bold text-slate-500 dark:text-white hover:text-red-600 px-4 py-2">
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-800/50 pb-2">Current Lecturers</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
          {lecturers.map((lecturer) => (
            <article key={lecturer.id} className={`rounded-lg border ${lecturer.isActive ? 'border-slate-200 dark:border-slate-800' : 'border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50'} p-4 flex gap-4 transition-colors`}>
              <div className="h-24 w-24 rounded-lg bg-primary/10 bg-cover bg-center flex items-center justify-center text-primary text-xl font-black shrink-0 relative" style={lecturer.imageUrl ? { backgroundImage: `url("${getFullImageUrl(lecturer.imageUrl)}")` } : undefined}>
                {!lecturer.imageUrl && (lecturer.initials || "TH")}
                {!lecturer.isActive && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Hidden</div>
                )}
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-base truncate" title={lecturer.name}>{lecturer.name}</p>
                  <p className="text-xs text-primary font-semibold mt-0.5">{lecturer.subject}</p>
                  <p className="text-xs text-slate-500 dark:text-white line-clamp-2 mt-1.5 leading-relaxed">{lecturer.focus}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => editLecturer(lecturer)} className="flex-1 h-8 px-3 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-colors">Edit</button>
                  <button onClick={() => deleteLecturer(lecturer.id)} className="h-8 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold inline-flex items-center gap-1 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
          {lecturers.length === 0 && (
            <div className="lg:col-span-2 p-8 text-center text-sm text-slate-500 dark:text-white bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-gray-300 dark:border-slate-700">
              No lecturer cards added yet. Add your first lecturer above.
            </div>
          )}
        </div>
      </section>
      <CustomDialog {...dialogState} />
    </div>
  );
}
