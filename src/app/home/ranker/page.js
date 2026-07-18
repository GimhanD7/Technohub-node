"use client";

import { useEffect, useState } from "react";
import { Trophy, Calendar, ClipboardList, RefreshCw, Star, AlertCircle, Crown, Award } from "lucide-react";
import { fetchApi } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function RankerPage() {
  const [pastQuizzes, setPastQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  
  const [rankings, setRankings] = useState([]);
  const [maxMarks, setMaxMarks] = useState(0);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadPastQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      loadRankings(selectedQuizId);
    } else {
      setRankings([]);
    }
  }, [selectedQuizId]);

  const loadPastQuizzes = async () => {
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
  };

  const loadRankings = async (qId) => {
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
  };

  const gold = rankings[0] || null;
  const silver = rankings[1] || null;
  const bronze = rankings[2] || null;

  return (
    <>
      <Navbar />
      
      <main className="flex-1 bg-[#f8fafc] dark:bg-slate-900 min-h-screen">
        
        {/* Header Section matching Gallery Page style */}
        <section className="pt-28 pb-8 px-6 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/15 bg-amber-500/5 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-5">
                <Crown className="w-4 h-4" />
                Hall of Fame
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950 dark:text-white mb-5">
                Top Rankers
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg leading-8">
                Celebrate the excellence and hard work of our highest achieving students. See where you stand among the best!
              </p>
            </div>

            {errorMsg && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg flex gap-2 items-center max-w-3xl">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                {errorMsg}
              </div>
            )}

            <div className="mt-8 max-w-sm">
              <label className="relative block">
                <span className="sr-only">Select Examination</span>
                <Award className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                  className="w-full h-14 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] pl-12 pr-4 text-sm font-semibold text-slate-700 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-[#1e293b] focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
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
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Rankings Section */}
        <section className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {isLoadingRankings ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mb-4" />
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
                
                {/* Podium Cards (Instead of glassmorphism) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 2nd Place */}
                  {silver && (
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm flex flex-col items-center text-center order-2 md:order-1 relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-1 bg-slate-400"></div>
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xl mb-4 border-2 border-slate-200 dark:border-slate-700">
                        {silver.fullName?.charAt(0) ?? '?'}
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
                        {gold.fullName?.charAt(0) ?? '?'}
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
                        {bronze.fullName?.charAt(0) ?? '?'}
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1 text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400 mb-3">
                        🥉 3rd Place
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate w-full mb-1">{bronze.fullName}</h3>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{bronze.score} pts</p>
                    </div>
                  )}
                </div>

                {/* Leaderboard Table matching Gallery cards */}
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
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
                          <tr key={r.rank} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
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
                                <Calendar className="w-3.5 h-3.5" /> {r.timeTaken}s
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
