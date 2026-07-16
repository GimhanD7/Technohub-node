"use client";

import { useEffect, useState } from "react";
import { Shield, Database, Users, Activity, TrendingUp, MoreVertical, BookOpen, GraduationCap, DollarSign, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

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
    return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner Area */}
      <div className="text-center py-4 mb-2">
         <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-full text-[11px] font-medium text-gray-500 dark:text-white mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            System Live & Online
         </div>
         <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white mb-2 tracking-tight">Techno-Hub Admin Dashboard</h1>
         <p className="text-[13px] text-gray-500 dark:text-white max-w-xl mx-auto">Welcome back, {user.full_name}. Here is what's happening on your platform today.</p>
      </div>

      {/* Top Cards (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Students */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Total Students</h3>
              <GraduationCap className="w-[18px] h-[18px] text-gray-400 dark:text-white" />
           </div>
           
           {/* Visual Chart Bars (Mock) */}
           <div className="flex items-end justify-between gap-1 h-12 mb-4">
              <div className="w-full bg-blue-500 rounded-sm h-[40%]"></div>
              <div className="w-full bg-blue-500 rounded-sm h-[50%]"></div>
              <div className="w-full bg-blue-500 rounded-sm h-[60%]"></div>
              <div className="w-full bg-blue-500 rounded-sm h-[80%]"></div>
              <div className="w-full bg-blue-500 rounded-sm h-[100%]"></div>
              <div className="w-full bg-blue-500 rounded-sm h-[70%]"></div>
           </div>
           
           <div className="flex items-end justify-between">
              <div>
                 <p className="text-[11px] text-gray-400 dark:text-white mb-1">Total</p>
                 <h2 className="text-[20px] font-semibold text-slate-800 dark:text-white tracking-tight">{stats?.total_students || 0} students</h2>
              </div>
           </div>
           
           <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white text-center">
             Registered on the platform
           </div>
        </div>

        {/* Card 2: Active Teachers */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Active Teachers</h3>
              <Users className="w-[18px] h-[18px] text-gray-400 dark:text-white" />
           </div>
           
           <h2 className="text-[28px] font-semibold text-slate-800 dark:text-white tracking-tight leading-none mb-1">{stats?.active_teachers || 0}</h2>
           <p className="text-[11px] text-gray-400 dark:text-white mb-4">Currently active</p>
           
           <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
             <div className="bg-blue-600 h-2.5 rounded-full w-[100%]"></div>
           </div>
           
           <div className="flex justify-between text-[11px] text-gray-500 dark:text-white mb-2">
             <div>
               <p className="mb-0.5">Assigned</p>
               <span className="font-semibold text-slate-800 dark:text-white text-[12px]">To Courses</span>
             </div>
           </div>
           
           <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white text-center">
             Managing the courses
           </div>
        </div>

        {/* Card 3: Total Courses */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Total Courses</h3>
              <BookOpen className="w-[18px] h-[18px] text-gray-400 dark:text-white" />
           </div>
           
           {/* Visual mock chart */}
           <div className="flex justify-center items-center h-[90px] mb-4">
              <div className="w-[88px] h-[88px] rounded-full overflow-hidden flex relative" style={{ background: 'conic-gradient(#3b82f6 0% 40%, #10b981 40% 65%, #f43f5e 65% 85%, #6366f1 85% 100%)' }}>
                 <div className="absolute inset-2 bg-white dark:bg-[#1e293b] rounded-full flex items-center justify-center">
                   <span className="font-bold text-xl text-slate-800 dark:text-white">{stats?.total_courses || 0}</span>
                 </div>
              </div>
           </div>
           
           <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white text-center">
             Available to students
           </div>
        </div>

        {/* Card 4: Total Revenue */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Total Revenue</h3>
              <DollarSign className="w-[18px] h-[18px] text-gray-400 dark:text-white" />
           </div>
           
           {/* Mock line chart */}
           <div className="h-12 mb-4 relative overflow-hidden">
             <div className="absolute bottom-0 w-full h-8 bg-blue-50"></div>
             <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,80 Q25,70 50,60 T100,30 L100,100 L0,100 Z" fill="#eff6ff" />
                <path d="M0,80 Q25,70 50,60 T100,30" fill="none" stroke="#3b82f6" strokeWidth="2" />
             </svg>
           </div>
           
           <div className="flex items-end justify-between">
              <div>
                 <p className="text-[11px] text-gray-400 dark:text-white mb-1">Total Wallets</p>
                 <h2 className="text-[18px] font-semibold text-slate-800 dark:text-white tracking-tight">LKR {parseFloat(stats?.total_revenue || 0).toLocaleString()}</h2>
              </div>
           </div>
           
           <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white text-center">
             Lifetime approved top-ups
           </div>
        </div>

      </div>

      {/* Bottom Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Table (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[14px] font-bold text-slate-800 dark:text-white">Recent Registrations</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-400 dark:text-white">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-600 dark:text-white">
                {stats?.recent_users?.map((u, i) => (
                  <tr key={u.id || i} className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50">
                    <td className="py-3.5 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        u.role === 'admin' ? 'bg-rose-100 text-rose-600' :
                        u.role === 'teacher' ? 'bg-purple-100 text-purple-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {u.full_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{u.full_name}</p>
                        <p className="text-[11px] text-gray-400 dark:text-white">{u.index_number || u.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 capitalize">{u.role}</td>
                    <td className="py-3.5 text-[12px]">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5">
                      <span className={`flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-white`}>
                        <span className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stats?.recent_users || stats.recent_users.length === 0) && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">No recent users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
        </div>

        {/* Right Details Panel (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-6">
             <h3 className="text-[14px] font-bold text-slate-800 dark:text-white mb-6">User Roles Summary</h3>
             <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 text-[9px] uppercase tracking-wider text-gray-400 dark:text-white">
                  <th className="pb-2 font-semibold">Role</th>
                  <th className="pb-2 font-semibold text-right">Count</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-slate-600 dark:text-white">
                {stats?.role_summary?.map((roleStat, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-slate-800/50">
                    <td className="py-3 capitalize">{roleStat.role}</td>
                    <td className="py-3 text-right text-slate-800 dark:text-white font-medium">{roleStat.count}</td>
                  </tr>
                ))}
                {(!stats?.role_summary || stats.role_summary.length === 0) && (
                  <tr>
                    <td colSpan="2" className="py-4 text-center text-gray-500">No data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className="text-[10px] text-gray-400 dark:text-white text-right mt-3">Updated just now</p>
          </div>
        </div>

      </div>

    </div>
  );
}
