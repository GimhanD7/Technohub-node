"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Users, Trash2, Shield, BookOpen, GraduationCap, Loader2, RefreshCw, Search, Plus, X, Edit3, ChevronLeft, ChevronRight, Filter, Ban, CheckCircle2, Activity, Eye, Wallet, MapPin, Calendar, Clock, Mail, Phone, Hash, Award, Briefcase, MonitorPlay, MoreVertical, ArrowUpDown } from "lucide-react";
import { fetchApi, BASE_URL } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";
import { digitsOnly, getEmailError, getPasswordError, getPhoneError, normalizeEmail } from "@/lib/validation";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [educationFilter, setEducationFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "full_name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [openActionMenu, setOpenActionMenu] = useState(null);

  // Modals & Dialogs
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  
  // Custom Alert / Confirm Dialog State
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'info', title: '', message: '', isAlertOnly: false, requirePassword: false, onConfirm: null, onCancel: null });
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

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

  const validateFormData = () => {
    if (!formData.fullName.trim()) return "Full name is required.";

    const phoneError = getPhoneError(formData.phoneNumber);
    if (phoneError) return phoneError;

    const emailError = getEmailError(formData.email);
    if (emailError) return emailError;

    const passwordError = getPasswordError(formData.password);
    if (passwordError) return passwordError;

    return "";
  };

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

  const userCounts = useMemo(() => ({
    total: users.length,
    students: users.filter(user => user.role === "student").length,
    teachers: users.filter(user => user.role === "teacher").length,
    suspended: users.filter(user => user.status === "suspended").length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    const filtered = users.filter(u => {
      const matchesSearch = 
        (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.phone_number || "").includes(searchQuery) ||
        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.index_number || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? u.status !== "suspended" : u.status === "suspended");
      const matchesEducation = educationFilter === "all" || u.education_category === educationFilter;
      return matchesSearch && matchesRole && matchesStatus && matchesEducation;
    });

    return filtered.sort((first, second) => {
      const firstValue = String(first[sortConfig.key] || "").toLowerCase();
      const secondValue = String(second[sortConfig.key] || "").toLowerCase();
      const result = firstValue.localeCompare(secondValue, undefined, { numeric: true });
      return sortConfig.direction === "asc" ? result : -result;
    });
  }, [users, searchQuery, roleFilter, statusFilter, educationFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const currentUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, educationFilter, usersPerPage]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    setEducationFilter("all");
  };

  const hasActiveFilters = Boolean(searchQuery || roleFilter !== "all" || statusFilter !== "all" || educationFilter !== "all");


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
          toast.success(isSuspending ? "Account suspended!" : "Account activated!");
        } else {
          toast.error(data.message || "Status update failed.");
        }
        setActionLoading(null);
      }
    );
  };

  const handleDeleteUser = (user) => {
    // Only allow deletion of students
    if (user.role !== 'student') {
      toast.error("Only student accounts can be deleted.");
      return;
    }

    showConfirm(
      "Delete Student Account",
      `Are you sure you want to permanently delete ${user.full_name}'s account? This action cannot be undone. You'll need to enter your admin password to confirm.`,
      "warning",
      async (password) => {
        if (!password) {
          toast.error("Admin password is required.");
          return;
        }

        setActionLoading(user.id);
        const data = await fetchApi("/user/delete_user", {
          method: "POST",
          body: JSON.stringify({
            id: user.id,
            adminId: currentUser?.id,
            password: password
          })
        });

        if (data.success) {
          toast.success("Student account deleted successfully!");
          loadUsers();
        } else {
          toast.error(data.message || "Failed to delete user account.");
        }
        setActionLoading(null);
      },
      true // requirePassword = true
    );
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const validationError = validateFormData();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormLoading(true);
    const data = await fetchApi("/user/add_user", {
      method: "POST",
      body: JSON.stringify({ ...formData, email: normalizeEmail(formData.email) })
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
    const validationError = validateFormData();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormLoading(true);
    const data = await fetchApi("/user/admin_update_user", {
      method: "POST",
      body: JSON.stringify({ id: editUser.id, ...formData, email: normalizeEmail(formData.email) })
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

  const handleViewProfile = useCallback(async (userId) => {
    setProfileLoading(true);
    setProfileUser(null);
    setProfileStats(null);
    const data = await fetchApi(`/user/get_user_profile?id=${userId}`);
    if (data.success) {
      setProfileUser(data.user);
      setProfileStats(data.stats);
    } else {
      toast.error(data.message || "Failed to load user profile.");
    }
    setProfileLoading(false);
  }, []);

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

      {/* Account Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: userCounts.total, icon: Users, tone: "text-slate-600 dark:text-slate-300", iconBg: "bg-slate-100 dark:bg-slate-800" },
          { label: "Students", value: userCounts.students, icon: GraduationCap, tone: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Teachers", value: userCounts.teachers, icon: BookOpen, tone: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Suspended", value: userCounts.suspended, icon: Ban, tone: "text-red-600 dark:text-red-400", iconBg: "bg-red-50 dark:bg-red-500/10" },
        ].map(({ label, value, icon: Icon, tone, iconBg }) => (
          <div key={label} className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p><p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p></div>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconBg} ${tone}`}><Icon className="w-5 h-5" /></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="relative w-full xl:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 dark:text-white absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-[#0f172a]"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full xl:w-auto xl:ml-auto">
          <select 
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-[12px] border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-slate-900 dark:text-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="teacher">Teachers</option>
            <option value="student">Students</option>
          </select>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="text-[12px] border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-slate-900 dark:text-white">
            <option value="all">All Statuses</option><option value="active">Active</option><option value="suspended">Suspended</option>
          </select>
          <select value={educationFilter} onChange={event => setEducationFilter(event.target.value)} className="text-[12px] border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-slate-900 dark:text-white">
            <option value="all">All Education</option><option value="school">School</option><option value="o/l">O/L</option><option value="a/l">A/L</option><option value="university">University</option><option value="vocational">Vocational</option><option value="professional">Professional</option>
          </select>
        </div>
        </div>
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {searchQuery && <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">Search: {searchQuery}</span>}
            {roleFilter !== "all" && <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold capitalize">Role: {roleFilter}</span>}
            {statusFilter !== "all" && <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold capitalize">Status: {statusFilter}</span>}
            {educationFilter !== "all" && <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold capitalize">Education: {educationFilter}</span>}
            <button type="button" onClick={clearFilters} className="ml-auto text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500">Clear filters</button>
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Users className="w-4 h-4" /></div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">User library</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{filteredUsers.length} {filteredUsers.length === 1 ? "account" : "accounts"} shown</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead className="bg-slate-50/90 dark:bg-slate-900/40">
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 sticky top-0 z-10">
                <th className="py-3.5 px-5 font-bold"><button type="button" onClick={() => handleSort("full_name")} className={`inline-flex items-center gap-1.5 hover:text-primary ${sortConfig.key === "full_name" ? "text-primary" : ""}`}>User details <ArrowUpDown className="w-3.5 h-3.5" /></button></th>
                <th className="py-3.5 px-5 font-bold"><button type="button" onClick={() => handleSort("phone_number")} className={`inline-flex items-center gap-1.5 hover:text-primary ${sortConfig.key === "phone_number" ? "text-primary" : ""}`}>Contact <ArrowUpDown className="w-3.5 h-3.5" /></button></th>
                <th className="py-3 px-5 font-bold"><button type="button" onClick={() => handleSort("role")} className={`inline-flex items-center gap-1.5 hover:text-primary ${sortConfig.key === "role" ? "text-primary" : ""}`}>Role <ArrowUpDown className="w-3.5 h-3.5" /></button></th>
                <th className="py-3 px-5 font-bold"><button type="button" onClick={() => handleSort("status")} className={`inline-flex items-center gap-1.5 hover:text-primary ${sortConfig.key === "status" ? "text-primary" : ""}`}>Status <ArrowUpDown className="w-3.5 h-3.5" /></button></th>
                <th className="py-3 px-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-600 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-800/70">
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center"><Users className="w-5 h-5" /></div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">No users found</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">Try changing your search term or role filter.</p>
                  </td>
                </tr>
              ) : (
                currentUsers.map(u => (
                  <tr key={u.id} className="group bg-white dark:bg-[#1e293b] hover:bg-primary/[0.025] dark:hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {u.profile_picture ? (
                          <img src={u.profile_picture.startsWith('http') ? u.profile_picture : `${BASE_URL}${u.profile_picture}`} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary flex items-center justify-center font-bold border border-primary/10 shrink-0">{u.full_name?.charAt(0).toUpperCase() || '?'}</div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-white truncate max-w-[220px]">{u.full_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{u.index_number || `USER-${String(u.id).padStart(4, '0')}`}</p>
                            {u.education_category && <p className="text-[10px] text-primary capitalize bg-primary/10 px-1.5 py-0.5 rounded-full">{u.education_category}</p>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{u.phone_number || 'No phone'}</p>
                      {u.email ? <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[220px]">{u.email}</p> : <p className="text-[11px] text-slate-400 mt-1">No email provided</p>}
                    </td>
                    <td className="py-3 px-5">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="py-3 px-5">
                      {u.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/50"><span className="h-1.5 w-1.5 rounded-full bg-current" />Suspended</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-900/50"><span className="h-1.5 w-1.5 rounded-full bg-current" />Active</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <div className="relative flex justify-end">
                        <button
                          onClick={() => setOpenActionMenu(openActionMenu === u.id ? null : u.id)}
                          disabled={actionLoading === u.id}
                          className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                          aria-label={`Open actions for ${u.full_name}`}
                        >
                          {actionLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                        </button>

                        {openActionMenu === u.id && (
                          <>
                            <button className="fixed inset-0 z-20 cursor-default" onClick={() => setOpenActionMenu(null)} aria-label="Close actions" />
                            <div className="absolute right-0 top-11 z-30 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl">
                              <button onClick={() => { setOpenActionMenu(null); handleViewProfile(u.id); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <Eye className="w-4 h-4 text-cyan-500" /> View profile
                              </button>
                              <button onClick={() => { setOpenActionMenu(null); window.location.href = `/dashboard/admin/users/${u.id}/activity`; }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <Activity className="w-4 h-4 text-purple-500" /> View activity
                              </button>
                              <button onClick={() => { setOpenActionMenu(null); openEditModal(u); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <Edit3 className="w-4 h-4 text-blue-500" /> Edit user
                              </button>
                              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                              <button onClick={() => { setOpenActionMenu(null); handleToggleStatus(u); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${u.status === 'suspended' ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20' : 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20'}`}>
                                {u.status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                {u.status === 'suspended' ? 'Activate account' : 'Suspend account'}
                              </button>
                              {u.role === 'student' && (
                                <button onClick={() => { setOpenActionMenu(null); handleDeleteUser(u); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                  <Trash2 className="w-4 h-4" /> Delete student
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
              Show
              <select value={usersPerPage} onChange={(event) => setUsersPerPage(Number(event.target.value))} className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-primary">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              Showing {filteredUsers.length === 0 ? 0 : ((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length}
            </p>
          </div>
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

      {/* User Profile Drawer */}
      {(profileUser || profileLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) { setProfileUser(null); setProfileStats(null); } }}>
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl overflow-y-auto border border-gray-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-500" />
                User Profile
              </h2>
              <button onClick={() => { setProfileUser(null); setProfileStats(null); }} className="p-1.5 text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : profileUser ? (
              <div className="p-6 space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  {profileUser.profile_picture ? (
                    <img src={profileUser.profile_picture.startsWith('http') ? profileUser.profile_picture : `${BASE_URL}${profileUser.profile_picture}`} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-slate-700 shadow-md" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                      {profileUser.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate">{profileUser.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {getRoleBadge(profileUser.role)}
                      {profileUser.status === 'suspended' ? (
                        <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-[10px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/50">Suspended</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-900/50">Active</span>
                      )}
                    </div>
                    {profileUser.index_number && (
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono mt-1">ID: {profileUser.index_number}</p>
                    )}
                  </div>
                </div>

                {/* Quick Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Phone</span>
                    </div>
                    <p className="text-[13px] font-medium text-slate-800 dark:text-white truncate">{profileUser.phone_number || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Email</span>
                    </div>
                    <p className="text-[13px] font-medium text-slate-800 dark:text-white truncate">{profileUser.email || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Wallet</span>
                    </div>
                    <p className="text-[13px] font-bold text-green-600 dark:text-green-400">Rs. {(profileUser.wallet_balance || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Joined</span>
                    </div>
                    <p className="text-[13px] font-medium text-slate-800 dark:text-white">{profileUser.created_at ? new Date(profileUser.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="bg-white dark:bg-slate-800/30 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50/80 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800/50">
                    <h4 className="text-[12px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Personal Details</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Address</p>
                        <p className="text-[13px] text-slate-700 dark:text-slate-300 mt-0.5">{profileUser.address || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Date of Birth</p>
                        <p className="text-[13px] text-slate-700 dark:text-slate-300 mt-0.5">{profileUser.birthdate ? new Date(profileUser.birthdate).toLocaleDateString() : 'Not provided'}</p>
                      </div>
                    </div>
                    {profileUser.role === 'student' && (
                      <>
                        <div className="flex items-start gap-3">
                          <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Education Category</p>
                            <p className="text-[13px] text-slate-700 dark:text-slate-300 mt-0.5 capitalize">{profileUser.education_category || 'Not set'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Hash className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Student Category</p>
                            <p className="text-[13px] text-slate-700 dark:text-slate-300 mt-0.5">{profileUser.student_category || 'Not set'}</p>
                          </div>
                        </div>
                      </>
                    )}
                    {profileUser.education_info && (
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Education Info</p>
                          <p className="text-[13px] text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-line">{profileUser.education_info}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Teacher-specific Section */}
                {profileUser.role === 'teacher' && (
                  <div className="bg-white dark:bg-slate-800/30 rounded-lg border border-blue-200 dark:border-blue-900/50 overflow-hidden">
                    <div className="px-4 py-3 bg-blue-50/80 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/30">
                      <h4 className="text-[12px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Teacher Information</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Subject</p>
                          <p className="text-[13px] text-slate-700 dark:text-slate-300 mt-0.5">{profileUser.subject || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Briefcase className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Experience</p>
                          <p className="text-[13px] text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-line">{profileUser.experience || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Award className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Certifications</p>
                          <p className="text-[13px] text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-line">{profileUser.certifications || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activity Summary */}
                {profileStats && (
                  <div className="bg-white dark:bg-slate-800/30 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50/80 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800/50">
                      <h4 className="text-[12px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Activity Summary</h4>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{profileStats.enrolled_courses}</p>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-1">Courses</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30">
                          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{profileStats.quiz_attempts}</p>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-1">Quizzes</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30">
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">Rs. {profileStats.total_payments.toFixed(0)}</p>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-1">Payments</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/30">
                          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{profileStats.online_classes}</p>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-1">Online Classes</p>
                        </div>
                        <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-900/10 rounded-lg border border-cyan-100 dark:border-cyan-900/30">
                          <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{profileStats.wallet_transactions}</p>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-1">Wallet Txns</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-1">Last Login</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{profileStats.last_login ? new Date(profileStats.last_login).toLocaleDateString() : 'Never'}</p>
                        </div>
                      </div>
                      {profileStats.last_login_ip && (
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-3 text-center">Last login IP: {profileStats.last_login_ip}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { const u = profileUser; setProfileUser(null); setProfileStats(null); openEditModal(u); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-[12px] font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit User
                  </button>
                  <button
                    onClick={() => { const id = profileUser.id; setProfileUser(null); setProfileStats(null); window.location.href = `/dashboard/admin/users/${id}/activity`; }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 rounded-lg text-[12px] font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    View Activity
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

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
                  <input type="tel" required value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: digitsOnly(e.target.value)})} inputMode="numeric" pattern="[0-9]*" className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
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
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editUser ? "Leave blank to keep current" : "Default: Password123!"} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none" />
                  <p className="mt-1 text-[11px] text-gray-400">Use 8+ characters with uppercase, lowercase, number, and special character.</p>
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
