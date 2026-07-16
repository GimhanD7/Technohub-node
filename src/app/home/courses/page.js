"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { fetchApi } from "@/lib/api";
import { Search, Loader2, BookOpen, Star, PlayCircle, CheckCircle, Image as ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { CustomDialog } from "@/components/ui/CustomDialog";

export default function CoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [enrollingId, setEnrollingId] = useState(null);
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    const parsed = savedUser ? JSON.parse(savedUser) : null;
    setUser(parsed);
    loadCourses(parsed?.id ?? null);
  }, []);

  const loadCourses = async (studentId) => {
    setIsLoading(true);
    const url = studentId
      ? `/student/get_all_courses?student_id=${studentId}`
      : `/student/get_all_courses`;
    const data = await fetchApi(url);
    if (data.success) {
      setCourses(data.courses || []);
    }
    setIsLoading(false);
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(["All"]);
    courses.forEach(course => {
      if (course.category) {
        cats.add(course.category);
      }
    });
    return Array.from(cats);
  }, [courses]);

  // Filtered courses (Search + Category)
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Category filter
    if (activeCategory !== "All") {
      result = result.filter(course => course.category === activeCategory);
    }

    // Search filter
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(lower) ||
          (c.teacher_name && c.teacher_name.toLowerCase().includes(lower)) ||
          (c.category && c.category.toLowerCase().includes(lower))
      );
    }

    return result;
  }, [courses, activeCategory, searchTerm]);

  const handleEnrollClick = async (course) => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (parseFloat(course.points) > 0) {
      const res = await fetchApi(`/wallet/balance?user_id=${user.id}`);
      if (res.success) setWalletBalance(parseFloat(res.balance));
      setSelectedCourseForEnroll(course);
    } else {
      handleConfirmEnroll(course.id);
    }
  };

  const handleConfirmEnroll = async (courseId) => {
    if (!user) return;
    setEnrollingId(courseId);
    const data = await fetchApi("/student/enroll_course", {
      method: "POST",
      body: JSON.stringify({ student_id: user.id, course_id: courseId }),
    });
    if (data.success) {
      await loadCourses(user.id);
      setSelectedCourseForEnroll(null);
      toast.success(data.message || "Enrolled successfully!");
    } else {
      toast.error(data.message || "Failed to enroll.");
    }
    setEnrollingId(null);
  };

  return (
    <>
      <Navbar />
      
      <main className="flex-1 flex flex-col pt-24 pb-20 px-6 max-w-7xl mx-auto w-full">

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-12 shadow-xl mb-10 border border-slate-800">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#1e293b]/10 backdrop-blur-md rounded-full text-[10px] font-bold text-violet-300 uppercase tracking-widest border border-white/5 shadow-sm mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse-slow"></span>
              LEARNING ACADEMY
            </div>
            <h1 className="text-3xl md:text-4.5xl lg:text-5xl font-extrabold tracking-tight leading-none mb-4">
              Master New <span className="text-gradient font-black">Skills</span>
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-xl">
              Explore structured courses with expert instructors. Learn at your own pace with rich materials, quizzes, and certificates.
            </p>
          </div>
        </div>

        {!user && (
          <div className="mb-8 p-6 bg-blue-50 border border-blue-100 dark:border-blue-900/50 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
            <div className="flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Authentication Required</h4>
                <p className="text-xs text-slate-500 dark:text-white">Sign in to enroll in courses and track your progress.</p>
              </div>
            </div>
            <button onClick={() => router.push("/login")} className="shrink-0">
              <div className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl transition">
                Sign In
              </div>
            </button>
          </div>
        )}

        {/* Tab Controls + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          <div className="flex bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl gap-2 overflow-x-auto flex-shrink-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  // Optional: clear search when changing category
                  // setSearchTerm("");
                }}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap capitalize ${activeCategory === category
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-slate-500 dark:text-white hover:text-slate-800 dark:text-white hover:bg-slate-200/70"
                  }`}
              >
                {category} {category === "All" && `(${courses.length})`}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search courses or instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-550 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-3" />
            <p className="text-sm font-semibold">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-150 p-6 shadow-sm">
            <Search className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-white">No Courses Found</h3>
            <p className="text-xs max-w-xs mx-auto mt-1">Try changing the filter or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="group p-[2px] rounded-[20px] bg-gray-300 transition-all duration-300 ease-out hover:bg-gradient-to-r hover:from-violet-500 hover:to-blue-500 shadow-[0_2px_12px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.25)] hover:-translate-y-1"
              >
                <div className="bg-white dark:bg-[#1e293b] rounded-[18px] flex flex-col justify-between relative overflow-hidden text-left h-full">

                  {/* Banner */}
                  <div className="h-44 bg-gray-100 relative overflow-hidden">
                    {course.banner_url ? (
                      <img
                        src={course.banner_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-white">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    {parseFloat(course.points) > 0 && (
                      <div className="absolute top-3 right-3 bg-white dark:bg-[#1e293b]/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className="text-[11px] font-bold text-amber-700">
                          LKR {parseFloat(course.points).toFixed(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="px-6 py-5 flex-1 flex flex-col">
                    {course.category && (
                      <div className="inline-block px-3 py-1 text-[10px] font-bold bg-violet-100 text-violet-700 rounded-full mb-3 w-fit">
                        {course.category}
                      </div>
                    )}

                    <h3 className="text-[16px] font-extrabold text-slate-850 tracking-tight group-hover:text-violet-600 transition-colors line-clamp-2 leading-snug mb-2">
                      {course.title}
                    </h3>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">
                        {course.teacher_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-600 dark:text-white font-medium">{course.teacher_name}</span>
                    </div>

                    <p className="text-[13px] text-slate-500 dark:text-white line-clamp-3 mb-5 flex-1">
                      {course.description || "No description available."}
                    </p>

                    <div className="flex items-center gap-4 py-3 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-white">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-xs font-medium">{course.module_count} Modules</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-white">
                        <PlayCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">{course.duration || "Self-Paced"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="px-6 pb-6">
                    {course.is_enrolled ? (
                      <button
                        onClick={() => router.push("/dashboard/student/my-courses")}
                        className="w-full h-11 rounded-xl bg-green-50 text-green-700 font-bold text-sm border border-green-200 dark:border-green-900/50 hover:bg-green-100 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Go to Course
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnrollClick(course)}
                        disabled={enrollingId === course.id}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                      >
                        {enrollingId === course.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : parseFloat(course.points) > 0 ? (
                          "Unlock Course"
                        ) : (
                          "Enroll Free"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Enrollment Dialog */}
      {selectedCourseForEnroll && (
        <CustomDialog
          isOpen={!!selectedCourseForEnroll}
          type="warning"
          title="Unlock Premium Course"
          message={
            <div className="space-y-3 mt-3 text-left bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-slate-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-white">Your Wallet Balance:</span>
                <span className="font-bold text-slate-800 dark:text-white">LKR {walletBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-slate-800 pt-2">
                <span className="text-gray-500 dark:text-white">Course Fee:</span>
                <span className="font-bold text-amber-600">
                  LKR {parseFloat(selectedCourseForEnroll.points).toFixed(2)}
                </span>
              </div>
              {walletBalance < parseFloat(selectedCourseForEnroll.points) && (
                <div className="pt-2 text-center">
                  <span className="text-xs text-red-500 font-medium">
                    Insufficient balance. Please recharge your wallet.
                  </span>
                </div>
              )}
            </div>
          }
          confirmText={
            walletBalance < parseFloat(selectedCourseForEnroll.points)
              ? "Go to Wallet"
              : enrollingId === selectedCourseForEnroll.id
                ? "Processing..."
                : "Confirm Payment"
          }
          cancelText="Cancel"
          onConfirm={() => {
            if (walletBalance < parseFloat(selectedCourseForEnroll.points)) {
              router.push("/dashboard/student/wallet");
            } else {
              handleConfirmEnroll(selectedCourseForEnroll.id);
            }
          }}
          onCancel={() => setSelectedCourseForEnroll(null)}
          confirmDisabled={enrollingId === selectedCourseForEnroll.id}
        />
      )}

      <Footer />
    </>
  );
}