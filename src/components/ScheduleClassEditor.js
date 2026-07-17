"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";
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
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const PLATFORMS = ["Zoom", "Google Meet", "Microsoft Teams", "Other"];

export default function ScheduleClassEditor({ classId: propClassId = null, isEdit: propIsEdit = false, onSaveSuccess = null, onCancel = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Support both prop-based usage and URL query param usage (?id=X&edit=1)
  const classId = propClassId ?? searchParams.get("id");
  const isEdit = propIsEdit || searchParams.get("edit") === "1";

  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMeetingLink, setFormMeetingLink] = useState("");
  const [formPlatform, setFormPlatform] = useState("Zoom");
  const [formOtherPlatform, setFormOtherPlatform] = useState("");
  const [formDateTime, setFormDateTime] = useState("");
  const [formDuration, setFormDuration] = useState(60);
  const [formFee, setFormFee] = useState(0);

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    isAlertOnly: false,
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = (title, message, type = "error", onClose = null) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      type,
      isAlertOnly: true,
      onCancel: () => {
        setDialogState((s) => ({ ...s, isOpen: false }));
        if (onClose) onClose();
      },
    });
  };

  const getBackUrl = (u = user) => {
    if (!u) return "/";
    return u.role === "admin"
      ? "/dashboard/admin/online-classes"
      : "/dashboard/teacher/online-classes";
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push(getBackUrl());
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(savedUser);
    setUser(parsed);

    if (isEdit && classId) {
      loadClassData(classId, parsed);
    }
  }, [classId, isEdit]);

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
        showAlert("Access Denied", "Live or ended classes cannot be edited.", "error", () => {
          if (onCancel) {
            onCancel();
          } else {
            router.push(getBackUrl(currentUser));
          }
        });
        return;
      }

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
        setFormDateTime(cls.date_time.replace(" ", "T").substring(0, 16));
      }

      setFormDuration(cls.duration || 60);
      setFormFee(cls.fee || 0);
    } else {
      showAlert("Error", data.message || "Failed to load class data.", "error");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      showAlert("Validation Error", "Please enter a class title.", "error");
      return;
    }
    if (!formMeetingLink.trim()) {
      showAlert("Validation Error", "Please enter the meeting link.", "error");
      return;
    }
    if (formPlatform === "Other" && !formOtherPlatform.trim()) {
      showAlert("Validation Error", "Please specify the platform name.", "error");
      return;
    }
    if (!formDateTime) {
      showAlert("Validation Error", "Please specify the date and time.", "error");
      return;
    }
    if (parseInt(formDuration) <= 0) {
      showAlert("Validation Error", "Duration must be greater than 0 minutes.", "error");
      return;
    }
    if (parseFloat(formFee) < 0) {
      showAlert("Validation Error", "Fee cannot be negative.", "error");
      return;
    }

    setIsSaving(true);

    const payload = {
      userId: user.id,
      role: user.role,
      title: formTitle,
      description: formDescription,
      meeting_link: formMeetingLink,
      platform: formPlatform === "Other" ? formOtherPlatform.trim() : formPlatform,
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
      showAlert("Success", "Class has been saved successfully.", "success", () => {
        if (onSaveSuccess) {
          onSaveSuccess();
        } else {
          router.push(getBackUrl());
        }
      });
    } else {
      showAlert("Error", response.message || "Failed to save online class.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
        <p>Loading class details...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <CustomDialog {...dialogState} />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          {(!onCancel && !onSaveSuccess) && (
            <Link
              href={getBackUrl()}
              className="p-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              {isEdit ? "Edit Online Class" : "Schedule New Live Class"}
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {isEdit
                ? "Update the details for this scheduled session."
                : "Fill in the details to schedule a new live session."}
            </p>
          </div>
        </div>

        <button
          form="schedule-class-form"
          type="submit"
          disabled={isSaving}
          className="hidden md:flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEdit ? "Update Session" : "Schedule Session"}
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
        <form id="schedule-class-form" onSubmit={handleSave} className="space-y-6">

          {/* Section: Basic Info */}
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
                <span className="font-normal text-gray-400 dark:text-slate-500">(Optional)</span>
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

          {/* Section: Platform & Link */}
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
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
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
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
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
                  onChange={(e) => setFormFee(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="e.g. 1500 (Leave 0 for Free)"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800/50">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 text-[13px] font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : isEdit ? (
                "Update Session"
              ) : (
                "Schedule Session"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
