"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  Video,
  Link2,
  Save,
  RefreshCw,
  Wallet,
  User,
  ChevronRight,
} from "lucide-react";

const PLATFORMS = ["Zoom", "Google Meet", "Microsoft Teams", "Other"];

export default function AdminOnlineClassCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const classId = searchParams.get("id");
  const isEdit = searchParams.get("edit") === "1";

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherSelected, setTeacherSelected] = useState(false);

  const [formTeacherId, setFormTeacherId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMeetingLink, setFormMeetingLink] = useState("");
  const [formPlatform, setFormPlatform] = useState("Zoom");
  const [formOtherPlatform, setFormOtherPlatform] = useState("");
  const [formDateTime, setFormDateTime] = useState("");
  const [formDuration, setFormDuration] = useState(60);
  const [formFee, setFormFee] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(savedUser);
    setUser(parsed);

    if (!isEdit) {
      loadTeachers();
    } else {
      setTeacherSelected(true);
      if (classId) {
        loadClassData(classId, parsed);
      }
    }
  }, [classId, isEdit]);

  const loadTeachers = async () => {
    setIsLoadingTeachers(true);
    const data = await fetchApi("/online_class/teachers");
    setIsLoadingTeachers(false);
    if (data.success) {
      setTeachers(data.teachers || []);
    } else {
      toast.error("Failed to load teachers list.");
    }
  };

  const loadClassData = async (id, currentUser) => {
    setIsLoading(true);
    const data = await fetchApi(
      `/online_class/manage?id=${id}&userId=${currentUser.id}&role=${currentUser.role}`
    );
    setIsLoading(false);

    if (data.success && data.class) {
      const cls = data.class;

      const now = new Date();
      const cStart = new Date(cls.date_time);
      if (now >= cStart) {
        toast.error("Live or ended classes cannot be edited.");
        router.push("/dashboard/admin/online-classes");
        return;
      }

      setFormTeacherId(String(cls.created_by || ""));
      setFormTitle(cls.title || "");
      setFormDescription(cls.description || "");
      setFormMeetingLink(cls.meeting_link || "");

      if (PLATFORMS.includes(cls.platform)) {
        setFormPlatform(cls.platform);
      } else {
        setFormPlatform("Other");
        setFormOtherPlatform(cls.platform || "");
      }

      if (cls.date_time) {
        const dt = new Date(cls.date_time);
        const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
        setFormDateTime(local.toISOString().substring(0, 16));
      }

      setFormDuration(cls.duration || 60);
      setFormFee(cls.fee || 0);
    } else {
      toast.error(data.message || "Failed to load class data.");
      router.push("/dashboard/admin/online-classes");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const actualTeacherId = isEdit ? formTeacherId : (selectedTeacher ? selectedTeacher.id : "");
    if (!actualTeacherId) return toast.error("Please select a teacher.");

    if (!formTitle.trim()) return toast.error("Please enter a class title.");
    if (!formMeetingLink.trim()) return toast.error("Please enter the meeting link.");
    if (formPlatform === "Other" && !formOtherPlatform.trim())
      return toast.error("Please specify the platform name.");
    if (!formDateTime) return toast.error("Please specify the date and time.");
    if (parseInt(formDuration) <= 0)
      return toast.error("Duration must be greater than 0 minutes.");
    if (parseFloat(formFee) < 0) return toast.error("Fee cannot be negative.");

    setIsSaving(true);

    const payload = {
      teacher_id: actualTeacherId,
      userId: user.id,
      role: user.role,
      title: formTitle,
      description: formDescription,
      meeting_link: formMeetingLink,
      platform:
        formPlatform === "Other" ? formOtherPlatform.trim() : formPlatform,
      date_time: formDateTime,
      duration: parseInt(formDuration),
      fee: parseFloat(formFee),
    };

    if (isEdit && classId) {
      payload.id = classId;
    }

    const response = await fetchApi("/online_class/manage", {
      method: isEdit ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });

    setIsSaving(false);

    if (response.success) {
      toast.success(
        isEdit ? "Class updated successfully." : "Class scheduled successfully."
      );
      router.push("/dashboard/admin/online-classes");
    } else {
      toast.error(response.message || "Failed to save class.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Stage 1: Admin Teacher Selection (if not edit and teacher not selected)
  if (!isEdit && user?.role === "admin" && !teacherSelected) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-slate-800 pb-5">
          <button
            onClick={() => router.push("/dashboard/admin/online-classes")}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Create Class — Select Teacher</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">Choose which teacher this class will be created for.</p>
          </div>
        </div>

        {isLoadingTeachers ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mb-3" />
            <p className="text-sm">Loading teachers...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
            No teachers found. Please add teachers to the system first.
          </div>
        ) : (
          <div className="space-y-3">
            {teachers.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedTeacher(t); setTeacherSelected(true); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
                  selectedTeacher?.id === t.id
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0">
                  {t.profile_picture ? (
                    <img src={t.profile_picture} alt={t.full_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{t.full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t.email || t.subject || "Teacher"}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Stage 2: The Main Form
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 py-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => !isEdit ? setTeacherSelected(false) : router.push("/dashboard/admin/online-classes")}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              {isEdit ? "Edit Online Class" : "Schedule New Live Class"}
            </h1>
            {!isEdit && selectedTeacher && (
              <p className="text-xs text-primary dark:text-primary font-medium mt-0.5">For: {selectedTeacher.full_name}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {isEdit
                ? "Update the details for this scheduled class."
                : "Fill in the details to schedule a new live class."}
            </p>
          </div>
        </div>
        <button
          form="admin-schedule-class-form"
          type="submit"
          disabled={isSaving}
          className="hidden md:flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEdit ? "Update class" : "Schedule class"}
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
        <form
          id="admin-schedule-class-form"
          onSubmit={handleSave}
          className="space-y-6"
        >
          {/* Section: Class Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700/50 pb-2">
              Class Information
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Class Title / Name
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. A/L Biology Live Seminar"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Description{" "}
                <span className="font-normal text-gray-400 dark:text-slate-500">
                  (Optional)
                </span>
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief overview of topics to be covered..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Section: Platform & Meeting Link */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700/50 pb-2 flex items-center gap-2">
              <Video className="w-4 h-4" /> Platform & Meeting Link
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Platform
                </label>
                <select
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              {formPlatform === "Other" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={formOtherPlatform}
                    onChange={(e) => setFormOtherPlatform(e.target.value)}
                    placeholder="e.g. Webex, Discord"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" /> Meeting Link
              </label>
              <input
                type="url"
                value={formMeetingLink}
                onChange={(e) => setFormMeetingLink(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          {/* Section: Schedule */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700/50 pb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formDateTime}
                  onChange={(e) => setFormDateTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Duration (Mins)
                </label>
                <input
                  type="number"
                  value={formDuration}
                  onChange={(e) =>
                    setFormDuration(Math.max(1, parseInt(e.target.value) || 0))
                  }
                  min="1"
                  placeholder="e.g. 60"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" /> Fee Amount (LKR)
                </label>
                <input
                  type="number"
                  value={formFee}
                  onChange={(e) => setFormFee(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0 for Free"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800/50">
            <button
              type="button"
              onClick={() => !isEdit ? setTeacherSelected(false) : router.push("/dashboard/admin/online-classes")}
              className="px-6 py-2.5 text-[13px] font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : isEdit ? (
                "Update class"
              ) : (
                "Schedule class"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
