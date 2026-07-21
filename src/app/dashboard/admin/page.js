"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  GraduationCap,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  TriangleAlert,
  UserPlus,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { fetchApi } from "@/lib/api";

const metricCards = [
  { key: "total_students", label: "Students", helper: "Registered learners", icon: GraduationCap, color: "blue" },
  { key: "active_teachers", label: "Active teachers", helper: "Available instructors", icon: Users, color: "emerald" },
  { key: "total_courses", label: "Published courses", helper: "Currently active", icon: BookOpen, color: "violet" },
  { key: "total_revenue", label: "Approved revenue", helper: "Lifetime wallet credits", icon: CircleDollarSign, color: "amber", currency: true },
];

const colorStyles = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
};

const quickActions = [
  { label: "Add a teacher", href: "/dashboard/admin/teachers", icon: UserPlus },
  { label: "Build a course", href: "/dashboard/admin/courses", icon: BookOpen },
  { label: "Schedule a class", href: "/dashboard/admin/online-classes/create", icon: Video },
  { label: "Create a quiz", href: "/dashboard/admin/quizzes/create", icon: ClipboardList },
  { label: "Send notification", href: "/dashboard/admin/notifications", icon: Send },
  { label: "System settings", href: "/dashboard/admin/settings", icon: Settings },
];

function formatRelativeTime(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(value).toLocaleDateString();
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboard = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    const data = await fetchApi("/dashboard/admin_stats", { showToast: false });
    if (data.success) setStats(data.stats);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (savedUser) setUser(JSON.parse(savedUser));
      loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const attentionItems = useMemo(() => [
    { label: "Wallet approvals", value: stats?.pending_wallet_approvals || 0, href: "/dashboard/admin/wallet", icon: Wallet, tone: "amber" },
    { label: "Teacher messages", value: stats?.unresolved_teacher_messages || 0, href: "/dashboard/admin/teacher-messages", icon: MessageSquare, tone: "blue" },
    { label: "Upcoming classes", value: stats?.upcoming_classes || 0, href: "/dashboard/admin/online-classes", icon: Clock3, tone: "violet" },
    { label: "Active quizzes", value: stats?.active_quizzes || 0, href: "/dashboard/admin/quizzes", icon: ClipboardList, tone: "emerald" },
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
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Platform operational
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back, {user.full_name}</h1>
            <p className="mt-2 max-w-2xl text-[13px] sm:text-sm text-slate-300">Monitor learning operations, resolve pending work, and manage the platform from one place.</p>
          </div>
          <button onClick={() => loadDashboard(true)} disabled={isRefreshing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-[12px] font-semibold hover:bg-white/15 disabled:opacity-60 transition-colors shrink-0">
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
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"><div><h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Needs attention</h2><p className="text-[11px] text-slate-500 mt-0.5">Current operational workload</p></div><ShieldCheck className="w-5 h-5 text-primary" /></div>
          <div className="grid sm:grid-cols-2">
            {attentionItems.map(({ label, value, href, icon: Icon, tone }, index) => (
              <Link key={label} href={href} className={`group flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${index % 2 === 0 ? "sm:border-r border-slate-100 dark:border-slate-800" : ""} ${index < 2 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorStyles[tone]}`}><Icon className="w-5 h-5" /></div>
                <div className="flex-1"><p className="text-[12px] text-slate-500 dark:text-slate-400">{label}</p><p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p></div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
          <Link href="/dashboard/admin/sms-logs" className={`flex items-center gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 text-[12px] font-medium ${stats?.failed_sms_today > 0 ? "text-red-600 bg-red-50/60 dark:bg-red-950/10" : "text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/10"}`}>
            {stats?.failed_sms_today > 0 ? <TriangleAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {stats?.failed_sms_today > 0 ? `${stats.failed_sms_today} SMS deliveries failed today` : "No SMS delivery failures today"}
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4"><div><h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Quick actions</h2><p className="text-[11px] text-slate-500 mt-0.5">Common administration tasks</p></div><Bell className="w-5 h-5 text-slate-400" /></div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ label, href, icon: Icon }) => <Link key={label} href={href} className="group rounded-xl border border-slate-200 dark:border-slate-700 p-3 hover:border-primary/40 hover:bg-primary/[0.035] transition-colors"><Icon className="w-4 h-4 text-primary mb-2" /><span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-primary">{label}</span></Link>)}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.45fr_1fr] gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"><div><h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Recent registrations</h2><p className="text-[11px] text-slate-500 mt-0.5">Latest users joining the platform</p></div><Link href="/dashboard/admin/users" className="text-[11px] font-semibold text-primary hover:underline">View users</Link></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{(stats?.recent_users || []).map(person => <tr key={person.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"><td className="px-5 py-3.5"><p className="text-[13px] font-semibold text-slate-800 dark:text-white">{person.full_name}</p><p className="text-[10px] text-slate-400">{person.index_number || person.email || "No identifier"}</p></td><td className="px-5 py-3.5 text-[12px] capitalize text-slate-600 dark:text-slate-300">{person.role}</td><td className="px-5 py-3.5 text-[11px] text-slate-500">{new Date(person.created_at).toLocaleDateString()}</td><td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${person.status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-700"}`}>{person.status}</span></td></tr>)}</tbody></table></div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"><div><h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Recent activity</h2><p className="text-[11px] text-slate-500 mt-0.5">Latest audited system actions</p></div><Activity className="w-5 h-5 text-primary" /></div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">{(stats?.recent_activity || []).map(item => <div key={item.id} className="px-5 py-3.5 flex gap-3"><div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="text-[12px] font-semibold text-slate-800 dark:text-white truncate">{item.action}</p><span className="text-[10px] text-slate-400 whitespace-nowrap">{formatRelativeTime(item.created_at)}</span></div><p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.user_name}{item.details ? ` · ${item.details}` : ""}</p></div></div>)}{(!stats?.recent_activity || stats.recent_activity.length === 0) && <p className="p-8 text-center text-[12px] text-slate-500">No recent activity available.</p>}</div>
          <Link href="/dashboard/admin/history" className="flex items-center justify-center gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-primary hover:bg-primary/[0.035]">Open system history <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
      </section>
    </div>
  );
}
