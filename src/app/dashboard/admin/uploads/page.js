"use client";

import { useState, useEffect } from "react";
import { Database, Trash2, ExternalLink, HardDrive, FileImage, File, FileText, Search, Loader2, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_BASE_URL, BASE_URL } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";

export default function UploadsManagerPage() {
  const [data, setData] = useState({ files: [], totalSize: 0, totalFiles: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState("All");
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'info', title: '', message: '', isAlertOnly: false, onConfirm: null, onCancel: null });

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/uploads`);
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        toast.error("Failed to load storage data.");
      }
    } catch (error) {
      toast.error("Error connecting to server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUploads();
    setIsRefreshing(false);
    toast.success("Storage data refreshed!");
  };

  const executeDelete = async (filePath) => {
    try {
      setIsDeleting(true);
      const res = await fetch(`${API_BASE_URL}/admin/uploads`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ path: filePath })
      });
      const result = await res.json();
      
      if (result.success) {
        toast.success(result.message);
        fetchUploads(); // Refresh list
      } else {
        toast.error(result.message || "Failed to delete file.");
      }
    } catch (error) {
      toast.error("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = (filePath) => {
    setDialogState({
      isOpen: true,
      type: 'warning',
      title: 'Delete File Permanently?',
      message: 'Are you sure you want to permanently delete this file? This will remove it from the server and cannot be undone.',
      isAlertOnly: false,
      onConfirm: async () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        await executeDelete(filePath);
      },
      onCancel: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage className="w-4 h-4 text-blue-500" />;
    if (['pdf'].includes(ext)) return <FileText className="w-4 h-4 text-red-500" />;
    return <File className="w-4 h-4 text-slate-500" />;
  };

  const folders = ["All", ...new Set(data.files.map(f => f.category))];

  const filteredFiles = data.files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = activeFolder === "All" || f.category === activeFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
      
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" /> Storage & Uploads
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage all files uploaded to the server, track storage space, and clean up unused assets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            title="Refresh storage data"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
           <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm">
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
               <HardDrive className="w-4 h-4 text-primary" />
             </div>
             <div>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Usage</p>
               <p className="text-sm font-bold text-slate-800 dark:text-white">{formatSize(data.totalSize)}</p>
             </div>
           </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search files or folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:text-white transition-all"
          />
        </div>
        <p className="text-sm text-slate-500 font-medium whitespace-nowrap">
          {filteredFiles.length} file{filteredFiles.length !== 1 && 's'}
        </p>
      </div>

      {/* Folder Tabs */}
      <div className="flex flex-wrap gap-2">
        {folders.map(folder => {
          const count = folder === "All" ? data.files.length : data.files.filter(f => f.category === folder).length;
          return (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder)}
              className={`px-4 py-2 flex items-center gap-2 rounded-lg text-[13px] font-medium transition-colors ${
                activeFolder === folder 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {folder === 'All' ? 'All Files' : folder}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeFolder === folder ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                 {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
                <th className="px-5 py-4">File Name</th>
                <th className="px-5 py-4">Folder</th>
                <th className="px-5 py-4">Size</th>
                <th className="px-5 py-4">Uploaded / Modified</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Scanning server storage...
                  </td>
                </tr>
              ) : filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Database className="w-8 h-8 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    No files found.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {getFileIcon(file.name)}
                        </div>
                        <div className="max-w-[200px] sm:max-w-[300px] truncate">
                          <p className="text-[13px] font-medium text-slate-800 dark:text-white truncate" title={file.name}>
                            {file.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {file.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] font-medium text-slate-600 dark:text-slate-400">
                      {formatSize(file.size)}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-slate-500 dark:text-slate-400">
                      {formatDate(file.modifiedAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={`${BASE_URL}${file.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          title="View File"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleDelete(file.path)}
                          disabled={isDeleting}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <CustomDialog {...dialogState} />
    </div>
  );
}
