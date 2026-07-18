"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  GraduationCap, BookOpen, Clock, Activity, TrendingUp, ClipboardList,
  ArrowRight, AlertCircle, Video, Calendar, RefreshCw, Lock, UserCheck,
  Play, CheckCircle2, Award, Wallet
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import Button from "@/components/ui/Button";
import { CustomDialog } from "@/components/ui/CustomDialog";

export default function StudentDashboard() {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (savedUser) return JSON.parse(savedUser);
    }
    return null;
  });
  const [quizzes, setQuizzes] = useState({ active: [], upcoming: [], past: [] });
  const [classes, setClasses] = useState({ ongoing: [], upcoming: [], past: [] });
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [quizError, setQuizError] = useState("");
  const [classError, setClassError] = useState("");
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [dashboardUpdates, setDashboardUpdates] = useState([]);
  const [dashboardError, setDashboardError] = useState("");

  // Tab States
  const [activeTab, setActiveTab] = useState("exams"); // "exams" | "classes"
  const [examSubTab, setExamSubTab] = useState("available"); // "available" | "past"
  const [classSubTab, setClassSubTab] = useState("ongoing"); // "ongoing" | "upcoming" | "past"

  // Unlock Quiz Modal state
  const [selectedQuizForUnlock, setSelectedQuizForUnlock] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const getDurationMinutes = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return Math.max(0, Math.round((end - start) / (1000 * 60)));
  };

  const getCategoryFromTitle = (title) => {
    const t = title.toLowerCase();
    if (t.includes("math") || t.includes("calculus") || t.includes("algebra")) return "Mathematics";
    if (t.includes("physic") || t.includes("mechanic") || t.includes("lab")) return "Physics";
    if (t.includes("chem") || t.includes("reaction")) return "Chemistry";
    if (t.includes("bio")) return "Biology";
    if (t.includes("english") || t.includes("lit")) return "English";
    return "General Quiz";
  };

  const formatClassDateTime = (dateTimeStr, durationMins) => {
    if (!dateTimeStr) return { date: "N/A", timeRange: "N/A" };
    const start = new Date(dateTimeStr.replace(/-/g, "/"));
    const end = new Date(start.getTime() + durationMins * 60 * 1000);
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

  const loadQuizzes = useCallback(async (userId) => {
    const data = await fetchApi(`/quiz/list?userId=${userId}`);
    setIsLoadingQuizzes(false);

    if (data.success) {
      setQuizzes(data.quizzes || { active: [], upcoming: [], past: [] });
    } else {
      setQuizError(data.message || "Failed to load quizzes.");
    }
  }, []);

  const loadClasses = useCallback(async () => {
    const data = await fetchApi("/online_class/manage");
    setIsLoadingClasses(false);

    if (data.success) {
      setClasses(data.classes);
      if (data.classes.ongoing.length === 0 && data.classes.upcoming.length > 0) {
        setClassSubTab("upcoming");
      }
    } else {
      setClassError(data.message || "Failed to load online classes.");
    }
  }, []);

  const loadDashboardSummary = useCallback(async (userId) => {
    const data = await fetchApi(`/student/get_dashboard_summary?student_id=${userId}`);

    if (data.success) {
      setDashboardSummary(data.summary);
      setDashboardUpdates(data.updates || []);
      setDashboardError("");
    } else {
      setDashboardError(data.message || "Failed to load dashboard summary.");
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      const t = setTimeout(() => {
        loadDashboardSummary(parsedUser.id);
        loadQuizzes(parsedUser.id);
        loadClasses();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [loadDashboardSummary, loadQuizzes, loadClasses]);

  const handleUnlockClick = (quiz) => {
    setSelectedQuizForUnlock(quiz);
  };

  const handleConfirmUnlock = async () => {
    if (!selectedQuizForUnlock) return;

    setIsUnlocking(true);
    const response = await fetchApi("/quiz/pay", {
      method: "POST",
      body: JSON.stringify({
        quizId: selectedQuizForUnlock.id,
        userId: user.id
      })
    });
    setIsUnlocking(false);
    setSelectedQuizForUnlock(null);

    if (response.success) {
      loadQuizzes(user.id);
    } else {
      toast.error(response.message || "Failed to unlock quiz.");
    }
  };

  if (!user) return null;

  const summary = dashboardSummary || {};
  const totalMaterials = Number(summary.total_materials || 0);
  const completedMaterials = Number(summary.completed_materials || 0);
  const overallProgress = Number(summary.overall_progress || 0);
  const enrolledCourses = Number(summary.enrolled_courses || 0);
  const completedCourses = Number(summary.completed_courses || 0);
  const dueThisWeek = Number(summary.due_this_week || 0);
  const liveNowCount = Number(summary.ongoing_classes || 0) + Number(summary.active_quizzes || 0);
  const upcomingCount = Number(summary.upcoming_classes || 0) + Number(summary.upcoming_quizzes || 0);
  const walletBalance = Number(summary.wallet_balance || 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Top Banner Area */}
      <div className="text-center py-6 mb-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-full text-[11px] font-medium text-gray-500 dark:text-white mb-5 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          {liveNowCount > 0 ? `${liveNowCount} live right now` : "Welcome back to your portal"}
        </div>
        <h1 className="text-[24px] md:text-[28px] font-bold text-slate-800 dark:text-white mb-2 tracking-tight">
          {(() => {
            const hour = new Date().getHours();
            const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
            const firstName = (user?.full_name || "").split(" ")[0];
            return firstName ? `${greeting}, ${firstName}` : greeting;
          })()}
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-white max-w-xl mx-auto">Track your courses, view your grades, and stay on top of upcoming assignments with this streamlined interface.</p>
      </div>

      {dashboardError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
          {dashboardError}
        </div>
      )}

      {/* Top Cards (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Card 1 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Learning Progress</h3>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-[18px] h-[18px] text-blue-500" />
            </div>
          </div>

          <h2 className="text-[28px] font-semibold text-slate-800 dark:text-white tracking-tight leading-none mb-1">{overallProgress}%</h2>
          <p className="text-[11px] text-gray-400 dark:text-white mb-4">Overall course completion</p>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white">
            <span className="font-medium text-slate-800 dark:text-white">{completedMaterials}</span> of {totalMaterials} lessons completed
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Courses Enrolled</h3>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-[18px] h-[18px] text-indigo-500" />
            </div>
          </div>

          <h2 className="text-[28px] font-semibold text-slate-800 dark:text-white tracking-tight leading-none mb-1">{enrolledCourses}</h2>
          <p className="text-[11px] text-gray-400 dark:text-white mb-4">Active enrollments</p>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(overallProgress, 100)}%` }}></div>
          </div>

          <div className="flex justify-between text-[11px] text-gray-500 dark:text-white text-center">
            <span>{completedCourses} completed courses</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Upcoming Schedule</h3>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
              <Clock className="w-[18px] h-[18px] text-amber-500" />
            </div>
          </div>

          <h2 className="text-[28px] font-semibold text-slate-800 dark:text-white tracking-tight leading-none mb-1">{dueThisWeek}</h2>
          <p className="text-[11px] text-amber-500 mb-4 font-medium">Classes and quizzes this week</p>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white text-center truncate">
            Next: <span className="font-medium text-slate-800 dark:text-white">{summary.next_event || "No upcoming schedule"}</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Wallet Balance</h3>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <Wallet className="w-[18px] h-[18px] text-emerald-500" />
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] text-gray-400 dark:text-white mb-1">Current</p>
              <h2 className="text-[20px] font-semibold text-slate-800 dark:text-white tracking-tight">LKR {walletBalance.toFixed(2)}</h2>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-400 dark:text-white mb-1">Live Now</p>
              <p className="text-[13px] font-medium text-slate-800 dark:text-white flex items-center justify-end gap-1">
                {liveNowCount} <TrendingUp className="w-3 h-3 text-green-500" />
              </p>
            </div>
          </div>

          <Link href="/dashboard/student/wallet" className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 flex items-center justify-between text-[11px] text-gray-500 dark:text-white group/wallet hover:text-blue-600 transition-colors">
            <span>{upcomingCount} upcoming activities</span>
            <span className="flex items-center gap-1 font-semibold text-blue-600">
              Top Up <ArrowRight className="w-3 h-3 group-hover/wallet:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>

      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="bg-white dark:bg-[#1e293b] p-1 rounded-xl border border-gray-200 dark:border-slate-800 inline-flex shadow-sm">
          <button
            onClick={() => setActiveTab("exams")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "exams"
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
          >
            <ClipboardList className="w-4 h-4" />
            Available Quizzes
          </button>
          <button
            onClick={() => setActiveTab("classes")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "classes"
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
          >
            <Video className="w-4 h-4" />
            Online Classes
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        {activeTab === "exams" ? (
          <>
            {/* Exams Sub Tabs */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div className="flex gap-2 border-b border-slate-50 pb-1.5 overflow-x-auto">
                {[
                  { id: "available", label: "Available" },
                  { id: "past", label: "Completed" }
                ].map((sub) => {
                  const count = sub.id === "available"
                    ? ((quizzes.active?.length || 0) + (quizzes.upcoming?.length || 0))
                    : (quizzes.past?.length || 0);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setExamSubTab(sub.id)}
                      className={`px-4 py-2 text-xs font-bold border-b-2 capitalize transition-all cursor-pointer whitespace-nowrap ${examSubTab === sub.id
                          ? "border-blue-500 text-blue-600 font-black scale-100 dark:border-blue-400 dark:text-blue-400"
                          : "border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                    >
                      {sub.label} Quizzes ({count})
                    </button>
                  );
                })}
              </div>
              <Link href="/dashboard/student/exams">
                <span className="flex items-center gap-1.5 text-blue-600 text-[12px] font-bold hover:underline cursor-pointer group">
                  Go to Exam Hall
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>

            {quizError && (
              <div className="p-4 bg-red-50 border border-red-200 dark:border-red-900/50 text-red-600 text-sm font-medium rounded-lg flex gap-2 mb-4">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {quizError}
              </div>
            )}

            {isLoadingQuizzes ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="w-7 h-7 animate-spin text-blue-600 mb-3" />
                <p className="text-xs font-semibold">Loading quizzes...</p>
              </div>
            ) : (examSubTab === "available" && ((quizzes.active?.length || 0) + (quizzes.upcoming?.length || 0)) === 0) || (examSubTab === "past" && (quizzes.past?.length || 0) === 0) ? (
              <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl p-6">
                <ClipboardList className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                <p className="text-xs font-bold text-slate-700">No {examSubTab} quizzes found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(examSubTab === "available" ? [...(quizzes.active || []), ...(quizzes.upcoming || [])] : (quizzes.past || [])).map((quiz) => {
                  const isActive = new Date(quiz.startTime) <= new Date() && new Date(quiz.endTime) >= new Date();
                  const isUpcoming = new Date(quiz.startTime) > new Date();
                  const duration = getDurationMinutes(quiz.startTime, quiz.endTime);

                  return (
                    <div key={quiz.id} className="bg-white rounded-3xl border border-slate-150 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group">
                      <div className={`p-5 border-b border-slate-100 ${parseFloat(quiz.fee) > 0 ? "bg-amber-50/50 dark:bg-amber-900/10" : "bg-emerald-50/50 dark:bg-emerald-900/10"}`}>
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                            {getCategoryFromTitle(quiz.title)}
                          </span>
                          {isActive && (
                            <span className="flex items-center gap-1 text-[9px] font-extrabold text-green-650 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full border border-green-150 animate-pulse-slow">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> Active
                            </span>
                          )}
                          {isUpcoming && !isActive && (
                            <span className="flex items-center gap-1 text-[9px] font-extrabold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Upcoming
                            </span>
                          )}
                        </div>
                        <h4 className="text-[13px] font-bold text-slate-800 leading-snug min-h-[38px] line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {quiz.title}
                        </h4>
                        {quiz.startTime && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md bg-slate-900/5 text-[10px] font-bold text-slate-700">
                            {new Date(quiz.startTime).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div className="p-5 space-y-3.5 flex-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-50">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 shrink-0 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                            {quiz.creatorName ? quiz.creatorName.charAt(0).toUpperCase() : "I"}
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Instructor</p>
                            <span className="font-bold text-slate-700 truncate block max-w-[150px]">{quiz.creatorName || "Lecturer"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <ClipboardList className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="text-slate-605 font-medium">Questions: <strong className="text-slate-800 font-bold">{quiz.questionCount}</strong></span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-slate-605 font-medium">Duration: <strong className="text-slate-800 font-bold">{duration} mins</strong></span>
                        </div>

                        <div className="pt-2.5 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 text-center">
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Start</p>
                              <p className="text-[12px] font-black text-slate-900 tabular-nums leading-tight mt-0.5">
                                {new Date(quiz.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                            <div className="flex-1 text-center">
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">End</p>
                              <p className="text-[12px] font-black text-slate-900 tabular-nums leading-tight mt-0.5">
                                {new Date(quiz.endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {quiz.attempt && quiz.attempt.isSubmitted && (
                        <div className="px-5 pb-5">
                          <div className="text-[11px] font-bold text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-100 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Score: {quiz.attempt.score}%
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Classes Sub Tabs */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div className="flex gap-2 border-b border-slate-50 pb-1.5 overflow-x-auto">
                {[
                  { id: "ongoing", label: "Ongoing" },
                  { id: "upcoming", label: "Upcoming" },
                  { id: "past", label: "Completed" }
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setClassSubTab(sub.id)}
                    className={`px-4 py-2 text-xs font-bold border-b-2 capitalize transition-all cursor-pointer whitespace-nowrap ${classSubTab === sub.id
                        ? "border-secondary text-primary font-black scale-100"
                        : "border-transparent text-slate-400 hover:text-slate-800"
                      }`}
                  >
                    {sub.label} Classes ({classes[sub.id]?.length || 0})
                  </button>
                ))}
              </div>
              <Link href="/home/online-class">
                <span className="flex items-center gap-1.5 text-primary text-[12px] font-bold hover:underline cursor-pointer group">
                  Join Live Broadcast
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>

            {classError && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-650 text-xs font-medium rounded-2xl flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {classError}
              </div>
            )}

            {isLoadingClasses ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="w-7 h-7 animate-spin text-primary mb-3" />
                <p className="text-xs font-semibold">Retrieving online lectures...</p>
              </div>
            ) : (classes[classSubTab] || []).length === 0 ? (
              <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl p-6">
                <Video className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                <p className="text-xs font-bold text-slate-700">No {classSubTab} classes scheduled</p>
                <p className="text-[10px] text-slate-400 mt-1">Please check the calendar schedule or query your batch representatives.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(classes[classSubTab] || []).map((cls) => {
                  const { date, timeRange } = formatClassDateTime(cls.date_time, cls.duration);
                  return (
                    <div
                      key={cls.id}
                      className={`bg-white rounded-3xl border flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group ${classSubTab === "ongoing" ? "border-red-200 ring-1 ring-red-50/50 shadow-md shadow-red-500/5" : "border-slate-150"
                        }`}
                    >
                      <div className="p-5 bg-slate-50/60 border-b border-slate-100">
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                            {getCategoryFromTitle(cls.title)}
                          </span>
                          {classSubTab === "ongoing" && (
                            <span className="flex items-center gap-1 text-[9px] font-extrabold text-red-650 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full border border-red-150 animate-pulse-slow">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span> Live Now
                            </span>
                          )}
                        </div>
                        <h4 className="text-[13px] font-bold text-slate-800 leading-snug min-h-[38px] line-clamp-2 group-hover:text-primary transition-colors">
                          {cls.title}
                        </h4>
                      </div>

                      <div className="p-5 space-y-3.5 flex-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-50">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-secondary shrink-0 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                            {cls.creator_name ? cls.creator_name.charAt(0).toUpperCase() : "I"}
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Instructor</p>
                            <span className="font-bold text-slate-700 truncate block max-w-[150px]">{cls.creator_name || "LMS Lecturer"}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <Calendar className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-800 leading-none mb-0.5">{date}</p>
                            <p className="text-[9px] text-slate-450 font-medium">{timeRange} ({cls.duration} mins)</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Video className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-slate-605 font-medium">Platform: <strong className="text-slate-800 font-bold">{cls.platform || "Zoom Meetings"}</strong></span>
                        </div>
                      </div>

                      <div className="p-5 pt-0">
                        {classSubTab === "ongoing" ? (
                          <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer" className="w-full inline-block">
                            <Button size="sm" className="w-full text-[11px] h-9 bg-gradient-to-r from-red-500 to-amber-500 hover:opacity-95 text-white flex items-center justify-center gap-1.5 font-bold rounded-xl shadow-sm border-none">
                              <Video className="w-3.5 h-3.5 animate-pulse" /> Join Live Lecture
                            </Button>
                          </a>
                        ) : classSubTab === "upcoming" ? (
                          <div className="w-full py-2 bg-slate-50 border border-slate-150/70 rounded-xl text-center text-slate-400 font-bold text-[10px] select-none">
                            Locks Until Scheduled Time
                          </div>
                        ) : (
                          <div className="w-full py-2 bg-gray-50 border border-gray-150 rounded-xl text-center text-gray-400 font-bold text-[10px] select-none uppercase tracking-wider">
                            Session Ended
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[14px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Recent Learning Updates
          </h3>
        </div>

        {dashboardUpdates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-slate-700 py-12 text-center">
            <Activity className="w-10 h-10 mx-auto text-slate-200 dark:text-slate-700 mb-3" />
            <p className="text-[13px] font-semibold text-slate-700 dark:text-white">No learning updates yet</p>
            <p className="mt-1 text-[12px] text-gray-500 dark:text-slate-300">New course materials, quizzes, and live classes will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-400 dark:text-white">
                  <th className="pb-3 px-2 font-semibold">Area</th>
                  <th className="pb-3 px-2 font-semibold">Update</th>
                  <th className="pb-3 px-2 font-semibold">Date</th>
                  <th className="pb-3 px-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-600 dark:text-white">
                {dashboardUpdates.map((update, index) => {
                  const statusStyle = (() => {
                    const s = (update.status || "").toLowerCase();
                    if (s.includes("complete") || s.includes("done") || s.includes("submitted")) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
                    if (s.includes("pending") || s.includes("progress") || s.includes("due")) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
                    if (s.includes("missed") || s.includes("fail") || s.includes("expired")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                    return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
                  })();
                  return (
                    <tr key={`${update.area}-${index}`} className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-2 font-medium text-slate-800 dark:text-white whitespace-nowrap">{update.area}</td>
                      <td className="py-3.5 px-2">{update.message}</td>
                      <td className="py-3.5 px-2 text-[12px] text-slate-500 dark:text-slate-300 whitespace-nowrap">{update.date}</td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${statusStyle}`}>
                          {update.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}