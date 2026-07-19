"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";
import {
  AlertCircle, CheckCircle2, Clock, Inbox, Loader2, MessageSquare,
  RefreshCw, Reply, Send, Tag, Trash2, X, ChevronDown, ChevronUp,
} from "lucide-react";

const CATEGORIES = ["general", "report", "request", "feedback", "technical", "other"];

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

export default function TeacherMessagesPage() {
  const [user] = useState(() => {
    if (typeof window === "undefined") return null;
    const s = localStorage.getItem("techno_hub_user");
    return s ? JSON.parse(s) : null;
  });

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [dialogState, setDialogState] = useState({ isOpen: false, type: "info", title: "", message: "", isAlertOnly: false, onConfirm: null, onCancel: null });

  const [form, setForm] = useState({ subject: "", category: "general", message: "" });

  const loadMessages = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await fetchApi(`/teacher-messages/my_messages?teacher_id=${user.id}`);
    setIsLoading(false);
    if (data.success) setMessages(data.messages);
    else setErrorMsg(data.message || "Failed to load messages.");
  }, [user]);

  useEffect(() => {
    const t = window.setTimeout(() => loadMessages(), 0);
    return () => window.clearTimeout(t);
  }, [loadMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) { setErrorMsg("Subject and message are required."); return; }
    setIsSending(true); setErrorMsg(""); setSuccessMsg("");
    const res = await fetchApi("/teacher-messages/send", {
      method: "POST",
      body: JSON.stringify({ teacher_id: user.id, subject: form.subject, message: form.message, category: form.category }),
    });
    setIsSending(false);
    if (res.success) {
      setSuccessMsg("Message sent to admin.");
      setForm({ subject: "", category: "general", message: "" });
      setShowCompose(false);
      loadMessages();
      setTimeout(() => setSuccessMsg(""), 4000);
    } else setErrorMsg(res.message || "Failed to send.");
  };

  const confirmDelete = (msgId) => {
    setDialogState({
      isOpen: true, type: "warning", title: "Delete Message?",
      message: "Permanently delete this message?",
      isAlertOnly: false,
      onConfirm: async () => { setDialogState(p => ({ ...p, isOpen: false })); await executeDelete(msgId); },
      onCancel: () => setDialogState(p => ({ ...p, isOpen: false }))
    });
  };

  const executeDelete = async (msgId) => {
    setIsDeletingId(msgId);
    const res = await fetchApi("/teacher-messages/delete", {
      method: "POST",
      body: JSON.stringify({ id: msgId, teacher_id: user.id, role: "teacher" }),
    });
    setIsDeletingId(null);
    if (res.success) { setSuccessMsg("Message deleted."); loadMessages(); setTimeout(() => setSuccessMsg(""), 3000); }
    else setErrorMsg(res.message || "Delete failed.");
  };

  const unread = messages.filter(m => m.status === "unread").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-[20px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Message Admin
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Send reports, requests, or feedback directly to the admin team.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800">
              {unread} waiting for reply
            </span>
          )}
          <button
            onClick={() => setShowCompose(c => !c)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            {showCompose ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            {showCompose ? "Cancel" : "Compose"}
          </button>
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

      {/* Compose Form */}
      {showCompose && (
        <form onSubmit={handleSend} className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> Compose Message
          </h2>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Subject *</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required
              placeholder="Brief summary of your message"
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button type="button" key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border transition-colors ${form.category === cat ? "bg-primary text-white border-primary" : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary hover:text-primary"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Message *</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required rows={5}
              placeholder="Describe your message in detail..."
              className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white resize-none" />
          </div>

          <button type="submit" disabled={isSending}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-70">
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSending ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}

      {/* Messages List */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/40 dark:bg-slate-800/30">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Inbox className="w-4 h-4 text-primary" /> My Messages ({messages.length})
          </h3>
          <button onClick={loadMessages} className="text-xs text-primary font-medium hover:text-secondary flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Reload
          </button>
        </div>

        {isLoading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-slate-500">You haven't sent any messages yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {messages.map(msg => (
              <div key={msg.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-slate-800 dark:text-white text-[13px]">{msg.subject}</p>
                      <StatusBadge status={msg.status} />
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 capitalize flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" /> {msg.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                      className="p-1.5 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 rounded transition-colors" title="View">
                      {expandedId === msg.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => confirmDelete(msg.id)} disabled={isDeletingId === msg.id}
                      className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 rounded transition-colors disabled:opacity-50" title="Delete">
                      {isDeletingId === msg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {expandedId === msg.id && (
                  <div className="mt-4 space-y-3">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                      <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Your Message</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{msg.message}</p>
                    </div>

                    {msg.adminReply && (
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <p className="text-[11px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Reply className="w-3 h-3" /> Admin Reply
                          {msg.repliedAt && <span className="normal-case font-normal text-gray-400 ml-1">· {new Date(msg.repliedAt).toLocaleString()}</span>}
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{msg.adminReply}</p>
                      </div>
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
