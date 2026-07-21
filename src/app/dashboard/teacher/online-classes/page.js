"use client";

import { toast } from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  Video,
  RefreshCw,
  Search,
  BarChart3,
  Zap,
  Clock,
  Archive,
  Loader2,
  Filter,
  Edit,
  Lock,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";
import Link from "next/link";

const STATUS_META = {
  ongoing: {
    label: "Live",
    bg: "bg-red-500/10 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-300 dark:border-red-800",
    dot: "bg-red-500 animate-pulse",
  },
  upcoming: {
    label: "Upcoming",
    bg: "bg-blue-500/10 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  past: {
    label: "Ended",
    bg: "bg-gray-100 dark:bg-slate-800",
    text: "text-gray-500 dark:text-slate-400",
    border: "border-gray-200 dark:border-slate-700",
    dot: "bg-gray-400",
  },
};

export default function TeacherOnlineClassesPage() {
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState({ ongoing: [], upcoming: [], past: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    isAlertOnly: false,
    onConfirm: null,
    onCancel: null,
  });

  const showConfirm = (title, message, type, onConfirmAction) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      type,
      isAlertOnly: false,
      onConfirm: () => {
        setDialogState((s) => ({ ...s, isOpen: false }));
        onConfirmAction();
      },
      onCancel: () => setDialogState((s) => ({ ...s, isOpen: false })),
    });
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
      toast.error(data.message || "Failed to load scheduled online classes.");
    }
  };

  const handleDeleteClass = (cls) => {
    if (cls._status === "ongoing") {
      toast.error("Live classes cannot be deleted while in progress.");
      return;
    }
    if (cls._status === "past") {
      toast.error("Ended classes cannot be deleted.");
      return;
    }

    showConfirm(
      "Cancel Class",
      "Are you sure you want to cancel and delete this scheduled online class?",
      "error",
      async () => {
        setIsDeletingId(cls.id);
        const response = await fetchApi("/online_class/manage", {
          method: "DELETE",
          body: JSON.stringify({
            id: cls.id,
            userId: user?.id,
            role: user?.role,
          }),
        });
        setIsDeletingId(null);

        if (response.success) {
          toast.success(response.message);
          loadClasses();
        } else {
          toast.error(response.message || "Failed to delete online class.");
        }
      }
    );
  };

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
        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-white">
          {count}
        </p>
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight">
            Online Class Manager
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
            Schedule and manage live online classes for your students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadClasses()}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[12px] font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Link
            href="/dashboard/teacher/online-classes/create"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded shadow-sm hover:bg-primary/90 text-[12px] font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Class
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BarChart3}
          label="Total Classes"
          count={totalCount}
          colorClass="text-slate-600 dark:text-slate-400"
        />
        <StatCard
          icon={Zap}
          label="Live"
          count={statusCounts.ongoing}
          colorClass="text-red-600 dark:text-red-400"
        />
        <StatCard
          icon={Clock}
          label="Upcoming"
          count={statusCounts.upcoming}
          colorClass="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={Archive}
          label="Ended"
          count={statusCounts.past}
          colorClass="text-gray-500 dark:text-gray-400"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 dark:text-white absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-[#0f172a]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 dark:text-white" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-[13px] border border-gray-200 dark:border-slate-800 rounded py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary dark:bg-[#0f172a] text-slate-600 dark:text-white"
          >
            <option value="all">All Classes</option>
            <option value="ongoing">Live</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Ended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Video className="w-4 h-4" /></div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">Class library</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{filteredClasses.length} {filteredClasses.length === 1 ? "class" : "classes"} shown</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50/90 dark:bg-slate-900/40">
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 sticky top-0 z-10">
                <th className="py-3.5 px-5 font-bold">Class details</th>
                <th className="py-3 px-5 font-bold">Status</th>
                <th className="py-3 px-5 font-bold hidden md:table-cell">Platform</th>
                <th className="py-3 px-5 font-bold">Schedule</th>
                <th className="py-3 px-5 font-bold">Fee</th>
                <th className="py-3 px-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-600 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-800/70">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-20 text-center"
                  >
                    <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center"><Video className="w-5 h-5" /></div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">No classes found</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">Try changing your search or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => {
                  const meta = STATUS_META[cls._status];
                  return (
                    <tr
                      key={cls.id}
                      className="group bg-white dark:bg-[#1e293b] hover:bg-primary/[0.025] dark:hover:bg-primary/5 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 text-primary flex items-center justify-center"><Video className="w-4 h-4" /></div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 dark:text-white truncate max-w-[250px]">{cls.title}</div>
                            {cls.description && <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1 max-w-[250px]">{cls.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-5 hidden md:table-cell">
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                          {cls.platform || "Zoom"}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-white">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[12px]">
                            {cls.date_time
                              ? new Date(cls.date_time).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )
                              : ""}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 ml-5">
                          {cls.date_time
                            ? new Date(cls.date_time).toLocaleTimeString(
                                "en-US",
                                { hour: "numeric", minute: "2-digit" }
                              )
                            : ""}{" "}
                          &bull; {cls.duration} mins
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            cls.fee > 0
                              ? "bg-primary/10 text-primary"
                              : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {cls.fee > 0 ? `LKR ${cls.fee}` : "Free"}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={cls.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 inline-flex items-center justify-center border border-slate-200 dark:border-slate-700 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 rounded-lg transition-colors"
                            title="Join Class"
                          >
                            <Video className="w-4 h-4" />
                          </a>

                          <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1" />

                          {/* Edit — only for upcoming */}
                          {cls._status === "upcoming" ? (
                            <Link
                              href={`/dashboard/teacher/online-classes/create?id=${cls.id}&edit=1`}
                              className="h-8 w-8 inline-flex items-center justify-center border border-slate-200 dark:border-slate-700 text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-200 rounded-lg transition-colors"
                              title="Edit Class"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 text-gray-300 dark:text-slate-600 cursor-not-allowed"
                              title={
                                cls._status === "ongoing"
                                  ? "Cannot edit live classes"
                                  : "Cannot edit ended classes"
                              }
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete — only for upcoming */}
                          {cls._status === "upcoming" ? (
                            <button
                              onClick={() => handleDeleteClass(cls)}
                              disabled={isDeletingId === cls.id}
                              className="h-8 w-8 inline-flex items-center justify-center border border-slate-200 dark:border-slate-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete Class"
                            >
                              {isDeletingId === cls.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 text-gray-300 dark:text-slate-600 cursor-not-allowed"
                              title={
                                cls._status === "ongoing"
                                  ? "Cannot delete live classes"
                                  : "Cannot delete ended classes"
                              }
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}
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
    </div>
  );
}
