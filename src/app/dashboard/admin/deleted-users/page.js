"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, Search, RefreshCw, Trash2, Download, Shield, BookOpen, GraduationCap, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function DeletedUsersAuditPage() {
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchApi("/admin/get_deleted_users");
    if (data.success) {
      setDeletedUsers(data.deletedUsers || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    return deletedUsers.filter(u => {
      const searchStr = searchQuery.toLowerCase();
      return (
        (u.full_name || "").toLowerCase().includes(searchStr) ||
        (u.role || "").toLowerCase().includes(searchStr) ||
        (u.email || "").toLowerCase().includes(searchStr) ||
        (u.phone_number || "").toLowerCase().includes(searchStr) ||
        (u.index_number || "").toLowerCase().includes(searchStr) ||
        (u.deleted_by_name || "").toLowerCase().includes(searchStr)
      );
    });
  }, [deletedUsers, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded text-[10px] font-bold uppercase tracking-wider border border-purple-200 dark:border-purple-900/50"><Shield className="w-3.5 h-3.5" /> Admin</span>;
      case 'teacher':
        return <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-900/50"><BookOpen className="w-3.5 h-3.5" /> Teacher</span>;
      case 'student':
      default:
        return <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-900/50"><GraduationCap className="w-3.5 h-3.5" /> Student</span>;
    }
  };

  const handleDownloadCSV = () => {
    const headers = ["Deleted Date", "Original ID", "Name", "Role", "Index Number", "Email", "Phone", "Deleted By"];
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const item of filteredUsers) {
      const values = [
        new Date(item.deleted_at).toLocaleString(),
        item.original_id,
        item.full_name,
        item.role,
        item.index_number || "N/A",
        item.email || "N/A",
        item.phone_number,
        item.deleted_by_name || "Admin"
      ].map(val => {
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `deleted_users_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-500" /> Deleted Users Audit Log
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-1">Audit trail of deleted or inactive users preserved in the system.</p>
        </div>
        <div className="flex items-center gap-2 font-medium">
          <button 
            onClick={handleDownloadCSV}
            disabled={filteredUsers.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded text-[12px] border border-emerald-150 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Download Audit Logs
          </button>
          <button 
            onClick={loadData} 
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[12px] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-gray-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search logs by name, index, phone, email, or role..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:bg-[#0f172a] dark:text-white"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-16 text-center">
          <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-white">No Deletion Logs Found</h3>
          <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-1">Audit logs are empty or no records matched your filter criteria.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  <th className="py-4 px-5 font-bold">Deletion Date</th>
                  <th className="py-4 px-5 font-bold">User Details</th>
                  <th className="py-4 px-5 font-bold">Role</th>
                  <th className="py-4 px-5 font-bold">Index / ID</th>
                  <th className="py-4 px-5 font-bold">Phone & Email</th>
                  <th className="py-4 px-5 font-bold text-right">Deleted By</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-600 dark:text-slate-350 divide-y divide-gray-150 dark:divide-slate-800/50">
                {currentUsers.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(item.deleted_at).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-800 dark:text-white leading-tight">
                      {item.full_name}
                    </td>
                    <td className="py-4 px-5">
                      {getRoleBadge(item.role)}
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap">
                      <p className="font-mono text-xs">{item.index_number || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Original ID: {item.original_id}</p>
                    </td>
                    <td className="py-4 px-5 leading-normal">
                      <p className="font-medium text-slate-700 dark:text-slate-300">{item.phone_number}</p>
                      <p className="text-[11px] text-slate-400">{item.email || 'No email registered'}</p>
                    </td>
                    <td className="py-4 px-5 text-right font-medium text-slate-700 dark:text-slate-300">
                      {item.deleted_by_name || 'System Admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-150 dark:border-slate-850 bg-gray-50/30 dark:bg-slate-800/30 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Page {currentPage} of {totalPages} ({filteredUsers.length} total entries)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-gray-200 dark:border-slate-750 rounded bg-white dark:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-gray-200 dark:border-slate-750 rounded bg-white dark:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
