"use client";

import { useEffect, useState } from "react";
import { BookOpen, Users, GraduationCap, ClipboardList, TrendingUp } from "lucide-react";

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner Area */}
      <div className="text-center py-4 mb-2">
         <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-full text-[11px] font-medium text-gray-500 dark:text-white mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Instructor View Active
         </div>
         <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white mb-2 tracking-tight">The Ultimate Teaching Dashboard</h1>
         <p className="text-[13px] text-gray-500 dark:text-white max-w-xl mx-auto">Manage your classes, track student progress, and grade assignments efficiently through our new structured interface.</p>
      </div>

      {/* Top Cards (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Total Students</h3>
              <Users className="w-[18px] h-[18px] text-gray-400 dark:text-white" />
           </div>
           
           <h2 className="text-[28px] font-semibold text-slate-800 dark:text-white tracking-tight leading-none mb-1">156</h2>
           <p className="text-[11px] text-gray-400 dark:text-white mb-4">Across all classes</p>
           
           <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white">
             Enrollment up <span className="font-medium text-green-600">8% this semester</span>
           </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Active Courses</h3>
              <BookOpen className="w-[18px] h-[18px] text-gray-400 dark:text-white" />
           </div>
           
           <div className="flex items-end justify-between mb-2">
              <h2 className="text-[28px] font-semibold text-slate-800 dark:text-white tracking-tight leading-none">4</h2>
           </div>
           
           <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white text-center">
             2 courses pending publication
           </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Assignments to Grade</h3>
              <ClipboardList className="w-[18px] h-[18px] text-gray-400 dark:text-white" />
           </div>
           
           <h2 className="text-[28px] font-semibold text-slate-800 dark:text-white tracking-tight leading-none mb-1">32</h2>
           <p className="text-[11px] text-yellow-500 mb-4 font-medium">Requires attention</p>
           
           <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white text-center">
             Avg. grading time: <span className="font-medium text-slate-800 dark:text-white">48 hrs</span>
           </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Class Average</h3>
              <GraduationCap className="w-[18px] h-[18px] text-gray-400 dark:text-white" />
           </div>
           
           <div className="flex items-end justify-between">
              <div>
                 <p className="text-[11px] text-gray-400 dark:text-white mb-1">Current</p>
                 <h2 className="text-[20px] font-semibold text-slate-800 dark:text-white tracking-tight">B+ (86%)</h2>
              </div>
              <div className="text-right">
                 <p className="text-[11px] text-gray-400 dark:text-white mb-1">Last Term</p>
                 <p className="text-[13px] font-medium text-slate-800 dark:text-white">82% <TrendingUp className="inline w-3 h-3 text-green-500" /></p>
              </div>
           </div>
           
           <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 text-[11px] text-gray-500 dark:text-white text-center">
             Overall performance is strong
           </div>
        </div>

      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[14px] font-bold text-slate-800 dark:text-white">Recent Assignments Submitted</h3>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-400 dark:text-white">
              <th className="pb-3 font-semibold">Student</th>
              <th className="pb-3 font-semibold">Course</th>
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Score</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-slate-600 dark:text-white">
             <tr className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50">
                <td className="py-3.5">Mark Johnson</td>
                <td className="py-3.5">Advanced Mathematics</td>
                <td className="py-3.5 text-[12px]">Today, 10:30 AM</td>
                <td className="py-3.5 font-medium text-slate-800 dark:text-white">92/100</td>
                <td className="py-3.5"><span className="flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-white"><span className="w-2 h-2 rounded-full bg-green-500"></span> Graded</span></td>
             </tr>
             <tr className="border-b border-gray-100 dark:border-slate-800/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50">
                <td className="py-3.5">Emily Chen</td>
                <td className="py-3.5">Physics 101</td>
                <td className="py-3.5 text-[12px]">Yesterday</td>
                <td className="py-3.5 text-gray-400 dark:text-white">-</td>
                <td className="py-3.5"><span className="flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-white"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Needs Grading</span></td>
             </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
