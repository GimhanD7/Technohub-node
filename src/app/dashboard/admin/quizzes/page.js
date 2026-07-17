"use client";

import { toast } from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus, Edit2, Trash2, Calendar, ClipboardList, RefreshCw, Award, Users, Lock, Search, X, Zap, Clock, Archive, CheckCircle, AlertTriangle, Loader2, Filter, LayoutGrid
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";

export default function AdminQuizzesPage() {
  const [user, setUser] = useState(null);
  const [quizzes, setQuizzes] = useState({ active: [], upcoming: [], past: [] });
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);

  const [isDeletingId, setIsDeletingId] = useState(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Custom Alert / Confirm Dialog State
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

  // Load User & Quizzes
  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      loadQuizzes(parsed.id);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadQuizzes = async (userId) => {
    setIsLoading(true);
    try {
      const data = await fetchApi(`/quiz/list?userId=${userId}`);
      if (data.success) {
        setQuizzes(data.quizzes || { active: [], upcoming: [], past: [] });
      } else {
        showAlert("Error", "Failed to load quizzes: " + data.message, "error");
      }
    } catch (err) {
      showAlert("Error", "Network error. Please check your connection.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Selection Handlers
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredQuizzes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQuizzes.map((q) => q.id));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  // Delete Handlers
  const handleDeleteQuiz = (quizId) => {
    showConfirm(
      "Delete Quiz",
      "Are you sure you want to delete this quiz? All student attempts and responses will be permanently deleted.",
      "error",
      async () => {
        setIsDeletingId(quizId);
        try {
          const response = await fetchApi("/quiz/delete", {
            method: "POST",
            body: JSON.stringify({ quizId, role: user?.role }),
          });

          if (response.success) {
            showAlert("Success", "Quiz deleted successfully", "success");
            loadQuizzes(user.id);
          } else {
            showAlert("Error", "Failed to delete quiz: " + response.message, "error");
          }
        } catch {
          showAlert("Error", "Delete failed", "error");
        } finally {
          setIsDeletingId(null);
        }
      }
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;

    showConfirm(
      `Delete ${selectedIds.length} Quiz${selectedIds.length > 1 ? "zes" : ""}`,
      `This action will permanently delete ${selectedIds.length} quiz(es) and all associated student data. This cannot be undone.`,
      "error",
      async () => {
        setIsBulkDeleting(true);
        let successCount = 0;
        let failCount = 0;

        for (const quizId of selectedIds) {
          try {
            const res = await fetchApi("/quiz/delete", {
              method: "POST",
              body: JSON.stringify({ quizId, role: user?.role }),
            });
            if (res.success) successCount++;
            else failCount++;
          } catch {
            failCount++;
          }
        }

        setIsBulkDeleting(false);
        clearSelection();

        if (successCount > 0) {
          showAlert("Success", `${successCount} quiz(es) deleted successfully`, "success");
          loadQuizzes(user.id);
        }
        if (failCount > 0) {
          showAlert("Error", `${failCount} deletion(s) failed`, "error");
        }
      }
    );
  };

  // Derived Data
  const allQuizzes = useMemo(() => {
    return [
      ...quizzes.active.map((q) => ({ ...q, _status: "active" })),
      ...quizzes.upcoming.map((q) => ({ ...q, _status: "upcoming" })),
      ...quizzes.past.map((q) => ({ ...q, _status: "past" })),
    ];
  }, [quizzes]);

  const statusCounts = {
    active: quizzes.active.length,
    upcoming: quizzes.upcoming.length,
    past: quizzes.past.length,
  };
  const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const filteredQuizzes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allQuizzes.filter((quiz) => {
      if (statusFilter !== "all" && quiz._status !== statusFilter) return false;
      if (!q) return true;
      return `${quiz.title || ""} ${quiz.creatorName || ""}`.toLowerCase().includes(q);
    });
  }, [allQuizzes, statusFilter, searchQuery]);

  const STATUS_META = {
    active: { label: "Active", bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-900/50" },
    upcoming: { label: "Upcoming", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-900/50" },
    past: { label: "Past", bg: "bg-gray-50 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", border: "border-gray-200 dark:border-slate-700" },
  };

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

  if (isLoading && allQuizzes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <CustomDialog {...dialogState} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight">Quiz Management</h1>
          <p className="text-[13px] text-gray-500 dark:text-white mt-1">Create, schedule and manage mock exams.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadQuizzes(user?.id)} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[12px] font-medium transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Link href="/dashboard/admin/quizzes/create" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded shadow-sm hover:bg-primary/90 text-[12px] font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" /> Create Quiz
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={LayoutGrid} label="Total Quizzes" count={totalCount} colorClass="text-slate-600 dark:text-slate-400" />
        <StatCard icon={Zap} label="Active" count={statusCounts.active} colorClass="text-green-600 dark:text-green-400" />
        <StatCard icon={Clock} label="Upcoming" count={statusCounts.upcoming} colorClass="text-blue-600 dark:text-blue-400" />
        <StatCard icon={Archive} label="Past" count={statusCounts.past} colorClass="text-gray-500 dark:text-gray-400" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 dark:text-white absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search quizzes..." 
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
            <option value="all">All Quizzes</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/30 shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-400 dark:text-white" />
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">Quizzes List ({filteredQuizzes.length})</h3>
          </div>
          
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-blue-600 font-medium">{selectedIds.length} selected</span>
              <button 
                onClick={handleBulkDelete} 
                disabled={isBulkDeleting} 
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded text-[12px] font-medium transition-colors disabled:opacity-50"
              >
                {isBulkDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Selected
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-500 dark:text-white sticky top-0 z-10">
                <th className="py-3 px-5 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredQuizzes.length && filteredQuizzes.length > 0} 
                    onChange={toggleSelectAll} 
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-primary" 
                  />
                </th>
                <th className="py-3 px-5 font-bold">Quiz</th>
                <th className="py-3 px-5 font-bold">Status</th>
                <th className="py-3 px-5 font-bold hidden md:table-cell">Fee</th>
                <th className="py-3 px-5 font-bold">Schedule</th>
                <th className="py-3 px-5 font-bold hidden lg:table-cell">Questions</th>
                <th className="py-3 px-5 font-bold hidden lg:table-cell">Created By</th>
                <th className="py-3 px-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-600 dark:text-white divide-y divide-gray-100 dark:divide-slate-800/50">
              {filteredQuizzes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500 dark:text-white italic">No quizzes found.</td>
                </tr>
              ) : (
                filteredQuizzes.map(quiz => {
                  const meta = STATUS_META[quiz._status];
                  const hasFee = parseFloat(quiz.fee || 0) > 0;
                  const isSelected = selectedIds.includes(quiz.id);

                  return (
                    <tr key={quiz.id} className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                      <td className="py-3 px-5">
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => toggleSelect(quiz.id)} 
                          className="w-3.5 h-3.5 rounded border-gray-300 accent-primary" 
                        />
                      </td>
                      <td className="py-3 px-5">
                        <div className="font-medium text-slate-800 dark:text-white">{quiz.title}</div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">Exam #{quiz.id}</div>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${meta.bg} ${meta.text} ${meta.border}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-5 hidden md:table-cell">
                        {hasFee ? (
                          <span className="text-[12px] font-medium text-amber-600 dark:text-amber-400">LKR {parseFloat(quiz.fee).toFixed(2)}</span>
                        ) : (
                          <span className="text-[12px] font-medium text-green-600 dark:text-green-400">Free</span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-white">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[12px]">{quiz.startTime}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 ml-5">to {quiz.endTime}</div>
                      </td>
                      <td className="py-3 px-5 hidden lg:table-cell">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded text-[11px] font-medium border border-gray-200 dark:border-slate-700">
                          {quiz.questionCount} Qs
                        </span>
                      </td>
                      <td className="py-3 px-5 hidden lg:table-cell text-slate-600 dark:text-white">
                        {quiz.creatorName || "Staff"}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/dashboard/admin/quiz-standings?id=${quiz.id}`} className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 rounded transition-colors" title="View Standings">
                            <Award className="w-4 h-4" />
                          </Link>
                          
                          <Link href={`/dashboard/admin/quiz-submissions?id=${quiz.id}`} className="p-1.5 text-purple-500 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 rounded transition-colors" title="View Participants">
                            <Users className="w-4 h-4" />
                          </Link>

                          <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1"></div>

                          {quiz._status === "past" || quiz._status === "active" ? (
                            <button disabled className="p-1.5 text-gray-400 cursor-not-allowed" title="Past and active quizzes cannot be edited">
                              <Lock className="w-4 h-4" />
                            </button>
                          ) : (
                            <Link href={`/dashboard/admin/quizzes/edit?id=${quiz.id}`} className="p-1.5 text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 rounded transition-colors" title="Edit Quiz">
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          )}

                          <button 
                            onClick={() => handleDeleteQuiz(quiz.id)} 
                            disabled={isDeletingId === quiz.id}
                            className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded transition-colors disabled:opacity-50" 
                            title="Delete Quiz"
                          >
                            {isDeletingId === quiz.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
    </div>
  );
}