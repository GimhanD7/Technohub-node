"use client";

import { useState, useEffect } from "react";
import { MessageSquare, RefreshCw, AlertCircle, Search, Clock, CheckCircle, XCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function AdminSmsLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkAudience, setBulkAudience] = useState("all_users");
  const [isSending, setIsSending] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/sms/logs`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      } else {
        toast.error(data.message || "Failed to load SMS logs.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };


  const handleBulkSend = async () => {
    if (!bulkMessage.trim()) {
      toast.error("Please enter a message to send.");
      return;
    }
    
    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sms/send_bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAudience: bulkAudience,
          message: bulkMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
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

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const phone = log.phone_number || "";
    const name = log.users?.full_name?.toLowerCase() || "";
    const index = log.users?.index_number?.toLowerCase() || "";
    const msg = log.message?.toLowerCase() || "";
    return phone.includes(term) || name.includes(term) || index.includes(term) || msg.includes(term);
  });

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
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
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
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {filteredLogs.length} Records Found
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider w-1/3">Message Content</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">API Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center text-slate-500 dark:text-white">
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                        <p>No SMS logs found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
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
