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
  const [quizzes, setQuizzes] = useState([]);
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
  const [examSubTab, setExamSubTab] = useState("active"); // "active" | "upcoming" | "past"
  const [classSubTab, setClassSubTab] = useState("ongoing"); // "ongoing" | "upcoming" | "past"

  // Unlock Quiz Modal state
  const [selectedQuizForUnlock, setSelectedQuizForUnlock] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const getDurationMinutes = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime.replace(/-/g, "/")).getTime();
    const end = new Date(endTime.replace(/-/g, "/")).getTime();
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
      // Flatten the active/upcoming/past buckets into a single array
      const { active = [], upcoming = [], past = [] } = data.quizzes || {};
      setQuizzes([...active, ...upcoming, ...past]);
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
      <div className="text-center py-4 mb-2">
         <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-full text-[11px] font-medium text-gray-500 dark:text-white mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Welcome back to your portal
         </div>
         <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white mb-2 tracking-tight">The Ultimate Student Dashboard</h1>
         <p className="text-[13px] text-gray-500 dark:text-white max-w-xl mx-auto">Track your courses, view your grades, and stay on top of upcoming assignments with this streamlined interface.</p>
      </div>

      {dashboardError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
          {dashboardError}
        </div>
      )}

      {/* Top Cards (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Learning Progress</h3>
              <GraduationCap className="w-[18px] h-[18px] text-gray-400 dark:text-white" />
           </div>
           
           <h2 className="text-[28px] font-semibold text-slate-800 dark:text-white tracking-tight leading-none mb-1">{overallProgress}%</h2>
           <p className="text-[11px] text-gray-400 dark:text-white mb-4">Overall course completion</p>
           
           <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white">
             <span className="font-medium text-slate-800 dark:text-white">{completedMaterials}</span> of {totalMaterials} lessons completed
           </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Courses Enrolled</h3>
              <BookOpen className="w-[18px] h-[18px] text-gray-400 dark:text-white" />
           </div>
           
           <h2 className="text-[28px] font-semibold text-slate-800 dark:text-white tracking-tight leading-none mb-1">{enrolledCourses}</h2>
           <p className="text-[11px] text-gray-400 dark:text-white mb-4">Active enrollments</p>
           
           <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
             <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(overallProgress, 100)}%` }}></div>
           </div>
           
           <div className="flex justify-between text-[11px] text-gray-500 dark:text-white text-center">
             <span>{completedCourses} completed courses</span>
           </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Upcoming Schedule</h3>
              <Clock className="w-[18px] h-[18px] text-gray-400 dark:text-white" />
           </div>
           
           <h2 className="text-[28px] font-semibold text-slate-800 dark:text-white tracking-tight leading-none mb-1">{dueThisWeek}</h2>
           <p className="text-[11px] text-yellow-500 mb-4 font-medium">Classes and quizzes this week</p>
           
           <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white text-center">
             Next: <span className="font-medium text-slate-800 dark:text-white">{summary.next_event || "No upcoming schedule"}</span>
           </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Wallet Balance</h3>
              <Wallet className="w-[18px] h-[18px] text-gray-400 dark:text-white" />
           </div>
           
           <div className="flex items-end justify-between">
              <div>
                 <p className="text-[11px] text-gray-400 dark:text-white mb-1">Current</p>
                 <h2 className="text-[20px] font-semibold text-slate-800 dark:text-white tracking-tight">LKR {walletBalance.toFixed(2)}</h2>
              </div>
              <div className="text-right">
                 <p className="text-[11px] text-gray-400 dark:text-white mb-1">Live Now</p>
                 <p className="text-[13px] font-medium text-slate-800 dark:text-white">{liveNowCount} <TrendingUp className="inline w-3 h-3 text-green-500" /></p>
              </div>
           </div>
           
           <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white text-center">
             {upcomingCount} upcoming learning activities
           </div>
        </div>

      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="bg-white dark:bg-[#1e293b] p-1 rounded-xl border border-gray-200 dark:border-slate-800 inline-flex shadow-sm">
          <button
            onClick={() => setActiveTab("exams")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "exams"
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Available Quizzes
          </button>
          <button
            onClick={() => setActiveTab("classes")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "classes"
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Online Classes
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        {activeTab === "exams" ? (
          <>
            <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-white">Available Quizzes</h3>
          </div>
        </div>

        {quizError && (
          <div className="p-4 bg-red-50 border border-red-200 dark:border-red-900/50 text-red-600 text-sm font-medium rounded-lg flex gap-2 mb-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {quizError}
          </div>
        )}

        {isLoadingQuizzes ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-white text-sm">Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-white text-sm">No quizzes available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => {
              const isActive = new Date(quiz.startTime) <= new Date() && new Date(quiz.endTime) >= new Date();
              const isUpcoming = new Date(quiz.startTime) > new Date();
              
              return (
                <div key={quiz.id} className="border border-gray-200 dark:border-slate-800 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-[13px] font-bold text-slate-800 dark:text-white flex-1">{quiz.title}</h4>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 ml-2 shrink-0">ACTIVE</span>
                    )}
                    {isUpcoming && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 ml-2 shrink-0">UPCOMING</span>
                    )}
                  </div>
                  
                  <p className="text-[12px] text-gray-500 dark:text-white mb-3">By {quiz.creatorName}</p>
                  
                  <div className="space-y-2 mb-4 text-[12px] text-gray-600 dark:text-white">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-gray-400 dark:text-white" />
                      <span>{quiz.questionCount} questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400 dark:text-white" />
                      <span>Starts: {new Date(quiz.startTime).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400 dark:text-white" />
                      <span>Ends: {new Date(quiz.endTime).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {quiz.attempt && quiz.attempt.isSubmitted ? (
                    <div className="space-y-2">
                      <div className="text-[12px] font-medium text-blue-600 bg-blue-50 p-2 rounded text-center">
                        Score: {quiz.attempt.score}%
                      </div>
                    </div>
                  ) : null}
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
                      className={`px-4 py-2 text-xs font-bold border-b-2 capitalize transition-all cursor-pointer whitespace-nowrap ${
                        classSubTab === sub.id
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
                        className={`bg-white rounded-3xl border flex flex-col justify-between hover:shadow-lg transition-all duration-300 overflow-hidden group ${
                          classSubTab === "ongoing" ? "border-red-200 ring-1 ring-red-50/50 shadow-md shadow-red-500/5" : "border-slate-150"
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

      <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[14px] font-bold text-slate-800 dark:text-white">Recent Learning Updates</h3>
        </div>
        
        {dashboardUpdates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 dark:border-slate-700 py-10 text-center">
            <p className="text-[13px] font-semibold text-slate-700 dark:text-white">No learning updates yet</p>
            <p className="mt-1 text-[12px] text-gray-500 dark:text-slate-300">New course materials, quizzes, and live classes will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-400 dark:text-white">
                <th className="pb-3 font-semibold">Area</th>
                <th className="pb-3 font-semibold">Update</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-slate-600 dark:text-white">
              {dashboardUpdates.map((update, index) => (
                <tr key={`${update.area}-${index}`} className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 font-medium text-slate-800 dark:text-white">{update.area}</td>
                  <td className="py-3.5">{update.message}</td>
                  <td className="py-3.5 text-[12px]">{update.date}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600 tracking-wider">
                      {update.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

