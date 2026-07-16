"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { fetchApi } from "@/lib/api";
import {
  AlertCircle,
  CheckCircle2,
  Home,
  Loader2,
  Save,
} from "lucide-react";

const initialSettings = {
  heroBadge: "",
  heroTitle: "",
  heroSubtitle: "",
  primaryCtaLabel: "",
  primaryCtaUrl: "",
  secondaryCtaLabel: "",
  secondaryCtaUrl: "",
  coursesHeading: "",
  coursesSubtitle: "",
  lecturersHeading: "",
  lecturersSubtitle: "",
  whyHeading: "",
  whySubtitle: "",
  timetableHeading: "",
  timetableSubtitle: "",
  faqHeading: "",
};

function normalizeSettings(settings) {
  return Object.keys(initialSettings).reduce((next, key) => {
    next[key] = settings?.[key] ?? "";
    return next;
  }, {});
}

export default function HomePageContentManager() {
  const [user] = useState(() => {
    if (typeof window === "undefined") return null;
    const savedUser = localStorage.getItem("techno_hub_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [settings, setSettings] = useState(() => ({ ...initialSettings }));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    const data = await fetchApi("/home/get_content?role=admin");
    setIsLoading(false);

    if (data.success) {
      setSettings(normalizeSettings(data.settings));
    } else {
      setErrorMsg(data.message || "Failed to load home page content.");
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadContent();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadContent]);

  const updateSettingsField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const response = await fetchApi("/home/update_settings", {
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
      setErrorMsg(response.message || "Failed to save home content.");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-[20px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            Homepage Content
          </h1>
          <p className="text-xs text-gray-500 dark:text-white">Edit text and headers for the homepage.</p>
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

      <form onSubmit={saveSettings} className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Save className="w-4 h-4 text-primary" />
            Content Settings
          </h2>
          <button type="button" onClick={loadContent} className="text-xs font-bold text-slate-500 dark:text-white hover:text-primary">Reload</button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            ["heroBadge", "Hero Badge"],
            ["heroTitle", "Hero Title"],
            ["primaryCtaLabel", "Primary Button Label"],
            ["primaryCtaUrl", "Primary Button Link"],
            ["secondaryCtaLabel", "Secondary Button Label"],
            ["secondaryCtaUrl", "Secondary Button Link"],
            ["coursesHeading", "Courses Heading"],
            ["coursesSubtitle", "Courses Subtitle"],
            ["lecturersHeading", "Lecturers Heading"],
            ["lecturersSubtitle", "Lecturers Subtitle"],
            ["whyHeading", "Why Section Heading"],
            ["whySubtitle", "Why Section Text"],
            ["timetableHeading", "Timetable Heading"],
            ["timetableSubtitle", "Timetable Text"],
            ["faqHeading", "FAQ Heading"],
          ].map(([field, label]) => (
            <div key={field} className={field.toLowerCase().includes("subtitle") || field === "whySubtitle" ? "md:col-span-2" : ""}>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">{label}</label>
              {field.toLowerCase().includes("subtitle") || field === "whySubtitle" ? (
                <textarea value={settings[field] ?? ""} onChange={(event) => updateSettingsField(field, event.target.value)} rows={3} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] resize-none" />
              ) : (
                <input value={settings[field] ?? ""} onChange={(event) => updateSettingsField(field, event.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
              )}
            </div>
          ))}
          
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Hero Subtitle</label>
            <textarea value={settings.heroSubtitle ?? ""} onChange={(event) => updateSettingsField("heroSubtitle", event.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] resize-none" />
          </div>
        </div>

        <Button type="submit" className="w-full gap-2 mt-6" disabled={isSaving || isLoading}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Home Content
        </Button>
      </form>
    </div>
  );
}
