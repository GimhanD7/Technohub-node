"use client";

import React, { useEffect, useState, useRef, Fragment, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ClipboardList, Clock, Flag, Check, ChevronLeft, ChevronRight, AlertCircle, 
  HelpCircle, RefreshCw, Trophy, ArrowRight, ArrowLeft, CornerDownRight, Star, Heart, Smile,
  Users, Award, Medal, BarChart3
} from "lucide-react";
import { fetchApi, BASE_URL } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function StudentQuizPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = searchParams?.get("id");

  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("techno_hub_user");
        if (saved) setUser(JSON.parse(saved));
      } catch {}
    }
  }, []);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // States
  const [attemptId, setAttemptId] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showRankings, setShowRankings] = useState(false);
  
  // Timer & Status
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeToStart, setTimeToStart] = useState(0);
  const [isLobby, setIsLobby] = useState(true);
  const [lobbyUsers, setLobbyUsers] = useState([]);
  
  // Rankings
  const [rankings, setRankings] = useState([]);
  const [maxMarks, setMaxMarks] = useState(0);
  const [myRank, setMyRank] = useState(null);
  const [podiumAnim, setPodiumAnim] = useState(false);
  const [confetti, setConfetti] = useState([]);

  const getDurationMinutes = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime.replace(/-/g, "/")).getTime();
    const end = new Date(endTime.replace(/-/g, "/")).getTime();
    return Math.max(0, Math.round((end - start) / (1000 * 60)));
  };

  // Loading & Loading messages
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Staff View States
  const [isStaffView, setIsStaffView] = useState(false);
  const [activeStaffTab, setActiveStaffTab] = useState("rankings");
  const [submissions, setSubmissions] = useState([]);
  const [staffStats, setStaffStats] = useState(null);
  const [expandedAttemptId, setExpandedAttemptId] = useState(null);
  const timerRef = useRef(null);
  const attemptIdRef = useRef(null);
  const isSubmittedRef = useRef(false);

  const loadRankings = useCallback(async (qId, currentUserId) => {
    setIsLoading(true);
    const res = await fetchApi(`/quiz/rankings?quizId=${qId}`);
    setIsLoading(false);

    if (res.success) {
      setRankings(res.rankings);
      setMaxMarks(res.maxMarks);
      setShowRankings(true);

      // Find user rank
      const found = res.rankings.find(item => item.fullName === user?.full_name || item.indexNumber === user?.index_number);
      if (found) {
        setMyRank(found);
      }
    }
  }, [user]);

  const handleAutoSubmit = useCallback(async () => {
    if (isSubmittedRef.current) return;
    
    const currentAttemptId = attemptIdRef.current;
    if (!currentAttemptId) {
      console.log("Auto-submit: attemptId is null (exam ended before starting)");
      setIsSubmitted(true);
      setShowReview(false);
      loadRankings(quizId, user?.id);
      return;
    }
    
    setIsSubmitting(true);
    // Submit whatever we have
    const res = await fetchApi("/quiz/submit", {
      method: "POST",
      body: JSON.stringify({ attemptId: currentAttemptId })
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsSubmitted(true);
      setShowReview(false);
      loadRankings(quizId, user?.id);
    } else {
      setErrorMsg("Timeout occurred but automatic submission failed. Please click submit manually if possible.");
    }
  }, [quizId, user, loadRankings]);

  const startTimers = useCallback((serverTime, startT, endT) => {
    let currentServerTime = serverTime;

    const tick = () => {
      currentServerTime += 1000;
      const leftToStart = startT - currentServerTime;
      const leftToEnd = endT - currentServerTime;

      if (leftToStart > 0) {
        setIsLobby(true);
        setTimeToStart(Math.ceil(leftToStart / 1000));
      } else if (leftToEnd > 0) {
        setIsLobby(false);
        setTimeToStart(0);
        setTimeLeft(Math.ceil(leftToEnd / 1000));
      } else {
        setIsLobby(false);
        setTimeToStart(0);
        setTimeLeft(0);
        clearInterval(timerRef.current);
        // Auto-submit if the timer runs out
        handleAutoSubmit();
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
  }, [handleAutoSubmit]);

  const checkAttemptStatus = useCallback(async (qId, currentUser, serverTime, startT, endT) => {
    // Check list of quizzes to find if user has submitted
    const listRes = await fetchApi(`/quiz/list?userId=${currentUser.id}`);
    if (listRes.success) {
      // Find the current quiz in active, upcoming, or past list
      const allQ = [...listRes.quizzes.active, ...listRes.quizzes.upcoming, ...listRes.quizzes.past];
      const match = allQ.find(item => item.id === parseInt(qId));
      
      if (match && match.attempt) {
        setAttemptId(match.attempt.id);
        if (match.attempt.isSubmitted) {
          setIsSubmitted(true);
          setIsLobby(false);
          loadRankings(qId, currentUser.id);
          return;
        }
      }
    }

    startTimers(serverTime, startT, endT);
  }, [loadRankings, startTimers]);

  const loadStaffSubmissions = useCallback(async (qId, currentUser) => {
    const res = await fetchApi(`/quiz/submissions?quizId=${qId}&userId=${currentUser.id}&role=${currentUser.role}`);
    if (res.success) {
      setSubmissions(res.submissions);
      setStaffStats(res.statistics);
    }
  }, []);

  const loadQuiz = useCallback(async (qId, currentUser) => {
    setIsLoading(true);
    setErrorMsg("");
    const data = await fetchApi(`/quiz/get?quizId=${qId}&userId=${currentUser.id}&role=${currentUser.role}`);
    setIsLoading(false);

    if (data.success) {
      setQuiz(data.quiz);
      setQuestions((data.quiz.questions || []).map(q => ({
        ...q,
        text: q.text || q.question_text,
        imageUrl: (q.imageUrl || q.image_url) ? ((q.imageUrl || q.image_url).startsWith('http') ? (q.imageUrl || q.image_url) : `${BASE_URL}${q.imageUrl || q.image_url}`) : null,
        selectedOptions: q.selectedOptions || [],
        options: (q.options || []).map(opt => ({
          ...opt,
          text: opt.text || opt.option_text
        }))
      })));
      
      const serverTime = new Date(data.quiz.now).getTime();
      const startT = new Date(data.quiz.startTime).getTime();
      const endT = new Date(data.quiz.endTime).getTime();

      if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
        setIsStaffView(true);
        // Load student rankings
        await loadRankings(qId, currentUser.id);
        // Load student submissions
        await loadStaffSubmissions(qId, currentUser);
      } else {
        checkAttemptStatus(qId, currentUser, serverTime, startT, endT);
      }
      
    } else {
      setErrorMsg(data.message || "Failed to retrieve mock exam.");
    }
  }, [loadRankings, loadStaffSubmissions, checkAttemptStatus]);

  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
  }, [isSubmitted]);

  useEffect(() => {
    const saved = localStorage.getItem("techno_hub_user");
    if (!saved) {
      router.push(`/login?redirect=/home/exam-hall/quiz?id=${quizId}`);
      return;
    }
    if (!user) return; // Wait for the state to populate

    let t;
    if (quizId) {
      t = setTimeout(() => {
        loadQuiz(quizId, user);
      }, 0);
    }

    return () => {
      if (t) clearTimeout(t);
      clearInterval(timerRef.current);
    };
  }, [quizId, user, loadQuiz, router]);


  useEffect(() => {
    if (isLobby && quizId && !isStaffView) {
      const loadLobbyStudents = async () => {
        const data = await fetchApi(`/quiz/get_lobby?quizId=${quizId}`);
        if (data.success) {
          setLobbyUsers(data.students);
        }
      };

      loadLobbyStudents();
      
      // Poll every 3 seconds to get updated list
      const interval = setInterval(loadLobbyStudents, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isLobby, quizId, isStaffView]);

  // Handle Confetti creation
  useEffect(() => {
    if (showRankings && (!isStaffView || activeStaffTab === "rankings")) {
      const colors = ["#ff5722", "#ffeb3b", "#00bcd4", "#4caf50", "#9c27b0", "#e91e63", "#ffc107"];
      const particles = Array.from({ length: 70 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        size: 5 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
        rot: Math.random() * 360
      }));
      const t = setTimeout(() => {
        setConfetti(particles);
        setPodiumAnim(true);
      }, 0);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setConfetti([]);
        setPodiumAnim(false);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [showRankings, isStaffView, activeStaffTab]);


  // Guard: if user is null (not authenticated), don't render anything —
  // the effect above will redirect to login.
  if (!user) return null;


  const handleStartQuiz = async () => {
    setErrorMsg("");
    setIsLoading(true);
    const res = await fetchApi("/quiz/start_attempt", {
      method: "POST",
      body: JSON.stringify({
        quizId: quiz?.id,
        userId: user?.id
      })
    });
    setIsLoading(false);

    if (res.success) {
      setAttemptId(res.attemptId);
      if (res.isSubmitted) {
        setIsSubmitted(true);
        loadRankings(quiz?.id, user?.id);
      } else {
        setIsLobby(false);
      }
    } else {
      setErrorMsg(res.message || "Failed to start quiz.");
    }
  };

  const handleSelectOption = async (questionId, optionId, isMultiSelect = true) => {
    if (isSubmitted) return;

    const currentQ = questions[currentIdx];
    let selected = [...currentQ.selectedOptions];

    // Determine if this question allows multiple selections
    const allowMultiple = currentQ.correctAnswerCount > 1;

    if (allowMultiple && isMultiSelect) {
      if (selected.includes(optionId)) {
        selected = selected.filter(id => id !== optionId);
      } else {
        selected.push(optionId);
      }
    } else {
      // Single selection - deselect if clicking the same option
      if (selected.includes(optionId)) {
        selected = [];
      } else {
        selected = [optionId];
      }
    }

    // Update state locally
    const updatedQuestions = [...questions];
    updatedQuestions[currentIdx].selectedOptions = selected;
    setQuestions(updatedQuestions);

    // Save progress to database in the background
    await fetchApi("/quiz/save_progress", {
      method: "POST",
      body: JSON.stringify({
        attemptId,
        questionId,
        selectedOptions: selected,
        isFlagged: currentQ.isFlagged
      })
    });
  };

  const handleToggleFlag = async () => {
    if (isSubmitted) return;

    const currentQ = questions[currentIdx];
    const isFlagged = !currentQ.isFlagged;

    const updatedQuestions = [...questions];
    updatedQuestions[currentIdx].isFlagged = isFlagged;
    setQuestions(updatedQuestions);

    // Save flag to database
    await fetchApi("/quiz/save_progress", {
      method: "POST",
      body: JSON.stringify({
        attemptId,
        questionId: currentQ.id,
        selectedOptions: currentQ.selectedOptions,
        isFlagged
      })
    });
  };

  const handleManualSubmit = async () => {
    setErrorMsg("");
    setIsSubmitting(true);
    const res = await fetchApi("/quiz/submit", {
      method: "POST",
      body: JSON.stringify({ attemptId })
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsSubmitted(true);
      setShowReview(false);
      await loadRankings(quizId, user.id);
      
      // Redirect to dashboard after 2 seconds to show rankings briefly
      setTimeout(() => {
        router.push("/dashboard/student");
      }, 2000);
    } else {
      setErrorMsg(res.message || "Failed to submit quiz.");
    }
  };

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const getQuestionBoxStyles = (q, idx) => {
    const isCurrent = idx === currentIdx;
    
    if (q.isFlagged) {
      return `bg-rose-50 dark:bg-rose-900/20 border-rose-350 text-rose-700 dark:text-rose-400 font-extrabold rounded-xl ${isCurrent ? 'ring-2 ring-rose-500 ring-offset-1 shadow-sm' : ''}`;
    }
    if (q.selectedOptions && q.selectedOptions.length > 0) {
      return `bg-emerald-50 dark:bg-emerald-900/20 border-emerald-355 text-emerald-700 dark:text-emerald-400 font-extrabold rounded-xl ${isCurrent ? 'ring-2 ring-emerald-500 ring-offset-1 shadow-sm' : ''}`;
    }
    
    return `bg-white dark:bg-slate-900 border-slate-200 text-slate-500 dark:text-slate-400 font-semibold rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 ${isCurrent ? 'border-primary text-primary font-black ring-2 ring-primary/20 shadow-sm' : ''}`;
  };

  const getStats = () => {
    const total = questions.length;
    const answered = questions.filter(q => q.selectedOptions && q.selectedOptions.length > 0).length;
    const flagged = questions.filter(q => q.isFlagged).length;
    return { total, answered, flagged };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4f7f9] dark:bg-slate-950">
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium">Synchronizing examination session...</p>
        </div>
      </div>
    );
  }

  // Staff dashboard view
  if (isStaffView && quiz) {
    const gold = rankings[0] || null;
    const silver = rankings[1] || null;
    const bronze = rankings[2] || null;

    return (
      <div className="max-w-7xl mx-auto space-y-6 py-8">
        
        {/* Style block for Podium animations in staff view if rankings are shown */}
        <style>{`
          @keyframes rise-up {
            0% { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
            100% { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
          }
          @keyframes confetti-fall {
            0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
          }
          .animate-rise {
            animation: rise-up 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .animate-confetti {
            animation: confetti-fall linear infinite;
          }
        `}</style>

        {/* Confetti Container */}
        {activeStaffTab === "rankings" && rankings.length > 0 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {confetti.map((p) => (
              <div
                key={p.id}
                className="animate-confetti"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}vh`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  transform: `rotate(${p.rot}deg)`,
                  position: "absolute",
                  borderRadius: p.size % 2 === 0 ? "50%" : "3px"
                }}
              />
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{quiz.title}</h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
               <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md text-[10px] font-semibold text-primary uppercase tracking-wider">
                 🛡️ Instructor View Mode
               </span>
               Manage participant records, analyze student scores, and inspect correct question matrices.
            </p>
          </div>
        </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 mb-8 gap-2">
            {[
              { id: "rankings", label: "Student Leaderboard", icon: Trophy },
              { id: "submissions", label: "Who Participated", icon: Users },
              { id: "questions", label: "Quiz Questions & Answers", icon: ClipboardList }
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveStaffTab(t.id)}
                  className={`px-4 py-3 text-xs md:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeStaffTab === t.id
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeStaffTab === "rankings" && (
            <div className="space-y-10">
              {rankings.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-white dark:bg-slate-900 border border-gray-150 rounded-2xl p-6">
                  <Trophy className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                  <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No Standings</h3>
                  <p className="text-xs max-w-xs mx-auto mt-1">No students have submitted this mock exam yet. Standings will populate here once attempts are complete.</p>
                </div>
              ) : (
                <>
                  {/* Animated Podium Block */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 p-8 shadow-sm max-w-xl mx-auto w-full text-slate-800 dark:text-white">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 text-center">Top 3 Podium</h3>
                    
                    <div className="flex items-end justify-center gap-4 h-60 border-b border-gray-200 dark:border-slate-800 pb-1 mt-6">
                      
                      {/* 2nd place */}
                      <div className="flex flex-col items-center flex-1">
                        {silver && (
                          <div className="text-center mb-2">
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate w-24">{silver.fullName.split(' ')[0]}</p>
                            <p className="text-[9px] text-slate-500 font-semibold">{silver.score} pts</p>
                          </div>
                        )}
                        <div 
                          className="w-full bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-t-xl flex flex-col justify-end p-2 relative animate-rise"
                          style={{ height: "110px" }}
                        >
                          <div className="absolute inset-x-0 bottom-2 text-center text-2xl font-black text-slate-400 dark:text-slate-400 opacity-50">2</div>
                        </div>
                      </div>

                      {/* 1st place */}
                      <div className="flex flex-col items-center flex-1">
                        {gold && (
                          <div className="text-center mb-2">
                            <Star className="w-4 h-4 text-yellow-500 mx-auto animate-bounce mb-0.5 fill-yellow-500" />
                            <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400 truncate w-24">{gold.fullName.split(' ')[0]}</p>
                            <p className="text-[10px] text-yellow-600 dark:text-yellow-500 font-semibold">{gold.score} pts</p>
                          </div>
                        )}
                        <div 
                          className="w-full bg-gradient-to-t from-yellow-200 to-yellow-100 dark:from-yellow-600 dark:to-yellow-400 rounded-t-xl flex flex-col justify-end p-2 relative animate-rise shadow-sm"
                          style={{ height: "160px", animationDelay: "0.2s" }}
                        >
                          <div className="absolute inset-x-0 bottom-2 text-center text-3xl font-black text-yellow-600 dark:text-yellow-800 opacity-50">1</div>
                        </div>
                      </div>

                      {/* 3rd place */}
                      <div className="flex flex-col items-center flex-1">
                        {bronze && (
                          <div className="text-center mb-2">
                            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-500 truncate w-24">{bronze.fullName.split(' ')[0]}</p>
                            <p className="text-[9px] text-amber-500 font-semibold">{bronze.score} pts</p>
                          </div>
                        )}
                        <div 
                          className="w-full bg-gradient-to-t from-orange-200 to-orange-100 dark:from-amber-700 dark:to-amber-500 rounded-t-xl flex flex-col justify-end p-2 relative animate-rise"
                          style={{ height: "80px", animationDelay: "0.4s" }}
                        >
                          <div className="absolute inset-x-0 bottom-2 text-center text-xl font-black text-amber-600 dark:text-amber-900 opacity-50">3</div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Leaderboard Table */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 p-6 shadow-sm max-w-3xl mx-auto w-full text-left">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Full Rankings</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-[10px] uppercase text-gray-400 font-semibold">
                            <th className="pb-3 text-center w-12">Rank</th>
                            <th className="pb-3">Name</th>
                            <th className="pb-3">Index Number</th>
                            <th className="pb-3 text-center">Final Score</th>
                            <th className="pb-3 text-center">Time taken</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-slate-700 dark:text-slate-200">
                          {rankings.map((r) => (
                            <tr key={r.rank} className="hover:bg-slate-50/50">
                              <td className="py-3 text-center font-bold text-slate-800 dark:text-slate-100">
                                {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                              </td>
                              <td className="py-3 font-medium text-slate-900 dark:text-white">{r.fullName}</td>
                              <td className="py-3 text-[10px] text-gray-400 font-mono">{r.indexNumber || "-"}</td>
                              <td className="py-3 text-center font-bold text-primary">{r.score} / {maxMarks}</td>
                              <td className="py-3 text-center text-slate-500 dark:text-slate-400">{r.timeTaken}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeStaffTab === "submissions" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-left">
              {submissions.length === 0 ? (
                <div className="py-16 text-center text-slate-400 p-6">
                  <Users className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                  <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No Participants Yet</h3>
                  <p className="text-xs max-w-xs mx-auto mt-1">No students have taken this exam. Once they do, their exact submission timelines will be listed here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-gray-200 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                      <tr>
                        <th className="px-6 py-3.5 text-center w-12">Rank</th>
                        <th className="px-6 py-3.5 text-left">Student Name</th>
                        <th className="px-6 py-3.5 text-left">Index</th>
                        <th className="px-6 py-3.5 text-left">Phone</th>
                        <th className="px-6 py-3.5 text-right">Score</th>
                        <th className="px-6 py-3.5 text-right">%</th>
                        <th className="px-6 py-3.5 text-right">Duration</th>
                        <th className="px-6 py-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-xs text-slate-700 dark:text-slate-200">
                      {submissions.map((sub) => (
                        <Fragment key={sub.attemptId}>
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary font-bold text-xs rounded-full">
                                {sub.rank}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-950 dark:text-white">{sub.fullName}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-semibold">{sub.role}</p>
                            </td>
                            <td className="px-6 py-4 font-mono text-gray-500">{sub.indexNumber || "-"}</td>
                            <td className="px-6 py-4 text-gray-500">{sub.phone || "-"}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-100">{sub.score}</td>
                            <td className="px-6 py-4 text-right font-bold">
                              <span className={sub.percentage >= 70 ? "text-green-600" : sub.percentage >= 50 ? "text-amber-600 dark:text-amber-500" : "text-red-600"}>
                                {sub.percentage}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-500">
                              {Math.floor(sub.timeTaken / 60)}m {sub.timeTaken % 60}s
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => setExpandedAttemptId(expandedAttemptId === sub.attemptId ? null : sub.attemptId)}
                                className="px-3 py-1 bg-primary/5 hover:bg-primary/10 text-primary font-semibold rounded-lg text-[11px] transition-colors cursor-pointer"
                              >
                                {expandedAttemptId === sub.attemptId ? "Hide Answers" : "View Answers"}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded responses list */}
                          {expandedAttemptId === sub.attemptId && (
                            <tr className="bg-slate-50/60 border-t border-gray-150">
                              <td colSpan="8" className="px-8 py-5">
                                <div className="space-y-4">
                                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                                    <ClipboardList className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    Student Responses & Answer Analysis
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(sub.answers).map(([qId, optionIds]) => {
                                      const question = questions.find(q => q.id == qId);
                                      const correctOptionIds = question ? question.options.filter(o => o.is_correct).map(o => o.id) : [];
                                      const isSelectionCorrect = question && 
                                        optionIds.length === correctOptionIds.length && 
                                        optionIds.every(id => correctOptionIds.includes(parseInt(id)));

                                      return (
                                        <div key={qId} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 text-xs shadow-sm space-y-2">
                                          <div className="flex justify-between items-start gap-2 border-b border-gray-100 pb-2">
                                            <span className="font-bold text-slate-700 dark:text-slate-200">
                                              {question ? question.text : `Question ${qId}`}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                                              isSelectionCorrect 
                                                ? "bg-green-100 text-green-700 border border-green-200" 
                                                : "bg-red-100 text-red-700 border border-red-200 dark:border-red-800/30"
                                            }`}>
                                              {isSelectionCorrect ? "Correct" : "Incorrect"}
                                            </span>
                                          </div>
                                          
                                          {question?.imageUrl && (
                                            <div className="my-2 max-w-xs rounded-lg overflow-hidden border border-gray-150 bg-slate-50 dark:bg-slate-800/50 p-1">
                                              <img src={question.imageUrl} alt="Question" className="max-h-20 object-contain mx-auto" />
                                            </div>
                                          )}
                                          
                                          <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-gray-100">
                                            <p className="font-medium text-slate-500 dark:text-slate-400">
                                              Selected: <span className="font-mono text-primary font-bold">{
                                                optionIds.map(optId => {
                                                  const opt = question?.options.find(o => o.id == optId);
                                                  return opt ? opt.text : `#${optId}`;
                                                }).join(", ")
                                              }</span>
                                            </p>
                                            <p className="font-medium text-green-600">
                                              Correct Choice: <span className="font-mono">{
                                                question?.options.filter(o => o.is_correct).map(o => o.text).join(", ")
                                              }</span>
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <p className="text-[10px] text-slate-400">
                                    Attempt Submitted on: {new Date(sub.submittedAt).toLocaleString()}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeStaffTab === "questions" && (
            <div className="space-y-4 text-left">
              {questions.map((q, qIdx) => (
                <div key={q.id} className="bg-white dark:bg-slate-900 border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-2.5 items-start">
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {qIdx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{q.text}</h4>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
                        {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                      </span>
                    </div>
                  </div>

                  {q.imageUrl && (
                    <div className="my-3 ml-8 max-w-md rounded-xl overflow-hidden border border-gray-200 bg-slate-50 dark:bg-slate-800/50 p-1">
                      <img 
                        src={q.imageUrl} 
                        alt={`Question ${qIdx + 1}`} 
                        className="max-h-48 object-contain mx-auto"
                      />
                    </div>
                  )}

                  {/* Options Matrix */}
                  <div className="grid grid-cols-1 gap-2 pl-8">
                    {q.options.map((opt) => {
                      const isCorrect = opt.is_correct;
                      return (
                        <div 
                          key={opt.id} 
                          className={`p-3 border rounded-lg text-xs flex items-center justify-between ${
                            isCorrect 
                              ? "border-green-400 bg-green-50/50 text-green-800 font-medium" 
                              : "border-gray-300 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              isCorrect ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
                            }`}>
                              {isCorrect && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span>{opt.text}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[9px] font-extrabold text-green-700 bg-green-100 border border-green-200 px-1.5 py-0.5 rounded uppercase">
                              Correct Option
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    );
  }

  return null;
}

// SUB-COMPONENT: REVIEWS DETAILED ANSWERS AFTER QUIZ ENDS
function QuizReviewSection({ quizId, userId }) {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const fetchResults = async () => {
    setIsLoading(true);
    const res = await fetchApi(`/quiz/results?quizId=${quizId}&userId=${userId}`);
    setIsLoading(false);
    if (res.success) {
      setResults(res.questions);
    }
  };

  if (showDetails && results) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-300">Detailed Review</h3>
          <button 
            onClick={() => setShowDetails(false)}
            className="text-xs text-primary font-medium hover:text-secondary"
          >
            Hide Review
          </button>
        </div>

        <div className="space-y-6">
          {results.map((q, qIdx) => (
            <div key={q.id} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-2.5 items-start">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {qIdx + 1}
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">{q.text}</h4>
                </div>
                
                <div className="text-right shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    q.isCorrect ? "bg-green-950/50 text-green-400 border border-green-900" : "bg-red-950/50 text-red-400 border border-red-900"
                  }`}>
                    {q.isCorrect ? `Correct (+${q.marks} pts)` : `Incorrect (0 / ${q.marks} pts)`}
                  </span>
                </div>
              </div>

              {q.imageUrl && (
                <div className="my-3 ml-8 max-w-md rounded-xl overflow-hidden border border-slate-800 bg-slate-900/40 p-1">
                  <img 
                    src={q.imageUrl} 
                    alt={`Question ${qIdx + 1}`} 
                    className="max-h-48 object-contain mx-auto"
                  />
                </div>
              )}

              {/* Options list showing review */}
              <div className="grid grid-cols-1 gap-2 pl-8">
                {q.options.map((opt) => {
                  const isSelected = q.selectedOptions.includes(opt.id);
                  const isCorrect = opt.isCorrect;
                  
                  let badge = null;
                  let cardStyle = "border-slate-800/50 text-slate-400 bg-transparent";

                  if (isCorrect) {
                    badge = <span className="text-[9px] font-extrabold text-green-400 bg-green-950/80 border border-green-900 px-1.5 py-0.5 rounded uppercase">Correct Option</span>;
                    cardStyle = isSelected 
                      ? "border-green-600 bg-green-950/20 text-white font-semibold" 
                      : "border-green-900 bg-green-950/5 text-green-400/80";
                  } else if (isSelected) {
                    badge = <span className="text-[9px] font-extrabold text-red-400 bg-red-950/80 border border-red-900 px-1.5 py-0.5 rounded uppercase">Your Wrong Choice</span>;
                    cardStyle = "border-red-600 bg-red-950/20 text-white font-semibold";
                  }

                  return (
                    <div 
                      key={opt.id} 
                      className={`p-3 border rounded-lg text-xs flex items-center justify-between ${cardStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-slate-700 border-slate-600 text-white" : "border-slate-800"
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900"></span>}
                        </div>
                        <span>{opt.text}</span>
                      </div>
                      
                      {badge}
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Button 
        onClick={() => {
          fetchResults();
          setShowDetails(true);
        }}
        className="w-full py-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white text-sm font-bold rounded-xl"
      >
        Review Correct & Wrong Answers
      </Button>
    </div>
  );
}




