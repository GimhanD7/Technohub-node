"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, Search, RefreshCw, Activity, Shield, BookOpen, GraduationCap, Monitor, Globe, LogIn, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function UserHistorySummaryPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchApi("/admin/get_user_history_summary");
    if (data.success) {
      setUsers(data.users);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const searchStr = searchQuery.toLowerCase();
      return (
        (u.full_name || "").toLowerCase().includes(searchStr) ||
        (u.role || "").toLowerCase().includes(searchStr) ||
        (u.last_ip || "").toLowerCase().includes(searchStr)
      );
    });
  }, [users, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const currentUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin':
        return <span className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded text-[10px] font-bold uppercase tracking-wider border border-purple-200 dark:border-purple-900/50"><Shield className="w-3 h-3" /> Admin</span>;
      case 'teacher':
        return <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-900/50"><BookOpen className="w-3 h-3" /> Teacher</span>;
      case 'student':
      default:
        return <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-900/50"><GraduationCap className="w-3 h-3" /> Student</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight">User Activity Summary</h1>
          <p className="text-[13px] text-gray-500 dark:text-white mt-1">Select a user to view their complete device and activity timeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 text-[12px] font-medium transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-gray-400 dark:text-white absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search users by name, role, or IP address..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-[#0f172a]"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-12 text-center">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">No Users Found</h3>
          <p className="text-[13px] text-gray-500 dark:text-white mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentUsers.map(user => (
              <div 
                key={user.id} 
                onClick={() => router.push(`/dashboard/admin/history?user_id=${user.id}`)}
                className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 dark:text-white flex items-center justify-center font-bold text-xl border border-gray-200 dark:border-slate-800 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 dark:border-blue-900/50 transition-colors">
                      {user.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800/50 px-2 py-1 rounded text-center min-w-[60px]">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-white uppercase tracking-wider">Logins</p>
                    <p className="text-[15px] font-bold text-blue-600">{user.login_count || 0}</p>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-[15px] font-bold text-slate-800 dark:text-white mb-1 truncate" title={user.full_name}>{user.full_name}</h3>
                  <p className="text-[11px] text-gray-400 dark:text-white font-mono mb-4">{user.index_number || 'N/A'}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-800/50 space-y-2 mt-auto">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-500 dark:text-white flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Last IP</span>
                    <span className="font-medium text-slate-700">{user.last_ip || 'None'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between mt-6">
            <p className="text-[12px] text-gray-500 dark:text-white">
              Showing {((currentPage - 1) * usersPerPage) + (filteredUsers.length > 0 ? 1 : 0)} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
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
        </>
      )}
    </div>
  );
}
