"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, Video, RefreshCw, AlertCircle, Clock, ArrowRight, Lock, Search, X, Wallet, CheckCircle } from "lucide-react";
import { fetchApi } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { CustomDialog } from "@/components/ui/CustomDialog";

export default function OnlineClassPage() {
  const [classes, setClasses] = useState({ ongoing: [], upcoming: [], past: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("ongoing");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
    onCancel: () => setDialogState(s => ({ ...s, isOpen: false }))
  });

  const getCategoryFromTitle = (title) => {
    const t = title.toLowerCase();
    if (t.includes("math") || t.includes("calculus") || t.includes("algebra")) return "Mathematics";
    if (t.includes("physic") || t.includes("mechanic") || t.includes("lab")) return "Physics";
    if (t.includes("chem") || t.includes("reaction")) return "Chemistry";
    if (t.includes("bio")) return "Biology";
    if (t.includes("english") || t.includes("lit")) return "English";
    return "General";
  };

  const formatClassDateTime = (dateTimeStr, durationMins) => {
    if (!dateTimeStr) return { date: "N/A", timeRange: "N/A" };

    const start = new Date(dateTimeStr);
    if (isNaN(start.getTime())) return { date: "N/A", timeRange: "N/A" };

    const end = new Date(start.getTime() + (durationMins || 60) * 60 * 1000);

    const yyyy = start.getFullYear();
    const mm = String(start.getMonth() + 1).padStart(2, '0');
    const dd = String(start.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    const formatTime = (dateObj) => {
      let hours = dateObj.getHours();
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    return {
      date: formattedDate,
      timeRange: `${formatTime(start)} - ${formatTime(end)}`
    };
  };

  const loadClasses = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    
    let url = "/online_class/manage";
    
    const savedUser = localStorage.getItem("techno_hub_user");
    let currentUser = null;
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      setUser(currentUser);
      if (currentUser && currentUser.id) {
        url += `?studentId=${currentUser.id}`;
      }
    }
    
    const data = await fetchApi(url);
    setIsLoading(false);

    if (data.success) {
      setClasses(data.classes);
      if (data.classes.ongoing.length === 0 && data.classes.upcoming.length > 0) {
        setActiveTab("upcoming");
      }
    } else {
      setErrorMsg(data.message || "Failed to load live sessions.");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadClasses();
    }, 0);
    return () => clearTimeout(t);
  }, [loadClasses]);

  const handleEnroll = (cls) => {
    if (!user) {
      setDialogState({
        isOpen: true,
        type: "info",
        title: "Login Required",
        message: "Please login to enroll in paid online classes.",
        onConfirm: () => {
          setDialogState(s => ({ ...s, isOpen: false }));
          window.location.href = "/login";
        },
        onCancel: () => setDialogState(s => ({ ...s, isOpen: false }))
      });
      return;
    }

    setDialogState({
      isOpen: true,
      type: "warning",
      title: "Confirm Enrollment",
      message: `You are about to enroll in "${cls.title}". This will deduct LKR ${cls.fee} from your wallet. Do you want to proceed?`,
      onConfirm: async () => {
        setDialogState(s => ({ ...s, isOpen: false }));
        setIsLoading(true);
        const res = await fetchApi("/student/enroll_online_class", {
          method: "POST",
          body: JSON.stringify({
            student_id: user.id,
            online_class_id: cls.id
          })
        });
        
        if (res.success) {
          setDialogState({
            isOpen: true,
            type: "success",
            title: "Enrollment Successful!",
            message: "You have successfully enrolled in the live class.",
            isAlertOnly: true,
            onCancel: () => {
              setDialogState(s => ({ ...s, isOpen: false }));
              loadClasses();
            }
          });
        } else {
          setDialogState({
            isOpen: true,
            type: "error",
            title: "Enrollment Failed",
            message: res.message || "Failed to enroll. Please check your wallet balance.",
            isAlertOnly: true,
            onCancel: () => setDialogState(s => ({ ...s, isOpen: false }))
          });
          setIsLoading(false);
        }
      },
      onCancel: () => setDialogState(s => ({ ...s, isOpen: false }))
    });
  };

  const getFilteredClasses = () => {
    const list = activeTab === "ongoing" ? classes.ongoing : activeTab === "upcoming" ? classes.upcoming : classes.past;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) => c.title.toLowerCase().includes(q) || (c.creator_name || "").toLowerCase().includes(q)
    );
  };

  const getActiveTabCount = () => {
    if (activeTab === "ongoing") return classes.ongoing.length;
    if (activeTab === "upcoming") return classes.upcoming.length;
    return classes.past.length;
  };

  const getInitials = (name) => {
    if (!name) return "LS";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0].toUpperCase())
      .slice(0, 2)
      .join("");
  };

  return (
    <>
      <Navbar />
      <CustomDialog {...dialogState} />
      <main className="flex-1 flex flex-col pt-24 pb-20 px-6 max-w-7xl mx-auto w-full">

        {/* Hero Section - Matched to Exam Hall color pattern */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-12 shadow-xl mb-10 border border-slate-850 text-left">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-secondary/10 rounded-full blur-[90px] pointer-events-none"></div>

          {/* Content */}
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#1e293b]/10 backdrop-blur-md rounded-full text-[10px] font-bold text-secondary uppercase tracking-widest border border-white/5 shadow-sm mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse-slow"></span>
              LIVE BROADCAST CHANNEL
            </div>

            <h1 className="text-3xl md:text-4.5xl lg:text-5xl font-extrabold tracking-tight leading-none mb-4">
              Interactive Live <span className="text-gradient font-black">Lectures</span>
            </h1>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-xl">
              Participate in interactive, live audio-visual broadcasts with our expert instructors.
              Engage with your peers and ask questions in real-time.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 dark:border-red-900/50 text-red-650 text-sm font-medium rounded-2xl flex gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            {errorMsg}
          </div>
        )}

        {/* Tab Controls + Search Filter - Exam Hall Style */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          <div className="flex bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl gap-2 overflow-x-auto flex-shrink-0">
            {["ongoing", "upcoming", "past"].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchQuery(""); }}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all capitalize cursor-pointer whitespace-nowrap ${activeTab === tab
                  ? "bg-primary text-white shadow-md font-bold"
                  : "text-slate-500 dark:text-white hover:text-slate-850 hover:bg-slate-200/50"
                  }`}
              >
                {tab} Classes ({tab === "ongoing" ? classes.ongoing.length : tab === "upcoming" ? classes.upcoming.length : classes.past.length})
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by class title or instructor…"
              className="w-full pl-10 pr-10 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:bg-[#0f172a] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Classes Grid - Exam Hall Card Style */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-550 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-semibold">Retrieving class rosters...</p>
          </div>
        ) : getActiveTabCount() === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-150 p-6 shadow-sm">
            <Video className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-white">No Lectures Scheduled</h3>
            <p className="text-xs max-w-xs mx-auto mt-1">There are no {activeTab} online classes scheduled at this moment. Check back later!</p>
          </div>
        ) : getFilteredClasses().length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-150 p-6 shadow-sm">
            <Search className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-white">No Results Found</h3>
            <p className="text-xs max-w-xs mx-auto mt-1">No classes match &ldquo;{searchQuery}&rdquo;. Try a different keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredClasses().map((cls) => {
              const { date, timeRange } = formatClassDateTime(cls.date_time, cls.duration);
              const category = getCategoryFromTitle(cls.title);

              return (
                <div
                  key={cls.id}
                  className="
                    group p-[2px] rounded-[20px]
                    bg-gray-300
                    transition-all duration-300 ease-out
                    hover:bg-gradient-to-r hover:from-blue-500 hover:to-violet-500
                    shadow-[0_2px_12px_rgba(0,0,0,0.07)]
                    hover:shadow-[0_8px_24px_rgba(59,130,246,0.25)]
                    hover:-translate-y-1
                  "
                >
                  <div className="bg-white dark:bg-[#1e293b] rounded-[18px] flex flex-col justify-between relative overflow-hidden text-left h-full">

                    {/* Header Band */}
                    <div className={`px-6 py-5 border-b border-slate-100 dark:border-slate-800/50 bg-gradient-to-r ${activeTab === "ongoing"
                      ? "from-emerald-50 via-emerald-50/40 to-blue-50/40"
                      : "from-amber-50 via-amber-50/30 to-violet-50/40"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[16px] font-extrabold text-slate-850 tracking-tight group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {cls.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-white mt-0.5 capitalize">
                            {activeTab} • Class #{cls.id}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200 dark:border-blue-900/50">
                            {category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Body Info */}
                    <div className="px-6 py-5 space-y-4 flex-1">

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-blue-500 flex items-center justify-center shrink-0 text-white text-sm font-bold">
                          {getInitials(cls.creator_name)}
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Instructor</p>
                          <p className="text-[13px] font-bold text-slate-800 dark:text-white">{cls.creator_name || "LMS Lecturer"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Date & Time</p>
                          <p className="text-[13px] font-bold text-slate-800 dark:text-white">{date}</p>
                          <p className="text-[12px] text-slate-500 dark:text-white">{timeRange}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Duration</p>
                          <p className="text-[13px] font-bold text-slate-800 dark:text-white">{cls.duration} minutes</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                          <Video className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Platform</p>
                          <p className="text-[13px] font-bold text-slate-800 dark:text-white">{cls.platform || "Zoom"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cls.fee > 0 ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                          {cls.fee > 0 ? (
                            <Wallet className="w-4 h-4 text-blue-600" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Fee</p>
                          <p className="text-[13px] font-bold text-slate-800 dark:text-white">
                            {cls.fee > 0 ? `LKR ${cls.fee}` : "Free"}
                          </p>
                        </div>
                      </div>

                      {cls.description && (
                        <div className="pt-1">
                          <p className="text-[10px] text-slate-400 font-medium">Description</p>
                          <p className="text-[13px] text-slate-600 dark:text-white line-clamp-2">{cls.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 mt-auto">
                      {cls.fee > 0 && !cls.is_enrolled && activeTab !== "past" ? (
                        <Button 
                          onClick={() => handleEnroll(cls)}
                          disabled={isLoading}
                          className="w-full text-[12px] h-11 rounded-xl shadow-sm flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700"
                        >
                          <Wallet className="w-4 h-4" />
                          Enroll Now - LKR {cls.fee}
                        </Button>
                      ) : activeTab === "ongoing" ? (
                        <a
                          href={cls.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="w-full text-[12px] h-11 rounded-xl shadow-sm flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700">
                            <Video className="w-4 h-4" />
                            Join Live Class
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      ) : activeTab === "upcoming" ? (
                        <div className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5 text-[12px] text-slate-500 dark:text-white font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          Coming Soon
                        </div>
                      ) : (
                        <div className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5 text-[12px] text-slate-400 font-semibold cursor-not-allowed">
                          <Lock className="w-3.5 h-3.5" />
                          Class Ended
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}