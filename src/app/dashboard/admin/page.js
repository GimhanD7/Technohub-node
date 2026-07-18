"use client";

import { useEffect, useState } from "react";
import { Shield, Database, Users, Activity, TrendingUp, MoreVertical, BookOpen, GraduationCap, DollarSign, Loader2, ArrowUpRight } from "lucide-react";
import { fetchApi } from "@/lib/api";

/* ---------- shared style tokens ---------- */
const ACCENTS = {
  blue: { bar: "bg-blue-500", badgeBg: "bg-blue-50 dark:bg-blue-500/10", icon: "text-blue-600 dark:text-blue-400", fill: "#3b82f6" },
  emerald: { bar: "bg-emerald-500", badgeBg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-600 dark:text-emerald-400", fill: "#10b981" },
  violet: { bar: "bg-violet-500", badgeBg: "bg-violet-50 dark:bg-violet-500/10", icon: "text-violet-600 dark:text-violet-400", fill: "#8b5cf6" },
  amber: { bar: "bg-amber-500", badgeBg: "bg-amber-50 dark:bg-amber-500/10", icon: "text-amber-600 dark:text-amber-400", fill: "#f59e0b" },
  rose: { bar: "bg-rose-500", badgeBg: "bg-rose-50 dark:bg-rose-500/10", icon: "text-rose-600 dark:text-rose-400", fill: "#f43f5e" },
};

const ROLE_COLORS = {
  admin: "bg-rose-500",
  teacher: "bg-emerald-500",
  student: "bg-blue-500",
};

function StatCard({ accent, label, icon: Icon, footer, children }) {
  const c = ACCENTS[accent];
  return (
    <div className="group relative bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${c.bar}`} />
      <div className="p-5 pt-[22px]">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[10.5px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-[0.08em]">{label}</h3>
          <div className={`w-8 h-8 rounded-lg ${c.badgeBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${c.icon}`} strokeWidth={2.25} />
          </div>
        </div>

        {children}

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/70 text-[11px] text-gray-400 dark:text-slate-500 flex items-center justify-between">
          <span>{footer}</span>
          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const loadStats = async () => {
      const data = await fetchApi("/dashboard/admin_stats");
      if (data.success) {
        setStats(data.stats);
      }
      setIsLoading(false);
    };

    loadStats();
  }, []);

  if (!user || isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-[12px] font-mono text-gray-400 tracking-wide">loading_dashboard.exe</p>
      </div>
    );
  }

  const roleSummary = stats?.role_summary || [];
  const roleTotal = roleSummary.reduce((sum, r) => sum + (r.count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Top Banner Area */}
      <div className="relative text-center py-8 mb-2 rounded-2xl overflow-hidden bg-gradient-to-b from-blue-50/60 to-transparent dark:from-blue-500/[0.04] dark:to-transparent border border-blue-100/70 dark:border-slate-800">
        {/* dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "18px 18px",
            color: "#93c5fd",
            maskImage: "radial-gradient(ellipse 60% 100% at 50% 0%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 100% at 50% 0%, black 40%, transparent 100%)",
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-full text-[11px] font-medium font-mono text-gray-500 dark:text-slate-300 mb-4 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            system.status: online
          </div>
          <h1 className="text-[24px] font-semibold text-slate-800 dark:text-white mb-2 tracking-tight">Techno-Hub Admin Dashboard</h1>
          <p className="text-[13px] text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
            Welcome back, <span className="font-medium text-slate-700 dark:text-slate-200">{user.full_name}</span>. Here's what's happening on your platform today.
          </p>
        </div>
      </div>

      {/* Top Cards (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1: Total Students */}
        <StatCard accent="blue" label="Total Students" icon={GraduationCap} footer="Registered on the platform">
          <div className="flex items-end justify-between gap-1 h-12 mb-4">
            <div className="w-full bg-blue-500/80 rounded-sm h-[40%]"></div>
            <div className="w-full bg-blue-500/80 rounded-sm h-[50%]"></div>
            <div className="w-full bg-blue-500/80 rounded-sm h-[60%]"></div>
            <div className="w-full bg-blue-500/80 rounded-sm h-[80%]"></div>
            <div className="w-full bg-blue-500 rounded-sm h-[100%]"></div>
            <div className="w-full bg-blue-500/80 rounded-sm h-[70%]"></div>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-1">Total</p>
          <h2 className="text-[26px] font-bold font-mono text-slate-800 dark:text-white tracking-tight leading-none">
            {stats?.total_students || 0}
          </h2>
        </StatCard>

        {/* Card 2: Active Teachers */}
        <StatCard accent="emerald" label="Active Teachers" icon={Users} footer="Managing the courses">
          <h2 className="text-[30px] font-bold font-mono text-slate-800 dark:text-white tracking-tight leading-none mb-1">
            {stats?.active_teachers || 0}
          </h2>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-4">Currently active</p>

          <div className="w-full bg-emerald-100 dark:bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full w-full"></div>
          </div>

          <div className="flex justify-between text-[11px] text-gray-500 dark:text-slate-400">
            <span>Assigned</span>
            <span className="font-semibold text-slate-800 dark:text-white font-mono">to courses</span>
          </div>
        </StatCard>

        {/* Card 3: Total Courses */}
        <StatCard accent="violet" label="Total Courses" icon={BookOpen} footer="Available to students">
          <div className="flex justify-center items-center h-[90px] mb-1">
            <div
              className="w-[88px] h-[88px] rounded-full overflow-hidden flex relative"
              style={{ background: "conic-gradient(#8b5cf6 0% 40%, #10b981 40% 65%, #f43f5e 65% 85%, #3b82f6 85% 100%)" }}
            >
              <div className="absolute inset-2 bg-white dark:bg-[#1e293b] rounded-full flex items-center justify-center">
                <span className="font-bold font-mono text-xl text-slate-800 dark:text-white">{stats?.total_courses || 0}</span>
              </div>
            </div>
          </div>
        </StatCard>

        {/* Card 4: Total Revenue */}
        <StatCard accent="amber" label="Total Revenue" icon={DollarSign} footer="Lifetime approved top-ups">
          <div className="h-12 mb-4 relative overflow-hidden">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0,80 Q25,70 50,60 T100,30 L100,100 L0,100 Z" fill="#fef3c7" opacity="0.5" />
              <path d="M0,80 Q25,70 50,60 T100,30" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
            </svg>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-1">Total Wallets</p>
          <h2 className="text-[19px] font-bold font-mono text-slate-800 dark:text-white tracking-tight">
            LKR {parseFloat(stats?.total_revenue || 0).toLocaleString()}
          </h2>
        </StatCard>

      </div>

      {/* Bottom Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Table (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-white">Recent Registrations</h3>
            <span className="text-[10.5px] font-mono text-gray-400 dark:text-slate-500 uppercase tracking-wide">
              {stats?.recent_users?.length || 0} entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-600 dark:text-slate-300">
                {stats?.recent_users?.map((u, i) => (
                  <tr key={u.id || i} className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${u.role === 'admin' ? 'bg-rose-100 text-rose-600' :
                        u.role === 'teacher' ? 'bg-violet-100 text-violet-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                        {u.full_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{u.full_name}</p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">{u.index_number || u.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 capitalize">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${ROLE_COLORS[u.role] || "bg-gray-400"}`}></span>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 text-[12px] font-mono text-gray-500 dark:text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${u.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stats?.recent_users || stats.recent_users.length === 0) && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500 dark:text-slate-500">No recent users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Details Panel (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-white mb-6">User Roles Summary</h3>

            {roleSummary.length > 0 ? (
              <div className="space-y-4">
                {roleSummary.map((roleStat, i) => {
                  const pct = roleTotal > 0 ? Math.round((roleStat.count / roleTotal) * 100) : 0;
                  const color = ROLE_COLORS[roleStat.role] || "bg-gray-400";
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-[12px] capitalize text-slate-600 dark:text-slate-300">{roleStat.role}</span>
                        <span className="text-[13px] font-bold font-mono text-slate-800 dark:text-white">{roleStat.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${color} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500 dark:text-slate-500 text-[13px]">No data available.</p>
            )}

            <p className="text-[10px] text-gray-400 dark:text-slate-500 text-right mt-6 font-mono">updated just now</p>
          </div>
        </div>

      </div>

    </div>
  );
}