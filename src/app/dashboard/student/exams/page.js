"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ClipboardList, Clock, RefreshCw, AlertCircle, ArrowRight, UserCheck, Lock, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import Button from "@/components/ui/Button";
import { CustomDialog } from "@/components/ui/CustomDialog";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function StudentExamHallPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [quizzes, setQuizzes] = useState({ active: [], upcoming: [], past: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [selectedQuizForUnlock, setSelectedQuizForUnlock] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

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
    const loadTimer = window.setTimeout(() => {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.role !== "student") {
          router.push("/login");
        } else {
          setUser(parsed);
          loadQuizzes(parsed.id);
        }
      } else {
        router.push("/login");
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadQuizzes, router]);

  const handleUnlockClick = async (quiz) => {
    // Fetch latest balance
    const res = await fetchApi(`/wallet/balance?user_id=${user.id}`);
    if (res.success) {
      setWalletBalance(parseFloat(res.balance));
    }
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

    if (response.success) {
      setSelectedQuizForUnlock(null);
      loadQuizzes(user.id);
      toast.success(response.message || "Exam unlocked successfully!");
    } else {
      toast.error(response.message || "Failed to unlock exam.");
      // Keep dialog open so they see they can't pay if insufficient
    }
  };

  const getActiveTabCount = () => {
    if (activeTab === "active") return quizzes.active.length;
    if (activeTab === "upcoming") return quizzes.upcoming.length;
    return quizzes.past.length;
  };

  if (!user) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto md:pb-12 h-full flex flex-col md:block relative">
      
      {/* =========================================
          DESKTOP HEADER (hidden on small screens)
      ========================================= */}
      <div className="hidden md:block mb-6">
        <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight">Exam Hall</h1>
        <p className="text-[13px] text-gray-500 dark:text-white mt-1">Participate in mock exams and test your knowledge.</p>
      </div>

      {/* =========================================
          MOBILE HEADER (visible only on small screens)
      ========================================= */}
      <div className="md:hidden bg-primary px-6 py-8 text-white rounded-b-[30px] shadow-sm mb-6 -mx-4 -mt-4 relative overflow-hidden shrink-0">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wide">Exam Hall</h1>
            <p className="text-white/80 text-[13px] mt-1">Mock exams & quizzes</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-[-50px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-650 text-sm font-medium rounded-xl flex gap-2 mx-4 md:mx-0 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          {errorMsg}
        </div>
      )}

      {/* Tab Controls - Segmented Design */}
      <div className="px-4 md:px-0 mb-8 w-full flex justify-center">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full max-w-md shadow-inner">
          {["active", "upcoming", "past"].map((tab) => {
            const count = tab === "active" ? quizzes.active.length : tab === "upcoming" ? quizzes.upcoming.length : quizzes.past.length;
            const isActiveTab = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-[13px] rounded-lg transition-all capitalize whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  isActiveTab
                    ? "bg-white dark:bg-slate-700 text-primary font-bold shadow-sm"
                    : "text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab}
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActiveTab ? 'bg-primary/10 text-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="px-4 md:px-0 flex-1 overflow-y-auto pb-20 md:pb-0">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-semibold">Loading exams...</p>
          </div>
        ) : getActiveTabCount() === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white dark:bg-[#1e293b] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 shadow-sm">
            <ClipboardList className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-[16px] font-bold text-slate-700 dark:text-white">No Exams Scheduled</h3>
            <p className="text-[13px] max-w-xs mx-auto mt-1">There are no {activeTab} exams scheduled at this moment. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {(activeTab === "active" ? quizzes.active : activeTab === "upcoming" ? quizzes.upcoming : quizzes.past).map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
            >
              {/* Header */}
              <div className={`px-5 py-4 border-b border-gray-100 dark:border-slate-800/50 ${parseFloat(quiz.fee) > 0 ? "bg-amber-50/50 dark:bg-amber-900/10" : "bg-emerald-50/50 dark:bg-emerald-900/10"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight">
                      {quiz.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 capitalize">{activeTab} &middot; Exam #{quiz.id}</p>
                  </div>
                  <div className="shrink-0">
                    {parseFloat(quiz.fee) > 0 ? (
                      <span className={`px-3 py-1.5 rounded-lg text-[14px] md:text-[15px] font-black flex items-center gap-1.5 shadow-sm border ${quiz.isPaid
                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                        }`}>
                        {!quiz.isPaid && <Lock className="w-4 h-4" />}
                        {quiz.isPaid ? "PAID" : `LKR ${parseFloat(quiz.fee).toFixed(0)}`}
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-lg text-[14px] md:text-[15px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                        FREE
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Duration</p>
                    <p className="text-[13px] font-bold text-slate-700 dark:text-white">{getDurationMinutes(quiz.startTime, quiz.endTime)} mins</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Questions</p>
                    <p className="text-[13px] font-bold text-slate-700 dark:text-white">{quiz.questionCount} Qs</p>
                  </div>
                </div>

                {quiz.attempt && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4 text-slate-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Status</p>
                      <p className="text-[13px] font-bold">
                        {quiz.attempt.isSubmitted ? (
                          <span className="text-green-600 dark:text-green-400">Grade: {quiz.attempt.score}</span>
                        ) : (
                          <span className="text-amber-500 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> In Progress
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 dark:border-slate-800/50 pt-3 mt-4">
                  <p className="text-[10px] text-slate-400 font-medium">Start Time</p>
                  <p className="text-[12px] font-semibold text-slate-700 dark:text-white">{quiz.startTime}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 pb-5">
                {activeTab === "past" ? (
                  quiz.attempt?.isSubmitted ? (
                    <Link href={`/home/exam-hall/quiz?id=${quiz.id}`} className="block">
                      <Button className="w-full text-[12px] h-10 rounded-lg flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white">
                        Review Standings
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <div className="w-full h-10 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-center gap-1.5 text-[12px] text-gray-400 font-bold cursor-not-allowed">
                      <Lock className="w-3.5 h-3.5" />
                      Exam Ended
                    </div>
                  )
                ) : !quiz.isPaid ? (
                  <Button
                    onClick={() => handleUnlockClick(quiz)}
                    className="w-full text-[12px] h-10 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Unlock Exam
                  </Button>
                ) : (
                  <Link href={`/home/exam-hall/quiz?id=${quiz.id}`} className="block">
                    <Button className="w-full text-[12px] h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5">
                      {activeTab === "active" ? (
                        quiz.attempt?.isSubmitted ? "Review Results" : "Start Exam"
                      ) : (
                        "Join Lobby"
                      )}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      

      {selectedQuizForUnlock && (
        <CustomDialog
          isOpen={!!selectedQuizForUnlock}
          type="warning"
          title="Unlock Premium Exam"
          message={
            <div className="space-y-3 mt-3 text-left bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Your Wallet Balance:</span>
                <span className="font-bold text-slate-800 dark:text-white">LKR {walletBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-slate-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Exam Fee:</span>
                <span className="font-bold text-amber-600">LKR {parseFloat(selectedQuizForUnlock.fee).toFixed(2)}</span>
              </div>
              {walletBalance < parseFloat(selectedQuizForUnlock.fee) && (
                <div className="pt-2 text-center flex flex-col items-center gap-2">
                  <span className="text-xs text-red-500 font-medium">Insufficient balance. Please recharge your wallet.</span>
                </div>
              )}
            </div>
          }
          confirmText={
            walletBalance < parseFloat(selectedQuizForUnlock.fee)
              ? "Go to Wallet"
              : (isUnlocking ? "Processing..." : "Confirm Payment")
          }
          cancelText="Cancel"
          onConfirm={() => {
            if (walletBalance < parseFloat(selectedQuizForUnlock.fee)) {
              router.push('/dashboard/student/wallet');
            } else {
              handleConfirmUnlock();
            }
          }}
          onCancel={() => setSelectedQuizForUnlock(null)}
          confirmDisabled={isUnlocking}
        />
      )}
    </div>
  );
}
