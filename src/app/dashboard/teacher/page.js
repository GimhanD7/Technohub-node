"use client";

import { useEffect, useState } from "react";
import { BookOpen, Users, GraduationCap, ClipboardList, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";

export default function TeacherDashboard() {
   const [user, setUser] = useState(null);
   const [stats, setStats] = useState({
      total_students: 0,
      active_courses: 0,
      total_courses: 0,
      total_quizzes: 0,
      total_earnings: 0,
      recent_attempts: []
   });
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (savedUser) {
         const parsedUser = JSON.parse(savedUser);
         setUser(parsedUser);
         fetchDashboardStats(parsedUser.id);
      } else {
         setLoading(false);
      }
   }, []);

   const fetchDashboardStats = async (teacherId) => {
      try {
         const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
         const res = await fetch(`${API_URL}/teacher/dashboard?teacher_id=${teacherId}`);
         const data = await res.json();
         if (data.success) {
            setStats(data.stats);
         }
      } catch (error) {
         console.error("Error fetching stats:", error);
      } finally {
         setLoading(false);
      }
   };

   if (!user) return null;

   return (
      <div className="max-w-7xl mx-auto space-y-6">

         {/* Top Banner Area */}
         <div className="text-center py-6 mb-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-full text-[11px] font-medium text-gray-500 dark:text-white mb-5 shadow-sm">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
               </span>
               Instructor View Active
            </div>
            <h1 className="text-[24px] md:text-[28px] font-bold text-slate-800 dark:text-white mb-2 tracking-tight">
               {(() => {
                  const hour = new Date().getHours();
                  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
                  const firstName = (user?.full_name || "").split(" ")[0];
                  return firstName ? `${greeting}, ${firstName}` : greeting;
               })()}
            </h1>
            <p className="text-[13px] text-gray-500 dark:text-white max-w-xl mx-auto">Manage your classes, track student progress, and grade assignments efficiently through our new structured interface.</p>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
               { label: "My Courses", helper: "Build course content", href: "/dashboard/teacher/courses", icon: BookOpen, tone: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
               { label: "Quiz Management", helper: "Create and review", href: "/dashboard/teacher/quizzes", icon: ClipboardList, tone: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
               { label: "Online Classes", helper: "Manage live teaching", href: "/dashboard/teacher/online-classes", icon: GraduationCap, tone: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
               { label: "Earnings", helper: "View performance", href: "/dashboard/teacher/earnings", icon: TrendingUp, tone: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
            ].map(({ label, helper, href, icon: Icon, tone, bg }) => (
               <Link key={label} href={href} className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 transition-all flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${bg} ${tone} flex items-center justify-center shrink-0`}><Icon className="w-4 h-4" /></div>
                  <div className="min-w-0"><p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{label}</p><p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{helper}</p></div>
               </Link>
            ))}
         </div>

         {/* Top Cards (4 cols) */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Card 1 */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
               <div className="flex justify-between items-start mb-4">
                  <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Total Students</h3>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                     <Users className="w-[18px] h-[18px] text-blue-500" />
                  </div>
               </div>

               <h2 className="text-[28px] font-semibold text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                  {loading ? "..." : stats.total_students}
               </h2>
               <p className="text-[11px] text-gray-400 dark:text-white mb-4">Across all classes</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
               <div className="flex justify-between items-start mb-4">
                  <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Active Courses</h3>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                     <BookOpen className="w-[18px] h-[18px] text-indigo-500" />
                  </div>
               </div>

               <div className="flex items-end justify-between mb-2">
                  <h2 className="text-[28px] font-semibold text-slate-800 dark:text-white tracking-tight leading-none">
                     {loading ? "..." : stats.active_courses}
                  </h2>
               </div>

               <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white text-center">
                  {loading ? "..." : (stats.total_courses - stats.active_courses)} courses pending
               </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
               <div className="flex justify-between items-start mb-4">
                  <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Total Quizzes</h3>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                     <ClipboardList className="w-[18px] h-[18px] text-amber-500" />
                  </div>
               </div>

               <h2 className="text-[28px] font-semibold text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                  {loading ? "..." : stats.total_quizzes}
               </h2>
               <p className="text-[11px] text-amber-500 mb-4 font-medium">Created by you</p>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
               <div className="flex justify-between items-start mb-4">
                  <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Total Earnings</h3>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                     <DollarSign className="w-[18px] h-[18px] text-emerald-500" />
                  </div>
               </div>

               <div className="flex items-end justify-between">
                  <div>
                     <p className="text-[11px] text-gray-400 dark:text-white mb-1">Net Earnings</p>
                     <h2 className="text-[20px] font-semibold text-slate-800 dark:text-white tracking-tight">
                        {loading ? "..." : `Rs. ${Number(stats.total_earnings).toLocaleString()}`}
                     </h2>
                  </div>
               </div>
            </div>

         </div>

         <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-[14px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-500" />
                  Recent Quiz Attempts
               </h3>
            </div>

            <div className="overflow-x-auto -mx-2">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-400 dark:text-white">
                        <th className="pb-3 px-2 font-semibold">Student</th>
                        <th className="pb-3 px-2 font-semibold">Quiz</th>
                        <th className="pb-3 px-2 font-semibold">Date</th>
                        <th className="pb-3 px-2 font-semibold">Score</th>
                        <th className="pb-3 px-2 font-semibold">Status</th>
                     </tr>
                  </thead>
                  <tbody className="text-[13px] text-slate-600 dark:text-white">
                     {loading ? (
                        <tr>
                           <td colSpan="5" className="py-4 text-center text-sm text-gray-500">Loading...</td>
                        </tr>
                     ) : stats.recent_attempts.length === 0 ? (
                        <tr>
                           <td colSpan="5" className="py-4 text-center text-sm text-gray-500">No recent quiz attempts found.</td>
                        </tr>
                     ) : (
                        stats.recent_attempts.map((attempt) => (
                           <tr key={attempt.id} className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-3.5 px-2">
                                 <div className="flex items-center gap-2.5">
                                    {attempt.users?.profile_picture ? (
                                       <img 
                                          src={attempt.users.profile_picture.startsWith('http') 
                                             ? attempt.users.profile_picture 
                                             : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${attempt.users.profile_picture.startsWith('/') ? '' : '/'}${attempt.users.profile_picture}`
                                          } 
                                          alt={attempt.users.full_name} 
                                          className="w-7 h-7 rounded-full object-cover shadow-inner" 
                                       />
                                    ) : (
                                       <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 shrink-0 text-white flex items-center justify-center font-bold text-[11px] shadow-inner">
                                          {attempt.users?.full_name?.substring(0, 2).toUpperCase() || 'ST'}
                                       </div>
                                    )}
                                    <span className="font-medium text-slate-800 dark:text-white">{attempt.users?.full_name || 'Unknown'}</span>
                                 </div>
                              </td>
                              <td className="py-3.5 px-2">{attempt.quizzes?.title || 'Unknown Quiz'}</td>
                              <td className="py-3.5 px-2 text-[12px] text-slate-500 dark:text-slate-300 whitespace-nowrap">
                                 {new Date(attempt.submitted_at).toLocaleDateString()} {new Date(attempt.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3.5 px-2 font-bold text-slate-800 dark:text-white">{attempt.score}</td>
                              <td className="py-3.5 px-2">
                                 <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Completed
                                 </span>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
}
