"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { Bell, Search, Loader2, Send, Users, Globe, BookOpen, FileText, CreditCard, Info, X, Check, Target, Trash2, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button";
import { CustomDialog } from "@/components/ui/CustomDialog";

export default function NotificationManagement() {
  const [user, setUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, notificationId: null });
  const [selectedNotificationIds, setSelectedNotificationIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("system"); // system, course, exam, payment, custom
  const [customType, setCustomType] = useState("");
  const [link, setLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  // Target Audience Selection Split
  const [targetAudienceType, setTargetAudienceType] = useState("all"); // all, all_students, all_teachers, specific_teacher, specific_student
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    // Fetch users list
    const usersRes = await fetchApi("/admin/get_users_list");
    if (usersRes.success) {
      setUsersList(usersRes.users || []);
    }

    // Fetch notifications
    const notifsRes = await fetchApi("/admin/get_notifications");
    if (notifsRes.success) {
      const loadedNotifications = notifsRes.notifications || [];
      setNotifications(loadedNotifications);
      setSelectedNotificationIds(prev => prev.filter(id => loadedNotifications.some(notification => notification.id === id)));
    }
    
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success("Notifications refreshed!");
  };

  // Filter teachers list
  const teachersList = useMemo(() => {
    return usersList.filter(u => u.role === "teacher" && u.status !== "deleted");
  }, [usersList]);

  // Filter students list for search autocomplete
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return [];
    return usersList.filter(u => 
      u.role === "student" && 
      u.status !== "deleted" &&
      ((u.full_name || "").toLowerCase().includes(studentSearch.toLowerCase()) || 
       (u.phone_number || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
       (u.index_number || "").toLowerCase().includes(studentSearch.toLowerCase()))
    );
  }, [usersList, studentSearch]);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setAlert({ type: "error", msg: "Title and Message are required." });
      return;
    }

    // Determine final target user id & target role
    let finalUserId = null;
    let finalTargetRole = "all";

    if (targetAudienceType === "all") {
      finalUserId = "all";
      finalTargetRole = "all";
    } else if (targetAudienceType === "all_students") {
      finalUserId = "all_students";
      finalTargetRole = "student";
    } else if (targetAudienceType === "all_teachers") {
      finalUserId = "all_teachers";
      finalTargetRole = "teacher";
    } else if (targetAudienceType === "specific_teacher") {
      if (!selectedTeacherId) {
        setAlert({ type: "error", msg: "Please select a specific teacher." });
        return;
      }
      finalUserId = parseInt(selectedTeacherId);
      finalTargetRole = "teacher";
    } else if (targetAudienceType === "specific_student") {
      if (!selectedStudent) {
        setAlert({ type: "error", msg: "Please search and select a student." });
        return;
      }
      finalUserId = parseInt(selectedStudent.id);
      finalTargetRole = "student";
    }

    // Custom notification type validation
    let finalType = type;
    if (type === "custom") {
      if (!customType.trim()) {
        setAlert({ type: "error", msg: "Please enter a label for your custom notification type." });
        return;
      }
      finalType = customType.trim();
    }

    setIsSubmitting(true);
    setAlert(null);

    const payload = {
      created_by: user?.id,
      title: title.trim(),
      message: message.trim(),
      type: finalType,
      link: link.trim() || null,
      user_id: finalUserId,
      target_role: finalTargetRole
    };

    const res = await fetchApi("/notifications/add", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setIsSubmitting(true);

    if (res.success) {
      toast.success("Notification sent successfully!");
      setAlert({ type: "success", msg: "Notification sent successfully!" });
      setTitle("");
      setMessage("");
      setLink("");
      setType("system");
      setCustomType("");
      setTargetAudienceType("all");
      setSelectedTeacherId("");
      setSelectedStudent(null);
      setStudentSearch("");
      loadData(); // Refresh list
    } else {
      const errorMsg = res.message || "Failed to send notification.";
      toast.error(errorMsg);
      setAlert({ type: "error", msg: errorMsg });
    }
    setIsSubmitting(false);
  };

  const getNotifIcon = (t) => {
    switch (t) {
      case 'course': return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'exam': return <FileText className="w-4 h-4 text-purple-500" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'system': return <Info className="w-4 h-4 text-amber-500" />;
      default: return <Target className="w-4 h-4 text-pink-500" />;
    }
  };

  const handleDeleteNotification = async (id) => {
    setDeleteDialog({
      isOpen: true,
      notificationId: id,
      type: 'warning',
      title: 'Delete Notification?',
      message: 'Are you sure you want to delete this notification? This action cannot be undone.',
      isAlertOnly: false,
      onConfirm: async () => {
        setDeleteDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetchApi(`/notifications/delete/${id}`, {
            method: "DELETE"
          });

          if (res.success) {
            toast.success("Notification deleted successfully");
            loadData();
          } else {
            toast.error(res.message || "Failed to delete notification");
          }
        } catch (error) {
          toast.error("An error occurred while deleting the notification");
        }
      },
      onCancel: () => {
        setDeleteDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const allNotificationsSelected = notifications.length > 0 && selectedNotificationIds.length === notifications.length;

  const toggleNotificationSelection = (id) => {
    setSelectedNotificationIds(prev => (
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    ));
  };

  const toggleSelectAllNotifications = () => {
    setSelectedNotificationIds(allNotificationsSelected ? [] : notifications.map(notification => notification.id));
  };

  const handleBulkDelete = () => {
    if (selectedNotificationIds.length === 0) return;

    const selectedCount = selectedNotificationIds.length;
    setDeleteDialog({
      isOpen: true,
      type: 'warning',
      title: `Delete ${selectedCount} Notifications?`,
      message: 'The selected notifications will be permanently deleted. This action cannot be undone.',
      confirmText: 'Delete selected',
      isAlertOnly: false,
      onConfirm: async () => {
        setDeleteDialog(prev => ({ ...prev, isOpen: false }));
        setIsBulkDeleting(true);

        try {
          const res = await fetchApi('/notifications/bulk-delete', {
            method: 'DELETE',
            body: JSON.stringify({ ids: selectedNotificationIds })
          });

          if (res.success) {
            toast.success(res.message || `${selectedCount} notifications deleted successfully.`);
            setSelectedNotificationIds([]);
            await loadData();
          } else {
            toast.error(res.message || 'Failed to delete selected notifications.');
          }
        } catch (error) {
          toast.error('An error occurred while deleting the selected notifications.');
        } finally {
          setIsBulkDeleting(false);
        }
      },
      onCancel: () => setDeleteDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notification Management
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
            Broadcast messages globally, target roles, or search specifically for teachers and students.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          title="Refresh notifications"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Send Notification Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-5 sticky top-24">
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Send Notification
            </h2>
            
            {alert && (
              <div className={`p-3 rounded-md text-[12px] font-medium mb-4 ${alert.type === "error" ? "bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-900/50" : "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50"}`}>
                {alert.msg}
              </div>
            )}

            <form onSubmit={handleSendNotification} className="space-y-4">
              {/* Target Type Selector */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 dark:text-gray-300 mb-1">Target Audience</label>
                <div className="relative">
                  <select
                    value={targetAudienceType}
                    onChange={(e) => {
                      setTargetAudienceType(e.target.value);
                      setSelectedTeacherId("");
                      setSelectedStudent(null);
                      setStudentSearch("");
                    }}
                    className="w-full h-10 pl-9 pr-3 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0f172a] text-[13px] text-slate-700 dark:text-white focus:outline-none focus:border-primary"
                  >
                    <option value="all">All Users (Global Broadcast)</option>
                    <option value="all_students">All Students Only</option>
                    <option value="all_teachers">All Teachers Only</option>
                    <option value="specific_teacher">Specific Teacher</option>
                    <option value="specific_student">Specific Student (Search Filters)</option>
                  </select>
                  {targetAudienceType === "all" ? (
                    <Globe className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
                  ) : (
                    <Users className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>

              {/* Specific Teacher Selection */}
              {targetAudienceType === "specific_teacher" && (
                <div className="animate-in slide-in-from-top-1 duration-150">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-gray-400 mb-1">Select Teacher</label>
                  <select
                    required
                    value={selectedTeacherId}
                    onChange={e => setSelectedTeacherId(e.target.value)}
                    className="w-full h-10 px-3 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0f172a] text-[13px] text-slate-700 dark:text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Select Teacher --</option>
                    {teachersList.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name} ({t.subject || 'N/A'})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Specific Student Autocomplete Search Box */}
              {targetAudienceType === "specific_student" && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150 relative">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-gray-400 mb-1">Search Student</label>
                  
                  {selectedStudent ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded text-slate-800 dark:text-white text-[13px]">
                      <div>
                        <p className="font-semibold">{selectedStudent.full_name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Index: {selectedStudent.index_number || 'N/A'} | Phone: {selectedStudent.phone_number}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedStudent(null)} 
                        className="p-1 hover:bg-emerald-100 rounded-full text-slate-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="Type name, phone or index..."
                        value={studentSearch}
                        onChange={e => {
                          setStudentSearch(e.target.value);
                          setShowStudentDropdown(true);
                        }}
                        onFocus={() => setShowStudentDropdown(true)}
                        className="w-full h-10 pl-9 pr-3 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0f172a] text-[13px] text-slate-700 dark:text-white focus:outline-none focus:border-primary"
                      />
                      
                      {showStudentDropdown && studentSearch.trim() && (
                        <div className="absolute z-55 left-0 right-0 mt-1 bg-white dark:bg-[#1e293b] border border-gray-250 dark:border-slate-750 rounded shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                          {filteredStudents.length === 0 ? (
                            <div className="p-3 text-[12px] text-slate-400 italic">No matching students found.</div>
                          ) : (
                            filteredStudents.map(student => (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowStudentDropdown(false);
                                  setStudentSearch("");
                                }}
                                className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-[13px] block"
                              >
                                <p className="font-semibold text-slate-850 dark:text-white">{student.full_name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Index: {student.index_number || 'N/A'} | Phone: {student.phone_number}</p>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notification Type Selector */}
              <div>
                <label className="block text-[12px] font-bold text-slate-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-10 px-3 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0f172a] text-[13px] text-slate-700 dark:text-white focus:outline-none focus:border-primary"
                >
                  <option value="system">System Information</option>
                  <option value="course">Course Update</option>
                  <option value="exam">Exam Alert</option>
                  <option value="payment">Payment Notice</option>
                  <option value="custom">Custom Notification Type...</option>
                </select>
              </div>

              {/* Custom Notification Type text field */}
              {type === "custom" && (
                <div className="animate-in slide-in-from-top-1 duration-150">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-gray-400 mb-1">Custom Type Name</label>
                  <input
                    type="text"
                    required
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="E.g. promotion, update, holiday"
                    className="w-full h-10 px-3 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0f172a] text-[13px] text-slate-700 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-[12px] font-bold text-slate-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g. System Maintenance"
                  className="w-full h-10 px-3 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0f172a] text-[13px] text-slate-700 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 dark:text-gray-300 mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter the notification message..."
                  className="w-full h-24 p-3 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0f172a] text-[13px] text-slate-700 dark:text-white focus:outline-none focus:border-primary resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 dark:text-gray-300 mb-1">Action Link (Optional)</label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="E.g. /home/courses"
                  className="w-full h-10 px-3 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0f172a] text-[13px] text-slate-700 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-10 text-[13px] rounded-lg shadow-sm">
                {isSubmitting ? "Sending..." : "Send Notification"}
              </Button>
            </form>
          </div>
        </div>

        {/* Notification History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-[14px] font-bold text-slate-800 dark:text-white font-sans uppercase tracking-wider">Notification History</h3>
                <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-semibold">Last 50 Sent</span>
              </div>
              {notifications.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-[12px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allNotificationsSelected}
                      onChange={toggleSelectAllNotifications}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    Select all
                  </label>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={selectedNotificationIds.length === 0 || isBulkDeleting}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-red-600 text-white text-[12px] font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete selected ({selectedNotificationIds.length})
                  </button>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20 text-slate-400 dark:text-slate-550 border border-dashed border-gray-200 dark:border-slate-800 rounded-lg">
                <p className="text-[13px]">No notifications sent yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`py-4 first:pt-0 last:pb-0 flex items-start gap-3 ${selectedNotificationIds.includes(notif.id) ? "bg-red-50/60 dark:bg-red-950/10" : ""}`}>
                    <input
                      type="checkbox"
                      checked={selectedNotificationIds.includes(notif.id)}
                      onChange={() => toggleNotificationSelection(notif.id)}
                      aria-label={`Select notification: ${notif.title}`}
                      className="mt-3 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary shrink-0"
                    />
                    <div className="p-2.5 bg-gray-50 dark:bg-slate-800/60 rounded-lg shrink-0">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-[13px] font-bold text-slate-850 dark:text-white leading-snug">{notif.title}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400">{new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          <button
                            onClick={() => handleDeleteNotification(notif.id)}
                            className="text-red-500 hover:text-red-600 transition-colors"
                            title="Delete Notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[12px] text-slate-500 dark:text-slate-350 leading-relaxed font-sans">{notif.message}</p>
                      
                      <div className="flex flex-wrap gap-2 pt-2.5">
                        <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[9px] font-bold uppercase tracking-wider">
                          Type: {notif.type}
                        </span>
                        
                        {notif.target_role && (
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded text-[9px] font-bold uppercase tracking-wider">
                            Audience: {notif.target_role}
                          </span>
                        )}
                        
                        {notif.user_id ? (
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-bold uppercase tracking-wider">
                            Direct message (ID: {notif.user_id})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded text-[9px] font-semibold">
                            Broadcasting
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <CustomDialog {...deleteDialog} />
    </div>
  );
}
