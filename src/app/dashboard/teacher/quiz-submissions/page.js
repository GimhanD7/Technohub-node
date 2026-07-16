"use client";

import { Fragment, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { BarChart3, Users, TrendingUp, Clock, Medal, ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";

export default function TeacherQuizSubmissions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedAttemptId, setExpandedAttemptId] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    
    const parsedUser = JSON.parse(savedUser);
    if (parsedUser.role !== "teacher") {
      router.push("/dashboard");
      return;
    }
    
    setUser(parsedUser);

    const loadQuizId = async () => {
      try {
        const id = searchParams?.get("id");
        if (id) {
          setQuizId(parseInt(id));
          await loadSubmissions(parseInt(id), parsedUser);
        } else {
          setError("Quiz ID is required to view submissions.");
          setIsLoading(false);
        }
      } catch (err) {
        setError("Failed to load quiz ID from URL");
        setIsLoading(false);
      }
    };

    loadQuizId();
  }, [searchParams, router]);

  const loadSubmissions = async (id, currentUser) => {
    setIsLoading(true);
    setError("");
    
    const data = await fetchApi(`/quiz/submissions?quizId=${id}&userId=${currentUser.id}&role=${currentUser.role}`);
    setIsLoading(false);
    
    if (data.success) {
      setQuiz(data.quiz);
      setSubmissions(data.submissions);
      setStats(data.statistics);
      setQuestions(data.questions || []);
    } else {
      setError(data.message || "Failed to load submissions.");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12">
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-white">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
          <p>Loading quiz submissions...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !stats) {
    return (
      <div className="max-w-7xl mx-auto py-12">
        <div className="p-6 bg-red-50 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{error || "Quiz not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-white" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{quiz.title}</h1>
          <p className="text-sm text-slate-500 dark:text-white mt-1">
            Quiz ID: {quiz.id} • Max Marks: {submissions[0]?.answers ? Object.keys(submissions[0].answers).length : 0}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-white">Total Submissions</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.totalSubmissions}</p>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-white">Average Score</h3>
            <BarChart3 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.averageScore}</p>
          <p className="text-xs text-slate-500 dark:text-white mt-1">{stats.averagePercentage}%</p>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-white">Highest Score</h3>
            <Medal className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">
            {submissions.length > 0 ? submissions[0].score : "N/A"}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-white">Quiz Duration</h3>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-sm text-slate-800 dark:text-white">
            {quiz.startTime?.split(" ")[0]} to {quiz.endTime?.split(" ")[0]}
          </p>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-white uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-white uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-white uppercase tracking-wider">Index</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-white uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-white uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-white uppercase tracking-wider">%</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-white uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 dark:text-white uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, idx) => (
                <Fragment key={sub.attemptId}>
                  <tr className="border-b border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-primary/10 text-primary font-bold text-sm rounded-full">
                        {sub.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800 dark:text-white">{sub.fullName}</p>
                      <p className="text-xs text-slate-500 dark:text-white">{sub.role}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-white">{sub.indexNumber}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-white">{sub.phone}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-slate-800 dark:text-white">{sub.score}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${sub.percentage >= 70 ? "text-green-600" : sub.percentage >= 50 ? "text-amber-600" : "text-red-600"}`}>
                        {sub.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-white">
                      {Math.floor(sub.timeTaken / 60)}m {sub.timeTaken % 60}s
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setExpandedAttemptId(expandedAttemptId === sub.attemptId ? null : sub.attemptId)}
                        className="px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        {expandedAttemptId === sub.attemptId ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Answer Details */}
                  {expandedAttemptId === sub.attemptId && (
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                      <td colSpan="8" className="px-6 py-4">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-800 dark:text-white">Student Answers:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(sub.answers).map(([qId, optionIds]) => {
                              const question = questions.find(q => q.id == qId);
                              return (
                                <div key={qId} className="bg-white dark:bg-[#1e293b] p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 text-sm shadow-sm space-y-2">
                                  <p className="font-semibold text-slate-800 dark:text-white">
                                    {question ? question.text : `Question ${qId}`}
                                  </p>
                                  {question?.imageUrl && (
                                    <div className="my-2 max-w-xs rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                      <img src={question.imageUrl} alt="Question" className="max-h-24 object-contain mx-auto" />
                                    </div>
                                  )}
                                  <div className="text-xs text-slate-600 dark:text-white bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50">
                                    <p className="font-medium">Selected Options: <span className="font-mono text-primary font-bold">{optionIds.join(", ")}</span></p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-white">
                            Submitted: {new Date(sub.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {submissions.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-white">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No submissions yet for this quiz.</p>
          </div>
        )}
      </div>

    </div>
  );
}




