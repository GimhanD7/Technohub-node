"use client";

import { toast } from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, Trash2, Calendar, Video, RefreshCw, Search, BarChart3, Zap, Clock, Archive, Loader2, Filter, Edit
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";
import Link from "next/link";
import ScheduleClassEditor from "@/components/ScheduleClassEditor";

const STATUS_META = {
  ongoing: { label: "Live", bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-900/50 animate-pulse" },
  upcoming: { label: "Upcoming", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-900/50" },
  past: { label: "Ended", bg: "bg-gray-50 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", border: "border-gray-200 dark:border-slate-700" },
};

export default function AdminOnlineClassesPage() {
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState({ ongoing: [], upcoming: [], past: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'info', title: '', message: '', isAlertOnly: false, onConfirm: null, onCancel: null });

  const showConfirm = (title, message, type, onConfirmAction) => {
    setDialogState({
      isOpen: true, title, message, type, isAlertOnly: false,
      onConfirm: () => {
        setDialogState(s => ({ ...s, isOpen: false }));
        onConfirmAction();
      },
      onCancel: () => setDialogState(s => ({ ...s, isOpen: false }))
    });
  };

  const showAlert = (title, message, type = 'error') => {
    if (type === 'error') {
      toast.error(`${title}: ${message}`);
    } else if (type === 'success') {
      toast.success(`${title}: ${message}`);
    } else {
      toast(`${title}: ${message}`);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      loadClasses();
    }
  }, []);

  const loadClasses = async () => {
    setIsLoading(true);
    const data = await fetchApi("/online_class/manage");
    setIsLoading(false);

    if (data.success) {
      setClasses(data.classes || { ongoing: [], upcoming: [], past: [] });
    } else {
      showAlert("Error", data.message || "Failed to load scheduled online classes.", "error");
    }
  };

  const handleDeleteClass = (classId) => {
    showConfirm(
      "Delete Class",
      "Are you sure you want to delete this scheduled online class?",
      "error",
      async () => {
        setIsDeletingId(classId);

        const response = await fetchApi("/online_class/manage", {
          method: "DELETE",
          body: JSON.stringify({
            id: classId,
            userId: user.id,
            role: user.role,
          }),
        });

        setIsDeletingId(null);

        if (response.success) {
          showAlert("Success", response.message, "success");
          loadClasses();
        } else {
          showAlert("Error", response.message || "Failed to delete online class.", "error");
        }
      }
    );
  };

  // Derived Data
  const allClasses = useMemo(() => {
    return [
      ...classes.ongoing.map((c) => ({ ...c, _status: "ongoing" })),
      ...classes.upcoming.map((c) => ({ ...c, _status: "upcoming" })),
      ...classes.past.map((c) => ({ ...c, _status: "past" })),
    ];
  }, [classes]);

  const statusCounts = {
    ongoing: classes.ongoing.length,
    upcoming: classes.upcoming.length,
    past: classes.past.length,
  };
  const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const filteredClasses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allClasses.filter((cls) => {
      if (statusFilter !== "all" && cls._status !== statusFilter) return false;
      if (!q) return true;
      return `${cls.title || ""} ${cls.platform || ""} ${cls.creator_name || ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [allClasses, statusFilter, searchQuery]);

  const StatCard = ({ icon: Icon, label, count, colorClass }) => (
    <div className="bg-white dark:bg-[#1e293b] p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-white">{count}</p>
      </div>
      <div className={`p-2 rounded bg-gray-50 dark:bg-[#0f172a] ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );

  if (isLoading && allClasses.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12">
      <CustomDialog {...dialogState} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight">Online Class Manager</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Manage and schedule live online classes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadClasses()} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[12px] font-medium transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded shadow-sm hover:bg-primary/90 text-[12px] font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Class
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} label="TOTAL CLASSES" count={totalCount} colorClass="text-slate-600 dark:text-slate-400" />
        <StatCard icon={Zap} label="LIVE" count={statusCounts.ongoing} colorClass="text-red-600 dark:text-red-400" />
        <StatCard icon={Clock} label="UPCOMING" count={statusCounts.upcoming} colorClass="text-blue-600 dark:text-blue-400" />
        <StatCard icon={Archive} label="PAST" count={statusCounts.past} colorClass="text-gray-500 dark:text-gray-400" />
      </div>

      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 dark:text-white absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-[#0f172a]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 dark:text-white" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-[13px] border border-gray-200 dark:border-slate-800 rounded py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary dark:bg-[#0f172a] text-slate-600 dark:text-white"
          >
            <option value="all">All Classes</option>
            <option value="ongoing">Live</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Ended</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/30 shrink-0">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-gray-400 dark:text-white" />
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">Scheduled Classes ({filteredClasses.length})</h3>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-500 dark:text-white sticky top-0 z-10">
                <th className="py-3 px-5 font-bold">Class</th>
                <th className="py-3 px-5 font-bold">Created By</th>
                <th className="py-3 px-5 font-bold">Status</th>
                <th className="py-3 px-5 font-bold hidden md:table-cell">Platform</th>
                <th className="py-3 px-5 font-bold">Schedule</th>
                <th className="py-3 px-5 font-bold">Fee</th>
                <th className="py-3 px-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-600 dark:text-white divide-y divide-gray-100 dark:divide-slate-800/50">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500 dark:text-white italic">No classes found.</td>
                </tr>
              ) : (
                filteredClasses.map(cls => {
                  const meta = STATUS_META[cls._status];

                  return (
                    <tr key={cls.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-5">
                        <div className="font-medium text-slate-800 dark:text-white">{cls.title}</div>
                        {cls.description && <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{cls.description}</div>}
                      </td>
                      <td className="py-3 px-5 text-[12px]">
                        {cls.creator_name}
                      </td>
                      <td className="py-3 px-5">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${meta.bg} ${meta.text} ${meta.border}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-5 hidden md:table-cell">
                        <span className="text-[12px] font-medium text-blue-600 dark:text-blue-400">
                          {cls.platform || "Zoom"}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-white">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[12px]">
                            {cls.date_time ? new Date(cls.date_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 ml-5">
                          {cls.date_time ? new Date(cls.date_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""}
                          <span className="ml-1 text-gray-300 dark:text-slate-600">|</span> {cls.duration} mins
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`text-[12px] font-bold ${cls.fee > 0 ? 'text-primary' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {cls.fee > 0 ? `LKR ${cls.fee}` : "Free"}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={cls.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 rounded transition-colors"
                            title="Join Class"
                          >
                            <Video className="w-4 h-4" />
                          </a>

                          <Link
                            href={`/dashboard/admin/online-classes/create?id=${cls.id}&edit=1`}
                            className="p-1.5 text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 rounded transition-colors"
                            title="Edit Class"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1"></div>

                          <button
                            onClick={() => handleDeleteClass(cls.id)}
                            disabled={isDeletingId === cls.id}
                            className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded transition-colors disabled:opacity-50"
                            title="Delete Class"
                          >
                            {isDeletingId === cls.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="p-2">
              <ScheduleClassEditor 
                isEdit={false} 
                onSaveSuccess={() => {
                  setShowScheduleModal(false);
                  loadClasses();
                }}
                onCancel={() => setShowScheduleModal(false)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}