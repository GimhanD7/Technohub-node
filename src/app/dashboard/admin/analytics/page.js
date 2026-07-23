"use client";

import { useState, useEffect } from "react";
import { Check, TrendingUp, DollarSign, Users, BookOpen, Activity, BarChart3, Target, FileText } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function shortenLabel(value, limit = 22) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

function LegendLabel({ value }) {
  return (
    <span title={value} className="text-xs font-medium capitalize text-slate-600 dark:text-slate-300">
      {shortenLabel(value)}
    </span>
  );
}

function EmptyChart({ icon: Icon, message }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center dark:border-slate-700 dark:bg-slate-900/30">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Analytics will appear here when data is available.</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-800">
        {label && <p className="mb-1 font-bold text-slate-800 dark:text-slate-100">{label}</p>}
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/dashboard?role=admin`);
        const data = await res.json();
        if (cancelled) return;

        if (data.success) {
          setStats(data.data);
        } else {
          toast.error("Failed to load analytics data.");
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to fetch stats", error);
        toast.error("Network error while fetching analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="analytics-page max-w-7xl mx-auto space-y-6 pb-12">
      
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Platform Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Detailed breakdown of platform revenue, users, courses, and system health.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : stats ? (
        <>
          {/* ROW 1: QUICK STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform"></div>
               <div className="flex justify-between items-start mb-2 relative">
                  <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Approved Revenue</h3>
                  <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
               </div>
               <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mt-4 relative">LKR {stats.thisMonthApproved.toFixed(0)}</h2>
               <p className="text-[10px] sm:text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1 relative">
                 <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> This Month
               </p>
            </div>
            
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform"></div>
               <div className="flex justify-between items-start mb-2 relative">
                  <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Users</h3>
                  <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
               </div>
               <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mt-4 relative">{stats.totalUsers}</h2>
               <p className="text-[10px] sm:text-xs text-blue-600 mt-2 font-medium flex items-center gap-1 relative">
                 Across all roles
               </p>
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-violet-50 rounded-full group-hover:scale-110 transition-transform"></div>
               <div className="flex justify-between items-start mb-2 relative">
                  <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Courses</h3>
                  <div className="p-2 bg-violet-100 rounded-lg shrink-0">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                  </div>
               </div>
               <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mt-4 relative">{stats.totalCourses}</h2>
               <p className="text-[10px] sm:text-xs text-violet-600 mt-2 font-medium flex items-center gap-1 relative">
                 {stats.totalModules} modules created
               </p>
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-110 transition-transform"></div>
               <div className="flex justify-between items-start mb-2 relative">
                  <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">System Logs</h3>
                  <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
                  </div>
               </div>
               <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mt-4 relative">{stats.totalLogs}</h2>
               <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium flex items-center gap-1 relative">
                 Recorded actions
               </p>
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-110 transition-transform"></div>
               <div className="flex justify-between items-start mb-2 relative">
                  <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Quizzes</h3>
                  <div className="p-2 bg-rose-100 rounded-lg shrink-0">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
                  </div>
               </div>
               <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mt-4 relative">{stats.totalQuizzes}</h2>
               <p className="text-[10px] sm:text-xs text-rose-600 mt-2 font-medium flex items-center gap-1 relative">
                 {stats.totalQuizAttempts} student attempts
               </p>
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-110 transition-transform"></div>
               <div className="flex justify-between items-start mb-2 relative">
                  <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total E-Books</h3>
                  <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  </div>
               </div>
               <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mt-4 relative">{stats.totalEbooks}</h2>
               <p className="text-[10px] sm:text-xs text-amber-600 mt-2 font-medium flex items-center gap-1 relative">
                 Library resources
               </p>
            </div>
          </div>

          {/* ROW 2: WALLET REVENUE (AREA CHART) */}
          {stats.monthlyTrend && stats.monthlyTrend.length > 0 && (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Monthly Revenue Trend</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Historical performance of approved wallet credits</p>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month_name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `LKR ${val}`} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      name="Revenue (LKR)"
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ROW 3: USERS & COURSES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* User Roles Pie Chart */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">User Demographics</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Distribution by account role</p>
              </div>
              <div className="h-72 w-full">
                {stats.userRoleDistribution && stats.userRoleDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.userRoleDistribution}
                        cx="50%"
                        cy="44%"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={4}
                        cornerRadius={5}
                        dataKey="value"
                        nameKey="name"
                        label={false}
                        stroke="none"
                      >
                        {stats.userRoleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={9}
                        formatter={(value) => <LegendLabel value={value} />}
                      />
                      <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-800 text-2xl font-bold dark:fill-slate-100">
                        {stats.totalUsers}
                      </text>
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-[10px] font-semibold uppercase tracking-wider dark:fill-slate-500">
                        Total users
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart icon={Users} message="No user demographic data available." />
                )}
              </div>
            </div>

            {/* Course Categories Bar Chart */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Top Course Categories</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Distribution of courses by subject</p>
              </div>
              <div className="h-72 w-full">
                {stats.courseCategories && stats.courseCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.courseCategories} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                      <Bar dataKey="value" name="Courses" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {stats.courseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart icon={BookOpen} message="No course category data available." />
                )}
              </div>
            </div>
            
          </div>

          {/* ROW 4: SYSTEM LOGS & GRADE REVENUE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Grade-wise Revenue Bar Chart */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Revenue by Education Category</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Approved wallet credits broken down by grade level</p>
              </div>
              <div className="h-64 w-full">
                {stats.gradeTrend && stats.gradeTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.gradeTrend} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis type="category" dataKey="grade_name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} dx={-10} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                      <Bar dataKey="total" name="Total Revenue (LKR)" fill="#10b981" radius={[0, 4, 4, 0]}>
                        {stats.gradeTrend.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart icon={BarChart3} message="No grade revenue data available." />
                )}
              </div>
            </div>

            {/* System Actions Pie Chart */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">System Activity</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Top 7 most frequent actions performed on the platform</p>
              </div>
              <div className="h-64 w-full">
                {stats.systemActions && stats.systemActions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.systemActions}
                        cx="32%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={82}
                        paddingAngle={2}
                        cornerRadius={3}
                        dataKey="value"
                        nameKey="name"
                        label={false}
                        stroke="none"
                      >
                        {stats.systemActions.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => <LegendLabel value={value} />}
                        wrapperStyle={{ width: '43%', lineHeight: '22px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart icon={Activity} message="No system activity data available." />
                )}
              </div>
            </div>

          </div>

          {/* ROW 5: QUIZZES & E-BOOKS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Quizzes Bar Chart */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Top Performing Quizzes</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Most attempted quizzes by students</p>
              </div>
              <div className="h-64 w-full">
                {stats.topQuizzes && stats.topQuizzes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.topQuizzes} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} dx={-10} width={100} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                      <Bar dataKey="value" name="Total Attempts" fill="#f43f5e" radius={[0, 4, 4, 0]}>
                        {stats.topQuizzes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart icon={Target} message="No quiz performance data available." />
                )}
              </div>
            </div>

            {/* E-Books by Subject Pie Chart */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">E-Book Library Distribution</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Resources broken down by subject</p>
              </div>
              <div className="h-64 w-full">
                {stats.ebookSubjects && stats.ebookSubjects.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.ebookSubjects}
                        cx="32%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={82}
                        paddingAngle={2}
                        cornerRadius={3}
                        dataKey="value"
                        nameKey="name"
                        label={false}
                        stroke="none"
                      >
                        {stats.ebookSubjects.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => <LegendLabel value={value} />}
                        wrapperStyle={{ width: '43%', lineHeight: '22px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart icon={FileText} message="No E-Book subject data available." />
                )}
              </div>
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
}
