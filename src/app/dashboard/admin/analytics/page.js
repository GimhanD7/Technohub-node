"use client";

import { useState, useEffect } from "react";
import { Check, Clock, TrendingUp, DollarSign, Users, BookOpen, Activity, BarChart3, Target, FileText } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function AdminAnalyticsPage() {
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) {
      setAdmin(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (admin) {
      fetchStats();
    }
  }, [admin]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/analytics/dashboard?role=admin`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        toast.error("Failed to load analytics data.");
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
      toast.error("Network error while fetching analytics.");
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-sm">
          <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      
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
                    <RechartsTooltip content={<CustomTooltip />} />
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
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.userRoleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.userRoleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Course Categories Bar Chart */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Top Course Categories</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Distribution of courses by subject</p>
              </div>
              <div className="h-64 w-full">
                {stats.courseCategories && stats.courseCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.courseCategories} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Courses" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {stats.courseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
                    No course data available.
                  </div>
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
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="total" name="Total Revenue (LKR)" fill="#10b981" radius={[0, 4, 4, 0]}>
                        {stats.gradeTrend.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
                    No grade revenue data available.
                  </div>
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
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        labelLine={true}
                        label={({ name, percent }) => `${name.length > 10 ? name.substring(0, 10)+'...' : name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {stats.systemActions.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
                    No system logs available.
                  </div>
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
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Total Attempts" fill="#f43f5e" radius={[0, 4, 4, 0]}>
                        {stats.topQuizzes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
                    No quiz data available.
                  </div>
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
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        labelLine={true}
                        label={({ name, percent }) => `${name.length > 15 ? name.substring(0, 15)+'...' : name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {stats.ebookSubjects.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
                    No E-Book data available.
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
}
