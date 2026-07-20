"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { fetchApi } from "@/lib/api";
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Loader2, RefreshCw, EyeOff, Eye, Wallet, CreditCard } from "lucide-react";
import { CustomDialog } from "@/components/ui/CustomDialog";
import Link from "next/link";

export default function BankDetailsManager() {
  const [banks, setBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
    is_hidden: false
  });

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

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    setIsLoading(true);
    const data = await fetchApi("/bank/get_all");
    if (data.success) setBanks(data.bankDetails);
    else toast.error(data.message || "Failed to load bank details");
    setIsLoading(false);
  };

  const handleOpenModal = (bank = null) => {
    if (bank) {
      setEditId(bank.id);
      setFormData({
        bank_name: bank.bank_name,
        account_name: bank.account_name,
        account_number: bank.account_number,
        is_hidden: Boolean(bank.is_hidden)
      });
    } else {
      if (banks.length >= 5) {
        toast.error("Maximum of 5 bank accounts allowed.");
        return;
      }
      setEditId(null);
      setFormData({
        bank_name: "",
        account_name: "",
        account_number: "",
        is_hidden: false
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const endpoint = editId ? "/bank/update" : "/bank/add";
    const payload = editId ? { id: editId, ...formData } : formData;

    const data = await fetchApi(endpoint, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (data.success) {
      toast.success(data.message);
      setShowModal(false);
      loadBanks();
    } else {
      toast.error(data.message || "Failed to save bank details");
    }
    setIsSubmitting(false);
  };

  const handleDelete = (id) => {
    showConfirm(
      "Delete Bank Account",
      "Are you sure you want to delete this bank account?",
      "error",
      async () => {
        const data = await fetchApi("/bank/delete", {
          method: "POST",
          body: JSON.stringify({ id })
        });
        if (data.success) {
          toast.success("Bank account deleted successfully");
          loadBanks();
        } else {
          toast.error(data.message || "Failed to delete bank account");
        }
      }
    );
  };

  const toggleStatus = async (id, currentHidden) => {
    const data = await fetchApi("/bank/toggle_status", {
      method: "POST",
      body: JSON.stringify({ id, is_hidden: !currentHidden })
    });
    if (data.success) {
      toast.success("Status updated");
      loadBanks();
    } else {
      toast.error("Failed to update status");
    }
  };

  if (isLoading && banks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <CustomDialog {...dialogState} />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight">Wallet Manager</h1>
          <p className="text-[13px] text-gray-500 dark:text-white mt-1">Manage recharge requests, wallet credits, and bank transfer accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadBanks} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[12px] font-medium transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => handleOpenModal()} 
            disabled={banks.length >= 5}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded shadow-sm hover:bg-primary/90 text-[12px] font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Add Bank Account
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-1 grid grid-cols-1 sm:grid-cols-3 gap-1">
        <Link href="/dashboard/admin/wallet" className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13px] font-bold text-slate-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
          <Wallet className="w-4 h-4" />
          Wallet Approvals
        </Link>
        <Link href="/dashboard/admin/wallet-credits" className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13px] font-bold text-slate-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
          <CreditCard className="w-4 h-4" />
          User Wallet Credits
        </Link>
        <Link href="/dashboard/admin/bank-details" className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13px] font-bold bg-primary text-white shadow-sm">
          <Eye className="w-4 h-4" />
          Bank Accounts
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Accounts</p>
          <p className="mt-2 text-2xl font-black text-slate-800 dark:text-white">{banks.length}/5</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Visible to Students</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{banks.filter((bank) => !bank.is_hidden).length}</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hidden Accounts</p>
          <p className="mt-2 text-2xl font-black text-slate-500">{banks.filter((bank) => bank.is_hidden).length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 sticky top-0 z-10">
                <th className="py-3 px-5 font-bold">Bank Name</th>
                <th className="py-3 px-5 font-bold">Account Name</th>
                <th className="py-3 px-5 font-bold">Account Number</th>
                <th className="py-3 px-5 font-bold">Status</th>
                <th className="py-3 px-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-600 dark:text-slate-300 divide-y divide-gray-100 dark:divide-slate-800/50">
              {banks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500 dark:text-gray-400 italic">No bank accounts configured.</td>
                </tr>
              ) : (
                banks.map(bank => (
                  <tr key={bank.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-5 font-medium">{bank.bank_name}</td>
                    <td className="py-4 px-5">{bank.account_name}</td>
                    <td className="py-4 px-5 font-mono">{bank.account_number}</td>
                    <td className="py-4 px-5">
                      <button 
                        onClick={() => toggleStatus(bank.id, bank.is_hidden)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${!bank.is_hidden ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50' : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-700'}`}
                      >
                        {!bank.is_hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {!bank.is_hidden ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleOpenModal(bank)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(bank.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
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
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">{editId ? 'Edit Bank Account' : 'Add Bank Account'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Bank Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.bank_name}
                  onChange={e => setFormData({...formData, bank_name: e.target.value})}
                  className="w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] dark:text-white transition-all"
                  placeholder="e.g. Bank of Ceylon"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Account Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.account_name}
                  onChange={e => setFormData({...formData, account_name: e.target.value})}
                  className="w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] dark:text-white transition-all"
                  placeholder="e.g. Techno Hub Pvt Ltd"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Account Number *</label>
                <input 
                  type="text" 
                  required
                  value={formData.account_number}
                  onChange={e => setFormData({...formData, account_number: e.target.value})}
                  className="w-full px-3 py-2 text-[13px] border border-gray-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] dark:text-white transition-all"
                  placeholder="e.g. 1234567890"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={!formData.is_hidden}
                  onChange={e => setFormData({...formData, is_hidden: !e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-[13px] text-slate-700 dark:text-slate-300 cursor-pointer">
                  Visible to students
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-[13px] font-medium text-slate-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {editId ? 'Save Changes' : 'Add Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
