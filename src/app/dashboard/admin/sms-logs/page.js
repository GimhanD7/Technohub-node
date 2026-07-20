"use client";

import { useState, useEffect, useMemo } from "react";
import { MessageSquare, RefreshCw, AlertCircle, Search, Clock, CheckCircle, XCircle, Trash2, Send, UserRound } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function AdminSmsLogsPage() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkAudience, setBulkAudience] = useState("all_users");
  const [singleMessage, setSingleMessage] = useState("");
  const [singleUserId, setSingleUserId] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedLogIds, setSelectedLogIds] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchApi("/sms/logs");
      if (data.success) {
        setLogs(data.logs || []);
        setSelectedLogIds([]);
      } else {
        toast.error(data.message || "Failed to load SMS logs.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const data = await fetchApi("/user/get_users");
    if (data.success) {
      setUsers((data.users || []).filter((user) => user.phone_number));
    }
  };

  const handleBulkSend = async () => {
    if (!bulkMessage.trim()) {
      toast.error("Please enter a message to send.");
      return;
    }
    
    setIsSending(true);
    try {
      const data = await fetchApi("/sms/send_bulk", {
        method: 'POST',
        body: JSON.stringify({
          targetAudience: bulkAudience,
          message: bulkMessage
        })
      });
      if (data.success) {
        setShowModal(false);
        setBulkMessage("");
        fetchLogs();
      } else {
        toast.error(data.message || "Failed to send bulk SMS.");
      }
    } catch (error) {
      toast.error("An error occurred while sending SMS.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSingleSend = async () => {
    if (!singleUserId) {
      toast.error("Please select a user.");
      return;
    }

    if (!singleMessage.trim()) {
      toast.error("Please enter a message to send.");
      return;
    }

    setIsSending(true);
    try {
      const data = await fetchApi("/sms/send_single", {
        method: "POST",
        body: JSON.stringify({
          userId: singleUserId,
          message: singleMessage,
        }),
      });

      if (data.success) {
        setShowSingleModal(false);
        setSingleMessage("");
        setSingleUserId("");
        setUserSearchTerm("");
        fetchLogs();
      } else {
        toast.error(data.message || "Failed to send SMS.");
      }
    } catch (error) {
      toast.error("An error occurred while sending SMS.");
    } finally {
      setIsSending(false);
    }
  };

  const deleteLogs = async (ids) => {
    const logIds = ids.filter(Boolean);
    if (logIds.length === 0) {
      toast.error("Select at least one SMS log to delete.");
      return;
    }

    const confirmed = window.confirm(`Delete ${logIds.length} selected SMS log${logIds.length === 1 ? "" : "s"}? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const data = await fetchApi(logIds.length === 1 ? "/sms/delete" : "/sms/delete_bulk", {
        method: "POST",
        body: JSON.stringify(logIds.length === 1 ? { id: logIds[0] } : { ids: logIds }),
      });

      if (data.success) {
        setLogs((current) => current.filter((log) => !logIds.includes(log.id)));
        setSelectedLogIds((current) => current.filter((id) => !logIds.includes(id)));
      } else {
        toast.error(data.message || "Failed to delete SMS logs.");
      }
    } catch (error) {
      toast.error("An error occurred while deleting SMS logs.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const phone = log.phone_number || "";
    const name = log.users?.full_name?.toLowerCase() || "";
    const index = log.users?.index_number?.toLowerCase() || "";
    const msg = log.message?.toLowerCase() || "";
    return phone.includes(term) || name.includes(term) || index.includes(term) || msg.includes(term);
  });

  const visibleLogIds = useMemo(() => filteredLogs.map((log) => log.id), [filteredLogs]);
  const allVisibleSelected = visibleLogIds.length > 0 && visibleLogIds.every((id) => selectedLogIds.includes(id));
  const selectedUsers = useMemo(() => {
    const term = userSearchTerm.toLowerCase().trim();
    return users.filter((user) => {
      const name = user.full_name?.toLowerCase() || "";
      const phone = user.phone_number || "";
      const index = user.index_number?.toLowerCase() || "";
      const email = user.email?.toLowerCase() || "";
      return !term || name.includes(term) || phone.includes(term) || index.includes(term) || email.includes(term);
    }).slice(0, 8);
  }, [users, userSearchTerm]);

  const toggleLogSelection = (id) => {
    setSelectedLogIds((current) => (
      current.includes(id) ? current.filter((logId) => logId !== id) : [...current, id]
    ));
  };

  const toggleAllVisible = () => {
    setSelectedLogIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleLogIds.includes(id));
      }

      return [...new Set([...current, ...visibleLogIds])];
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            SMS Delivery Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-white mt-1">View delivery status and details of all system SMS messages.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSingleModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 text-[13px] font-medium transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Single SMS
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 text-[13px] font-medium transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Send Bulk SMS
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[13px] font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, index, phone or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:ml-auto">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {filteredLogs.length} Records Found
            </div>
            {selectedLogIds.length > 0 && (
              <button
                onClick={() => deleteLogs(selectedLogIds)}
                disabled={isDeleting}
                className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedLogIds.length})
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      aria-label="Select all visible SMS logs"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider w-1/3">Message Content</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">API Response</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center text-slate-500 dark:text-white">
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                        <p>No SMS logs found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLogIds.includes(log.id)}
                          onChange={() => toggleLogSelection(log.id)}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          aria-label={`Select SMS log ${log.id}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800 dark:text-white">{new Date(log.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500 dark:text-white flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {log.users?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-white mt-0.5">
                          {log.users?.index_number}
                        </div>
                        <div className="text-xs font-mono font-semibold text-primary mt-1">
                          {log.phone_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 dark:text-slate-300 break-words whitespace-pre-wrap bg-slate-50 dark:bg-[#0f172a] p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                          {log.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold uppercase tracking-wider">
                            <CheckCircle className="w-3.5 h-3.5" /> Delivered
                          </span>
                        ) : log.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold uppercase tracking-wider">
                            <XCircle className="w-3.5 h-3.5" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-semibold uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5" /> {log.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 max-w-[200px] break-all">
                          {log.error_details || <span className="italic text-slate-400">No response logged</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteLogs([log.id])}
                          disabled={isDeleting}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed dark:border-red-900/30 dark:hover:bg-red-900/20"
                          title="Delete SMS log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UserRound className="w-5 h-5 text-emerald-600" />
                Send Single SMS
              </h2>
              <button
                onClick={() => setShowSingleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Search User</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search name, index, phone or email..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white"
                  />
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                {selectedUsers.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500 dark:text-slate-300 text-center">No users with phone numbers found.</div>
                ) : selectedUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSingleUserId(String(user.id))}
                    className={`w-full text-left p-3 transition-colors ${String(user.id) === singleUserId ? "bg-emerald-50 dark:bg-emerald-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{user.full_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.index_number || user.email || user.role}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary whitespace-nowrap">{user.phone_number}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Message Content</label>
                <textarea
                  value={singleMessage}
                  onChange={(e) => setSingleMessage(e.target.value)}
                  placeholder="Enter the SMS message for the selected user..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white resize-none"
                />
                <p className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>{singleMessage.length} characters</span>
                  <span>{Math.ceil(singleMessage.length / 160) || 1} SMS Message(s)</span>
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button
                onClick={() => setShowSingleModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSingleSend}
                disabled={isSending || !singleUserId || !singleMessage.trim()}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send SMS
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Send Bulk SMS
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Target Audience</label>
                <select 
                  value={bulkAudience}
                  onChange={(e) => setBulkAudience(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white"
                >
                  <option value="all_users">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="teachers">Teachers Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Message Content</label>
                <textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="Enter the SMS message you want to broadcast..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white resize-none"
                />
                <p className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>{bulkMessage.length} characters</span>
                  <span>{Math.ceil(bulkMessage.length / 160) || 1} SMS Message(s) per user</span>
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSend}
                disabled={isSending || !bulkMessage.trim()}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Send Broadcast
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
