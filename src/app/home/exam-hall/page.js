"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ClipboardList, Calendar, Clock, RefreshCw, AlertCircle, ArrowRight, UserCheck, Lock, Search, X } from "lucide-react";
import { fetchApi } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { CustomDialog } from "@/components/ui/CustomDialog";

export default function ExamHallPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, []);
  const [quizzes, setQuizzes] = useState({ active: [], upcoming: [], past: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [selectedQuizForUnlock, setSelectedQuizForUnlock] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getDurationMinutes = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime.replace(/-/g, "/")).getTime();
    const end = new Date(endTime.replace(/-/g, "/")).getTime();
    return Math.max(0, Math.round((end - start) / (1000 * 60)));
  };

  const loadQuizzes = useCallback(async (userId) => {
    const data = await fetchApi(`/quiz/list?userId=${userId}`);
    setIsLoading(false);

    if (data.success) {
      setQuizzes(data.quizzes);
    } else {
      setErrorMsg(data.message || "Failed to load mock exams.");
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const t = setTimeout(() => {
        loadQuizzes(parsed.id);
      }, 0);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        loadQuizzes(0); // Fetch without attempt progress
      }, 0);
      return () => clearTimeout(t);
    }
  }, [loadQuizzes]);

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

  const getFilteredQuizzes = () => {
    const list = activeTab === "active" ? quizzes.active : activeTab === "upcoming" ? quizzes.upcoming : quizzes.past;
    if (!searchQuery.trim()) return list;
    return list.filter((q) => q.title.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const getActiveTabCount = () => {
    if (activeTab === "active") return quizzes.active.length;
    if (activeTab === "upcoming") return quizzes.upcoming.length;
    return quizzes.past.length;
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col pt-24 pb-20 px-6 max-w-7xl mx-auto w-full">

        {/* Page Title & Intro */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-12 shadow-xl mb-10 border border-slate-850 text-left">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-secondary/10 rounded-full blur-[90px] pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#1e293b]/10 backdrop-blur-md rounded-full text-[10px] font-bold text-secondary uppercase tracking-widest border border-white/5 shadow-sm mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse-slow"></span>
              Virtual Examination Arena
            </div>
            <h1 className="text-3xl md:text-4.5xl lg:text-5xl font-extrabold tracking-tight leading-none mb-4">
              Test Your <span className="text-gradient font-black">Knowledge</span>
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-xl">
              Participate in real-time scheduled mock exams under timed conditions. Gain immediate rankings on our live leaderboard and review correct answer matrices post-submission.
            </p>
          </div>
        </div>

        {!user && (
          <div className="mb-8 p-6 bg-blue-50 border border-blue-100 dark:border-blue-900/50 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
            <div className="flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Authentication Required</h4>
                <p className="text-xs text-slate-500 dark:text-white">You must be logged in as a student to participate in mock examinations and view leaderboards.</p>
              </div>
            </div>
            <Link href="/login" className="shrink-0">
              <Button size="sm">Sign In to Join</Button>
            </Link>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 dark:border-red-900/50 text-red-650 text-sm font-medium rounded-2xl flex gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            {errorMsg}
          </div>
        )}

        {/* Tab Controls + Search Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          <div className="flex bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl gap-2 overflow-x-auto flex-shrink-0">
            {["active", "upcoming", "past"].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchQuery(""); }}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all capitalize cursor-pointer whitespace-nowrap ${activeTab === tab
                  ? "bg-primary text-white shadow-md font-bold"
                  : "text-slate-500 dark:text-white hover:text-slate-850 hover:bg-slate-200/50"
                  }`}
              >
                {tab} Exams ({tab === "active" ? quizzes.active.length : tab === "upcoming" ? quizzes.upcoming.length : quizzes.past.length})
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
              placeholder="Search exams by title…"
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

        {/* Quizzes Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-550 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-semibold">Retrieving mock exam rosters...</p>
          </div>
        ) : getActiveTabCount() === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-150 p-6 shadow-sm">
            <ClipboardList className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-white">No Exams Scheduled</h3>
            <p className="text-xs max-w-xs mx-auto mt-1">There are no {activeTab} mock examinations scheduled at this moment. Check back later!</p>
          </div>
        ) : getFilteredQuizzes().length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-150 p-6 shadow-sm">
            <Search className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-white">No Results Found</h3>
            <p className="text-xs max-w-xs mx-auto mt-1">No exams match &ldquo;{searchQuery}&rdquo;. Try a different keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredQuizzes().map((quiz) => (
              <div
                key={quiz.id}
                className="
group p-[2px] rounded-[20px]
bg-gray-300
transition-all duration-300 ease-out

hover:bg-gradient-to-r hover:from-blue-500 hover:to-yellow-400

shadow-[0_2px_12px_rgba(0,0,0,0.07)]
hover:shadow-[0_8px_24px_rgba(59,130,246,0.25)]
hover:-translate-y-1
"         >
                <div className="bg-white dark:bg-[#1e293b] rounded-[18px] flex flex-col justify-between relative overflow-hidden text-left h-full">
                  {/* Header band: title/subtitle + status pill */}
                  <div className={`px-6 py-5 border-b border-slate-100 dark:border-slate-800/50 bg-gradient-to-r ${parseFloat(quiz.fee) > 0 ? "from-amber-50 via-amber-50/40 to-blue-50/40" : "from-emerald-50 via-emerald-50/30 to-secondary/5"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[16px] font-extrabold text-slate-850 tracking-tight group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {quiz.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-white mt-0.5 capitalize">{activeTab} &middot; Exam #{quiz.id}</p>
                      </div>
                      <div className="shrink-0">
                        {parseFloat(quiz.fee) > 0 ? (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${quiz.isPaid
                            ? "bg-green-50 text-green-700 border-green-200 dark:border-green-900/50"
                            : "bg-amber-50 text-amber-755 border-amber-200/80"
                            }`}>
                            {!quiz.isPaid && <Lock className="w-2.5 h-2.5 text-amber-600" />}
                            {quiz.isPaid ? "Paid" : `LKR ${parseFloat(quiz.fee).toFixed(0)}`}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            Free
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body: icon + label + value rows */}
                  <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Duration</p>
                        <p className="text-[13px] font-bold text-slate-800 dark:text-white">{getDurationMinutes(quiz.startTime, quiz.endTime)} minutes</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                        <span className="text-amber-600 font-bold text-sm">$</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Fee</p>
                        <p className="text-[13px] font-bold text-slate-800 dark:text-white">
                          {parseFloat(quiz.fee) > 0 ? `Rs. ${parseFloat(quiz.fee).toFixed(0)}` : "Free"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Questions</p>
                        <p className="text-[13px] font-bold text-slate-800 dark:text-white">{quiz.questionCount} questions</p>
                      </div>
                    </div>

                    {quiz.attempt && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0">
                          <UserCheck className="w-4 h-4 text-slate-500 dark:text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Your Status</p>
                          <p className="text-[13px] font-bold">
                            {quiz.attempt.isSubmitted ? (
                              <span className="text-green-600">Grade: {quiz.attempt.score}</span>
                            ) : (
                              <span className="text-amber-500 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> In Progress
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
                      <p className="text-[10px] text-slate-400 font-medium">Start Time</p>
                      <p className="text-[13px] font-bold text-slate-800 dark:text-white">{quiz.startTime}</p>
                    </div>
                  </div>

                  {/* Footer: full-width action button */}
                  <div className="px-6 pb-6">
                    {user ? (
                      ["admin", "teacher"].includes(user.role) ? (
                        // Staff: always show console panel
                        <Link href={`/home/exam-hall/quiz?id=${quiz.id}`} className="block">
                          <Button className="w-full text-[12px] h-11 rounded-xl shadow-sm flex items-center justify-center gap-1.5">
                            Console Panel
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      ) : activeTab === "past" ? (
                        // Past exams: permanently locked — no unlock, no participation
                        quiz.attempt?.isSubmitted ? (
                          // Student did participate → allow viewing standings
                          <Link href={`/home/exam-hall/quiz?id=${quiz.id}`} className="block">
                            <Button className="w-full text-[12px] h-11 rounded-xl shadow-sm flex items-center justify-center gap-1.5">
                              Review Standings
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        ) : (
                          // Student did NOT participate → locked, no action
                          <div className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center gap-1.5 text-[12px] text-slate-400 font-semibold cursor-not-allowed select-none">
                            <Lock className="w-3.5 h-3.5" />
                            Exam Ended
                          </div>
                        )
                      ) : !quiz.isPaid ? (
                        // Active / upcoming: locked behind payment — show unlock
                        <Button
                          onClick={() => handleUnlockClick(quiz)}
                          className="w-full text-[12px] h-11 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 border-none text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Unlock Exam
                        </Button>
                      ) : (
                        // Active / upcoming: paid/free — allow entry
                        <Link href={`/home/exam-hall/quiz?id=${quiz.id}`} className="block">
                          <Button className="w-full text-[12px] h-11 rounded-xl shadow-sm flex items-center justify-center gap-1.5">
                            {activeTab === "active" ? (
                              quiz.attempt?.isSubmitted ? "Review Results" : "Start Exam"
                            ) : (
                              "Join Lobby"
                            )}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      )
                    ) : (
                      <Link href="/login" className="block">
                        <Button variant="ghost" className="w-full text-[12px] h-11 border border-slate-200 dark:border-slate-800 rounded-xl">
                          Log In to Play
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />

      <CustomDialog
        isOpen={!!selectedQuizForUnlock}
        type="warning"
        title="Unlock Premium Exam"
        message={`You are about to unlock "${selectedQuizForUnlock?.title}" for LKR ${parseFloat(selectedQuizForUnlock?.fee || 0).toFixed(2)}. Do you want to proceed?`}
        confirmText={isUnlocking ? "Unlocking..." : "Confirm & Unlock"}
        cancelText="Cancel"
        onConfirm={handleConfirmUnlock}
        onCancel={() => setSelectedQuizForUnlock(null)}
      />
    </>
  );
}