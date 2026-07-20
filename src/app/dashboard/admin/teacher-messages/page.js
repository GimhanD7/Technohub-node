"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { CustomDialog } from "@/components/ui/CustomDialog";
import {
  AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Clock, Filter,
  Inbox, Loader2, MessageSquare, RefreshCw, Reply, Send, ShieldCheck,
  Tag, Trash2, User,
} from "lucide-react";

const STATUS_FILTERS = ["all", "unread", "replied", "resolved"];

const StatusBadge = ({ status }) => {
  const map = {
    unread:   { bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400", label: "Unread" },
    replied:  { bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400", label: "Replied" },
    resolved: { bg: "bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400", label: "Resolved" },
  };
  const s = map[status] || map.unread;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider ${s.bg}`}>
      {s.label}
    </span>
  );
};

export default function AdminTeacherMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isResolvingId, setIsResolvingId] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [dialogState, setDialogState] = useState({ isOpen: false, type: "info", title: "", message: "", isAlertOnly: false, onConfirm: null, onCancel: null });

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchApi("/teacher-messages/all");
    setIsLoading(false);
    if (data.success) {
      setMessages(data.messages);
    } else {
      toast.error(data.message || "Failed to load messages.");
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => loadMessages(), 0);
    return () => window.clearTimeout(t);
  }, [loadMessages]);

  useEffect(() => {
    if (statusFilter === "all") setFiltered(messages);
    else setFiltered(messages.filter(m => m.status === statusFilter));
  }, [messages, statusFilter]);

  const stats = {
    unread:   messages.filter(m => m.status === "unread").length,
    replied:  messages.filter(m => m.status === "replied").length,
    resolved: messages.filter(m => m.status === "resolved").length,
    total:    messages.length,
  };

  const handleSendReply = async (msgId) => {
    if (!replyText.trim()) return;
    setIsSendingReply(true);
    const res = await fetchApi("/teacher-messages/reply", {
      method: "POST",
      body: JSON.stringify({ id: msgId, reply: replyText }),
    });
    setIsSendingReply(false);
    if (res.success) {
      toast.success("Reply sent successfully!");
      setReplyText("");
      setReplyingId(null);
      loadMessages();
    } else {
      toast.error(res.message || "Failed to send reply.");
    }
  };

  const handleResolve = async (msgId) => {
    setIsResolvingId(msgId);
    const res = await fetchApi("/teacher-messages/resolve", {
      method: "POST",
      body: JSON.stringify({ id: msgId }),
    });
    setIsResolvingId(null);
    if (res.success) {
      toast.success("Message marked as resolved!");
      loadMessages();
    } else {
      toast.error(res.message || "Failed to resolve.");
    }
  };

  const confirmDelete = (msgId) => {
    setDialogState({
      isOpen: true, type: "warning", title: "Delete Message?",
      message: "Permanently delete this teacher message?",
      isAlertOnly: false,
      onConfirm: async () => { setDialogState(p => ({ ...p, isOpen: false })); await executeDelete(msgId); },
      onCancel: () => setDialogState(p => ({ ...p, isOpen: false }))
    });
  };

  const executeDelete = async (msgId) => {
    setIsDeletingId(msgId);
    const res = await fetchApi("/teacher-messages/delete", {
      method: "POST",
      body: JSON.stringify({ id: msgId, role: "admin" }),
    });
    setIsDeletingId(null);
    if (res.success) {
      toast.success("Message deleted successfully!");
      loadMessages();
    } else {
      toast.error(res.message || "Delete failed.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-[20px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Teacher Messages
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Review and respond to reports and requests from teachers.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 min-w-[360px]">
          {[
            { label: "Total",    value: stats.total,    color: "text-slate-800 dark:text-white" },
            { label: "Unread",   value: stats.unread,   color: "text-blue-600 dark:text-blue-400" },
            { label: "Replied",  value: stats.replied,  color: "text-green-600 dark:text-green-400" },
            { label: "Resolved", value: stats.resolved, color: "text-gray-500 dark:text-slate-400" },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-slate-400">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl flex gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium rounded-xl flex gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" /> {successMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400 dark:text-slate-500" />
        {STATUS_FILTERS.map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors border ${statusFilter === f ? "bg-primary text-white border-primary" : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary hover:text-primary"}`}>
            {f} {f !== "all" && `(${messages.filter(m => m.status === f).length})`}
          </button>
        ))}
        <button onClick={loadMessages} className="ml-auto text-xs text-primary font-medium hover:text-secondary flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Reload
        </button>
      </div>

      {/* Messages List */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800/50 flex items-center bg-slate-50/40 dark:bg-slate-800/30">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Inbox className="w-4 h-4 text-primary" /> Messages ({filtered.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-slate-500">No messages {statusFilter !== "all" ? `with status "${statusFilter}"` : ""}.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {filtered.map(msg => (
              <div key={msg.id} className={`p-5 transition-colors ${msg.status === "unread" ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {msg.teacherName?.charAt(0).toUpperCase() || "T"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-slate-800 dark:text-white text-[13px]">{msg.subject}</p>
                        <StatusBadge status={msg.status} />
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 capitalize flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" /> {msg.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span className="font-medium text-slate-600 dark:text-slate-300">{msg.teacherName}</span>
                        <span className="text-gray-300 dark:text-slate-600">·</span>
                        <Clock className="w-3 h-3" />
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {msg.status !== "resolved" && (
                      <button onClick={() => handleResolve(msg.id)} disabled={isResolvingId === msg.id}
                        className="p-1.5 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors disabled:opacity-50" title="Mark resolved">
                        {isResolvingId === msg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                    )}
                    <button onClick={() => { setExpandedId(expandedId === msg.id ? null : msg.id); setReplyingId(null); setReplyText(""); }}
                      className="p-1.5 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 rounded transition-colors" title="Expand">
                      {expandedId === msg.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => confirmDelete(msg.id)} disabled={isDeletingId === msg.id}
                      className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 rounded transition-colors disabled:opacity-50" title="Delete">
                      {isDeletingId === msg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {expandedId === msg.id && (
                  <div className="mt-4 space-y-3 ml-12">
                    {/* Teacher message */}
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                      <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Message from {msg.teacherName}</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{msg.message}</p>
                    </div>

                    {/* Existing reply */}
                    {msg.adminReply && (
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <p className="text-[11px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Reply className="w-3 h-3" /> Your Reply
                          {msg.repliedAt && <span className="normal-case font-normal text-gray-400 ml-1">· {new Date(msg.repliedAt).toLocaleString()}</span>}
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{msg.adminReply}</p>
                      </div>
                    )}

                    {/* Reply form */}
                    {msg.status !== "resolved" && (
                      replyingId === msg.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            rows={4}
                            placeholder="Type your reply to the teacher..."
                            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white resize-none"
                          />
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleSendReply(msg.id)} disabled={isSendingReply || !replyText.trim()}
                              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70">
                              {isSendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              {isSendingReply ? "Sending..." : msg.adminReply ? "Update Reply" : "Send Reply"}
                            </button>
                            <button onClick={() => { setReplyingId(null); setReplyText(""); }}
                              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-red-600 transition-colors">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setReplyingId(msg.id); setReplyText(msg.adminReply || ""); }}
                          className="flex items-center gap-2 px-4 py-2 bg-primary/5 dark:bg-primary/20 text-primary rounded-lg text-sm font-semibold hover:bg-primary/10 transition-colors">
                          <Reply className="w-4 h-4" />
                          {msg.adminReply ? "Edit Reply" : "Write Reply"}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CustomDialog {...dialogState} />
    </div>
  );
}
