"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState, useMemo, useRef } from "react";
import { Users, BookOpen, Loader2, RefreshCw, Search, Plus, X, Edit3, ChevronLeft, ChevronRight, Ban, CheckCircle2, Upload, MoreVertical, ArrowUpDown, UserCheck, Layers3 } from "lucide-react";
import { fetchApi, API_BASE_URL, BASE_URL } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";
import { digitsOnly, getEmailError, getPasswordError, getPhoneError, normalizeEmail } from "@/lib/validation";

export default function TeacherManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "full_name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [openActionMenu, setOpenActionMenu] = useState(null);

  // Modals & Dialogs
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const fileInputRef = useRef(null);
  
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
  const defaultFormData = { 
    fullName: "", phoneNumber: "", email: "", birthdate: "", 
    role: "teacher", password: "", 
    subject: "", experience: "", certifications: "", profilePicture: "" 
  };
  
  const [formData, setFormData] = useState(defaultFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

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
      // Only keep teachers
      setUsers(data.users.filter(u => u.role === 'teacher'));
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

  const subjects = useMemo(() => [...new Set(users.map(user => user.subject?.trim()).filter(Boolean))].sort(), [users]);

  const teacherCounts = useMemo(() => ({
    total: users.length,
    active: users.filter(user => user.status !== "suspended").length,
    suspended: users.filter(user => user.status === "suspended").length,
    subjects: subjects.length,
  }), [users, subjects]);

  const filteredUsers = useMemo(() => {
    const filtered = users.filter(u => {
      const matchesSearch = (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
             (u.phone_number || "").includes(searchQuery) ||
             (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
             (u.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
             (u.index_number || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? u.status !== "suspended" : u.status === "suspended");
      const matchesSubject = subjectFilter === "all" || u.subject === subjectFilter;
      return matchesSearch && matchesStatus && matchesSubject;
    });

    return filtered.sort((first, second) => {
      const firstValue = String(first[sortConfig.key] || "").toLowerCase();
      const secondValue = String(second[sortConfig.key] || "").toLowerCase();
      const result = firstValue.localeCompare(secondValue, undefined, { numeric: true });
      return sortConfig.direction === "asc" ? result : -result;
    });
  }, [users, searchQuery, statusFilter, subjectFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const currentUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, subjectFilter, usersPerPage]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };


  const handleToggleStatus = (user) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const isSuspending = newStatus === 'suspended';
    
    showConfirm(
      isSuspending ? "Suspend Account" : "Activate Account", 
      `Are you sure you want to ${isSuspending ? 'SUSPEND' : 'ACTIVATE'} this account?`, 
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showAlert("Upload Failed", "File size exceeds 5MB limit.", "error");
        return;
    }

    setUploadingImage(true);
    const formDataObj = new FormData();
    formDataObj.append('image', file);
    formDataObj.append('id', editUser ? editUser.id : 'NEW'); 

    try {
        const response = await fetch(`${API_BASE_URL}/user/upload_profile`, {
            method: 'POST',
            body: formDataObj
        });
        const data = await response.json();
        
        if (data.success) {
            setFormData(prev => ({...prev, profilePicture: data.imageUrl}));
        } else {
            showAlert("Upload Failed", data.message, "error");
        }
    } catch (error) {
        showAlert("Upload Failed", "An error occurred during upload.", "error");
    } finally {
        setUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
      setFormData(defaultFormData);
      loadUsers();
      showAlert("Success", "The teacher has been successfully created.", "success");
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
      showAlert("Success", "Teacher details have been successfully updated.", "success");
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
      role: "teacher",
      password: "",
      subject: user.subject || "",
      experience: user.experience || "",
      certifications: user.certifications || "",
      profilePicture: user.profile_picture || ""
    });
    setEditUser(user);
  };

  const openAddModal = () => {
    setFormData(defaultFormData);
    setShowAddModal(true);
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
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight">Teacher Management</h1>
          <p className="text-[13px] text-gray-500 dark:text-white mt-1">Manage teacher accounts and profiles.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadUsers} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[12px] font-medium transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded shadow-sm hover:bg-primary/90 text-[12px] font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Teacher
          </button>
        </div>
      </div>

      {/* Teacher Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Teachers", value: teacherCounts.total, icon: Users, tone: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Active", value: teacherCounts.active, icon: UserCheck, tone: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Suspended", value: teacherCounts.suspended, icon: Ban, tone: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-50 dark:bg-amber-500/10" },
          { label: "Subjects", value: teacherCounts.subjects, icon: Layers3, tone: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-50 dark:bg-violet-500/10" },
        ].map(({ label, value, icon: Icon, tone, iconBg }) => (
          <div key={label} className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${iconBg} ${tone} flex items-center justify-center shrink-0`}><Icon className="w-5 h-5" /></div>
            <div><p className="text-xl font-bold text-slate-900 dark:text-white leading-none">{value}</p><p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1.5">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-3 items-center">
        <div className="relative w-full lg:flex-1">
          <Search className="w-4 h-4 text-gray-400 dark:text-white absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search name, email, phone, subject or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-10 text-[13px] text-slate-700 dark:text-white border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-[#0f172a]"
          />
        </div>
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="w-full lg:w-40 h-10 px-3 text-[12px] font-medium text-slate-600 dark:text-slate-200 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary">
          <option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option>
        </select>
        <select value={subjectFilter} onChange={event => setSubjectFilter(event.target.value)} className="w-full lg:w-48 h-10 px-3 text-[12px] font-medium text-slate-600 dark:text-slate-200 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary">
          <option value="all">All subjects</option>
          {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
        </select>
        {(searchQuery || statusFilter !== "all" || subjectFilter !== "all") && <button onClick={() => { setSearchQuery(""); setStatusFilter("all"); setSubjectFilter("all"); }} className="h-10 px-3 text-[12px] font-semibold text-slate-500 dark:text-slate-300 hover:text-red-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Clear filters</button>}
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/30 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-400 dark:text-white" />
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">Teachers List ({filteredUsers.length})</h3>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-500 dark:text-white sticky top-0 z-10">
                <th className="py-3 px-5 font-bold"><button onClick={() => handleSort("full_name")} className="inline-flex items-center gap-1.5 hover:text-primary">Teacher <ArrowUpDown className="w-3 h-3" /></button></th>
                <th className="py-3 px-5 font-bold"><button onClick={() => handleSort("phone_number")} className="inline-flex items-center gap-1.5 hover:text-primary">Contact <ArrowUpDown className="w-3 h-3" /></button></th>
                <th className="py-3 px-5 font-bold"><button onClick={() => handleSort("subject")} className="inline-flex items-center gap-1.5 hover:text-primary">Subject <ArrowUpDown className="w-3 h-3" /></button></th>
                <th className="py-3 px-5 font-bold"><button onClick={() => handleSort("status")} className="inline-flex items-center gap-1.5 hover:text-primary">Status <ArrowUpDown className="w-3 h-3" /></button></th>
                <th className="py-3 px-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-600 dark:text-white divide-y divide-gray-100 dark:divide-slate-800/50">
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500 dark:text-white italic">No teachers found matching your search.</td>
                </tr>
              ) : (
                currentUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {u.profile_picture ? (
                           <img src={u.profile_picture.startsWith('http') ? u.profile_picture : `${BASE_URL}${u.profile_picture.startsWith('/') ? '' : '/'}${u.profile_picture}`} alt={u.full_name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-100 shrink-0">
                            {u.full_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{u.full_name}</p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">{u.index_number || `TEACHER-${String(u.id).padStart(4, '0')}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{u.phone_number || 'No phone'}</p>
                      {u.email ? <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 truncate max-w-[220px]">{u.email}</p> : <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">No email provided</p>}
                    </td>
                    <td className="py-3 px-5">
                      <p className="text-slate-800 dark:text-white font-medium">{u.subject || <span className="text-gray-400 font-normal italic">Not specified</span>}</p>
                    </td>
                    <td className="py-3 px-5">
                      {u.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/50"><span className="w-1.5 h-1.5 rounded-full bg-current" />Suspended</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-900/50"><span className="w-1.5 h-1.5 rounded-full bg-current" />Active</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <div className="relative flex justify-end">
                        <button onClick={() => setOpenActionMenu(openActionMenu === u.id ? null : u.id)} disabled={actionLoading === u.id} className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50" aria-label={`Open actions for ${u.full_name}`}>
                          {actionLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                        </button>
                        {openActionMenu === u.id && <>
                          <button className="fixed inset-0 z-20 cursor-default" onClick={() => setOpenActionMenu(null)} aria-label="Close actions" />
                          <div className="absolute right-0 top-11 z-30 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl">
                            <button onClick={() => { setOpenActionMenu(null); openEditModal(u); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"><Edit3 className="w-4 h-4 text-blue-500" />Edit teacher</button>
                            <button onClick={() => { setOpenActionMenu(null); handleToggleStatus(u); }} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${u.status === 'suspended' ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}>
                              {u.status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}{u.status === 'suspended' ? 'Activate account' : 'Suspend account'}
                            </button>
                          </div>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800/50 bg-white dark:bg-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-slate-400">Show <select value={usersPerPage} onChange={event => setUsersPerPage(Number(event.target.value))} className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-primary"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label>
            <p className="text-[12px] text-gray-500 dark:text-slate-400">
              Showing {filteredUsers.length === 0 ? 0 : ((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[12px] font-medium px-3 text-slate-600 dark:text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal Overlay */}
      {(showAddModal || editUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between bg-gray-50/80 dark:bg-slate-800/80 sticky top-0 z-10">
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-white">
                {editUser ? 'Edit Teacher Profile' : 'Add New Teacher'}
              </h2>
              <button 
                onClick={() => { setShowAddModal(false); setEditUser(null); }}
                className="text-gray-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={editUser ? handleEditSubmit : handleAddSubmit} className="p-6 space-y-6">
              {formError && <div className="p-3 rounded bg-red-50 border border-red-200 dark:border-red-900/50 text-red-600 text-[12px] font-medium">{formError}</div>}
              
              <div className="flex flex-col sm:flex-row gap-6">
                 <div className="flex flex-col items-center gap-3 shrink-0">
                    <div className="w-28 h-28 rounded-full border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center bg-gray-50 dark:bg-slate-800 overflow-hidden relative group">
                        {formData.profilePicture ? (
                            <img src={formData.profilePicture.startsWith('http') ? formData.profilePicture : `${BASE_URL}${formData.profilePicture}`} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-gray-400 dark:text-slate-500 flex flex-col items-center">
                                <Upload className="w-6 h-6 mb-1" />
                                <span className="text-[10px] font-medium uppercase">Photo</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <span className="text-white text-[11px] font-bold uppercase tracking-wider">{uploadingImage ? '...' : 'Upload'}</span>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} />
                 </div>
                 
                 <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Full Name *</label>
                        <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a]" />
                        </div>
                        <div>
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Phone Number *</label>
                        <input type="tel" required value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: digitsOnly(e.target.value)})} inputMode="numeric" pattern="[0-9]*" className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Email Address</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a]" />
                        </div>
                        <div>
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Subject *</label>
                        <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a]" placeholder="e.g. Mathematics, ICT" />
                        </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Experience</label>
                    <textarea value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} rows={3} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a]" placeholder="e.g. 5 years teaching ICT at xyz College..."></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Certifications</label>
                    <textarea value={formData.certifications} onChange={e => setFormData({...formData, certifications: e.target.value})} rows={2} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a]" placeholder="e.g. BSc in Computer Science, Microsoft Certified..."></textarea>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Date of Birth</label>
                    <input type="date" value={formData.birthdate} onChange={e => setFormData({...formData, birthdate: e.target.value})} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a]" />
                 </div>
                 <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Password</label>
                    <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editUser ? "Leave blank to keep current" : "Default: Password123!"} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a]" />
                    <p className="mt-1 text-[11px] text-gray-400">Use 8+ characters with uppercase, lowercase, number, and special character.</p>
                 </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800/50 mt-6">
                <button type="button" onClick={() => { setShowAddModal(false); setEditUser(null); }} className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-white bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editUser ? 'Save Changes' : 'Create Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
