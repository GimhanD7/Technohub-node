"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState, useMemo, useRef } from "react";
import { Users, Trash2, BookOpen, Loader2, RefreshCw, Search, Plus, X, Edit3, ChevronLeft, ChevronRight, Ban, CheckCircle2, Upload } from "lucide-react";
import { fetchApi, API_BASE_URL, BASE_URL } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";

export default function TeacherManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

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

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      return (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
             (u.phone_number || "").includes(searchQuery) ||
             (u.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
             (u.index_number || "").toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [users, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const currentUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);


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
    setFormLoading(true);
    const data = await fetchApi("/user/add_user", {
      method: "POST",
      body: JSON.stringify(formData)
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
    setFormLoading(true);
    const data = await fetchApi("/user/admin_update_user", {
      method: "POST",
      body: JSON.stringify({ id: editUser.id, ...formData })
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

      {/* Filters */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 dark:text-white absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search teachers..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-[#0f172a]"
          />
        </div>
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
                <th className="py-3 px-5 font-bold">Teacher</th>
                <th className="py-3 px-5 font-bold">Contact</th>
                <th className="py-3 px-5 font-bold">Subject</th>
                <th className="py-3 px-5 font-bold">Status</th>
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
                          <p className="font-medium text-slate-800 dark:text-white">{u.full_name}</p>
                          <p className="text-[11px] text-gray-400 dark:text-white font-mono mt-0.5">{u.index_number || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <p className="text-slate-800 dark:text-white">{u.phone_number}</p>
                      {u.email && <p className="text-[11px] text-gray-400 dark:text-white mt-0.5">{u.email}</p>}
                    </td>
                    <td className="py-3 px-5">
                      <p className="text-slate-800 dark:text-white font-medium">{u.subject || <span className="text-gray-400 font-normal italic">Not specified</span>}</p>
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
                          title="Edit Teacher"
                        >
                          <Edit3 className="w-4 h-4" />
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
                        <input type="tel" required value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a]" />
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
                    <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editUser ? "Leave blank to keep current" : "Default: password123"} className="w-full p-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-primary focus:outline-none dark:bg-[#0f172a]" />
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
