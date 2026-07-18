"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  GraduationCap, BookOpen, Clock, Activity, TrendingUp, ClipboardList,
  ArrowRight, AlertCircle, Video, Calendar, RefreshCw, Lock, UserCheck,
  Play, CheckCircle2, Award, Wallet, Trophy, X, Crown, Sparkles,
  ChevronRight, Eye, BarChart2, CheckCircle, XCircle, MinusCircle
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import Button from "@/components/ui/Button";
import { CustomDialog } from "@/components/ui/CustomDialog";

// ─── Leaderboard helpers (same style as /home/ranker) ──────────────────────

const RANK_BADGE = { 1: "bg-[#eab308]", 2: "bg-slate-300", 3: "bg-[#b45309]" };
const RANK_BADGE_TEXT = { 1: "text-[#1e293b]", 2: "text-slate-700", 3: "text-white" };
const PEDESTAL_HEIGHT = { 1: "h-44", 2: "h-32", 3: "h-24" };
const AVATAR_RING = { 1: "ring-[#eab308]", 2: "ring-slate-300", 3: "ring-[#b45309]" };
const CROWN_COLOR = { 1: "text-[#eab308]", 2: "text-slate-400", 3: "text-[#b45309]" };
const CROWN_SIZE = { 1: "w-6 h-6", 2: "w-4 h-4", 3: "w-4 h-4" };

function PentagonBadge({ rank }) {
  return (
    <div
      className={`w-8 h-8 flex items-center justify-center font-black text-sm ${RANK_BADGE_TEXT[rank]} ${RANK_BADGE[rank]} shadow-md`}
      style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}
    >
      {rank}
    </div>
  );
}

function PodiumColumn({ entry, rank, order, isCurrentUser }) {
  if (!entry) return <div className={`${order} flex-1`} />;
  return (
    <div className={`${order} flex-1 flex flex-col items-center relative`}>
      <div className="flex flex-col items-center gap-1.5">
        <Crown className={`${CROWN_SIZE[rank]} ${CROWN_COLOR[rank]}`} fill="currentColor" strokeWidth={1.5} />
        <div
          className={`w-14 h-14 rounded-full ring-4 ${AVATAR_RING[rank]} shadow-lg flex items-center justify-center text-lg font-black text-[#1e3a8a] ${isCurrentUser ? "bg-blue-100" : "bg-white"}`}
        >
          {entry.fullName?.charAt(0) ?? "?"}
        </div>
      </div>
      <div className="mt-1.5 -mb-4 z-10">
        <PentagonBadge rank={rank} />
      </div>
      <div className={`w-full max-w-[130px] ${PEDESTAL_HEIGHT[rank]} rounded-t-xl bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1d4ed8] shadow-lg flex flex-col items-center justify-end pb-3 px-2 ${isCurrentUser ? "ring-2 ring-blue-400" : ""}`}>
        <p className="text-white font-bold text-xs text-center line-clamp-2 leading-tight w-full">
          {entry.fullName}
          {isCurrentUser && <span className="block text-[#eab308] text-[9px] font-black mt-0.5">YOU</span>}
        </p>
        <p className="text-[#eab308] font-semibold text-[10px] mt-0.5">{entry.score} pts</p>
      </div>
    </div>
  );
}

// ─── Leaderboard Modal ───────────────────────────────────────────────────────

