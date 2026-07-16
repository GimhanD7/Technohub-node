"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { Loader2, User, RefreshCw, Activity, Search, Filter, ChevronLeft, ChevronRight, Globe, Monitor, Clock } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useSearchParams, useRouter } from "next/navigation";

function HistoryTableContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlUserId = searchParams.get("user_id");

  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Pagination
  const [selectedUser, setSelectedUser] = useState(urlUserId || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs(selectedUser);
  }, [selectedUser]);

  const fetchUsers = async () => {
    const data = await fetchApi("/admin/get_users_list");
    if (data.success) {
      setUsers(data.users);
    }
  };

  const fetchLogs = async (userId = "all") => {
    setIsLoading(true);
    const data = await fetchApi(`/admin/get_logs?user_id=${userId}`);
    if (data.success) {
      setLogs(data.logs);
    }
    setIsLoading(false);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const searchStr = searchQuery.toLowerCase();
      return (
        (log.action || "").toLowerCase().includes(searchStr) ||
        (log.details || "").toLowerCase().includes(searchStr) ||
        (log.ip_address || "").toLowerCase().includes(searchStr) ||
        (log.user_name || "").toLowerCase().includes(searchStr)
      );
    });
  }, [logs, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));
  const currentLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedUser]);

  // Helper to format date
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight">System History</h1>
          <p className="text-[13px] text-gray-500 dark:text-white mt-1">Track device logins, updates, and platform activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/dashboard/admin/user-history')} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 text-[12px] font-medium transition-colors">
            <User className="w-3.5 h-3.5" /> User Summaries
          </button>
          <button onClick={() => fetchLogs(selectedUser)} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 text-[12px] font-medium transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 dark:text-white absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-[#0f172a]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 dark:text-white" />
          <select 
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              // Clean up URL if they change the filter manually
              if (urlUserId) {
                router.replace('/dashboard/admin/history');
              }
            }}
            className="text-[13px] border border-gray-200 dark:border-slate-800 rounded py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-[#0f172a]"
          >
            <option value="all">All Users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/30 shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400 dark:text-white" />
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">Activity Logs ({filteredLogs.length})</h3>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 relative">
          {isLoading && logs.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#1e293b]/50 z-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-500 dark:text-white sticky top-0 z-10">
                  <th className="py-3 px-5 font-bold whitespace-nowrap">Timestamp</th>
                  <th className="py-3 px-5 font-bold">User</th>
                  <th className="py-3 px-5 font-bold">Action</th>
                  <th className="py-3 px-5 font-bold">Device & IP</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-600 dark:text-white divide-y divide-gray-100 dark:divide-slate-800/50">
                {currentLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-gray-500 dark:text-white italic">No logs found matching your filters.</td>
                  </tr>
                ) : (
                  currentLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-white">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDateTime(log.created_at)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 dark:text-white flex items-center justify-center font-bold border border-gray-200 dark:border-slate-800 shrink-0">
                            {log.user_name ? log.user_name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">{log.user_name || 'System / Guest'}</p>
                            {log.user_role && <p className="text-[11px] text-gray-400 dark:text-white mt-0.5 capitalize">{log.user_role}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <p className="font-medium text-slate-800 dark:text-white">{log.action}</p>
                        <p className="text-[12px] text-gray-500 dark:text-white mt-0.5 line-clamp-2" title={log.details}>{log.details}</p>
                      </td>
                      <td className="py-3 px-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-white text-[12px]">
                            <Monitor className="w-3 h-3" />
                            <span className="truncate max-w-[200px]" title={log.device_info}>{log.device_info || 'Unknown Device'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-white text-[12px]">
                            <Globe className="w-3 h-3" />
                            <span>{log.ip_address}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800/50 bg-white dark:bg-[#1e293b] flex items-center justify-between shrink-0">
          <p className="text-[12px] text-gray-500 dark:text-white">
            Showing {((currentPage - 1) * logsPerPage) + (filteredLogs.length > 0 ? 1 : 0)} to {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length}
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
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-12 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></div>}>
      <HistoryTableContent />
    </Suspense>
  );
}
