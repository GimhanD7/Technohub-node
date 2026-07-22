"use client";

import React, { useEffect, useState, useRef, Fragment, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ClipboardList, Clock, Flag, Check, ChevronLeft, ChevronRight, AlertCircle, 
  HelpCircle, RefreshCw, Trophy, ArrowRight, CornerDownRight, Star, Heart, Smile,
  Users, Award, Medal, BarChart3, Crown
} from "lucide-react";
import { fetchApi, BASE_URL } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";

function normalizeQuizQuestions(questions = []) {
  return questions.map(question => ({
    ...question,
    text: question.text || question.question_text,
    imageUrl: (question.imageUrl || question.image_url)
      ? ((question.imageUrl || question.image_url).startsWith('http')
          ? (question.imageUrl || question.image_url)
          : `${BASE_URL}${question.imageUrl || question.image_url}`)
      : null,
    selectedOptions: question.selectedOptions || [],
    options: (question.options || []).map(option => ({
      ...option,
      text: option.text || option.option_text
    }))
  }));
}

function rotateForAttempt(items, offset) {
  if (items.length < 2) return [...items];
  const safeOffset = ((Number(offset) % items.length) + items.length) % items.length;
  return [...items.slice(safeOffset), ...items.slice(0, safeOffset)];
}

function applyFallbackAttemptOrder(questions, attemptId) {
  return rotateForAttempt(questions, attemptId).map(question => ({
    ...question,
    options: rotateForAttempt(question.options || [], Number(attemptId) + Number(question.id))
  }));
}

function StudentQuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = searchParams?.get("id");

  const [user, setUser] = useState(null);

  useEffect(() => {
    const userTimer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem("techno_hub_user");
        if (saved) setUser(JSON.parse(saved));
      } catch {}
    }, 0);

    return () => window.clearTimeout(userTimer);
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
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
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

  const checkAttemptStatus = useCallback(async (qId, currentUser, serverTime, startT, endT, shuffleApplied) => {
    // Check list of quizzes to find if user has submitted
    const listRes = await fetchApi(`/quiz/list?userId=${currentUser.id}`);
    if (listRes.success) {
      // Find the current quiz in active, upcoming, or past list
      const allQ = [...listRes.quizzes.active, ...listRes.quizzes.upcoming, ...listRes.quizzes.past];
      const match = allQ.find(item => item.id === parseInt(qId));
      
      if (match && match.attempt) {
        setAttemptId(match.attempt.id);
        if (!shuffleApplied) {
          setQuestions(currentQuestions => applyFallbackAttemptOrder(currentQuestions, match.attempt.id));
        }
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
      const normalizedQuestions = normalizeQuizQuestions(data.quiz.questions);
      setQuestions(
        data.quiz.attemptId && !data.quiz.shuffleApplied
          ? applyFallbackAttemptOrder(normalizedQuestions, data.quiz.attemptId)
          : normalizedQuestions
      );
      
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
        checkAttemptStatus(qId, currentUser, serverTime, startT, endT, data.quiz.shuffleApplied);
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
          setLobbyUsers(data.students || []);
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
      const normalizedQuestions = normalizeQuizQuestions(res.questions);
      setQuestions(
        res.shuffleApplied
          ? normalizedQuestions
          : applyFallbackAttemptOrder(normalizedQuestions, res.attemptId)
      );
      setCurrentIdx(0);
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
      <div className="min-h-screen flex flex-col bg-[#f4f7f9]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium">Synchronizing examination session...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Staff dashboard view
  if (isStaffView && quiz) {
    const gold = rankings[0] || null;
    const silver = rankings[1] || null;
    const bronze = rankings[2] || null;

    return (
      <div className="min-h-screen flex flex-col bg-[#f4f7f9] text-slate-800 dark:text-slate-100">
        <Navbar />
        
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

        <main className="flex-1 flex flex-col pt-24 pb-20 px-6 max-w-5xl mx-auto w-full z-10 relative">
          
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary mb-3">
               🛡️ Instructor View Mode
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 dark:text-slate-100 mb-2">
              {quiz.title}
            </h1>
            <p className="text-zinc-500 max-w-xl mx-auto text-xs md:text-sm">
              Manage participant records, analyze student scores, and inspect correct question matrices.
            </p>
          </div>

          {/* Info Banner */}
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-150 rounded-2xl flex gap-3 items-start text-left text-xs">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100">Staff Mode Information</h4>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">As an Administrator or Teacher, you are restricted from participating in the examination attempts. Instead, you can view the quiz rankings, participant submission details, and exam questions below.</p>
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
                  <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl max-w-xl mx-auto w-full text-white">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Top 3 Podium</h3>
                    
                    <div className="flex items-end justify-center gap-4 h-60 border-b border-slate-800 pb-1 mt-6">
                      
                      {/* 2nd place */}
                      <div className="flex flex-col items-center flex-1">
                        {silver && (
                          <div className="text-center mb-2">
                            <p className="text-[11px] font-bold text-slate-300 truncate w-24">{silver.fullName.split(' ')[0]}</p>
                            <p className="text-[9px] text-slate-400 font-semibold">{silver.score} pts</p>
                          </div>
                        )}
                        <div 
                          className="w-full bg-gradient-to-t from-slate-600 to-slate-400 rounded-t-xl flex flex-col justify-end p-2 relative animate-rise"
                          style={{ height: "110px" }}
                        >
                          <div className="absolute inset-x-0 bottom-2 text-center text-2xl font-black text-slate-800 dark:text-slate-100 opacity-30">2</div>
                        </div>
                      </div>

                      {/* 1st place */}
                      <div className="flex flex-col items-center flex-1">
                        {gold && (
                          <div className="text-center mb-2">
                            <Star className="w-4 h-4 text-yellow-400 mx-auto animate-bounce mb-0.5" />
                            <p className="text-xs font-bold text-yellow-400 truncate w-24">{gold.fullName.split(' ')[0]}</p>
                            <p className="text-[10px] text-yellow-500 font-semibold">{gold.score} pts</p>
                          </div>
                        )}
                        <div 
                          className="w-full bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-xl flex flex-col justify-end p-2 relative animate-rise"
                          style={{ height: "160px", animationDelay: "0.2s" }}
                        >
                          <div className="absolute inset-x-0 bottom-2 text-center text-3xl font-black text-yellow-800 opacity-30">1</div>
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
                          className="w-full bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-xl flex flex-col justify-end p-2 relative animate-rise"
                          style={{ height: "80px", animationDelay: "0.4s" }}
                        >
                          <div className="absolute inset-x-0 bottom-2 text-center text-xl font-black text-amber-900 opacity-30">3</div>
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

        </main>
        <Footer />
      </div>
    );
  }

  // 1. LOBBY VIEW
  if (!isStaffView && (isLobby || !attemptId) && quiz) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-slate-950">
        <Navbar />
        <main className="flex-1 flex flex-col justify-center items-center py-20 px-6 max-w-xl mx-auto w-full">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 p-8 shadow-xl w-full text-center space-y-6">
            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto text-primary animate-pulse shadow-sm border border-primary/10">
              <ClipboardList className="w-8 h-8" />
            </div>
            
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">{quiz.title}</h1>
              <span className="inline-block mt-2 px-3 py-1 bg-primary/5 text-primary border border-primary/10 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Mock Exam Lobby
              </span>
            </div>

            {/* Timings Details */}
            <div className="grid grid-cols-2 gap-3.5 text-left text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Start Time</p>
                <p className="font-bold text-slate-700 dark:text-slate-200 mt-1 truncate">
                  {quiz.startTime
                    ? new Date(quiz.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                    : '—'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Duration</p>
                <p className="font-bold text-slate-700 dark:text-slate-200 mt-1">{getDurationMinutes(quiz.startTime, quiz.endTime)} mins</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Questions</p>
                <p className="font-bold text-slate-700 dark:text-slate-200 mt-1">{questions.length} Qs</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Exam Fee</p>
                <p className="font-bold text-slate-700 dark:text-slate-200 mt-1">
                  <span className={parseFloat(quiz.fee) > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600'}>
                    {parseFloat(quiz.fee) > 0 ? `LKR ${parseFloat(quiz.fee).toFixed(0)}` : 'Free'}
                  </span>
                </p>
              </div>
            </div>

            {/* Countdown Clock */}
            <div className="py-5 border-y border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2">Quiz starts in</p>
              <div className="inline-block px-8 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-3.5xl font-mono font-black text-primary tracking-tight shadow-inner">
                {formatTimer(timeToStart)}
              </div>
            </div>

            {/* Live Lobby Students */}
            <div className="text-left space-y-3">
              <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Students in lobby ({lobbyUsers.length + 1})</p>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                <span className="px-3 py-1 bg-primary/5 text-primary border border-primary/20 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                  {user?.full_name} (You)
                </span>
                {lobbyUsers.map((student, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-655 border border-slate-155 text-xs font-medium rounded-xl">
                    {student.fullName}
                  </span>
                ))}
              </div>
            </div>

            {timeToStart <= 0 ? (
              <Button onClick={handleStartQuiz} className="w-full py-4 text-base rounded-2xl shadow-lg bg-primary hover:shadow-primary/20 hover:scale-102 transition-all">
                Start Exam Now
              </Button>
            ) : (
              <div className="text-[11px] text-slate-550 font-semibold animate-pulse bg-slate-50 dark:bg-slate-800/50 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                Lobby Active. Exam starts automatically when the countdown completes.
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. DETAILED POST-SUBMISSION LEADERBOARD / STANDINGS
  if (showRankings && quiz) {
    const gold = rankings[0] || null;
    const silver = rankings[1] || null;
    const bronze = rankings[2] || null;

    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-slate-900 transition-colors duration-500">
        <Navbar />
        
        <main className="flex-1 flex flex-col pt-24 pb-20 px-6 max-w-7xl mx-auto w-full z-10 relative">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/15 bg-amber-500/5 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3">
                <Crown className="w-4 h-4" />
                Exam Standings
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
                {quiz.title} Rankings
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">See how you stack up against your peers.</p>
            </div>
            
            <Button onClick={() => router.push("/dashboard/student/exams")} className="shrink-0 w-full md:w-auto h-11 bg-primary hover:bg-primary/90 text-white rounded-lg px-6 font-bold flex items-center justify-center gap-2 shadow-sm">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* User's own standing summary block */}
          {myRank && (
            <div className="max-w-7xl w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg p-6 mb-8 flex flex-col md:flex-row items-center justify-between shadow-sm">
              <div className="text-center md:text-left mb-4 md:mb-0 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
                  {myRank.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Your Performance</p>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{myRank.fullName}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ID: {myRank.indexNumber}</p>
                </div>
              </div>
              <div className="flex gap-6 md:gap-10 text-center">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Position</span>
                  <h2 className="text-2xl font-black text-primary">#{myRank.rank}</h2>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Score</span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{myRank.score} <span className="text-sm text-slate-400">/ {maxMarks}</span></h2>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-8 mt-4">
            
            {/* Podium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 2nd Place */}
              {silver && (
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm flex flex-col items-center text-center order-2 md:order-1 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-slate-400"></div>
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xl mb-4 border-2 border-slate-200 dark:border-slate-700">
                    {silver.fullName.charAt(0)}
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-3">
                    🥈 2nd Place
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate w-full mb-1">{silver.fullName}</h3>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{silver.score} pts</p>
                </div>
              )}

              {/* 1st Place */}
              {gold && (
                <div className="bg-white dark:bg-[#1e293b] border-2 border-amber-200 dark:border-amber-500/30 rounded-lg p-8 shadow-md flex flex-col items-center text-center order-1 md:order-2 relative overflow-hidden transform md:-translate-y-4">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-400"></div>
                  <Crown className="w-8 h-8 text-amber-500 dark:text-amber-400 mb-3" />
                  <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-2xl mb-4 border-4 border-amber-100 dark:border-amber-800">
                    {gold.fullName.charAt(0)}
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 mb-3">
                    🥇 1st Place
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate w-full mb-1">{gold.fullName}</h3>
                  <p className="text-base font-bold text-amber-600 dark:text-amber-400">{gold.score} pts</p>
                </div>
              )}

              {/* 3rd Place */}
              {bronze && (
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm flex flex-col items-center text-center order-3 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-orange-400"></div>
                  <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl mb-4 border-2 border-orange-100 dark:border-orange-800/50">
                    {bronze.fullName.charAt(0)}
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1 text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400 mb-3">
                    🥉 3rd Place
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate w-full mb-1">{bronze.fullName}</h3>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{bronze.score} pts</p>
                </div>
              )}
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden mb-12">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" /> Full Leaderboard
                </h3>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {rankings.length} Participants
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                      <th className="py-3 px-6 text-center w-16">Rank</th>
                      <th className="py-3 px-6">Student Name</th>
                      <th className="py-3 px-6 hidden sm:table-cell">Index Number</th>
                      <th className="py-3 px-6 text-right">Final Score</th>
                      <th className="py-3 px-6 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {rankings.map((r) => (
                      <tr 
                        key={r.rank} 
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                          (r.fullName === user?.full_name || r.indexNumber === user?.index_number) 
                            ? "bg-primary/5 dark:bg-primary/10 font-bold" 
                            : ""
                        }`}
                      >
                        <td className="py-4 px-6 text-center">
                          {r.rank === 1 ? (
                            <span className="text-lg font-black text-amber-500">1</span>
                          ) : r.rank === 2 ? (
                            <span className="text-lg font-bold text-slate-400">2</span>
                          ) : r.rank === 3 ? (
                            <span className="text-lg font-bold text-orange-400">3</span>
                          ) : (
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{r.rank}</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                          {r.fullName}
                          {(r.fullName === user?.full_name || r.indexNumber === user?.index_number) && (
                            <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">You</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono hidden sm:table-cell">
                          {r.indexNumber || "-"}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-3 py-1 rounded-md font-bold text-sm">
                            {r.score} <span className="text-xs text-primary/60 ml-1 font-semibold">/ {maxMarks}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right text-slate-500 dark:text-slate-400 font-medium text-xs">
                          <span className="flex items-center justify-end gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {r.timeTaken}s
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Detailed correct/wrong answers review */}
          <QuizReviewSection quizId={quiz.id} userId={user.id} />

        </main>
      </div>
    );
  }

  // 3. REVIEW MODE
  if (showReview && quiz) {
    const stats = getStats();
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-slate-950">
        <Navbar />
        <main className="flex-1 flex flex-col py-24 px-6 max-w-3xl mx-auto w-full space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 p-8 shadow-xl space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-none">Review Exam Submission</h2>
                  <p className="text-xs text-slate-400 mt-1.5">Verify your choices before final submission.</p>
                </div>
              </div>
              {timeLeft > 0 && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-650 dark:text-red-400 px-4 py-2 rounded-2xl font-bold text-sm">
                  <Clock className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="font-mono">{formatTimer(timeLeft)}</span>
                </div>
              )}
            </div>

            {/* Progress summary stats */}
            <div className="grid grid-cols-3 gap-4 text-center py-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
                <span className="block text-2xl font-black text-slate-850">{stats.total}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mt-1">Total Questions</span>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl">
                <span className="block text-2xl font-black text-emerald-700 dark:text-emerald-400">{stats.answered}</span>
                <span className="text-[9px] text-emerald-600 uppercase tracking-widest font-bold block mt-1">Answered</span>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-2xl">
                <span className="block text-2xl font-black text-rose-700 dark:text-rose-400">{stats.flagged}</span>
                <span className="text-[9px] text-rose-600 uppercase tracking-widest font-bold block mt-1">Flagged Qs</span>
              </div>
            </div>

            {/* Questions Answer State List */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1.5 my-4 border border-slate-50 dark:border-slate-800/50 rounded-2xl p-4 bg-slate-50/50">
              {questions.map((q, idx) => {
                const isAnswered = q.selectedOptions && q.selectedOptions.length > 0;
                return (
                  <div key={q.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-655 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 truncate w-60 md:w-[350px]">{q.text}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {q.isFlagged && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:text-rose-400 text-[10px] font-bold rounded-lg border border-rose-200">Flagged</span>
                      )}
                      {isAnswered ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Answered
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-200">Unanswered</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Warning */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl text-amber-800 dark:text-amber-400 text-xs flex gap-2.5 items-start">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Important Examination Warning:</span> 
                Once submitted, you cannot modify your answers or re-enter the test arena. The remaining time limit continues to count down in the background.
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button 
                variant="ghost" 
                onClick={() => setShowReview(false)}
                className="border border-slate-200 text-slate-600 dark:text-slate-300 px-6 rounded-2xl text-xs h-10 shadow-none hover:bg-slate-50 dark:bg-slate-800/50 font-bold"
              >
                Return to Arena
              </Button>
              <Button 
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="px-6 rounded-2xl text-xs h-10 flex items-center gap-1.5 font-bold shadow-md shadow-primary/20 border-none"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirm Submission
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }    // 4. ACTIVE TEST VIEW
  if (quiz && questions.length > 0) {
    const currentQ = questions[currentIdx];
    const stats = getStats();

    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-slate-950">
        
        {/* Fixed Active Quiz Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm md:text-base hidden sm:inline">{quiz.title}</span>
            <span className="px-3 py-1 bg-primary/5 text-primary border border-primary/10 text-[10px] rounded-xl font-bold uppercase tracking-wider">
              {currentIdx + 1} / {questions.length}
            </span>
          </div>

          {/* Running Countdown Timer */}
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm shadow-sm border ${
            timeLeft < 300 
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30 text-red-650 dark:text-red-400 animate-pulse" 
              : "bg-slate-50 dark:bg-slate-800/50 border-slate-150 dark:border-slate-800 text-slate-750"
          }`}>
            <Clock className={`w-4 h-4 ${timeLeft < 300 ? "text-red-500 animate-spin" : "text-primary"}`} />
            <span className="font-mono">{formatTimer(timeLeft)}</span>
            <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider hidden md:inline">Time Remaining</span>
          </div>

          <Button 
            size="sm" 
            onClick={() => setShowReview(true)}
            className="text-xs px-5 h-9 rounded-xl shadow-sm"
          >
            Submit Exam
          </Button>
        </header>

        {/* Content Body Grid */}
        <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-6 gap-6">
          
          {/* Sidebar Navigation Panel */}
          <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 p-5 shadow-sm text-left">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Question Navigator
              </h3>
              
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isActive = currentIdx === idx;
                  const isAnswered = q.selectedOptions && q.selectedOptions.length > 0;
                  const isFlagged = q.isFlagged;
                  
                  let btnClass = "border border-slate-200 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800/50";
                  if (isActive) {
                    btnClass = "ring-2 ring-primary ring-offset-1 bg-primary border-primary text-white font-bold";
                  } else if (isFlagged) {
                    btnClass = "border-rose-300 dark:border-rose-800/30 text-rose-600 bg-rose-50 dark:bg-rose-900/20 font-bold";
                  } else if (isAnswered) {
                    btnClass = "border-emerald-300 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 font-bold";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-full aspect-square flex items-center justify-center rounded-xl text-[11px] transition-all cursor-pointer ${btnClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-800/30"></div> Answered
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md bg-rose-50 dark:bg-rose-900/20 border border-rose-300 dark:border-rose-800/30"></div> Flagged
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md bg-primary border border-primary"></div> Current
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200"></div> Unanswered
                </div>
              </div>
            </div>
          </div>

          {/* Main Question Box Panel */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 p-6 md:p-8 shadow-sm flex flex-col justify-between text-left min-w-0">
            <div>
              {/* Question progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-300" 
                  style={{ width: `${(stats.answered / questions.length) * 100}%` }}
                ></div>
              </div>

              {/* Question Text */}
              <div className="flex justify-between items-start gap-4 border-b border-slate-50 dark:border-slate-800/50 pb-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {currentIdx + 1}</span>
                  <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mt-1.5">{currentQ.text}</h2>
                  {/* Selection Instruction */}
                  <div className="mt-3 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl inline-block">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {currentQ.correctAnswerCount > 1 ? "✓ Select one or more answers" : "✓ Select one answer"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-655">
                    {currentQ.marks} {currentQ.marks === 1 ? 'mark' : 'marks'}
                  </span>
                </div>
              </div>

              {currentQ.imageUrl && (
                <div className="mb-6 max-w-2xl rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shadow-sm p-1">
                  <img 
                    src={currentQ.imageUrl} 
                    alt={`Question ${currentIdx + 1}`} 
                    className="max-h-80 w-auto object-contain mx-auto"
                  />
                </div>
              )}

              {/* Answers ticking list */}
              <div className="space-y-3">
                {currentQ.options.map((opt) => {
                  const isChecked = currentQ.selectedOptions.includes(opt.id);
                  const allowMultiple = currentQ.correctAnswerCount > 1;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQ.id, opt.id)}
                      className={`w-full text-left p-4 md:p-5 border-2 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer group/opt ${
                        isChecked 
                          ? "bg-primary/5 border-primary text-primary font-semibold shadow-sm" 
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-50/50 hover:border-slate-350"
                      }`}
                    >
                      <span className="text-xs md:text-sm font-medium leading-relaxed">{opt.text}</span>
                      
                      <div className={`flex items-center justify-center shrink-0 border-2 ${
                        allowMultiple 
                          ? "w-5 h-5 rounded-lg" 
                          : "w-5 h-5 rounded-full"
                      } ${
                        isChecked 
                          ? "bg-primary border-primary text-white border-primary" 
                          : "border-slate-300 bg-white dark:bg-slate-900 group-hover/opt:border-slate-400"
                      } transition-all duration-200`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              
              {/* Star/Flag Button */}
              <button
                onClick={handleToggleFlag}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  currentQ.isFlagged
                    ? "bg-rose-500 dark:bg-rose-600 border-rose-500 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:bg-rose-900/20"
                }`}
              >
                <Flag className="w-4 h-4" />
                {currentQ.isFlagged ? "Starred / Flagged" : "Flag Question"}
              </button>

              {/* Pagination controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                  className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 disabled:opacity-40 disabled:hover:bg-white dark:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                  disabled={currentIdx === questions.length - 1}
                  className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 disabled:opacity-40 disabled:hover:bg-white dark:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

            </div>
          </div>

          {/* Right Question Grid Sidebar */}
          <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-5 shrink-0 self-start text-left">
            
            {/* Quick summary stats */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-2 border-b border-slate-50 dark:border-slate-800/50 pb-1.5">Overview</h4>
              <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <strong className="block text-sm font-black">{stats.answered}</strong> Answered
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-xl p-2 text-rose-700 dark:text-rose-400 font-semibold">
                  <strong className="block text-sm font-black">{stats.flagged}</strong> Flagged
                </div>
              </div>
            </div>

            {/* Grid Box list */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-3.5 border-b border-slate-50 dark:border-slate-800/50 pb-1.5">Questions</h4>
              
              <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-8 rounded-xl border text-xs flex items-center justify-center transition-all cursor-pointer ${getQuestionBoxStyles(q, idx)}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Legends */}
            <div className="text-[10px] space-y-2 border-t border-slate-50 dark:border-slate-800/50 pt-4 text-slate-405 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 inline-block shadow-sm"></span>
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-550 border border-emerald-400 inline-block shadow-sm"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-rose-550 border border-rose-450 inline-block shadow-sm"></span>
                <span>Flagged / Starred</span>
              </div>
            </div>

          </aside>
        </div>
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

export default function StudentQuizPage() {
  return (
    <Suspense fallback={<div>Loading quiz...</div>}>
      <StudentQuizContent />
    </Suspense>
  );
}
