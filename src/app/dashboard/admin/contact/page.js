"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api";
import Button from "@/components/ui/Button";
import { CustomDialog } from "@/components/ui/CustomDialog";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";

const initialSettings = {
  heroBadge: "",
  title: "",
  subtitle: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  officeHours: "",
  mapUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  youtubeUrl: "",
  primaryCtaLabel: "",
  primaryCtaUrl: "",
};

function normalizeSettings(settings) {
  return Object.keys(initialSettings).reduce((normalized, key) => {
    normalized[key] = settings?.[key] ?? "";
    return normalized;
  }, {});
}

function formatDate(value) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminContactPage() {
  const [user] = useState(() => {
    if (typeof window === "undefined") return null;
    const savedUser = localStorage.getItem("techno_hub_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [settings, setSettings] = useState(() => ({ ...initialSettings }));
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingMessageId, setUpdatingMessageId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'info', title: '', message: '', isAlertOnly: false, onConfirm: null, onCancel: null });

  const stats = useMemo(() => {
    const fresh = messages.filter((message) => message.status === "new").length;
    const closed = messages.filter((message) => message.status === "closed").length;
    return { total: messages.length, fresh, closed };
  }, [messages]);

  const loadContactData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");

    const [settingsData, messagesData] = await Promise.all([
      fetchApi("/contact/get_settings"),
      fetchApi("/contact/list_messages?role=admin"),
    ]);

    setIsLoading(false);

    if (settingsData.success) {
      setSettings(normalizeSettings(settingsData.settings));
    } else {
      setErrorMsg(settingsData.message || "Failed to load contact settings.");
    }

    if (messagesData.success) {
      setMessages(messagesData.messages);
    } else {
      setErrorMsg(messagesData.message || "Failed to load contact messages.");
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadContactData();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadContactData]);

  const updateField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const response = await fetchApi("/contact/update_settings", {
      method: "POST",
      body: JSON.stringify({
        ...settings,
        userId: user?.id,
        role: user?.role,
      }),
    });

    setIsSaving(false);

    if (response.success) {
      setSuccessMsg(response.message);
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setErrorMsg(response.message || "Failed to update contact details.");
    }
  };

  const updateMessageStatus = async (messageId, status) => {
    setUpdatingMessageId(messageId);
    setErrorMsg("");

    const response = await fetchApi("/contact/update_message_status", {
      method: "POST",
      body: JSON.stringify({
        messageId,
        status,
        role: user?.role,
      }),
    });

    setUpdatingMessageId(null);

    if (response.success) {
      setMessages((current) => current.map((message) => (
        message.id === messageId ? { ...message, status } : message
      )));
    } else {
      setErrorMsg(response.message || "Failed to update message status.");
    }
  };

  const executeDeleteMessage = async (messageId) => {
    setUpdatingMessageId(messageId);
    setErrorMsg("");

    const response = await fetchApi("/contact/delete_message", {
      method: "POST",
      body: JSON.stringify({
        messageId,
        role: user?.role,
      }),
    });

    setUpdatingMessageId(null);

    if (response.success) {
      setMessages((current) => current.filter((message) => message.id !== messageId));
    } else {
      setErrorMsg(response.message || "Failed to delete contact message.");
    }
  };

  const deleteMessage = (messageId) => {
    setDialogState({
      isOpen: true,
      type: 'warning',
      title: 'Delete Contact Message?',
      message: 'Are you sure you want to permanently delete this contact message from the log?',
      isAlertOnly: false,
      onConfirm: async () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        await executeDeleteMessage(messageId);
      },
      onCancel: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-[20px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Contact Page Manager
          </h1>
          <p className="text-xs text-gray-500 dark:text-white">Manage public contact details and review student or parent messages.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 min-w-[360px]">
          <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-white">Messages</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-white">New</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.fresh}</p>
          </div>
          <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-white">Closed</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.closed}</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 dark:border-red-900/50 text-red-600 text-sm font-medium rounded-lg flex gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 dark:border-green-900/50 text-green-700 text-sm font-medium rounded-lg flex gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="grid xl:grid-cols-[430px_1fr] gap-6 items-start">
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Save className="w-4 h-4 text-primary" />
              Public Contact Details
            </h2>
            <button type="button" onClick={loadContactData} className="text-xs font-bold text-slate-500 dark:text-white hover:text-primary">
              Reload
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Small Heading</label>
            <input value={settings.heroBadge ?? ""} onChange={(event) => updateField("heroBadge", event.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" required />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Page Title</label>
            <input value={settings.title ?? ""} onChange={(event) => updateField("title", event.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" required />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Intro Text</label>
            <textarea value={settings.subtitle ?? ""} onChange={(event) => updateField("subtitle", event.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Phone</label>
              <input value={settings.phone ?? ""} onChange={(event) => updateField("phone", event.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">WhatsApp</label>
              <input value={settings.whatsapp ?? ""} onChange={(event) => updateField("whatsapp", event.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" value={settings.email ?? ""} onChange={(event) => updateField("email", event.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Address</label>
            <textarea value={settings.address ?? ""} onChange={(event) => updateField("address", event.target.value)} rows={3} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] resize-none" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Office Hours</label>
            <input value={settings.officeHours ?? ""} onChange={(event) => updateField("officeHours", event.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Google Map Link</label>
            <input value={settings.mapUrl ?? ""} onChange={(event) => updateField("mapUrl", event.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">CTA Label</label>
              <input value={settings.primaryCtaLabel ?? ""} onChange={(event) => updateField("primaryCtaLabel", event.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">CTA Link</label>
              <input value={settings.primaryCtaUrl ?? ""} onChange={(event) => updateField("primaryCtaUrl", event.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input value={settings.facebookUrl ?? ""} onChange={(event) => updateField("facebookUrl", event.target.value)} placeholder="Facebook link" className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
            <input value={settings.instagramUrl ?? ""} onChange={(event) => updateField("instagramUrl", event.target.value)} placeholder="Instagram link" className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
            <input value={settings.linkedinUrl ?? ""} onChange={(event) => updateField("linkedinUrl", event.target.value)} placeholder="LinkedIn link" className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
            <input value={settings.youtubeUrl ?? ""} onChange={(event) => updateField("youtubeUrl", event.target.value)} placeholder="YouTube link" className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "Saving..." : "Save Contact Details"}
          </Button>
        </form>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Contact Preview</h2>
                <p className="text-xs text-gray-500 dark:text-white">This is the information students see on the public page.</p>
              </div>
              <a href="/home/contact-us" target="_blank" className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 dark:border-slate-800 px-3 text-xs font-bold text-slate-600 dark:text-white hover:border-primary/40 hover:text-primary">
                <ExternalLink className="w-4 h-4" />
                Open Page
              </a>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                <Phone className="w-5 h-5 text-primary mb-3" />
                <p className="text-xs font-bold uppercase text-slate-400">Phone</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{settings.phone || "Not set"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                <Mail className="w-5 h-5 text-primary mb-3" />
                <p className="text-xs font-bold uppercase text-slate-400">Email</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{settings.email || "Not set"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                <MapPin className="w-5 h-5 text-primary mb-3" />
                <p className="text-xs font-bold uppercase text-slate-400">Address</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{settings.address || "Not set"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                <Clock className="w-5 h-5 text-primary mb-3" />
                <p className="text-xs font-bold uppercase text-slate-400">Hours</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{settings.officeHours || "Not set"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Submitted Messages</h2>
                <p className="text-xs text-gray-500 dark:text-white">Review contact form messages and mark follow-up status.</p>
              </div>
              <button onClick={loadContactData} className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 dark:border-slate-800 px-3 text-xs font-bold text-slate-600 dark:text-white hover:border-primary/40 hover:text-primary">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="py-20 flex justify-center text-slate-500 dark:text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="py-20 text-center text-slate-500 dark:text-white">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium">No contact messages yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800/50">
                {messages.map((message) => (
                  <article key={message.id} className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white">{message.subject}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${message.status === "new" ? "bg-blue-50 text-blue-700" : message.status === "closed" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600 dark:text-white"}`}>
                            {message.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-white mt-1">{message.fullName} / {message.learnerType || "Visitor"} / {formatDate(message.createdAt)}</p>
                        <p className="text-sm text-slate-600 dark:text-white leading-6 mt-3 whitespace-pre-line">{message.message}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-white mt-3">
                          {message.email && <span>{message.email}</span>}
                          {message.phone && <span>{message.phone}</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap lg:flex-col gap-2">
                        <button onClick={() => updateMessageStatus(message.id, "read")} disabled={updatingMessageId === message.id} className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 px-3 text-xs font-bold text-slate-600 dark:text-white hover:text-primary hover:border-primary/30">
                          Mark Read
                        </button>
                        <button onClick={() => updateMessageStatus(message.id, "closed")} disabled={updatingMessageId === message.id} className="h-9 rounded-lg border border-green-100 px-3 text-xs font-bold text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">
                          Close
                        </button>
                        <button onClick={() => deleteMessage(message.id)} disabled={updatingMessageId === message.id} className="h-9 rounded-lg border border-red-100 px-3 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 inline-flex items-center gap-2 justify-center">
                          {updatingMessageId === message.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <CustomDialog {...dialogState} />
    </div>
  );
}
