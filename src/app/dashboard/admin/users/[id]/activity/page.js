"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Loader2, ArrowLeft, Activity, Calendar, CreditCard, PlayCircle, LogIn } from "lucide-react";

export default function UserActivityPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [activities, setActivities] = useState({
    logs: [],
    quizzes: [],
    payments: [],
    courses: []
  });

  useEffect(() => {
    if (!userId) return;

    const loadActivity = async () => {
      setIsLoading(true);
      const data = await fetchApi(`/user/get_activity?id=${userId}`);
      if (data.success) {
        setUserData(data.user);
        setActivities({
          logs: data.logs || [],
          quizzes: data.quizzes || [],
          payments: data.payments || [],
          courses: data.courses || []
        });
      }
      setIsLoading(false);
    };

    loadActivity();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>User not found or unable to load activity.</p>
        <button onClick={() => router.back()} className="mt-4 text-primary hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            User Activity: {userData.full_name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {userData.email || userData.phone_number} • {userData.role.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* System Logs */}
        <section className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center gap-2 bg-gray-50/50 dark:bg-slate-800/30">
            <LogIn className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Recent System Logs</h3>
          </div>
          <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
            {activities.logs.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent system logs found.</p>
            ) : (
              activities.logs.map((log, i) => (
                <div key={i} className="flex gap-3 text-sm border-b border-gray-100 dark:border-slate-800/50 pb-2 last:border-0">
                  <div className="min-w-[120px] text-xs text-gray-500 pt-0.5">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{log.action}</p>
                    {log.details && <p className="text-xs text-gray-500 mt-1">{log.details}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">IP: {log.ip_address || 'Unknown'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Quiz Attempts */}
        <section className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center gap-2 bg-gray-50/50 dark:bg-slate-800/30">
            <PlayCircle className="w-4 h-4 text-purple-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Quiz Attempts</h3>
          </div>
          <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
            {activities.quizzes.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No quiz attempts found.</p>
            ) : (
              activities.quizzes.map((quiz, i) => (
                <div key={i} className="flex gap-3 text-sm border-b border-gray-100 dark:border-slate-800/50 pb-2 last:border-0 justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{quiz.quizzes?.title || 'Unknown Quiz'}</p>
                    <p className="text-xs text-gray-500">{new Date(quiz.started_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary">Score: {quiz.score}</span>
                    <p className="text-xs text-gray-400">{quiz.is_submitted ? 'Completed' : 'In Progress'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Payments */}
        <section className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center gap-2 bg-gray-50/50 dark:bg-slate-800/30">
            <CreditCard className="w-4 h-4 text-green-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Recent Payments</h3>
          </div>
          <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
            {activities.payments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No payments found.</p>
            ) : (
              activities.payments.map((payment, i) => (
                <div key={i} className="flex gap-3 text-sm border-b border-gray-100 dark:border-slate-800/50 pb-2 last:border-0 justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      {payment.quizzes ? \`Quiz: \${payment.quizzes.title}\` : 'Payment'}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(payment.paid_at).toLocaleString()}</p>
                  </div>
                  <div className="font-bold text-green-600">
                    Rs. {payment.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Course Enrollments */}
        <section className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center gap-2 bg-gray-50/50 dark:bg-slate-800/30">
            <Calendar className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Course Enrollments</h3>
          </div>
          <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
            {activities.courses.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No course enrollments found.</p>
            ) : (
              activities.courses.map((enrollment, i) => (
                <div key={i} className="flex gap-3 text-sm border-b border-gray-100 dark:border-slate-800/50 pb-2 last:border-0 justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{enrollment.courses?.title || 'Unknown Course'}</p>
                    <p className="text-xs text-gray-500">Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
