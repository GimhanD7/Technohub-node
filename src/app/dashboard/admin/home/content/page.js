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
  Plus,
  Trash2,
} from "lucide-react";

const defaultFeedbackItems = [
  { name: "A/L ICT Student", role: "Advanced Level", quote: "The quizzes and video lessons helped me revise faster because everything was connected in one platform." },
  { name: "University Learner", role: "Software Foundation", quote: "The practical resources and e-books made it easier to prepare for assignments and project presentations." },
  { name: "Professional Learner", role: "Career Upskilling", quote: "The platform feels focused. I can follow lessons, check resources, and keep track of learning activities clearly." },
];

const defaultFaqItems = [
  { question: "Can different student categories use the platform?", answer: "Yes. Techno-Hub supports school, O/L, A/L, university, vocational, and professional learners with category-focused resources." },
  { question: "Are e-books and quizzes available online?", answer: "Yes. Students can access e-books, learning materials, quizzes, rankings, and exam practice from the platform." },
  { question: "Can I join live or online classes?", answer: "Yes. Online classes and guided sessions can be managed through the platform alongside recorded video lessons." },
  { question: "How do I contact the support team?", answer: "Use the Contact Us page to send a message or reach the education support team through the available contact details." },
];

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
  heroStatOneValue: "6",
  heroStatOneLabel: "Learner categories",
  heroStatTwoValue: "24/7",
  heroStatTwoLabel: "Resource access",
  heroStatThreeValue: "Live",
  heroStatThreeLabel: "Classes and exams",
  feedbackHeading: "Learners trust focused, practical support.",
  feedbackItems: defaultFeedbackItems,
  faqItems: defaultFaqItems,
};

function normalizeSettings(settings) {
  return Object.keys(initialSettings).reduce((next, key) => {
    next[key] = settings?.[key] ?? initialSettings[key];
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

  const updateListItem = (field, index, itemField, value) => {
    setSettings((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) => itemIndex === index ? { ...item, [itemField]: value } : item),
    }));
  };

  const removeListItem = (field, index) => {
    setSettings((current) => ({ ...current, [field]: current[field].filter((_, itemIndex) => itemIndex !== index) }));
  };

  const addListItem = (field, item) => {
    setSettings((current) => ({ ...current, [field]: [...current[field], item] }));
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

          <div className="md:col-span-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0f172a] p-4">
            <div className="mb-4">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">Hero highlight boxes</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Customize the three information boxes displayed below the homepage buttons.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                ["heroStatOneValue", "heroStatOneLabel", "Box 1"],
                ["heroStatTwoValue", "heroStatTwoLabel", "Box 2"],
                ["heroStatThreeValue", "heroStatThreeLabel", "Box 3"],
              ].map(([valueField, labelField, boxLabel]) => (
                <div key={valueField} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] p-3 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{boxLabel}</p>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider mb-1.5">Value</label>
                    <input value={settings[valueField] ?? ""} onChange={(event) => updateSettingsField(valueField, event.target.value)} maxLength={40} className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm font-bold outline-none focus:border-primary dark:bg-[#0f172a]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider mb-1.5">Label</label>
                    <input value={settings[labelField] ?? ""} onChange={(event) => updateSettingsField(labelField, event.target.value)} maxLength={120} className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 rounded-xl border border-gray-200 dark:border-slate-800 p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">Student feedback</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Edit the section heading and testimonial cards.</p>
              </div>
              <button type="button" onClick={() => addListItem("feedbackItems", { name: "", role: "", quote: "" })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-[11px] font-semibold hover:bg-primary/90"><Plus className="w-3.5 h-3.5" /> Add feedback</button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider mb-1.5">Section heading</label>
              <input value={settings.feedbackHeading ?? ""} onChange={(event) => updateSettingsField("feedbackHeading", event.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
            </div>
            <div className="space-y-3">
              {settings.feedbackItems.map((item, index) => (
                <div key={index} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#0f172a] p-3">
                  <div className="flex justify-between items-center mb-3"><p className="text-[10px] font-bold uppercase tracking-wider text-primary">Feedback {index + 1}</p><button type="button" onClick={() => removeListItem("feedbackItems", index)} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" aria-label={`Remove feedback ${index + 1}`}><Trash2 className="w-3.5 h-3.5" /></button></div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input value={item.name} onChange={(event) => updateListItem("feedbackItems", index, "name", event.target.value)} placeholder="Learner name" className="rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#1e293b]" />
                    <input value={item.role} onChange={(event) => updateListItem("feedbackItems", index, "role", event.target.value)} placeholder="Learner category" className="rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#1e293b]" />
                    <textarea value={item.quote} onChange={(event) => updateListItem("feedbackItems", index, "quote", event.target.value)} placeholder="Feedback message" rows={3} className="sm:col-span-2 rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#1e293b] resize-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 rounded-xl border border-gray-200 dark:border-slate-800 p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="text-[13px] font-bold text-slate-800 dark:text-white">Frequently asked questions</h3><p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Add, edit, or remove questions shown on the homepage.</p></div>
              <button type="button" onClick={() => addListItem("faqItems", { question: "", answer: "" })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-[11px] font-semibold hover:bg-primary/90"><Plus className="w-3.5 h-3.5" /> Add FAQ</button>
            </div>
            <div className="space-y-3">
              {settings.faqItems.map((item, index) => (
                <div key={index} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#0f172a] p-3">
                  <div className="flex justify-between items-center mb-3"><p className="text-[10px] font-bold uppercase tracking-wider text-primary">Question {index + 1}</p><button type="button" onClick={() => removeListItem("faqItems", index)} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" aria-label={`Remove question ${index + 1}`}><Trash2 className="w-3.5 h-3.5" /></button></div>
                  <div className="space-y-3">
                    <input value={item.question} onChange={(event) => updateListItem("faqItems", index, "question", event.target.value)} placeholder="Question" className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm font-semibold outline-none focus:border-primary dark:bg-[#1e293b]" />
                    <textarea value={item.answer} onChange={(event) => updateListItem("faqItems", index, "answer", event.target.value)} placeholder="Answer" rows={3} className="w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#1e293b] resize-none" />
                  </div>
                </div>
              ))}
            </div>
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
