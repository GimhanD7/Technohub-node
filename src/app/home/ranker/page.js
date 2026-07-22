"use client";

import { useEffect, useRef, useState } from "react";
import {
  Trophy,
  Calendar,
  ClipboardList,
  AlertCircle,
  Award,
  Sparkles,
  Crown,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Animates a number counting up from 0 to `value` once it enters view/mounts.
function CountUp({ value, duration = 900, delay = 0, className }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      const reducedMotionTimer = window.setTimeout(() => setDisplay(value), 0);
      return () => window.clearTimeout(reducedMotionTimer);
    }

    let raf;
    const start = performance.now() + delay;

    const tick = (now) => {
      const elapsed = now - start;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, delay]);

  return <span className={className}>{display}</span>;
}

// A handful of falling confetti pieces, shown once behind the 1st place column
function Confetti() {
  const pieces = [
    { left: "10%", color: "#eab308", delay: "0s", duration: "1.6s", rotate: "40deg" },
    { left: "25%", color: "#1e3a8a", delay: "0.1s", duration: "1.9s", rotate: "-30deg" },
    { left: "40%", color: "#eab308", delay: "0.05s", duration: "1.7s", rotate: "60deg" },
    { left: "58%", color: "#1d4ed8", delay: "0.2s", duration: "2s", rotate: "-50deg" },
    { left: "72%", color: "#eab308", delay: "0.15s", duration: "1.8s", rotate: "20deg" },
    { left: "88%", color: "#1e3a8a", delay: "0.25s", duration: "1.6s", rotate: "-15deg" },
  ];

  return (
    <div className="absolute inset-x-0 -top-4 h-0 overflow-visible pointer-events-none confetti-wrap">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: p.left,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            "--rot": p.rotate,
          }}
        />
      ))}
    </div>
  );
}

// Pentagon badge colors per rank — gold for 1st, matching the site's amber accent
// A restrained page-wide celebration while a completed exam leaderboard is shown.
function PageCelebration() {
  const colors = ["#eab308", "#1d4ed8", "#0f172a", "#f59e0b", "#60a5fa"];
  const pieces = Array.from({ length: 14 }, (_, index) => ({
    left: `${3 + ((index * 37) % 94)}%`,
    color: colors[index % colors.length],
    delay: `${-(index * 0.73)}s`,
    duration: `${7.5 + (index % 5) * 0.65}s`,
    drift: `${((index % 7) - 3) * 18}px`,
    rotation: `${180 + (index % 6) * 75}deg`,
  }));

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden pointer-events-none" aria-hidden="true">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className={`page-celebration-piece ${index % 3 === 0 ? "rounded-full" : "rounded-sm"}`}
          style={{
            left: piece.left,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            "--celebration-drift": piece.drift,
            "--celebration-rotation": piece.rotation,
          }}
        />
      ))}
    </div>
  );
}

const RANK_BADGE = {
  1: "bg-[#eab308]",
  2: "bg-slate-300",
  3: "bg-[#b45309]",
};

const RANK_BADGE_TEXT = {
  1: "text-[#1e293b]",
  2: "text-slate-700",
  3: "text-white",
};

// Pedestal heights (tallest in center for 1st)
const PEDESTAL_HEIGHT = {
  1: "h-44 sm:h-48",
  2: "h-36 sm:h-40",
  3: "h-28 sm:h-32",
};

const AVATAR_RING = {
  1: "ring-[#eab308]",
  2: "ring-slate-300",
  3: "ring-[#b45309]",
};

const CROWN_COLOR = {
  1: "text-[#eab308]",
  2: "text-slate-400",
  3: "text-[#b45309]",
};

const CROWN_SIZE = {
  1: "w-7 h-7",
  2: "w-5 h-5",
  3: "w-5 h-5",
};

