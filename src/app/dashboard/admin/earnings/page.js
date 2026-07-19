"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState, useMemo } from "react";
import { 
  DollarSign, Search, Loader2, RefreshCw, Settings2, History, X, 
  CheckCircle2, Download, TrendingUp, Calendar, AlertCircle, ArrowDownRight, CreditCard
} from "lucide-react";
import { fetchApi, BASE_URL } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from "recharts";

export default function TeacherEarnings() {
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("commissions"); // commissions, monthly, trends
  
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'info', title: '', message: '', isAlertOnly: false, onConfirm: null, onCancel: null });
  
  // Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  
  // Forms and Report states
  const [configData, setConfigData] = useState({ commission_type: 'percentage', commission_value: '80' });
  const [historyData, setHistoryData] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Monthly Sheet States
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [monthlyTotals, setMonthlyTotals] = useState({ totalGross: 0, totalNet: 0, totalPaid: 0, totalBalance: 0 });
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: "", remarks: "" });

  // Trends States
  const [trendTeacherId, setTrendTeacherId] = useState("all");
  const [trendsData, setTrendsData] = useState([]);
  const [isTrendsLoading, setIsTrendsLoading] = useState(false);

  const showAlert = (title, message, type = 'error') => {
    if (type === 'error') {
      toast.error(`${title}: ${message}`);
    } else if (type === 'success') {
      toast.success(`${title}: ${message}`);
    } else {
      toast(`${title}: ${message}`);
    }
  };

  const loadTeachers = async () => {
    setIsLoading(true);
    const data = await fetchApi("/admin/get_teacher_earnings");
    if (data.success) {
      setTeachers(data.teachers);
    }
    setIsLoading(false);
  };

  const loadMonthlyReport = async (monthVal) => {
    setIsReportLoading(true);
    const data = await fetchApi(`/admin/get_teacher_monthly_report?month=${monthVal}`);
    if (data.success) {
      setMonthlyReport(data.report || []);
      setMonthlyTotals(data.totals || { totalGross: 0, totalNet: 0, totalPaid: 0, totalBalance: 0 });
    } else {
      showAlert("Error", data.message || "Failed to load monthly sheet.", "error");
    }
    setIsReportLoading(false);
  };

  const loadTrends = async (teacherId) => {
    setIsTrendsLoading(true);
    const query = teacherId !== "all" ? `?teacher_id=${teacherId}` : "";
    const data = await fetchApi(`/admin/get_teacher_earnings_trends${query}`);
    if (data.success) {
      setTrendsData(data.trends || []);
    } else {
      showAlert("Error", "Failed to load trends.", "error");
    }
    setIsTrendsLoading(false);
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (activeTab === "monthly") {
      loadMonthlyReport(selectedMonth);
    } else if (activeTab === "trends") {
      loadTrends(trendTeacherId);
    }
  }, [activeTab, selectedMonth, trendTeacherId]);

  const filteredTeachers = useMemo(() => {
    if (!Array.isArray(teachers)) return [];
    return teachers.filter(t => {
      if (!t) return false;
      return (t.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
             (t.subject || "").toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [teachers, searchQuery]);

  const filteredMonthly = useMemo(() => {
    if (!Array.isArray(monthlyReport)) return [];
    return monthlyReport.filter(r => {
      return (r.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
             (r.subject || "").toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [monthlyReport, searchQuery]);

  const openConfigModal = (teacher) => {
    setSelectedTeacher(teacher);
    setConfigData({
      commission_type: teacher.commission_type || 'percentage',
      commission_value: teacher.commission_value || '80.00'
    });
    setShowConfigModal(true);
  };

  const openHistoryModal = async (teacher) => {
    if (!teacher) return;
    setSelectedTeacher(teacher);
    setShowHistoryModal(true);
    setActionLoading(true);
    const data = await fetchApi(`/admin/get_teacher_earnings_history?teacher_id=${teacher.id}`);
    if (data.success) {
      setHistoryData(data.history || []);
    } else {
      showAlert("Error", "Could not load history.", "error");
    }
    setActionLoading(false);
  };

  const openPayoutModal = (teacher) => {
    setSelectedTeacher(teacher);
    // Default payout to month balance or accumulative all time balance (if negative, default to 0)
    const defaultAmount = Math.max(0, teacher.all_time_balance !== undefined ? teacher.all_time_balance : teacher.month_balance);
    setPayoutForm({
      amount: defaultAmount > 0 ? defaultAmount.toString() : "",
      remarks: ""
    });
    setShowPayoutModal(true);
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setActionLoading(true);
    const data = await fetchApi("/admin/update_teacher_commission", {
      method: "POST",
      body: JSON.stringify({
        teacher_id: selectedTeacher.id,
        commission_type: configData.commission_type,
        commission_value: parseFloat(configData.commission_value)
      })
    });

    if (data.success) {
      showAlert("Success", "Commission settings updated successfully.", "success");
      setShowConfigModal(false);
      loadTeachers();
    } else {
      showAlert("Update Failed", data.message || "An error occurred.", "error");
    }
    setActionLoading(false);
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setActionLoading(true);
    const data = await fetchApi("/admin/record_teacher_payout", {
      method: "POST",
      body: JSON.stringify({
        teacher_id: selectedTeacher.id,
        month: selectedMonth,
        amount: parseFloat(payoutForm.amount),
        remarks: payoutForm.remarks
      })
    });

    if (data.success) {
      showAlert("Success", "Salary payout recorded successfully.", "success");
      setShowPayoutModal(false);
      loadMonthlyReport(selectedMonth);
    } else {
      showAlert("Allocation Failed", data.message || "Failed to record payout.", "error");
    }
    setActionLoading(false);
  };

  // CSV Exporter
  const exportToCSV = (filename, headers, keys, data) => {
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const item of data) {
      const values = keys.map(key => {
        const val = item[key];
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCommissions = () => {
    exportToCSV(
      "teacher_commissions.csv",
      ["Name", "Subject", "Commission Type", "Value", "Total Earnings (LKR)"],
      ["full_name", "subject", "commission_type", "commission_value", "total_earnings"],
      teachers
    );
  };

  const handleDownloadHistory = () => {
    if (!selectedTeacher || historyData.length === 0) return;
    exportToCSV(
      `${selectedTeacher.full_name.replace(/\s+/g, '_')}_earnings_history.csv`,
      ["Date", "Description", "Gross Amount (LKR)", "Commission Details", "Net Earning (LKR)"],
      ["created_at", "description", "amount", "commission_value", "net_earning"],
      historyData.map(h => ({
        ...h,
        created_at: new Date(h.created_at).toLocaleDateString(),
        commission_value: h.commission_type === 'percentage' ? `${h.commission_value}%` : `LKR ${h.commission_value} Fixed`
      }))
    );
  };

  const handleDownloadMonthlySheet = () => {
    exportToCSV(
      `teacher_payout_sheet_${selectedMonth}.csv`,
      ["Teacher", "Subject", "Gross Earnings (LKR)", "Net Earnings (LKR)", "Paid Payouts (LKR)", "Month Balance (LKR)", "All Time Unpaid Balance (LKR)"],
      ["full_name", "subject", "gross_earnings", "net_earnings", "paid_amount", "month_balance", "all_time_balance"],
      monthlyReport
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12">
      <CustomDialog {...dialogState} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" /> Teacher Earnings Manager
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-1">Configure payouts, record salary sheets, and analyze financial performance trends.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "commissions" && (
            <button 
              onClick={handleDownloadCommissions}
              disabled={teachers.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded text-[12px] font-medium border border-emerald-150 transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Download Commissions
            </button>
          )}
          {activeTab === "monthly" && (
            <button 
              onClick={handleDownloadMonthlySheet}
              disabled={monthlyReport.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded text-[12px] font-medium border border-emerald-150 transition-colors shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Download Payout Sheet
            </button>
          )}
          <button 
            onClick={() => {
              if (activeTab === "commissions") loadTeachers();
              else if (activeTab === "monthly") loadMonthlyReport(selectedMonth);
              else loadTrends(trendTeacherId);
            }} 
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[12px] font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(isLoading || isReportLoading || isTrendsLoading) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("commissions")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "commissions"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          Commissions & Setup
        </button>
        <button
          onClick={() => setActiveTab("monthly")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "monthly"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          Monthly Payout Sheets
        </button>
        <button
          onClick={() => setActiveTab("trends")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "trends"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          Earning Trends
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      {activeTab !== "trends" && (
        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-gray-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search teachers..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-[#0f172a] dark:text-white"
            />
          </div>
          
          {activeTab === "monthly" && (
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" /> Month Sheet:
              </span>
              <input 
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="p-2 border border-gray-200 dark:border-slate-700 rounded text-[13px] dark:bg-[#0f172a] dark:text-white outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>
      )}

      {/* COMMISSIONS VIEW */}
      {activeTab === "commissions" && (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[450px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  <th className="py-4 px-5 font-bold">Teacher Info</th>
                  <th className="py-4 px-5 font-bold">Commission Setup</th>
                  <th className="py-4 px-5 font-bold">Total Earnings</th>
                  <th className="py-4 px-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-600 dark:text-slate-300 divide-y divide-gray-100 dark:divide-slate-800/50">
                {isLoading && teachers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <span className="text-xs text-slate-400">Loading commissions...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-16 text-center text-gray-500 dark:text-slate-400 italic">No teachers found.</td>
                  </tr>
                ) : (
                  filteredTeachers.map((t, index) => (
                    <tr key={t?.id || index} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {t?.profile_picture ? (
                             <img src={t.profile_picture.startsWith('http') ? t.profile_picture : `${BASE_URL}${t.profile_picture.startsWith('/') ? '' : '/'}${t.profile_picture}`} alt={t.full_name || 'Teacher'} className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-slate-700" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 flex items-center justify-center font-bold border border-blue-100 dark:border-blue-800 shrink-0">
                              {t?.full_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white leading-tight">{t?.full_name || 'Unknown'}</p>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">{t?.subject || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          {t.commission_type === 'percentage' ? (
                            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-[10px] font-bold tracking-wide border border-indigo-250">
                              Percentage ({parseFloat(t.commission_value)}%)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold tracking-wide border border-emerald-250">
                              Fixed (LKR {parseFloat(t.commission_value).toFixed(2)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-bold text-slate-800 dark:text-white">LKR {parseFloat(t.total_earnings).toFixed(2)}</p>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openHistoryModal(t)}
                            className="px-3 py-1.5 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-[11px] font-bold transition-colors border border-blue-200 dark:border-blue-800"
                          >
                            <History className="w-3.5 h-3.5" /> History
                          </button>
                          <button 
                            onClick={() => openConfigModal(t)}
                            className="px-3 py-1.5 flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-[11px] font-bold transition-colors border border-gray-255 dark:border-slate-700"
                          >
                            <Settings2 className="w-3.5 h-3.5" /> Edit Setup
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MONTHLY PAYOUT SHEETS VIEW */}
      {activeTab === "monthly" && (
        <div className="space-y-6">
          {/* Totals Summary Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Month Sales</span>
              <span className="text-xl font-bold text-slate-800 dark:text-white block mt-1.5">LKR {monthlyTotals.totalGross.toFixed(2)}</span>
            </div>
            <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Net Commission</span>
              <span className="text-xl font-bold text-slate-800 dark:text-white block mt-1.5">LKR {monthlyTotals.totalNet.toFixed(2)}</span>
            </div>
            <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Paid Salary</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 block mt-1.5">LKR {monthlyTotals.totalPaid.toFixed(2)}</span>
            </div>
            <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Overall Unpaid Balance</span>
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400 block mt-1.5">LKR {monthlyTotals.totalBalance.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    <th className="py-4 px-5 font-bold">Teacher</th>
                    <th className="py-4 px-5 font-bold">Month Gross</th>
                    <th className="py-4 px-5 font-bold">Month Net (Owed)</th>
                    <th className="py-4 px-5 font-bold">Month Paid</th>
                    <th className="py-4 px-5 font-bold">Month Balance</th>
                    <th className="py-4 px-5 font-bold text-amber-600">Total Unpaid (All Time)</th>
                    <th className="py-4 px-5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-slate-600 dark:text-slate-300 divide-y divide-gray-100 dark:divide-slate-800/50">
                  {isReportLoading && monthlyReport.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                          <span className="text-xs text-slate-400">Loading payout sheet...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredMonthly.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-gray-500 dark:text-slate-400 italic">No records found.</td>
                    </tr>
                  ) : (
                    filteredMonthly.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-5">
                          <p className="font-semibold text-slate-800 dark:text-white leading-tight">{row.full_name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{row.subject}</p>
                        </td>
                        <td className="py-4 px-5">LKR {row.gross_earnings.toFixed(2)}</td>
                        <td className="py-4 px-5 font-medium">LKR {row.net_earnings.toFixed(2)}</td>
                        <td className="py-4 px-5 text-emerald-600 dark:text-emerald-400">LKR {row.paid_amount.toFixed(2)}</td>
                        <td className="py-4 px-5">LKR {row.month_balance.toFixed(2)}</td>
                        <td className="py-4 px-5 font-bold text-amber-600 dark:text-amber-500">LKR {row.all_time_balance.toFixed(2)}</td>
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openHistoryModal(row)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-gray-50 rounded"
                              title="View Ledger History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openPayoutModal(row)}
                              className="px-2.5 py-1.5 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-[11px] font-bold border border-emerald-200 transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Allocate Salary
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TRENDS VIEW */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Earning performance trends
              </h3>
              <p className="text-xs text-gray-500 mt-1">Review the financial generation trends of the academy over the last 6 months.</p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-400">Teacher:</span>
              <select
                value={trendTeacherId}
                onChange={e => setTrendTeacherId(e.target.value)}
                className="p-2 border border-gray-200 dark:border-slate-700 rounded text-[13px] dark:bg-[#0f172a] dark:text-white outline-none focus:ring-1 focus:ring-primary min-w-[200px]"
              >
                <option value="all">All Teachers (Academy Trend)</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name} ({t.subject})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
            {isTrendsLoading ? (
              <div className="py-20 flex justify-center items-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : trendsData.length === 0 ? (
              <div className="py-20 text-center text-slate-400 italic">No trend data available for this selection.</div>
            ) : (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a3cb6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#1a3cb6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#efc300" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#efc300" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit=" LKR" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" name="Gross Sales (LKR)" dataKey="gross" stroke="#1a3cb6" strokeWidth={2} fillOpacity={1} fill="url(#colorGross)" />
                    <Area type="monotone" name="Net Commission (LKR)" dataKey="net" stroke="#efc300" strokeWidth={2} fillOpacity={1} fill="url(#colorNet)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIG COMMISSION MODAL */}
      {showConfigModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Commission Setup</h2>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleConfigSubmit} className="p-6 space-y-5">
              <div>
                <p className="text-[13px] text-gray-500 dark:text-slate-400 mb-4">Set the revenue share parameters for <span className="font-bold text-slate-800 dark:text-white">{selectedTeacher.full_name}</span>.</p>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-slate-350 uppercase tracking-wider mb-1.5">Commission Model</label>
                <select 
                  value={configData.commission_type} 
                  onChange={e => setConfigData({...configData, commission_type: e.target.value})}
                  className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a] dark:text-white"
                >
                  <option value="percentage">Percentage share (%)</option>
                  <option value="fixed">Fixed payment per unit (LKR)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-slate-355 uppercase tracking-wider mb-1.5">Model Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[13px] font-medium">
                    {configData.commission_type === 'percentage' ? '%' : 'LKR'}
                  </span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required
                    value={configData.commission_value}
                    onChange={e => setConfigData({...configData, commission_value: e.target.value})}
                    className="w-full pl-12 pr-3 py-2.5 text-[13px] border border-gray-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a] dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-150 dark:border-slate-800/80 mt-6">
                <button type="button" onClick={() => setShowConfigModal(false)} className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1e293b] border border-gray-255 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors focus:outline-none">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-white bg-primary rounded hover:bg-primary/95 transition-colors disabled:opacity-70 focus:outline-none">
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save Commission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALLOCATE SALARY PAYOUT MODAL */}
      {showPayoutModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Allocate Payment / Salary
              </h2>
              <button onClick={() => setShowPayoutModal(false)} className="text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePayoutSubmit} className="p-6 space-y-5">
              <div>
                <p className="text-[13px] text-gray-500 dark:text-slate-400 mb-4">
                  Allocate salary/payout to <span className="font-bold text-slate-800 dark:text-white">{selectedTeacher.full_name}</span> for sheet month <span className="font-bold text-slate-800 dark:text-white">{selectedMonth}</span>.
                </p>
                
                {selectedTeacher.all_time_balance !== undefined && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg text-xs text-amber-700 dark:text-amber-400 mb-4">
                    <strong>All-Time Outstanding Balance:</strong> LKR {selectedTeacher.all_time_balance.toFixed(2)}
                  </div>
                )}
                
                <label className="block text-[11px] font-bold text-gray-400 dark:text-slate-355 uppercase tracking-wider mb-1.5">Payout Amount (LKR)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="Enter payout amount..."
                  value={payoutForm.amount}
                  onChange={e => setPayoutForm({...payoutForm, amount: e.target.value})}
                  className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-slate-355 uppercase tracking-wider mb-1.5">Remarks / Receipt Info</label>
                <input 
                  type="text" 
                  placeholder="e.g., Bank Transfer, Monthly Salary..."
                  value={payoutForm.remarks}
                  onChange={e => setPayoutForm({...payoutForm, remarks: e.target.value})}
                  className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a] dark:text-white"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-150 dark:border-slate-800/80 mt-6">
                <button type="button" onClick={() => setShowPayoutModal(false)} className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1e293b] border border-gray-255 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors focus:outline-none">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded hover:bg-emerald-700 transition-colors disabled:opacity-70 focus:outline-none">
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Allocate Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED EARNING HISTORY MODAL */}
      {showHistoryModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/80">
              <div>
                <h2 className="text-[15px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" /> {selectedTeacher.full_name}'s General Ledger
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">Timeline of all gross earnings and monthly payout allocations.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDownloadHistory}
                  disabled={historyData.length === 0}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded text-[11px] font-bold border border-emerald-250 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6 bg-gray-50/20 dark:bg-[#0f172a]/20">
              {actionLoading ? (
                 <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
              ) : historyData.length === 0 ? (
                 <div className="py-16 text-center text-gray-500 dark:text-slate-400 text-[13px] italic bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">No ledger logs found.</div>
              ) : (
                <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-800/80 text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400">
                        <th className="py-3.5 px-4 font-bold border-b border-gray-200 dark:border-slate-700">Date</th>
                        <th className="py-3.5 px-4 font-bold border-b border-gray-200 dark:border-slate-700">Description</th>
                        <th className="py-3.5 px-4 font-bold border-b border-gray-200 dark:border-slate-700">Gross Sales</th>
                        <th className="py-3.5 px-4 font-bold border-b border-gray-200 dark:border-slate-700">Applied Commission</th>
                        <th className="py-3.5 px-4 font-bold border-b border-gray-200 dark:border-slate-700 text-right">Net Earning / Payout</th>
                      </tr>
                    </thead>
                    <tbody className="text-[12px] text-slate-600 dark:text-slate-300 divide-y divide-gray-150 dark:divide-slate-800/50">
                      {historyData.map((record) => {
                        const isPayout = parseFloat(record.net_earning) < 0;
                        return (
                          <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3.5 px-4 whitespace-nowrap">{new Date(record.created_at).toLocaleDateString()}</td>
                            <td className="py-3.5 px-4">
                              <span className="flex items-center gap-1.5">
                                {isPayout && <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />}
                                {record.description || '-'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium">LKR {parseFloat(record.amount).toFixed(2)}</td>
                            <td className="py-3.5 px-4">
                              {parseFloat(record.amount) > 0 ? (
                                record.commission_type === 'percentage' 
                                  ? `${parseFloat(record.commission_value)}%` 
                                  : `LKR ${parseFloat(record.commission_value).toFixed(2)}`
                              ) : '-'}
                            </td>
                            <td className={`py-3.5 px-4 text-right font-bold ${isPayout ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                              {isPayout ? '-' : ''}LKR {Math.abs(parseFloat(record.net_earning)).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-150 dark:border-slate-800/80 flex justify-end shrink-0 bg-white dark:bg-[#1e293b]">
               <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors focus:outline-none">
                 Close
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
