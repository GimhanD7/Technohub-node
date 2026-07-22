"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CircleDollarSign,
  ClipboardList,
  GraduationCap,
  Library,
  Loader2,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { BASE_URL, fetchApi } from "@/lib/api";

const metricCards = [
  { key: "total_students", label: "Students", helper: "Across all your classes", icon: Users, color: "blue" },
  { key: "active_courses", label: "Active courses", helper: "Currently published", icon: BookOpen, color: "violet" },
  { key: "total_quizzes", label: "Total quizzes", helper: "Created by you", icon: ClipboardList, color: "amber" },
  { key: "total_earnings", label: "Total earnings", helper: "Your net earnings", icon: CircleDollarSign, color: "emerald", currency: true },
];

const colorStyles = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
};

const quickActions = [
  { label: "Build a course", href: "/dashboard/teacher/courses", icon: BookOpen },
  { label: "Create a quiz", href: "/dashboard/teacher/quizzes", icon: ClipboardList },
  { label: "Schedule a class", href: "/dashboard/teacher/online-classes/create", icon: Video },
  { label: "Add an e-book", href: "/dashboard/teacher/e-books", icon: Library },
  { label: "View earnings", href: "/dashboard/teacher/earnings", icon: TrendingUp },
  { label: "Message admin", href: "/dashboard/teacher/messages", icon: MessageSquare },
];

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboard = useCallback(async (teacherId, refresh = false) => {
    if (refresh) setIsRefreshing(true);
    const data = await fetchApi(`/teacher/dashboard?teacher_id=${teacherId}`, { showToast: false });
    if (data.success) setStats(data.stats);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (!savedUser) {
        setIsLoading(false);
        return;
      }
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      loadDashboard(parsedUser.id);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const overviewItems = useMemo(() => [
    { label: "All courses", value: stats?.total_courses || 0, href: "/dashboard/teacher/courses", icon: BookOpen, tone: "blue" },
    { label: "Courses pending", value: Math.max((stats?.total_courses || 0) - (stats?.active_courses || 0), 0), href: "/dashboard/teacher/courses", icon: GraduationCap, tone: "amber" },
    { label: "Quiz attempts", value: stats?.recent_attempts?.length || 0, href: "/dashboard/teacher/quizzes", icon: ClipboardList, tone: "violet" },
    { label: "Active classes", value: stats?.active_classes || 0, href: "/dashboard/teacher/online-classes", icon: Video, tone: "emerald" },
  ], [stats]);

  if (isLoading || !user) {
    return <div className="h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-primary/80 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-emerald-200 mb-4">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Instructor workspace active
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back, {user.full_name}</h1>
            <p className="mt-2 max-w-2xl text-[13px] sm:text-sm text-slate-300">Manage courses, monitor student progress, and organize your teaching work from one place.</p>
          </div>
          <button onClick={() => loadDashboard(user.id, true)} disabled={isRefreshing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-[12px] font-semibold hover:bg-white/15 disabled:opacity-60 transition-colors shrink-0">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh overview
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map(({ key, label, helper, icon: Icon, color, currency }) => (
          <div key={key} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p><p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{currency ? `LKR ${Number(stats?.[key] || 0).toLocaleString()}` : Number(stats?.[key] || 0).toLocaleString()}</p><p className="mt-1 text-[11px] text-slate-400">{helper}</p></div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorStyles[color]}`}><Icon className="w-5 h-5" /></div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"><div><h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Teaching overview</h2><p className="text-[11px] text-slate-500 mt-0.5">Your current learning workload</p></div><GraduationCap className="w-5 h-5 text-primary" /></div>
          <div className="grid sm:grid-cols-2">
            {overviewItems.map(({ label, value, href, icon: Icon, tone }, index) => (
              <Link key={label} href={href} className={`group flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${index % 2 === 0 ? "sm:border-r border-slate-100 dark:border-slate-800" : ""} ${index < 2 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorStyles[tone]}`}><Icon className="w-5 h-5" /></div>
                <div className="flex-1"><p className="text-[12px] text-slate-500 dark:text-slate-400">{label}</p><p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p></div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4"><div><h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Quick actions</h2><p className="text-[11px] text-slate-500 mt-0.5">Common teaching tasks</p></div><ClipboardList className="w-5 h-5 text-slate-400" /></div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ label, href, icon: Icon }) => <Link key={label} href={href} className="group rounded-xl border border-slate-200 dark:border-slate-700 p-3 hover:border-primary/40 hover:bg-primary/[0.035] transition-colors"><Icon className="w-4 h-4 text-primary mb-2" /><span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-primary">{label}</span></Link>)}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"><div><h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Recent quiz attempts</h2><p className="text-[11px] text-slate-500 mt-0.5">Latest submissions from your students</p></div><Link href="/dashboard/teacher/quizzes" className="text-[11px] font-semibold text-primary hover:underline">View quizzes</Link></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Quiz</th><th className="px-5 py-3">Submitted</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(stats?.recent_attempts || []).map((attempt) => (
                <tr key={attempt.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5"><div className="flex items-center gap-3">{attempt.users?.profile_picture ? <img src={attempt.users.profile_picture.startsWith("http") ? attempt.users.profile_picture : `${BASE_URL}${attempt.users.profile_picture.startsWith("/") ? "" : "/"}${attempt.users.profile_picture}`} alt={attempt.users.full_name || "Student"} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{attempt.users?.full_name?.substring(0, 2).toUpperCase() || "ST"}</div>}<span className="text-[13px] font-semibold text-slate-800 dark:text-white">{attempt.users?.full_name || "Unknown student"}</span></div></td>
                  <td className="px-5 py-3.5 text-[12px] text-slate-600 dark:text-slate-300">{attempt.quizzes?.title || "Unknown quiz"}</td>
                  <td className="px-5 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">{new Date(attempt.submitted_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-5 py-3.5 text-[13px] font-bold text-slate-900 dark:text-white">{attempt.score}</td>
                  <td className="px-5 py-3.5"><span className="rounded-full px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Completed</span></td>
                </tr>
              ))}
              {(!stats?.recent_attempts || stats.recent_attempts.length === 0) && <tr><td colSpan="5" className="p-10 text-center text-[12px] text-slate-500">No recent quiz attempts found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