function PentagonBadge({ rank }) {
  return (
    <div
      className={`w-10 h-10 flex items-center justify-center font-black text-base ${RANK_BADGE_TEXT[rank]} ${RANK_BADGE[rank]} shadow-md`}
      style={{ clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" }}
    >
      {rank}
    </div>
  );
}

function PodiumColumn({ entry, rank, order }) {
  const [celebrating, setCelebrating] = useState(false);

  if (!entry) return <div className={`${order} flex-1`} />;

  const handleHover = () => {
    if (rank !== 1) return;
    setCelebrating(true);
  };

  const handleLeave = () => {
    if (rank !== 1) return;
    setCelebrating(false);
  };

  return (
    <div className={`${order} flex-1 flex flex-col items-center pop-in relative`} style={{ animationDelay: `${rank * 0.12}s` }}>
      {celebrating && (
        <>
          <Confetti />
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 winner-toast z-40 pointer-events-none">
            <div className="flex items-center gap-1 bg-[#eab308] text-[#1e293b] font-black text-xs px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5" /> Winner!
            </div>
          </div>
        </>
      )}

      {/* Crown + avatar move together as one unit so they never cross */}
      <div
        className={`flex flex-col items-center gap-2 float-avatar ${celebrating ? "winner-bounce" : ""}`}
        onMouseEnter={handleHover}
        onMouseLeave={handleLeave}
        onTouchStart={handleHover}
        onTouchEnd={handleLeave}
      >
        <Crown
          className={`${CROWN_SIZE[rank]} ${CROWN_COLOR[rank]} ${rank === 1 ? "crown-wobble" : ""}`}
          fill="currentColor"
          strokeWidth={1.5}
        />

        {/* Avatar bubble */}
        <div className="relative">
          <div
            className="avatar-pop transition-transform duration-200 ease-out"
            style={{ animationDelay: `${rank * 0.15}s` }}
          >
            <div
              className={`relative z-10 w-16 h-16 rounded-full bg-white ring-4 ${AVATAR_RING[rank]} shadow-lg flex items-center justify-center text-xl font-black text-[#1e3a8a] ${celebrating ? "scale-110" : ""} transition-transform duration-200`}
            >
              {entry.fullName?.charAt(0) ?? "?"}
            </div>
          </div>
        </div>
      </div>

      {/* Pentagon rank badge, overlapping pedestal */}
      <div className="mt-2 -mb-5 z-10">
        <PentagonBadge rank={rank} />
      </div>

      {/* Pedestal block — navy-to-blue gradient matching the site's featured card */}
      <div
        className={`w-full max-w-[160px] ${PEDESTAL_HEIGHT[rank]} rounded-t-xl bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1d4ed8] shadow-lg flex flex-col items-center justify-end pb-4 px-3`}
      >
        <p className="text-white font-bold text-sm sm:text-base text-center line-clamp-3 leading-tight w-full">
          {entry.fullName}
        </p>
        <p className="text-[#eab308] font-semibold text-xs mt-0.5">{entry.score} pts</p>
      </div>
    </div>
  );
}

export default function RankerPage() {
  const [pastQuizzes, setPastQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");

  const [rankings, setRankings] = useState([]);
  const [maxMarks, setMaxMarks] = useState(0);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function loadPastQuizzes() {
    setIsLoadingQuizzes(true);
    setErrorMsg("");
    const res = await fetchApi("/quiz/list");
    setIsLoadingQuizzes(false);

    if (res.success) {
      setPastQuizzes(res.quizzes.past);
      if (res.quizzes.past.length > 0) {
        setSelectedQuizId(res.quizzes.past[0].id.toString());
      }
    } else {
      setErrorMsg("Failed to load past mock exams.");
    }
  }

  async function loadRankings(qId) {
    setIsLoadingRankings(true);
    setErrorMsg("");
    const res = await fetchApi(`/quiz/rankings?quizId=${qId}`);
    setIsLoadingRankings(false);

    if (res.success) {
      setRankings(res.rankings);
      setMaxMarks(res.maxMarks);
    } else {
      setErrorMsg(res.message || "Failed to load rankings.");
    }
  }

  useEffect(() => {
    const quizzesTimer = window.setTimeout(() => loadPastQuizzes(), 0);
    return () => window.clearTimeout(quizzesTimer);
  }, []);

  useEffect(() => {
    const rankingsTimer = window.setTimeout(() => {
      if (selectedQuizId) {
        loadRankings(selectedQuizId);
      } else {
        setRankings([]);
      }
    }, 0);

    return () => window.clearTimeout(rankingsTimer);
  }, [selectedQuizId]);

  const gold = rankings[0] || null;
  const silver = rankings[1] || null;
  const bronze = rankings[2] || null;

  return (
    <>
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5) translateY(30px); opacity: 0; }
          60% { transform: scale(1.05) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .pop-in { animation: popIn 0.6s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes floatAvatar {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .float-avatar { animation: floatAvatar 2.6s ease-in-out infinite; }
        @keyframes avatarPopIn {
          0% { transform: scale(0.3) rotate(-30deg); opacity: 0; }
          55% { transform: scale(1.18) rotate(10deg); opacity: 1; }
          75% { transform: scale(0.94) rotate(-5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .avatar-pop { animation: avatarPopIn 0.7s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes crownWobble {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(6deg); }
        }
        .crown-wobble { animation: crownWobble 2.2s ease-in-out infinite; transform-origin: 50% 90%; }
        @keyframes winnerBounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          20% { transform: scale(1.25) rotate(-6deg); }
          40% { transform: scale(0.92) rotate(4deg); }
          60% { transform: scale(1.12) rotate(-3deg); }
          80% { transform: scale(0.98) rotate(2deg); }
        }
        .winner-bounce { animation: winnerBounce 0.9s ease-in-out; }
        @keyframes winnerToastPop {
          0% { transform: translate(-50%, 12px) scale(0.5); opacity: 0; }
          25% { transform: translate(-50%, -8px) scale(1.1); opacity: 1; }
          75% { transform: translate(-50%, -8px) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -20px) scale(0.9); opacity: 0; }
        }
        .winner-toast { animation: winnerToastPop 1.9s ease-out forwards; }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(90px) rotate(var(--rot)); opacity: 0; }
        }
        .confetti-piece {
          position: absolute;
          top: 0;
          width: 6px;
          height: 10px;
          border-radius: 1px;
          animation-name: confettiFall;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        @keyframes slideInBar {
          0% { transform: translateX(-24px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .slide-in-bar { animation: slideInBar 0.4s ease-out both; }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        .dot-bounce { animation: dotBounce 1s ease-in-out infinite; }
        @keyframes sparkleSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .sparkle-spin { animation: sparkleSpin 4s linear infinite; }
        @keyframes pageCelebrationFall {
          0% { transform: translate3d(0, -8vh, 0) rotate(0deg); opacity: 0; }
          12% { opacity: 0.62; }
          82% { opacity: 0.62; }
          100% { transform: translate3d(var(--celebration-drift), 105vh, 0) rotate(var(--celebration-rotation)); opacity: 0; }
        }
        .page-celebration-piece {
          position: absolute;
          top: 0;
          width: 6px;
          height: 9px;
          box-shadow: 0 1px 3px rgb(15 23 42 / 0.1);
          animation-name: pageCelebrationFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-fill-mode: both;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .page-celebration-piece { display: none; }
        }
      `}</style>

      <Navbar />

      {rankings.length > 0 && <PageCelebration key={selectedQuizId} />}

      <main className="flex-1 bg-[#f8fafc] dark:bg-slate-900 min-h-screen">
        {/* Header Section matching the site's card style */}
        <section className="pt-24 pb-6 px-4 sm:px-6 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3">
                <Award className="w-4 h-4" />
                Hall of Fame
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-950 dark:text-white mb-2">
                Top Rankers
              </h1>
              <p className="max-w-2xl text-slate-600 dark:text-slate-300 text-base leading-7">
                Celebrate the excellence and hard work of our highest achieving students. See where you stand among the best!
              </p>
            </div>

            <div className="lg:self-end">
              <label htmlFor="ranker-exam" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Examination
              </label>

            <div className="max-w-md">
              <label className="relative block">
                <span className="sr-only">Select Examination</span>
                <Award className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="ranker-exam"
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                  className="w-full h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] pl-12 pr-10 text-sm font-semibold text-slate-700 dark:text-white outline-none focus:border-[#1e3a8a] focus:bg-white dark:focus:bg-[#1e293b] focus:ring-4 focus:ring-[#1e3a8a]/10 appearance-none cursor-pointer"
                  disabled={isLoadingQuizzes}
                >
                  {isLoadingQuizzes ? (
                    <option>Loading past exams...</option>
                  ) : pastQuizzes.length === 0 ? (
                    <option>No past examinations available</option>
                  ) : (
                    pastQuizzes.map((quiz) => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.title} (Ended: {quiz.endTime.substring(0, 10)})
                      </option>
                    ))
                  )}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs" aria-hidden="true">▼</span>
              </label>
            </div>
            </div>
            </div>

            {errorMsg && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg flex gap-2 items-center max-w-3xl">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                {errorMsg}
              </div>
            )}

          </div>
        </section>

        {/* Rankings Section */}
        <section className="px-4 sm:px-6 py-6">
          <div className="max-w-5xl mx-auto">
            {isLoadingRankings ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                <div className="flex gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-[#1e3a8a] dot-bounce" style={{ animationDelay: "0s" }} />
                  <span className="w-3 h-3 rounded-full bg-[#eab308] dot-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-3 h-3 rounded-full bg-[#1e3a8a] dot-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
                <p className="text-sm font-medium">Tabulating scores...</p>
              </div>
            ) : rankings.length === 0 && selectedQuizId ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                <ClipboardList className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No Participants Yet</h3>
                <p className="text-sm max-w-xs mx-auto text-center">No students participated in this exam under timed conditions.</p>
              </div>
            ) : rankings.length > 0 ? (
              <div className="space-y-8">
                {/* Podium */}
                <div className="relative bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm px-3 sm:px-8 pt-9 pb-0">
                  <div className="flex items-end justify-center gap-2 sm:gap-6 max-w-2xl mx-auto">
                    <PodiumColumn entry={silver} rank={2} order="order-1" />
                    <PodiumColumn entry={gold} rank={1} order="order-2" />
                    <PodiumColumn entry={bronze} rank={3} order="order-3" />
                  </div>
                </div>

                {/* Leaderboard Table matching the site's card style */}
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-[#eab308]" /> Full Leaderboard
                    </h3>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {rankings.length} Participants
                    </span>
                  </div>

                  <div className="p-4 sm:p-6 space-y-2.5">
                    {rankings.map((r, idx) => {
                      const isTop3 = r.rank <= 3;
                      return (
                        <div
                          key={r.rank}
                          className={`slide-in-bar flex items-center gap-4 rounded-lg px-4 sm:px-5 py-3.5 border transition-colors ${isTop3
                              ? "bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-slate-700"
                              : "bg-white dark:bg-transparent border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                            }`}
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${r.rank === 1
                                ? "bg-[#eab308] text-[#1e293b]"
                                : r.rank === 2
                                  ? "bg-slate-300 text-slate-700"
                                  : r.rank === 3
                                    ? "bg-[#b45309] text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}
                          >
                            {r.rank}
                          </div>
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {r.fullName?.charAt(0) ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{r.fullName}</p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 font-mono">
                              {r.indexNumber || "-"}
                            </p>
                          </div>
                          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0">
                            <Calendar className="w-3.5 h-3.5" /> {r.timeTaken}s
                          </div>
                          <div className="shrink-0 bg-[#1e3a8a]/10 text-[#1e3a8a] dark:text-blue-300 rounded-md px-3 py-1.5 font-bold text-sm">
                            {r.score}
                            <span className="text-[10px] text-[#1e3a8a]/60 dark:text-blue-300/60 ml-1 font-semibold">/ {maxMarks}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
