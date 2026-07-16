"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState, useMemo } from "react";
import { DollarSign, Search, Loader2, RefreshCw, Settings2, History, X, CheckCircle2 } from "lucide-react";
import { fetchApi, BASE_URL } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";

export default function TeacherEarnings() {
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'info', title: '', message: '', isAlertOnly: false, onConfirm: null, onCancel: null });
  
  // Modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  
  // Forms and History data
  const [configData, setConfigData] = useState({ commission_type: 'percentage', commission_value: '80' });
  const [historyData, setHistoryData] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    loadTeachers();
  }, []);

  const filteredTeachers = useMemo(() => {
    if (!Array.isArray(teachers)) return [];
    return teachers.filter(t => {
      if (!t) return false;
      return (t.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
             (t.subject || "").toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [teachers, searchQuery]);

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <CustomDialog {...dialogState} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" /> Teacher Earnings
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-1">Manage commissions and view earnings history for teachers.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadTeachers} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[12px] font-medium transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search teachers..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-[#0f172a]"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 sticky top-0 z-10">
                <th className="py-3 px-5 font-bold">Teacher Info</th>
                <th className="py-3 px-5 font-bold">Commission Setup</th>
                <th className="py-3 px-5 font-bold">Total Earnings</th>
                <th className="py-3 px-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-600 dark:text-slate-300 divide-y divide-gray-100 dark:divide-slate-800/50">
              {isLoading && teachers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center">
                    <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-gray-500 dark:text-slate-400 italic">No teachers found.</td>
                </tr>
              ) : (
                filteredTeachers.map((t, index) => (
                  <tr key={t?.id || index} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {t?.profile_picture ? (
                           <img src={t.profile_picture.startsWith('http') ? t.profile_picture : `${BASE_URL}${t.profile_picture.startsWith('/') ? '' : '/'}${t.profile_picture}`} alt={t.full_name || 'Teacher'} className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400 flex items-center justify-center font-bold border border-blue-100 dark:border-blue-800 shrink-0">
                            {t?.full_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{t?.full_name || 'Unknown'}</p>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{t?.subject || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        {t.commission_type === 'percentage' ? (
                          <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-bold tracking-wide border border-indigo-200 dark:border-indigo-800/50">
                            Percentage ({parseFloat(t.commission_value)}%)
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold tracking-wide border border-emerald-200 dark:border-emerald-800/50">
                            Fixed (LKR {parseFloat(t.commission_value).toFixed(2)})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <p className="font-bold text-slate-800 dark:text-white">LKR {parseFloat(t.total_earnings).toFixed(2)}</p>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openHistoryModal(t)}
                          className="px-3 py-1.5 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-[11px] font-semibold transition-colors"
                        >
                          <History className="w-3.5 h-3.5" /> History
                        </button>
                        <button 
                          onClick={() => openConfigModal(t)}
                          className="px-3 py-1.5 flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-[11px] font-semibold transition-colors"
                        >
                          <Settings2 className="w-3.5 h-3.5" /> Edit
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

      {/* Config Modal */}
      {showConfigModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-white">Commission Settings</h2>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleConfigSubmit} className="p-6 space-y-5">
              <div>
                <p className="text-[13px] text-gray-500 dark:text-slate-400 mb-4">Set the commission payout structure for <span className="font-bold text-slate-800 dark:text-white">{selectedTeacher.full_name}</span>.</p>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider mb-1.5">Commission Type</label>
                <select 
                  value={configData.commission_type} 
                  onChange={e => setConfigData({...configData, commission_type: e.target.value})}
                  className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a] dark:text-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (LKR)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider mb-1.5">Value</label>
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
                    className="w-full pl-10 pr-3 py-2.5 text-[13px] border border-gray-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a] dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800/50 mt-6">
                <button type="button" onClick={() => setShowConfigModal(false)} className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors focus:outline-none">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors disabled:opacity-70 focus:outline-none">
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[16px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" /> {selectedTeacher.full_name}'s Earnings History
                </h2>
                <p className="text-[12px] text-gray-500 dark:text-slate-400 mt-0.5">Read-only history of all payouts.</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6 bg-gray-50/30 dark:bg-slate-900/30">
              {actionLoading ? (
                 <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
              ) : historyData.length === 0 ? (
                 <div className="py-12 text-center text-gray-500 dark:text-slate-400 text-[13px] italic bg-white dark:bg-[#1e293b] rounded border border-gray-200 dark:border-slate-800">No earnings history found for this teacher.</div>
              ) : (
                <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-800 text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400">
                        <th className="py-3 px-4 font-bold border-b border-gray-200 dark:border-slate-700">Date</th>
                        <th className="py-3 px-4 font-bold border-b border-gray-200 dark:border-slate-700">Description</th>
                        <th className="py-3 px-4 font-bold border-b border-gray-200 dark:border-slate-700">Gross Earning</th>
                        <th className="py-3 px-4 font-bold border-b border-gray-200 dark:border-slate-700">Commission Applied</th>
                        <th className="py-3 px-4 font-bold border-b border-gray-200 dark:border-slate-700 text-right">Net Payout</th>
                      </tr>
                    </thead>
                    <tbody className="text-[12px] text-slate-600 dark:text-slate-300 divide-y divide-gray-100 dark:divide-slate-800/50">
                      {historyData.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">{new Date(record.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4">{record.description || '-'}</td>
                          <td className="py-3 px-4 font-medium">LKR {parseFloat(record.amount).toFixed(2)}</td>
                          <td className="py-3 px-4">
                            {record.commission_type === 'percentage' 
                                ? `${parseFloat(record.commission_value)}%` 
                                : `LKR ${parseFloat(record.commission_value).toFixed(2)} Fixed`}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-white">
                            LKR {parseFloat(record.net_earning).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800/50 flex justify-end shrink-0 bg-white dark:bg-[#1e293b]">
               <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors focus:outline-none">
                 Close
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
