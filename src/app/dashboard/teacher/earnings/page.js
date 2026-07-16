"use client";

import { useEffect, useState } from "react";
import { DollarSign, BookOpen, ClipboardList, RefreshCw, AlertCircle, TrendingUp } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function TeacherEarningsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.role !== "teacher") {
          router.push("/login");
        } else {
          setUser(parsed);
          loadEarnings(parsed.id);
        }
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  const loadEarnings = async (teacherId) => {
    setIsLoading(true);
    const res = await fetchApi(`/teacher/earnings?teacher_id=${teacherId}`);
    setIsLoading(false);
    if (res.success) {
      setData(res);
    } else {
      setErrorMsg(res.message || "Failed to load earnings data.");
    }
  };

  if (!user || isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 dark:border-red-900/50 text-red-600 rounded-xl flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        {errorMsg}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-[22px] font-bold text-slate-800 dark:text-white tracking-tight">Revenue & Earnings</h1>
        <p className="text-[13px] text-gray-500 dark:text-white mt-1">Track your financial performance from courses and exams.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm flex items-start justify-between relative overflow-hidden group hover:border-blue-300 transition-colors">
          <div className="relative z-10">
            <p className="text-[12px] font-bold text-gray-400 dark:text-white uppercase tracking-wider">Total Earnings</p>
            <h3 className="text-[28px] font-black text-slate-800 dark:text-white mt-2">
              LKR {data?.summary?.total_earnings?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0 relative z-10 transition-transform group-hover:scale-110">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <div className="absolute -bottom-6 -right-6 text-blue-50/50 transition-transform group-hover:scale-110">
            <TrendingUp className="w-32 h-32" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm flex items-start justify-between group hover:border-emerald-300 transition-colors">
          <div>
            <p className="text-[12px] font-bold text-gray-400 dark:text-white uppercase tracking-wider">Course Revenue</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-2">
              LKR {data?.summary?.course_earnings?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
            <BookOpen className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm flex items-start justify-between group hover:border-amber-300 transition-colors">
          <div>
            <p className="text-[12px] font-bold text-gray-400 dark:text-white uppercase tracking-wider">Exam Revenue</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-2">
              LKR {data?.summary?.exam_earnings?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
            <ClipboardList className="w-5 h-5 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Breakdown Table */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-[14px] text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" /> Course Earnings Breakdown
            </h3>
          </div>
          <div className="flex-1 p-0 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white dark:bg-[#1e293b] border-b border-gray-100 dark:border-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-white uppercase tracking-wider">Course Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-white uppercase tracking-wider text-right">Price</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-white uppercase tracking-wider text-right">Enrollments</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-white uppercase tracking-wider text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                {data?.course_breakdown && data.course_breakdown.length > 0 ? (
                  data.course_breakdown.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-[13px] text-slate-800 dark:text-white font-bold truncate max-w-[200px]">{c.title}</td>
                      <td className="px-6 py-4 text-[13px] text-gray-500 dark:text-white text-right">LKR {parseFloat(c.price).toFixed(2)}</td>
                      <td className="px-6 py-4 text-[13px] text-gray-500 dark:text-white text-right font-medium">{c.enrollments}</td>
                      <td className="px-6 py-4 text-[13px] text-emerald-600 font-bold text-right">
                        LKR {parseFloat(c.total_earned).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-[13px] text-gray-400 dark:text-white font-medium">No course earnings yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exam Breakdown Table */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-[14px] text-slate-800 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-600" /> Exam Earnings Breakdown
            </h3>
          </div>
          <div className="flex-1 p-0 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white dark:bg-[#1e293b] border-b border-gray-100 dark:border-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-white uppercase tracking-wider">Exam Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-white uppercase tracking-wider text-right">Fee</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-white uppercase tracking-wider text-right">Unlocks</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-white uppercase tracking-wider text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                {data?.exam_breakdown && data.exam_breakdown.length > 0 ? (
                  data.exam_breakdown.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-[13px] text-slate-800 dark:text-white font-bold truncate max-w-[200px]">{e.title}</td>
                      <td className="px-6 py-4 text-[13px] text-gray-500 dark:text-white text-right">LKR {parseFloat(e.fee).toFixed(2)}</td>
                      <td className="px-6 py-4 text-[13px] text-gray-500 dark:text-white text-right font-medium">{e.unlocks}</td>
                      <td className="px-6 py-4 text-[13px] text-amber-600 font-bold text-right">
                        LKR {parseFloat(e.total_earned).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-[13px] text-gray-400 dark:text-white font-medium">No exam earnings yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