function LeaderboardModal({ quiz, currentUserId, onClose }) {
  const [rankings, setRankings] = useState([]);
  const [maxMarks, setMaxMarks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetchApi(`/quiz/rankings?quizId=${quiz.id}`);
      setLoading(false);
      if (res.success) {
        setRankings(res.rankings);
        setMaxMarks(res.maxMarks);
      } else {
        setError(res.message || "Failed to load leaderboard.");
      }
    };
    load();
  }, [quiz.id]);

  const gold = rankings[0] || null;
  const silver = rankings[1] || null;
  const bronze = rankings[2] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Trophy className="w-5 h-5 text-[#eab308]" />
              <h2 className="text-[15px] font-black text-slate-900 dark:text-white">Leaderboard</h2>
            </div>
            <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{quiz.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-7 h-7 animate-spin text-blue-500" />
              <p className="text-xs font-semibold">Tabulating scores...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-500 text-sm">{error}</div>
          ) : rankings.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-bold text-slate-600 dark:text-white">No participants yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Podium — top 3 */}
              <div className="bg-slate-50 dark:bg-[#0f172a] rounded-xl p-5 pb-0 border border-slate-100 dark:border-slate-800">
                <div className="flex items-end justify-center gap-2 sm:gap-4">
                  <PodiumColumn entry={silver} rank={2} order="order-1" isCurrentUser={silver?.userId === currentUserId} />
                  <PodiumColumn entry={gold}   rank={1} order="order-2" isCurrentUser={gold?.userId   === currentUserId} />
                  <PodiumColumn entry={bronze} rank={3} order="order-3" isCurrentUser={bronze?.userId === currentUserId} />
                </div>
              </div>

              {/* Full ranked list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-bold text-slate-700 dark:text-white flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-blue-500" /> Full Rankings
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400">{rankings.length} participants</span>
                </div>
                <div className="space-y-2">
                  {rankings.map((r, idx) => {
                    const isMe = r.userId === currentUserId;
                    const isTop3 = r.rank <= 3;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors ${
                          isMe
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-1 ring-blue-300 dark:ring-blue-700"
                            : isTop3
                              ? "bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-slate-700"
                              : "bg-white dark:bg-transparent border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                          r.rank === 1 ? "bg-[#eab308] text-[#1e293b]"
                          : r.rank === 2 ? "bg-slate-300 text-slate-700"
                          : r.rank === 3 ? "bg-[#b45309] text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {r.rank}
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${isMe ? "bg-gradient-to-br from-blue-500 to-blue-700" : "bg-gradient-to-br from-[#0f172a] to-[#1e3a8a]"}`}>
                          {r.fullName?.charAt(0) ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm truncate ${isMe ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-white"}`}>
                            {r.fullName}
                            {isMe && <span className="ml-2 text-[9px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">You</span>}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{r.indexNumber || "—"}</p>
                        </div>
                        {r.timeTaken !== null && (
                          <span className="text-[10px] text-slate-400 shrink-0">{r.timeTaken}s</span>
                        )}
                        <div className={`shrink-0 rounded-lg px-3 py-1.5 font-bold text-sm ${isMe ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "bg-[#1e3a8a]/10 text-[#1e3a8a] dark:text-blue-300"}`}>
                          {r.score}
                          <span className="text-[10px] opacity-60 ml-1 font-semibold">/ {maxMarks}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Review Answers Modal ────────────────────────────────────────────────────

function ReviewModal({ quiz, attemptId, onClose }) {
  const [review, setReview] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeQ, setActiveQ] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetchApi(`/quiz/review?attemptId=${attemptId}`);
      setLoading(false);
      if (res.success) {
        setReview(res.review);
        setScore(res.score);
      } else {
        setError(res.message || "Failed to load review.");
      }
    };
    load();
  }, [attemptId]);

  const correctCount = review.filter(q => q.is_correct).length;
  const totalCount = review.length;
  const notAnsweredCount = review.filter(q => q.selected_option_id === null).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Eye className="w-5 h-5 text-blue-500" />
              <h2 className="text-[15px] font-black text-slate-900 dark:text-white">Answer Review</h2>
            </div>
            <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{quiz.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
            <RefreshCw className="w-7 h-7 animate-spin text-blue-500" />
            <p className="text-xs font-semibold">Loading your answers...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center py-12 text-red-500 text-sm">{error}</div>
        ) : (
          <>
            {/* Score summary bar */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-[12px] font-bold text-emerald-600">{correctCount} Correct</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-[12px] font-bold text-red-500">{totalCount - correctCount - notAnsweredCount} Wrong</span>
              </div>
              {notAnsweredCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <MinusCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-[12px] font-bold text-slate-500">{notAnsweredCount} Skipped</span>
                </div>
              )}
              <div className="ml-auto text-[12px] font-black text-slate-700 dark:text-white">
                Score: <span className="text-blue-600 dark:text-blue-400">{score}</span>
                <span className="text-slate-400 font-semibold"> / {review.reduce((s, q) => s + (q.marks || 1), 0)}</span>
              </div>
            </div>

            {/* Question navigation pills */}
            <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 flex gap-1.5 flex-wrap shrink-0">
              {review.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setActiveQ(idx)}
                  className={`w-7 h-7 rounded-full text-[10px] font-black transition-all border ${
                    activeQ === idx
                      ? "bg-blue-600 text-white border-blue-600 scale-110"
                      : q.is_correct
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200"
                        : q.selected_option_id === null
                          ? "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200"
                          : "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Question body */}
            <div className="flex-1 overflow-y-auto p-6">
              {review.length > 0 && (() => {
                const q = review[activeQ];
                return (
                  <div>
                    <div className="flex items-start gap-2 mb-4">
                      <span className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        q.is_correct ? "bg-emerald-100 text-emerald-600" :
                        q.selected_option_id === null ? "bg-slate-100 text-slate-400" :
                        "bg-red-100 text-red-500"
                      }`}>
                        {q.is_correct ? <CheckCircle className="w-3.5 h-3.5" /> :
                         q.selected_option_id === null ? <MinusCircle className="w-3.5 h-3.5" /> :
                         <XCircle className="w-3.5 h-3.5" />}
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Question {activeQ + 1} · {q.marks || 1} mark{(q.marks || 1) !== 1 ? "s" : ""}
                        </p>
                        <p className="text-[14px] font-semibold text-slate-800 dark:text-white leading-snug">{q.question_text}</p>
                      </div>
                    </div>

                    {q.imageUrl && (
                      <img src={q.imageUrl} alt="question" className="mb-4 max-h-40 rounded-lg object-contain border border-slate-100" />
                    )}

                    <div className="space-y-2.5 mt-4">
                      {q.options.map(opt => {
                        const isCorrect = opt.id === q.correct_option_id;
                        const isSelected = opt.id === q.selected_option_id;
                        const isWrong = isSelected && !isCorrect;

                        let cls = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 text-slate-600 dark:text-slate-300";
                        let icon = null;

                        if (isCorrect) {
                          cls = "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300";
                          icon = <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
                        } else if (isWrong) {
                          cls = "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                          icon = <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium transition-colors ${cls}`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-[9px] font-black ${
                              isCorrect ? "border-emerald-400 bg-emerald-100 text-emerald-700"
                              : isWrong ? "border-red-400 bg-red-100 text-red-700"
                              : "border-slate-200 dark:border-slate-600 text-slate-400"
                            }`}>
                              {["A","B","C","D"][q.options.indexOf(opt)]}
                            </div>
                            <span className="flex-1">{opt.option_text}</span>
                            {icon}
                            {isCorrect && (
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wide bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                                Correct
                              </span>
                            )}
                            {isWrong && (
                              <span className="text-[9px] font-black text-red-600 uppercase tracking-wide bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">
                                Your Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.selected_option_id === null && (
                      <div className="mt-3 text-[11px] text-slate-400 italic text-center">You did not answer this question.</div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer nav */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                disabled={activeQ === 0}
                onClick={() => setActiveQ(p => p - 1)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-[11px] text-slate-400 font-semibold">{activeQ + 1} / {review.length}</span>
              <button
                disabled={activeQ === review.length - 1}
                onClick={() => setActiveQ(p => p + 1)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

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
  const [examSubTab, setExamSubTab] = useState("available"); // "available" | "participated"
  const [classSubTab, setClassSubTab] = useState("ongoing"); // "ongoing" | "upcoming" | "past"

  // Unlock Quiz Modal state
  const [selectedQuizForUnlock, setSelectedQuizForUnlock] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Review & Leaderboard modal state
  const [reviewModal, setReviewModal] = useState(null);       // { quiz, attemptId }
  const [leaderboardModal, setLeaderboardModal] = useState(null); // { quiz }

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

  const loadQuizzes = useCallback(async (userId) => {
    const data = await fetchApi(`/quiz/list?userId=${userId}`);
    setIsLoadingQuizzes(false);

    if (data.success) {
      setQuizzes(data.quizzes || { active: [], upcoming: [], past: [] });
    } else {
      setQuizError(data.message || "Failed to load quizzes.");
    }
  }, []);

  const loadClasses = useCallback(async (userId) => {
    const data = await fetchApi(`/online_class/manage?userId=${userId}&role=student`);
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
        loadClasses(parsedUser.id);
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

  const availableQuizzes = [...(quizzes.active || []), ...(quizzes.upcoming || [])];
  const participatedQuizzes = quizzes.past || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Modals */}
      {reviewModal && (
        <ReviewModal
          quiz={reviewModal.quiz}
          attemptId={reviewModal.attemptId}
          onClose={() => setReviewModal(null)}
        />
      )}
      {leaderboardModal && (
        <LeaderboardModal
          quiz={leaderboardModal.quiz}
          currentUserId={user.id}
          onClose={() => setLeaderboardModal(null)}
        />
      )}

      {/* Unlock Quiz Confirmation Dialog */}
      {selectedQuizForUnlock && (
        <CustomDialog
          isOpen={!!selectedQuizForUnlock}
          onClose={() => setSelectedQuizForUnlock(null)}
          title="Unlock Quiz"
          message={`This quiz costs LKR ${selectedQuizForUnlock.fee}. Do you want to unlock it?`}
          onConfirm={handleConfirmUnlock}
          isLoading={isUnlocking}
        />
      )}

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
            Quizzes
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
                  { id: "participated", label: "Participated" }
                ].map((sub) => {
                  const count = sub.id === "available"
                    ? availableQuizzes.length
                    : participatedQuizzes.length;
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
            ) : examSubTab === "available" ? (
              /* ── Available Quizzes ── */
              availableQuizzes.length === 0 ? (
                <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl p-6">
                  <ClipboardList className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                  <p className="text-xs font-bold text-slate-700">No available quizzes at the moment</p>
                  <p className="text-[10px] text-slate-400 mt-1">Check back later for upcoming exams.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableQuizzes.map((quiz) => {
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

                        {/* Unlock / fee badge */}
                        {parseFloat(quiz.fee) > 0 && !quiz.isPaid && (
                          <div className="px-5 pb-5">
                            <button
                              onClick={() => handleUnlockClick(quiz)}
                              className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black rounded-xl flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                            >
                              <Lock className="w-3.5 h-3.5" /> Unlock — LKR {parseFloat(quiz.fee).toFixed(2)}
                            </button>
                          </div>
                        )}

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
              )
            ) : (
              /* ── Participated Quizzes ── */
              participatedQuizzes.length === 0 ? (
                <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl p-6">
                  <Award className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                  <p className="text-xs font-bold text-slate-700">No participated quizzes yet</p>
                  <p className="text-[10px] text-slate-400 mt-1">Quizzes you complete will appear here with your results and rankings.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {participatedQuizzes.map((quiz) => {
                    const duration = getDurationMinutes(quiz.startTime, quiz.endTime);
                    const scoreVal = quiz.attempt?.score ?? null;

                    return (
                      <div key={quiz.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-700 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group">
                        {/* Card Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:from-blue-900/10 dark:to-indigo-900/5">
                          <div className="flex justify-between items-center mb-2.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                              {getCategoryFromTitle(quiz.title)}
                            </span>
                            <span className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Completed
                            </span>
                          </div>
                          <h4 className="text-[13px] font-bold text-slate-800 dark:text-white leading-snug min-h-[38px] line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {quiz.title}
                          </h4>
                          {quiz.endTime && (
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md bg-slate-900/5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              Ended: {new Date(quiz.endTime).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-5 space-y-3 flex-1 text-[11px] text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-50 dark:border-slate-800">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 shrink-0 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                              {quiz.creatorName ? quiz.creatorName.charAt(0).toUpperCase() : "I"}
                            </div>
                            <div>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Instructor</p>
                              <span className="font-bold text-slate-700 dark:text-slate-200 truncate block max-w-[150px]">{quiz.creatorName || "Lecturer"}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <ClipboardList className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="font-medium">Questions: <strong className="text-slate-800 dark:text-white">{quiz.questionCount}</strong></span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-medium">Duration: <strong className="text-slate-800 dark:text-white">{duration} mins</strong></span>
                          </div>

                          {/* Score badge */}
                          {scoreVal !== null && (
                            <div className="pt-2 border-t border-slate-50 dark:border-slate-800">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Score</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="h-1.5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${scoreVal >= 80 ? "bg-emerald-500" : scoreVal >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                                      style={{ width: `${Math.min(scoreVal, 100)}%` }}
                                    />
                                  </div>
                                  <span className={`text-[12px] font-black ${scoreVal >= 80 ? "text-emerald-600" : scoreVal >= 50 ? "text-amber-600" : "text-red-500"}`}>
                                    {scoreVal}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="px-5 pb-5 space-y-2.5">
                          {/* Review Answers */}
                          <button
                            onClick={() => quiz.attempt?.id && setReviewModal({ quiz, attemptId: quiz.attempt.id })}
                            disabled={!quiz.attempt?.id}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-[11px] font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review My Answers
                          </button>
                          {/* Leaderboard */}
                          <button
                            onClick={() => setLeaderboardModal({ quiz })}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-[11px] font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trophy className="w-3.5 h-3.5 text-[#eab308]" />
                            View Leaderboard
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        ) : (
          <>
            {/* Classes Sub Tabs */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div className="flex gap-2 border-b border-slate-50 pb-1.5 overflow-x-auto">
                {[
                  { id: "ongoing",  label: "Live Now" },
                  { id: "upcoming", label: "Upcoming" },
                  { id: "past",     label: "Attended" }
                ].map((sub) => {
                  const count =
                    sub.id === "ongoing"  ? (classes.ongoing?.filter(c => c.is_enrolled).length || 0) :
                    sub.id === "upcoming" ? (classes.upcoming?.filter(c => c.is_enrolled).length || 0) :
                    (classes.past?.length || 0);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setClassSubTab(sub.id)}
                      className={`px-4 py-2 text-xs font-bold border-b-2 capitalize transition-all cursor-pointer whitespace-nowrap ${
                        classSubTab === sub.id
                          ? "border-blue-500 text-blue-600 font-black dark:border-blue-400 dark:text-blue-400"
                          : "border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {sub.label} ({count})
                    </button>
                  );
                })}
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
            ) : classSubTab === "past" ? (
              /* ── Attended (past enrolled) ── */
              (classes.past || []).length === 0 ? (
                <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6">
                  <Video className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                  <p className="text-xs font-bold text-slate-700 dark:text-white">No attended classes yet</p>
                  <p className="text-[10px] text-slate-400 mt-1">Classes you were enrolled in will appear here after they end.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(classes.past || []).map((cls) => {
                    const { date, timeRange } = formatClassDateTime(cls.date_time, cls.duration);
                    return (
                      <div key={cls.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-700 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:from-blue-900/10 dark:to-indigo-900/5">
                          <div className="flex justify-between items-center mb-2.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                              {getCategoryFromTitle(cls.title)}
                            </span>
                            <span className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Attended
                            </span>
                          </div>
                          <h4 className="text-[13px] font-bold text-slate-800 dark:text-white leading-snug min-h-[38px] line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {cls.title}
                          </h4>
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md bg-slate-900/5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            Ended: {date}
                          </span>
                        </div>

                        <div className="p-5 space-y-3.5 flex-1 text-[11px] text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-50 dark:border-slate-800">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 shrink-0 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                              {cls.creator_name ? cls.creator_name.charAt(0).toUpperCase() : "I"}
                            </div>
                            <div>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Instructor</p>
                              <span className="font-bold text-slate-700 dark:text-slate-200 truncate block max-w-[150px]">{cls.creator_name || "LMS Lecturer"}</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <Calendar className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white leading-none mb-0.5">{date}</p>
                              <p className="text-[9px] text-slate-400 font-medium">{timeRange} ({cls.duration} mins)</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <Video className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="font-medium">Platform: <strong className="text-slate-800 dark:text-white">{cls.platform || "Zoom Meetings"}</strong></span>
                          </div>
                        </div>

                        <div className="px-5 pb-5">
                          <div className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl text-center text-slate-400 font-bold text-[10px] select-none uppercase tracking-wider">
                            Session Ended
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (() => {
              /* ── Ongoing / Upcoming — only enrolled classes ── */
              const allInTab = (classes[classSubTab] || []);
              const enrolledInTab = allInTab.filter(c => c.is_enrolled);
              const unenrolledInTab = allInTab.filter(c => !c.is_enrolled);

              return (
                <>
                  {enrolledInTab.length === 0 && unenrolledInTab.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6">
                      <Video className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                      <p className="text-xs font-bold text-slate-700 dark:text-white">No {classSubTab === "ongoing" ? "live" : classSubTab} classes</p>
                      <p className="text-[10px] text-slate-400 mt-1">Enroll in a class to see it appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Enrolled classes */}
                      {enrolledInTab.length > 0 && (
                        <div>
                          {unenrolledInTab.length > 0 && (
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Enrolled Classes
                            </p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrolledInTab.map((cls) => {
                              const { date, timeRange } = formatClassDateTime(cls.date_time, cls.duration);
                              return (
                                <div
                                  key={cls.id}
                                  className={`bg-white rounded-3xl border flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group ${
                                    classSubTab === "ongoing" ? "border-red-200 ring-1 ring-red-50/50 shadow-md shadow-red-500/5" : "border-slate-150"
                                  }`}
                                >
                                  <div className="p-5 bg-slate-50/60 border-b border-slate-100">
                                    <div className="flex justify-between items-center mb-2.5">
                                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                        {getCategoryFromTitle(cls.title)}
                                      </span>
                                      {classSubTab === "ongoing" ? (
                                        <span className="flex items-center gap-1 text-[9px] font-extrabold text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full border border-red-150 animate-pulse-slow">
                                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span> Live Now
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                          <CheckCircle2 className="w-2.5 h-2.5" /> Enrolled
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
                                      <span className="font-medium">Platform: <strong className="text-slate-800 font-bold">{cls.platform || "Zoom Meetings"}</strong></span>
                                    </div>
                                  </div>

                                  <div className="p-5 pt-0">
                                    {classSubTab === "ongoing" ? (
                                      <a href={cls.meeting_link} target="_blank" rel="noopener noreferrer" className="w-full inline-block">
                                        <Button size="sm" className="w-full text-[11px] h-9 bg-gradient-to-r from-red-500 to-amber-500 hover:opacity-95 text-white flex items-center justify-center gap-1.5 font-bold rounded-xl shadow-sm border-none">
                                          <Video className="w-3.5 h-3.5 animate-pulse" /> Join Live Lecture
                                        </Button>
                                      </a>
                                    ) : (
                                      <div className="w-full py-2 bg-slate-50 border border-slate-150/70 rounded-xl text-center text-slate-400 font-bold text-[10px] select-none">
                                        Locks Until Scheduled Time
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Other available classes (not enrolled) */}
                      {unenrolledInTab.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <ClipboardList className="w-3.5 h-3.5 text-blue-400" /> Other Available Classes
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {unenrolledInTab.map((cls) => {
                              const { date, timeRange } = formatClassDateTime(cls.date_time, cls.duration);
                              return (
                                <div
                                  key={cls.id}
                                  className="bg-white rounded-3xl border border-slate-150 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group opacity-80 hover:opacity-100"
                                >
                                  <div className="p-5 bg-slate-50/60 border-b border-slate-100">
                                    <div className="flex justify-between items-center mb-2.5">
                                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                        {getCategoryFromTitle(cls.title)}
                                      </span>
                                      {parseFloat(cls.fee) > 0 ? (
                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                          LKR {parseFloat(cls.fee).toFixed(2)}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                          Free
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
                                      <span className="font-medium">Platform: <strong className="text-slate-800 font-bold">{cls.platform || "Zoom Meetings"}</strong></span>
                                    </div>
                                  </div>

                                  <div className="px-5 pb-5">
                                    <Link href="/home/online-class" className="w-full block">
                                      <div className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-opacity text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
                                        <Play className="w-3.5 h-3.5" /> View & Enroll
                                      </div>
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
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