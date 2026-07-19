"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { fetchApi } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

const initialTimetable = {
  day: "",
  time: "",
  title: "",
  mode: "",
  sortOrder: 0,
  isActive: true,
};

export default function HomePageTimetableManager() {
  const [user] = useState(() => {
    if (typeof window === "undefined") return null;
    const savedUser = localStorage.getItem("techno_hub_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [timetable, setTimetable] = useState([]);
  const [timetableForm, setTimetableForm] = useState(initialTimetable);
  const [editingTimetableId, setEditingTimetableId] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'info', title: '', message: '', isAlertOnly: false, onConfirm: null, onCancel: null });

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    const data = await fetchApi("/home/get_content?role=admin");
    setIsLoading(false);

    if (data.success) {
      setTimetable(data.timetable || []);
    } else {
      setErrorMsg(data.message || "Failed to load timetable rows.");
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadContent();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadContent]);

  const updateTimetableField = (field, value) => {
    setTimetableForm((current) => ({ ...current, [field]: value }));
  };

  const saveTimetable = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const response = await fetchApi("/home/save_timetable", {
      method: "POST",
      body: JSON.stringify({
        ...timetableForm,
        rowId: editingTimetableId,
        role: user?.role,
      }),
    });

    setIsSaving(false);
    if (response.success) {
      setSuccessMsg(response.message);
      setTimetableForm(initialTimetable);
      setEditingTimetableId(null);
      loadContent();
    } else {
      setErrorMsg(response.message || "Failed to save timetable row.");
    }
  };

  const executeDelete = async (rowId) => {
    const response = await fetchApi("/home/delete_timetable", {
      method: "POST",
      body: JSON.stringify({ rowId, role: user?.role }),
    });
    if (response.success) loadContent();
    else setErrorMsg(response.message || "Failed to delete timetable row.");
  };

  const deleteTimetable = (rowId) => {
    setDialogState({
      isOpen: true,
      type: 'warning',
      title: 'Delete Timetable Row?',
      message: 'Are you sure you want to permanently delete this timetable row from the homepage schedule?',
      isAlertOnly: false,
      onConfirm: async () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        await executeDelete(rowId);
      },
      onCancel: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const editTimetable = (row) => {
    setEditingTimetableId(row.id);
    setTimetableForm({
      day: row.day || "",
      time: row.time || "",
      title: row.title || "",
      mode: row.mode || "",
      sortOrder: row.sortOrder || 0,
      isActive: Boolean(row.isActive),
    });
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-[20px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Timetable Rows
          </h1>
          <p className="text-xs text-gray-500 dark:text-white">Manage the class schedule table displayed on the homepage.</p>
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
            {editingTimetableId ? "Edit Timetable Row" : "Add Timetable Row"}
          </h2>
          <button onClick={loadContent} className="inline-flex items-center gap-2 text-xs font-bold text-primary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <form onSubmit={saveTimetable} className="grid lg:grid-cols-3 gap-4 mb-8">
          <input value={timetableForm.day ?? ""} onChange={(event) => updateTimetableField("day", event.target.value)} placeholder="Day, e.g. Monday" className="rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" required />
          <input value={timetableForm.time ?? ""} onChange={(event) => updateTimetableField("time", event.target.value)} placeholder="Time, e.g. 6.00 PM - 8.00 PM" className="lg:col-span-2 rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" required />
          <input value={timetableForm.title ?? ""} onChange={(event) => updateTimetableField("title", event.target.value)} placeholder="Class or session title" className="lg:col-span-2 rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" required />
          <input value={timetableForm.mode ?? ""} onChange={(event) => updateTimetableField("mode", event.target.value)} placeholder="Mode, e.g. Online" className="rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
          <input type="number" value={timetableForm.sortOrder ?? 0} onChange={(event) => updateTimetableField("sortOrder", event.target.value)} placeholder="Order" className="rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-white bg-gray-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-800">
            <input type="checkbox" checked={timetableForm.isActive} onChange={(event) => updateTimetableField("isActive", event.target.checked)} className="accent-primary w-4 h-4" />
            Active Display
          </label>
          <div className="lg:col-span-3 flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Button type="submit" className="gap-2 w-full sm:w-auto" disabled={isSaving}>
              {editingTimetableId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingTimetableId ? "Update Row" : "Save New Row"}
            </Button>
            {editingTimetableId && (
              <button type="button" onClick={() => { setEditingTimetableId(null); setTimetableForm(initialTimetable); }} className="text-sm font-bold text-slate-500 dark:text-white hover:text-red-600 px-4 py-2">
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-800/50 pb-2">Current Schedule</h3>
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          {timetable.map((row) => (
            <article key={row.id} className={`p-4 grid lg:grid-cols-[140px_1fr_auto] gap-4 items-center ${row.isActive ? 'bg-white dark:bg-[#1e293b]' : 'bg-gray-50 dark:bg-slate-800/50'} transition-colors`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  {row.day}
                  {!row.isActive && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded uppercase">Hidden</span>}
                </p>
                <p className="text-xs text-slate-500 dark:text-white mt-1.5 font-medium">{row.time}</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-[15px]">{row.title}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  {row.mode && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:text-white">
                      {row.mode}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-medium">Order: {row.sortOrder}</span>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => editTimetable(row)} className="h-8 px-4 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-colors">Edit</button>
                <button onClick={() => deleteTimetable(row.id)} className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
          {timetable.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-white bg-gray-50 dark:bg-slate-800/50 border-t border-dashed border-gray-300 dark:border-slate-700">
              No timetable rows added yet. Add your first row above.
            </div>
          )}
        </div>
      </section>
      <CustomDialog {...dialogState} />
    </div>
  );
}
