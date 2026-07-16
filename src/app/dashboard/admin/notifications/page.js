"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Bell, Search, Loader2, Send, Users, Globe, BookOpen, FileText, CreditCard, Info } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotificationManagement() {
  const [user, setUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("system");
  const [link, setLink] = useState("");
  const [targetUser, setTargetUser] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

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
      setUsersList(usersRes.users);
    }

    // Fetch notifications
    const notifsRes = await fetchApi("/admin/get_notifications");
    if (notifsRes.success) {
      setNotifications(notifsRes.notifications);
    }
    
    setIsLoading(false);
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setAlert({ type: "error", msg: "Title and Message are required." });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    const payload = {
      created_by: user?.id,
      title: title.trim(),
      message: message.trim(),
      type,
      link: link.trim() || null,
      user_id: targetUser === "all" ? null : targetUser
    };

    const res = await fetchApi("/notifications/add", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setIsSubmitting(false);

    if (res.success) {
      setAlert({ type: "success", msg: "Notification sent successfully!" });
      setTitle("");
      setMessage("");
      setLink("");
      setType("system");
      setTargetUser("all");
      loadData(); // Refresh list
    } else {
      setAlert({ type: "error", msg: res.message || "Failed to send notification." });
    }
  };

  const getNotifIcon = (t) => {
    switch (t) {
      case 'course': return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'exam': return <FileText className="w-4 h-4 text-purple-500" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-amber-500" />;
    }
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
            Broadcast messages globally or target specific users.
          </p>
        </div>
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
              <div>
                <label className="block text-[12px] font-bold text-slate-700 dark:text-gray-300 mb-1">Target Audience</label>
                <div className="relative">
                  <select
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-[#0f172a] text-[13px] text-slate-700 dark:text-white focus:outline-none focus:border-primary"
                  >
                    <option value="all">All Users (Global Broadcast)</option>
                    <option value="all_students">All Students Only</option>
                    <option value="all_teachers">All Teachers Only</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role})
                      </option>
                    ))}
                  </select>
                  {targetUser === "all" ? (
                    <Globe className="w-4 h-4 text-primary absolute left-3 top-1/2 -translate-y-1/2" />
                  ) : (
                    <Users className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>

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
                </select>
              </div>

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
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/30">
              <h3 className="text-[14px] font-bold text-slate-800 dark:text-white">Notification History</h3>
            </div>
            
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-12">
                <Bell className="w-12 h-12 text-gray-300 mb-3" />
                <p>No notifications sent yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-[#0f172a] border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <th className="py-3 px-4 font-bold">Details</th>
                      <th className="py-3 px-4 font-bold">Target Audience</th>
                      <th className="py-3 px-4 font-bold">Sender</th>
                      <th className="py-3 px-4 font-bold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] text-slate-600 dark:text-white divide-y divide-gray-100 dark:divide-slate-800/50">
                    {notifications.map((notif) => (
                      <tr key={notif.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex gap-3">
                            <div className="mt-1 shrink-0">{getNotifIcon(notif.type)}</div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white">{notif.title}</p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {notif.user_id === null ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold uppercase">
                              <Globe className="w-3 h-3" /> Global
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold uppercase">
                              <Users className="w-3 h-3" /> {notif.target_user_name || `User #${notif.user_id}`}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[12px]">{notif.creator_name || "System"}</td>
                        <td className="py-3 px-4 text-[11px] text-gray-500 dark:text-gray-400">
                          {new Date(notif.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
