"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet, Upload, Clock, CheckCircle, XCircle, AlertCircle, Eye, ArrowDown } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";

export default function StudentWalletPage() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [slipFile, setSlipFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayButton, setShowPayButton] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hide button when the recharge form is on screen
        setShowPayButton(!entry.isIntersecting);
      },
      { threshold: 0.1 } // Triggers when 10% of the form is visible
    );

    const formElement = document.getElementById("recharge-form");
    if (formElement) {
      observer.observe(formElement);
    }

    return () => {
      if (formElement) {
        observer.unobserve(formElement);
      }
    };
  }, [loading]); // re-run effect when loading finishes and elements are rendered

  const fetchWalletData = useCallback(async (userId) => {
    try {
      setLoading(true);
      const balanceRes = await fetch(`${API_BASE_URL}/wallet/balance?user_id=${userId}`);
      const balanceData = await balanceRes.json();
      if (balanceData.success) {
        setBalance(parseFloat(balanceData.balance));
      }

      const historyRes = await fetch(`${API_BASE_URL}/wallet/history?user_id=${userId}`);
      const historyData = await historyRes.json();
      if (historyData.success) {
        setTransactions(historyData.transactions);
      }
    } catch (error) {
      toast.error("Failed to load wallet data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        fetchWalletData(parsed.id);
      } else {
        setLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [fetchWalletData]);

  const handleRechargeSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!slipFile) {
      toast.error("Please upload a payment slip.");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("user_id", user.id);
      formData.append("amount", amount);
      if (reference) formData.append("reference", reference);
      formData.append("slip", slipFile);

      const res = await fetch(`${API_BASE_URL}/wallet/recharge`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setAmount("");
        setReference("");
        setSlipFile(null);
        document.getElementById("slipUpload").value = "";
        fetchWalletData(user.id);
      } else {
        toast.error(data.message || "Failed to submit recharge request.");
      }
    } catch (error) {
      toast.error("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "rejected": return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved": return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold uppercase tracking-wider">Approved</span>;
      case "rejected": return <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold uppercase tracking-wider">Rejected</span>;
      default: return <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-semibold uppercase tracking-wider">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Wallet</h1>
          <p className="text-sm text-slate-500 dark:text-white mt-1">Manage your balance and view transactions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Balance & Bank Details */}
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary-50 mb-2">
                <Wallet className="w-5 h-5" />
                <span className="font-medium">Wallet Balance</span>
              </div>
              <h2 className="text-4xl font-bold">LKR {balance.toFixed(2)}</h2>
            </div>
            <div className="mt-8">
              <p className="text-sm text-primary-100 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Upload a slip to recharge
              </p>
            </div>
          </div>

          {/* Bank Details Card */}
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              Bank Transfer Details
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Bank Name</p>
                <p className="text-[13px] font-bold text-slate-800 dark:text-white">Commercial Bank</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Account Name</p>
                <p className="text-[13px] font-bold text-slate-800 dark:text-white">Techno Hub Education</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Account Number</p>
                <p className="text-[15px] font-black text-blue-600 dark:text-blue-400 tracking-wider">1234 5678 9012</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
              <strong>Instructions:</strong> Please transfer the desired amount to the account above. Take a screenshot or photo of the payment slip and upload it in the recharge form.
            </p>
          </div>
        </div>

        {/* Recharge Form */}
        <div id="recharge-form" className="md:col-span-2 bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 scroll-mt-20">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recharge Points</h3>
          <form onSubmit={handleRechargeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">Payment Amount (LKR)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-colors"
                placeholder="Enter amount paid in LKR"
                min="1"
              />
              {amount > 0 && (
                <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> You will receive {amount} Points (1 LKR = 1 Point)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">Reference Number (Optional)</label>
              <input 
                type="text" 
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-colors"
                placeholder="e.g. Transaction ID, Bank Ref"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">Payment Slip</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-600 dark:text-white justify-center">
                    <label htmlFor="slipUpload" className="relative cursor-pointer bg-white dark:bg-[#1e293b] rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none">
                      <span>Upload a file</span>
                      <input id="slipUpload" name="slipUpload" type="file" className="sr-only" onChange={(e) => setSlipFile(e.target.files[0])} accept="image/*,.pdf" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-white">PNG, JPG, PDF up to 5MB</p>
                  {slipFile && <p className="text-sm text-emerald-600 font-medium mt-2">Selected: {slipFile.name}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Upload className="w-4 h-4" />}
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-white">No transactions found.</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-white">
                      {new Date(tx.created_at).toLocaleDateString()} <span className="text-slate-400 text-xs ml-1">{new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className={`text-sm font-medium ${tx.status === 'rejected' ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                          {tx.description}
                        </div>
                        {tx.status === 'rejected' && tx.description && tx.description !== 'Wallet Recharge Request' && (
                          <div className="text-xs text-red-500 mt-0.5">Admin Note</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'} LKR {parseFloat(tx.amount).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status)}
                        {getStatusBadge(tx.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {tx.payment_slip_url ? (
                        <a href={`${API_BASE_URL.replace('/api', '')}${tx.payment_slip_url}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded transition-colors" title="View Slip">
                          <Eye className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Sticky Pay Now Button */}
      <div className={`md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${showPayButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <button 
          onClick={() => {
            document.getElementById('recharge-form')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-primary text-white px-6 py-3 rounded-full font-bold shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] flex items-center gap-2 border border-blue-500/50 hover:bg-primary/90 transition-all animate-bounce"
        >
          Pay Now <ArrowDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
