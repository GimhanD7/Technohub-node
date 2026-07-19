"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState, useMemo } from "react";
import { Users, Trash2, Shield, BookOpen, GraduationCap, Loader2, RefreshCw, Search, Plus, X, Edit3, ChevronLeft, ChevronRight, Filter, Ban, CheckCircle2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Modals & Dialogs
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  
  // Custom Alert / Confirm Dialog State
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'info', title: '', message: '', isAlertOnly: false, requirePassword: false, onConfirm: null, onCancel: null });
  const [currentUser, setCurrentUser] = useState(null);

  const showConfirm = (title, message, type, onConfirmAction, requirePassword = false) => {
    setDialogState({
      isOpen: true, title, message, type, isAlertOnly: false, requirePassword,
      onConfirm: (enteredPassword) => {
        setDialogState(s => ({ ...s, isOpen: false }));
        onConfirmAction(enteredPassword);
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

  // Form States
  const [formData, setFormData] = useState({ fullName: "", phoneNumber: "", email: "", birthdate: "", educationCategory: "", role: "student", password: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const loadUsers = async () => {
    setIsLoading(true);
    const data = await fetchApi("/user/get_users");
    if (data.success) {
      setUsers(data.users);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    }
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.phone_number || "").includes(searchQuery) ||
        (u.index_number || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const currentUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  const handleDelete = (id) => {
    showConfirm(
      "Delete User", 
      "Are you sure you want to delete this user? This action is permanent and cannot be undone.", 
      "error", 
      async (enteredPassword) => {
        setActionLoading(id);
        const data = await fetchApi("/user/delete_user", {
          method: "POST",
          body: JSON.stringify({ id, adminId: currentUser?.id, password: enteredPassword })
        });
        
        if (data.success) {
          setUsers(users.filter(u => u.id !== id));
          showAlert("Success", "User deleted successfully", "success");
        } else {
          showAlert("Deletion Failed", data.message, "error");
        }
        setActionLoading(null);
      },
      true
    );
  };

  const handleRoleChange = (phone, newRole, id) => {
    showConfirm(
      "Change Role", 
      `Are you sure you want to make this user a ${newRole}?`, 
      "warning", 
      async () => {
        setActionLoading(id);
        const data = await fetchApi(`/user/set_role?phone=${encodeURIComponent(phone)}&role=${encodeURIComponent(newRole)}`);
        if (data.success) {
          setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
        } else {
          showAlert("Update Failed", data.message, "error");
        }
        setActionLoading(null);
      }
    );
  };

  const handleToggleStatus = (user) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const isSuspending = newStatus === 'suspended';
    
    showConfirm(
      isSuspending ? "Suspend Account" : "Activate Account", 
      `Are you sure you want to ${isSuspending ? 'SUSPEND' : 'ACTIVATE'} this account? ${isSuspending ? 'The user will be immediately blocked from logging in.' : ''}`, 
      isSuspending ? "warning" : "success", 
      async () => {
        setActionLoading(user.id);
        const data = await fetchApi("/user/toggle_status", {
          method: "POST",
          body: JSON.stringify({ id: user.id, status: newStatus })
        });
        
        if (data.success) {
          setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        } else {
          showAlert("Status Update Failed", data.message, "error");
        }
        setActionLoading(null);
      }
    );
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    const data = await fetchApi("/user/add_user", {
      method: "POST",
      body: JSON.stringify(formData)
    });
    
    if (data.success) {
      setShowAddModal(false);
      setFormData({ fullName: "", phoneNumber: "", email: "", birthdate: "", educationCategory: "", role: "student", password: "" });
      loadUsers();
      showAlert("Success", "The user has been successfully created.", "success");
    } else {
      setFormError(data.message);
    }
    setFormLoading(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    const data = await fetchApi("/user/admin_update_user", {
      method: "POST",
      body: JSON.stringify({ id: editUser.id, ...formData })
    });
    
    if (data.success) {
      setEditUser(null);
      loadUsers();
      showAlert("Success", "User details have been successfully updated.", "success");
    } else {
      setFormError(data.message);
    }
    setFormLoading(false);
  };

  const openEditModal = (user) => {
    setFormData({
      fullName: user.full_name || "",
      phoneNumber: user.phone_number || "",
      email: user.email || "",
      birthdate: user.birthdate || "",
      educationCategory: user.education_category || "",
      role: user.role || "student",
      password: ""
    });
    setEditUser(user);
  };

  const openAddModal = () => {
    setFormData({ fullName: "", phoneNumber: "", email: "", birthdate: "", educationCategory: "", role: "student", password: "" });
    setShowAddModal(true);
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded text-[10px] font-bold uppercase tracking-wider border border-purple-200 dark:border-purple-900/50 w-max"><Shield className="w-3 h-3" /> Admin</span>;
      case 'teacher':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-900/50 w-max"><BookOpen className="w-3 h-3" /> Teacher</span>;
      case 'student':
      default:
        return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-900/50 w-max"><GraduationCap className="w-3 h-3" /> Student</span>;
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      
      <CustomDialog {...dialogState} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight">User Directory</h1>
          <p className="text-[13px] text-gray-500 dark:text-white mt-1">Manage platform access, roles, and user data.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadUsers} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 text-[12px] font-medium transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded shadow-sm hover:bg-primary/90 text-[12px] font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 dark:text-white absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-[#0f172a]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 dark:text-white" />
          <select 
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-[13px] border border-gray-200 dark:border-slate-800 rounded py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="teacher">Teachers</option>
            <option value="student">Students</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/30 shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400 dark:text-white" />
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">Users List ({filteredUsers.length})</h3>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-500 dark:text-white sticky top-0 z-10">
                <th className="py-3 px-5 font-bold">User</th>
                <th className="py-3 px-5 font-bold">Contact</th>
                <th className="py-3 px-5 font-bold">Role</th>
                <th className="py-3 px-5 font-bold">Status</th>
                <th className="py-3 px-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-600 dark:text-white divide-y divide-gray-100 dark:divide-slate-800/50">
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500 dark:text-white italic">No users found matching your filters.</td>
                </tr>
              ) : (
                currentUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-100 shrink-0">
                          {u.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{u.full_name}</p>
                          <p className="text-[11px] text-gray-400 dark:text-white font-mono mt-0.5">{u.index_number || 'N/A'}</p>
                          {u.education_category && <p className="text-[11px] text-primary mt-0.5 capitalize bg-primary/10 px-1.5 py-0.5 rounded w-max">{u.education_category}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <p className="text-slate-800 dark:text-white">{u.phone_number}</p>
                      {u.email && <p className="text-[11px] text-gray-400 dark:text-white mt-0.5">{u.email}</p>}
                    </td>
                    <td className="py-3 px-5">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="py-3 px-5">
                      {u.status === 'suspended' ? (
                        <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-[10px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/50">Suspended</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-900/50">Active</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        <button 
                          onClick={() => handleToggleStatus(u)}
                          disabled={actionLoading === u.id}
                          className={`p-1.5 rounded transition-colors disabled:opacity-50 ${u.status === 'suspended' ? 'text-green-500 hover:bg-green-50 hover:text-green-600' : 'text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600'}`}
                          title={u.status === 'suspended' ? "Activate Account" : "Suspend Account"}
                        >
                          {u.status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>

                        <button 
                          onClick={() => openEditModal(u)}
                          disabled={actionLoading === u.id}
                          className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 rounded transition-colors disabled:opacity-50"
                          title="Edit User"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>

                        <button 
                          onClick={() => handleDelete(u.id)}
                          disabled={actionLoading === u.id}
                          className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded transition-colors disabled:opacity-50"
                          title="Delete User"
                        >
                          {actionLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800/50 bg-white dark:bg-[#1e293b] flex items-center justify-between shrink-0">
          <p className="text-[12px] text-gray-500 dark:text-white">
            Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length}
          </p>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[12px] font-medium px-3 text-slate-600 dark:text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal Overlay */}
      {(showAddModal || editUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between bg-gray-50/80">
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-white">
                {editUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button 
                onClick={() => { setShowAddModal(false); setEditUser(null); }}
                className="text-gray-400 dark:text-white hover:text-slate-800 dark:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={editUser ? handleEditSubmit : handleAddSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 rounded bg-red-50 border border-red-200 dark:border-red-900/50 text-red-600 text-[12px] font-medium">{formError}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Phone Number *</label>
                  <input type="tel" required value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Email Address</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Date of Birth</label>
                  <input type="date" value={formData.birthdate} onChange={e => setFormData({...formData, birthdate: e.target.value})} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">System Role *</label>
                  <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none bg-white dark:bg-[#1e293b]">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Education Category</label>
                  <select value={formData.educationCategory} onChange={e => setFormData({...formData, educationCategory: e.target.value})} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none bg-white dark:bg-[#1e293b]">
                    <option value="">None</option>
                    <option value="school">School</option>
                    <option value="o/l">O/L</option>
                    <option value="a/l">A/L</option>
                    <option value="university">University</option>
                    <option value="vocational">Vocational</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Password</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editUser ? "Leave blank to keep current" : "Default: password123"} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800/50 mt-6">
                <button type="button" onClick={() => { setShowAddModal(false); setEditUser(null); }} className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-white bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
