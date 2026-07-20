"use client";

import { useState, useEffect } from "react";
import { Users, Search, DollarSign, Lock, KeyRound, Edit2, Check, X, PlusCircle, History, ArrowUpRight, ArrowDownRight, Clock, RefreshCw, Wallet, CreditCard, Building2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";

export default function AdminWalletCreditsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pin, setPin] = useState("");
  const [admin, setAdmin] = useState(null);
  const [editModal, setEditModal] = useState({ isOpen: false, user: null, amount: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkModal, setBulkModal] = useState({ isOpen: false, amount: '' });
  const [historyModal, setHistoryModal] = useState({ isOpen: false, user: null, transactions: [], loading: false });

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) {
      setAdmin(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchUsers();
    }
  }, [isAuthorized]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/user/get_users`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        toast.error(data.message || "Failed to load users.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
    toast.success("User list refreshed!");
  };

  const filteredUsers = users.filter(user => 
    (user.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (user.phone_number || "").includes(searchTerm) ||
    (user.index_number || "").includes(searchTerm)
  );

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (id) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pin === '7845') {
      setIsAuthorized(true);
    } else {
      toast.error("Incorrect Security PIN.");
      setPin("");
    }
  };

  const openEditModal = (user) => {
    setEditModal({ isOpen: true, user: user, amount: user.wallet_balance || 0 });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, user: null, amount: '' });
  };

  const handleUpdateBalance = async () => {
    if (!editModal.user || !admin) return;
    
    if (editModal.amount === '' || isNaN(editModal.amount) || Number(editModal.amount) < 0) {
      toast.error("Please enter a valid positive number.");
      return;
    }

    try {
      setIsUpdating(true);
      const res = await fetch(`${API_BASE_URL}/wallet/update_balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: admin.id,
          target_user_id: editModal.user.id,
          new_balance: editModal.amount
        })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        closeEditModal();
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to update balance.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setIsUpdating(false);
    }
  };

  const openBulkModal = () => {
    setBulkModal({ isOpen: true, amount: '' });
  };

  const closeBulkModal = () => {
    setBulkModal({ isOpen: false, amount: '' });
  };

  const handleBulkAdd = async () => {
    if (!admin || selectedUsers.length === 0) return;
    
    if (bulkModal.amount === '' || isNaN(bulkModal.amount) || Number(bulkModal.amount) <= 0) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }

    try {
      setIsUpdating(true);
      const res = await fetch(`${API_BASE_URL}/wallet/bulk_add_credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: admin.id,
          users: selectedUsers,
          amount: bulkModal.amount
        })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        closeBulkModal();
        setSelectedUsers([]);
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to add credits.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setIsUpdating(false);
    }
  };

  const openHistoryModal = async (user) => {
    setHistoryModal({ isOpen: true, user: user, transactions: [], loading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/wallet/history?user_id=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setHistoryModal({ isOpen: true, user: user, transactions: data.transactions, loading: false });
      } else {
        toast.error(data.message || "Failed to load history.");
        setHistoryModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      toast.error("An error occurred fetching history.");
      setHistoryModal(prev => ({ ...prev, loading: false }));
    }
  };

  const closeHistoryModal = () => {
    setHistoryModal({ isOpen: false, user: null, transactions: [], loading: false });
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto mt-20">
        
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Restricted Access</h2>
          <p className="text-sm text-slate-500 dark:text-white mb-8">Enter the administrative PIN to view user wallet balances.</p>
          
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div className="relative max-w-xs mx-auto">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-colors text-center text-lg tracking-[0.5em] font-mono"
                placeholder="••••"
                autoFocus
                maxLength={4}
              />
            </div>
            <button 
              type="submit"
              disabled={pin.length < 4}
              className="w-full max-w-xs mx-auto block px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Verify & Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            User Wallet Credits
          </h1>
          <p className="text-sm text-slate-500 dark:text-white mt-1">View the current wallet credit balance for all registered users.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            title="Refresh user list"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          {selectedUsers.length > 0 && (
            <button 
              onClick={openBulkModal}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Add Credits to {selectedUsers.length} User(s)
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-1 grid grid-cols-1 sm:grid-cols-3 gap-1">
        <Link href="/dashboard/admin/wallet" className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13px] font-bold text-slate-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
          <Wallet className="w-4 h-4" />
          Wallet Approvals
        </Link>
        <Link href="/dashboard/admin/wallet-credits" className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13px] font-bold bg-primary text-white shadow-sm">
          <CreditCard className="w-4 h-4" />
          User Wallet Credits
        </Link>
        <Link href="/dashboard/admin/bank-details" className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13px] font-bold text-slate-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
          <Building2 className="w-4 h-4" />
          Bank Accounts
        </Link>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, or index number..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-colors"
            />
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">User Info</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Wallet Balance</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-white">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors ${selectedUsers.includes(user.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-800 dark:text-white">{user.full_name}</div>
                        <div className="text-xs text-slate-500 dark:text-white font-mono mt-0.5">{user.index_number || 'No ID'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 dark:text-white">{user.email}</div>
                        <div className="text-xs text-slate-500 dark:text-white mt-0.5">{user.phone_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          user.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                          user.role === 'teacher' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                          'bg-slate-100 text-slate-600 dark:text-white'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-lg font-bold text-emerald-600">
                          LKR {parseFloat(user.wallet_balance || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openHistoryModal(user)}
                            className="p-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                            title="View History"
                          >
                            <History className="w-3.5 h-3.5" /> History
                          </button>
                          <button 
                            onClick={() => openEditModal(user)}
                            className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                            title="Edit Balance"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
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

      {/* Edit Balance Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Wallet Balance</h3>
                <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600 dark:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4 text-sm text-slate-600 dark:text-white bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
                Editing balance for <span className="font-bold text-slate-800 dark:text-white">{editModal.user?.full_name}</span>
                <div className="text-xs text-slate-500 dark:text-white mt-1">{editModal.user?.email}</div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">New Balance (LKR)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={editModal.amount}
                    onChange={(e) => setEditModal({...editModal, amount: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-colors"
                    placeholder="Enter new balance"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6">
                <button 
                  onClick={closeEditModal}
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateBalance}
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                >
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Balance Modal */}
      {bulkModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Bulk Add Credits</h3>
                <button onClick={closeBulkModal} className="text-slate-400 hover:text-slate-600 dark:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4 text-sm text-slate-600 dark:text-white bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100">
                You are adding credits to <span className="font-bold">{selectedUsers.length} selected user(s)</span>. 
                This amount will be added on top of their existing balance.
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount to Add (LKR)</label>
                <div className="relative">
                  <PlusCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input 
                    type="number" 
                    value={bulkModal.amount}
                    onChange={(e) => setBulkModal({...bulkModal, amount: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                    placeholder="Enter amount to add"
                    min="1"
                    step="1"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6">
                <button 
                  onClick={closeBulkModal}
                  disabled={isUpdating}
                  // className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkAdd}
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                >
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Add to Wallets
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User History Modal */}
      {historyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Transaction History</h3>
                  <p className="text-sm text-slate-500 dark:text-white">
                    <span className="font-bold">{historyModal.user?.full_name}</span> • LKR {parseFloat(historyModal.user?.wallet_balance || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <button onClick={closeHistoryModal} className="text-slate-400 hover:text-slate-600 dark:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 bg-slate-50/50 flex-1">
              {historyModal.loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : historyModal.transactions.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-white font-medium">No transactions found for this user.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyModal.transactions.map((tx) => (
                    <div key={tx.id} className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'credit' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 text-red-600'
                        }`}>
                          {tx.type === 'credit' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {tx.type === 'credit' ? 'Credited' : 'Debited'}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                              tx.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                              tx.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                              'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                            }`}>
                              {tx.status}
                            </span>
                          </p>

                          <p className="text-xs text-slate-500 dark:text-white mt-0.5">{new Date(tx.created_at).toLocaleString()}</p>
                          {tx.description && (
                            <p className="text-xs text-slate-600 dark:text-white mt-1.5 italic bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded inline-block">{tx.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? '+' : '-'} LKR {parseFloat(tx.amount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 flex justify-end shrink-0 bg-white dark:bg-[#1e293b]">
              <button 
                onClick={closeHistoryModal}
                className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
