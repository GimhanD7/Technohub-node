"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { fetchApi, API_BASE_URL } from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  Home,
  Loader2,
  Save,
  Upload,
  Image as ImageIcon,
  X,
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
  aitiDescription: "",
  aitiLogo: "",
  aitiLogoWidth: 120,
  aitiLogoHeight: 44,
  aitiDescriptionBold: false,
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

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchApi("/home/get_content?role=admin", { showToast: false });
    setIsLoading(false);

    if (data.success) {
      setSettings(normalizeSettings(data.settings));
    } else {
      toast.error(data.message || "Failed to load home page content.");
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        updateSettingsField('aitiLogo', data.imageUrl);
        toast.success("Logo uploaded successfully!");
      } else {
        toast.error(data.message || "Failed to upload logo.");
      }
    } catch (error) {
      toast.error("Logo upload error: " + error.message);
    }
  };

  const handleRemoveLogo = () => {
    updateSettingsField('aitiLogo', '');
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setIsSaving(true);

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
      toast.success(response.message || "Home content saved successfully!");
    } else {
      toast.error(response.message || "Failed to save home content.");
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
            ["aitiDescription", "AITI Description"],
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
            <div key={field} className={field.toLowerCase().includes("subtitle") || field === "whySubtitle" || field.toLowerCase().includes("description") ? "md:col-span-2" : ""}>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">{label}</label>
              {field.toLowerCase().includes("subtitle") || field === "whySubtitle" || field.toLowerCase().includes("description") ? (
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

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">AITI Logo</label>
            <div className="space-y-3">
              {settings.aitiLogo ? (
                <div className="relative p-4 bg-slate-50 dark:bg-[#0f172a] rounded-lg border border-gray-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={settings.aitiLogo.startsWith('http') ? settings.aitiLogo : `${API_BASE_URL}${settings.aitiLogo}`} 
                      alt="AITI Logo Preview" 
                      style={{ width: `${settings.aitiLogoWidth}px`, height: `${settings.aitiLogoHeight}px` }}
                      className="object-contain shrink-0"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{settings.aitiLogo}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    id="logo-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-slate-300">Click to upload logo image</span>
                  </label>
                </div>
              )}
              <p className="text-[11px] text-gray-500 dark:text-slate-400">Recommended: PNG or JPG, max 2MB, square aspect ratio</p>
              <div className="grid sm:grid-cols-2 gap-4 rounded-lg border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] p-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Display Width (px)</label>
                  <input
                    type="number"
                    min="20"
                    max="500"
                    value={settings.aitiLogoWidth}
                    onChange={(event) => updateSettingsField('aitiLogoWidth', Number(event.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#1e293b]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Display Height (px)</label>
                  <input
                    type="number"
                    min="20"
                    max="300"
                    value={settings.aitiLogoHeight}
                    onChange={(event) => updateSettingsField('aitiLogoHeight', Number(event.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#1e293b]"
                  />
                </div>
              </div>
              <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] p-4 cursor-pointer">
                <div>
                  <span className="block text-[13px] font-semibold text-slate-700 dark:text-white">Bold AITI description</span>
                  <span className="block mt-1 text-[11px] text-gray-500 dark:text-slate-400">Display the complete AITI description using bold text.</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(settings.aitiDescriptionBold)}
                  onChange={(event) => updateSettingsField('aitiDescriptionBold', event.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary shrink-0"
                />
              </label>
            </div>
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
