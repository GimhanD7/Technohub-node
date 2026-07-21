"use client";

import { useState, useEffect } from "react";
import { Check, X, Clock, Eye, AlertCircle, TrendingUp, DollarSign, Trash2, KeyRound, Download, ChevronDown, ChevronUp, RefreshCw, Wallet, CreditCard, Building2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";

export default function AdminWalletPage() {
  const [admin, setAdmin] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, transactionId: null, action: null, reason: '', amount: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, transactionId: null, pin: '' });

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) {
      setAdmin(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (admin) {
      fetchTransactions();
      fetchStats();
    }
  }, [admin, activeTab]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/wallet/stats?role=admin`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats || data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const url = activeTab === "all" 
        ? `${API_BASE_URL}/wallet/history?role=admin`
        : `${API_BASE_URL}/wallet/history?role=admin&status=${activeTab}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      } else {
        toast.error("Failed to load transactions.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = (transactionId, action, amount = '') => {
    setConfirmModal({ isOpen: true, transactionId, action, reason: '', amount: action === 'approve' ? amount : '' });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, transactionId: null, action: null, reason: '', amount: '' });
  };

  const executeAction = async () => {
    const { transactionId, action, reason } = confirmModal;
    if (!transactionId || !action) return;
    
    if (action === 'reject' && !reason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/wallet/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admin_id: admin.id,
          transaction_id: transactionId,
          action: action,
          description: action === 'reject' ? reason : null,
          amount: action === 'approve' ? confirmModal.amount : null
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        closeConfirmModal();
        fetchTransactions(); // Refresh the list
        fetchStats(); // Refresh stats
      } else {
        toast.error(data.message || "Action failed.");
      }
    } catch (error) {
      toast.error("An error occurred while processing the request.");
    }
  };

  const openDeleteModal = (transactionId) => {
    setDeleteModal({ isOpen: true, transactionId, pin: '' });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, transactionId: null, pin: '' });
  };

  const executeDelete = async () => {
    const { transactionId, pin } = deleteModal;
    if (!transactionId || !pin) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/wallet/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admin_id: admin.id,
          transaction_id: transactionId,
          pin: pin,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        closeDeleteModal();
        fetchTransactions();
        fetchStats();
      } else {
        toast.error(data.message || "Failed to delete.");
      }
    } catch (error) {
      toast.error("An error occurred while processing the request.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved": return <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider">Approved</span>;
      case "rejected": return <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold uppercase tracking-wider">Rejected</span>;
      default: return <span className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-semibold uppercase tracking-wider">Pending</span>;
    }
  };

  const handleExportCSV = () => {
    if (!admin) return;
    const url = `${API_BASE_URL}/wallet/export_summary_csv?role=admin`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Wallet Approvals</h1>
          <p className="text-sm text-slate-500 dark:text-white mt-1">Review and manage student wallet recharge requests.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { fetchTransactions(); fetchStats(); }}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Summary (CSV)
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-1 grid grid-cols-1 sm:grid-cols-3 gap-1">
        <Link href="/dashboard/admin/wallet" className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13px] font-bold bg-primary text-white shadow-sm">
          <Wallet className="w-4 h-4" />
          Wallet Approvals
        </Link>
        <Link href="/dashboard/admin/wallet-credits" className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13px] font-bold text-slate-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
          <CreditCard className="w-4 h-4" />
          User Wallet Credits
        </Link>
        <Link href="/dashboard/admin/bank-details" className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13px] font-bold text-slate-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
          <Building2 className="w-4 h-4" />
          Bank Accounts
        </Link>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
               <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-white uppercase tracking-wider">This Month Approved</h3>
                  <DollarSign className="w-5 h-5 text-emerald-500" />
               </div>
               <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">LKR {stats.thisMonthApproved.toFixed(2)}</h2>
               <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center gap-1">
                 <Check className="w-4 h-4" /> Added to wallets
               </p>
            </div>
            <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
               <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-white uppercase tracking-wider">This Month Pending</h3>
                  <Clock className="w-5 h-5 text-amber-500" />
               </div>
               <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">LKR {stats.thisMonthPending.toFixed(2)}</h2>
               <p className="text-sm text-amber-600 mt-2 font-medium flex items-center gap-1">
                 Awaiting your approval
               </p>
            </div>
            <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
               <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-white uppercase tracking-wider">Historical Trend</h3>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
               </div>
               <div className="space-y-3 mt-2">
                  {stats.monthlyTrend.slice(0, 3).map((month, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-white">{month.month_name}</span>
                      <span className="font-bold text-slate-800 dark:text-white">LKR {parseFloat(month.total).toFixed(2)}</span>
                    </div>
                  ))}
                  {stats.monthlyTrend.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-white">No historical data yet.</p>
                  )}
               </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'pending' ? 'text-primary border-b-2 border-primary bg-white dark:bg-[#1e293b]' : 'text-slate-500 dark:text-white hover:text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
          >
            Pending Requests
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'approved' ? 'text-primary border-b-2 border-primary bg-white dark:bg-[#1e293b]' : 'text-slate-500 dark:text-white hover:text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'rejected' ? 'text-primary border-b-2 border-primary bg-white dark:bg-[#1e293b]' : 'text-slate-500 dark:text-white hover:text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
          >
            Rejected
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'all' ? 'text-primary border-b-2 border-primary bg-white dark:bg-[#1e293b]' : 'text-slate-500 dark:text-white hover:text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
          >
            All History
          </button>
          <button
            onClick={() => { fetchTransactions(); fetchStats(); }}
            className="px-4 py-4 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors border-l border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-sm font-medium"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Content */}
        <div className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[15%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
                <col className="w-[17%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
                <col className="w-[19%]" />
              </colgroup>
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-4 text-left text-[11px] font-semibold text-slate-500 dark:text-white uppercase tracking-wide">Date</th>
                  <th className="px-3 py-4 text-left text-[11px] font-semibold text-slate-500 dark:text-white uppercase tracking-wide">Student</th>
                  <th className="px-3 py-4 text-left text-[11px] font-semibold text-slate-500 dark:text-white uppercase tracking-wide">Amount</th>
                  <th className="px-3 py-4 text-left text-[11px] font-semibold text-slate-500 dark:text-white uppercase tracking-wide">Reference</th>
                  <th className="px-3 py-4 text-left text-[11px] font-semibold text-slate-500 dark:text-white uppercase tracking-wide">Description/Reason</th>
                  <th className="px-3 py-4 text-left text-[11px] font-semibold text-slate-500 dark:text-white uppercase tracking-wide">Status</th>
                  <th className="px-3 py-4 text-center text-[11px] font-semibold text-slate-500 dark:text-white uppercase tracking-wide">Slip</th>
                  <th className="px-3 py-4 text-right text-[11px] font-semibold text-slate-500 dark:text-white uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center text-slate-500 dark:text-white">
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                        <p>No transactions found for this filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                      <td className="px-3 py-4">
                        <div className="text-sm text-slate-800 dark:text-white">{new Date(tx.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500 dark:text-white">{new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-3 py-4 min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{tx.user_name}</div>
                        <div className="text-xs text-slate-500 dark:text-white">{tx.phone_number}</div>
                        {tx.wallet_balance !== undefined && (
                          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">Bal: LKR {tx.wallet_balance.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm font-bold text-slate-800 dark:text-white">
                          LKR {parseFloat(tx.amount).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-3 py-4 min-w-0">
                        <div className="text-xs text-slate-600 dark:text-white font-mono break-words">
                          {tx.reference_number || <span className="text-slate-400 italic">None</span>}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-xs text-slate-600 dark:text-white break-words whitespace-normal">
                          {tx.description || <span className="text-slate-400 italic">No description</span>}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="px-3 py-4 text-center">
                        {tx.payment_slip_url ? (
                          <a href={`${API_BASE_URL.replace('/api', '')}${tx.payment_slip_url}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                            <Eye className="w-4 h-4" /> View
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {tx.status === 'pending' ? (
                            <>
                              <button 
                                onClick={() => openConfirmModal(tx.id, 'approve', tx.amount)}
                                className="px-2 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" /> Approve
                              </button>
                              <button 
                                onClick={() => openConfirmModal(tx.id, 'reject')}
                                className="px-2 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                              >
                                <X className="w-4 h-4" /> Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 uppercase font-semibold mr-2">Processed</span>
                          )}
                          <button 
                            onClick={() => openDeleteModal(tx.id)}
                            className="p-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 rounded transition-colors"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-full ${confirmModal.action === 'approve' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 text-red-600'}`}>
                  {confirmModal.action === 'approve' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    {confirmModal.action === 'approve' ? 'Approve Transaction' : 'Reject Transaction'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-white">
                    Are you sure you want to {confirmModal.action} this transaction?
                  </p>
                </div>
              </div>
              
              {confirmModal.action === 'reject' && (
                <div className="mt-4 mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rejection Reason</label>
                  <textarea 
                    value={confirmModal.reason}
                    onChange={(e) => setConfirmModal({...confirmModal, reason: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors text-sm resize-none h-20 dark:text-white"
                    placeholder="Enter reason for rejection..."
                  />
                </div>
              )}

              {confirmModal.action === 'approve' && (
                <div className="mt-4 mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Approval Amount (LKR)</label>
                  <input 
                    type="number"
                    value={confirmModal.amount}
                    onChange={(e) => setConfirmModal({...confirmModal, amount: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-sm dark:text-white"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">You can adjust the amount before approving.</p>
                </div>
              )}
              
              <div className="flex items-center justify-end gap-3 mt-6">
                <button 
                  onClick={closeConfirmModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeAction}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    confirmModal.action === 'approve' 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Yes, {confirmModal.action} it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Delete Transaction
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-white">
                    Enter PIN to confirm deletion.
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Security PIN</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={deleteModal.pin}
                    onChange={(e) => setDeleteModal({...deleteModal, pin: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                    placeholder="Enter PIN"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6">
                <button 
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDelete}
                  disabled={!deleteModal.pin}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
