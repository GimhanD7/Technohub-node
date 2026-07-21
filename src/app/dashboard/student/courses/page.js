"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Loader2, BookOpen, Star, PlayCircle, Users, CheckCircle, Image as ImageIcon, Library, Gift, WalletCards } from "lucide-react";
import { fetchApi, BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import { CustomDialog } from "@/components/ui/CustomDialog";
import { toast } from "react-hot-toast";

export default function StudentCourseExplorer() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [enrollmentFilter, setEnrollmentFilter] = useState("all");
  const [enrollingId, setEnrollingId] = useState(null);
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const loadCourses = useCallback(async (studentId) => {
    setIsLoading(true);
    const data = await fetchApi(`/student/get_all_courses?student_id=${studentId}`);
    if (data.success) {
      setCourses(data.courses);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        loadCourses(parsed.id);
      } else {
        router.push("/login");
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadCourses, router]);

  const filteredCourses = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return courses.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(lower) || c.teacher_name.toLowerCase().includes(lower);
      const matchesPrice = priceFilter === "all" || (priceFilter === "free" ? Number(c.points || 0) === 0 : Number(c.points || 0) > 0);
      const matchesEnrollment = enrollmentFilter === "all" || (enrollmentFilter === "enrolled" ? c.is_enrolled : !c.is_enrolled);
      return matchesSearch && matchesPrice && matchesEnrollment;
    });
  }, [courses, searchTerm, priceFilter, enrollmentFilter]);

  const courseSummary = useMemo(() => ({
    total: courses.length,
    enrolled: courses.filter(course => course.is_enrolled).length,
    free: courses.filter(course => Number(course.points || 0) === 0).length,
    premium: courses.filter(course => Number(course.points || 0) > 0).length,
  }), [courses]);

  const handleEnrollClick = async (course) => {
    if (!user) return;
    if (parseFloat(course.points) > 0) {
      const res = await fetchApi(`/wallet/balance?user_id=${user.id}`);
      if (res.success) {
        setWalletBalance(parseFloat(res.balance));
      }
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
      body: JSON.stringify({ student_id: user.id, course_id: courseId })
    });

    if (data.success) {
      await loadCourses(user.id);
      setSelectedCourseForEnroll(null);
      toast.success(data.message || "Course enrolled successfully!");
    } else {
      toast.error(data.message || "Failed to enroll in the course.");
    }
    setEnrollingId(null);
  };

  if (isLoading && courses.length === 0) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight">Course Explorer</h1>
          <p className="text-[13px] text-gray-500 dark:text-white mt-1">Discover new skills and expand your knowledge.</p>
        </div>
        
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white" />
          <input 
            type="text" 
            placeholder="Search for courses or instructors..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[13px] text-slate-700 dark:text-white shadow-sm transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Available Courses", value: courseSummary.total, icon: Library, tone: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "My Enrollments", value: courseSummary.enrolled, icon: CheckCircle, tone: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Free Courses", value: courseSummary.free, icon: Gift, tone: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
          { label: "Premium Courses", value: courseSummary.premium, icon: WalletCards, tone: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
        ].map(({ label, value, icon: Icon, tone, bg }) => <div key={label} className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 shadow-sm"><div className={`w-10 h-10 rounded-xl ${bg} ${tone} flex items-center justify-center`}><Icon className="w-5 h-5" /></div><div><p className="text-xl font-bold text-slate-900 dark:text-white leading-none">{value}</p><p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">{label}</p></div></div>)}
      </div>

      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row gap-3">
        <select value={priceFilter} onChange={event => setPriceFilter(event.target.value)} className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-semibold text-slate-600 dark:text-slate-200 outline-none focus:border-primary"><option value="all">All prices</option><option value="free">Free courses</option><option value="premium">Premium courses</option></select>
        <select value={enrollmentFilter} onChange={event => setEnrollmentFilter(event.target.value)} className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-xs font-semibold text-slate-600 dark:text-slate-200 outline-none focus:border-primary"><option value="all">All courses</option><option value="enrolled">Enrolled</option><option value="available">Not enrolled</option></select>
        {(searchTerm || priceFilter !== "all" || enrollmentFilter !== "all") && <button onClick={() => { setSearchTerm(""); setPriceFilter("all"); setEnrollmentFilter("all"); }} className="h-10 px-3 text-xs font-semibold text-slate-500 dark:text-slate-300 hover:text-red-500">Clear filters</button>}
        <span className="sm:ml-auto self-center text-xs text-slate-500 dark:text-slate-400">Showing {filteredCourses.length} courses</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map(course => {
          const progress = Number(course.progress_percentage || 0);
          const completedLessons = Number(course.completed_materials || 0);
          const totalLessons = Number(course.total_materials || 0);

          return (
            <div key={course.id} className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-100 dark:border-slate-800/50 shadow-sm hover:shadow-md hover:border-blue-100 dark:border-blue-900/50 transition-all flex flex-col overflow-hidden group">
              <div className="h-40 bg-gray-100 relative overflow-hidden">
                {course.banner_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.banner_url.startsWith('http') ? course.banner_url : `${BASE_URL}${course.banner_url.startsWith('/') ? '' : '/'}${course.banner_url}`} alt="Course Banner" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-white"><ImageIcon className="w-10 h-10" /></div>
                )}
                {course.points > 0 ? (
                  <div className="absolute top-3 right-3 bg-white dark:bg-[#1e293b]/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border-2 border-amber-300 dark:border-amber-700">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span className="text-[14px] md:text-[15px] font-black text-amber-600 dark:text-amber-400">LKR {course.points}</span>
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 bg-emerald-500 dark:bg-emerald-600 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border-2 border-emerald-400 dark:border-emerald-500">
                    <span className="text-[14px] md:text-[15px] font-black text-white">FREE</span>
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-[16px] font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight mb-2 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-bold">
                    {course.teacher_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[12px] font-medium text-slate-600 dark:text-white">{course.teacher_name}</span>
                </div>
                
                <p className="text-[13px] text-gray-500 dark:text-white line-clamp-2 mb-4 flex-1">{course.description || "No description available for this course."}</p>
                
                <div className="flex items-center gap-4 py-3 border-y border-gray-100 dark:border-slate-800/50 mb-4">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-white">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">{course.module_count} Modules</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-white">
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">{course.duration || "Self-Paced"}</span>
                  </div>
                </div>

                {course.is_enrolled && (
                  <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-900/50 dark:bg-blue-900/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Your Progress</span>
                      <span className={`text-[11px] font-bold ${progress >= 100 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? "bg-green-500" : "bg-blue-600"}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-300">
                      {completedLessons} of {totalLessons} lessons completed
                    </p>
                  </div>
                )}

                {course.is_enrolled ? (
                  <button 
                    onClick={() => router.push(`/dashboard/student/learn?id=${course.id}`)}
                    className="w-full py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-bold text-[13px] rounded-lg border border-green-200 dark:border-green-900/50 hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> {progress >= 100 ? "Review Course" : "Continue Course"}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleEnrollClick(course)}
                    disabled={enrollingId === course.id}
                    className="w-full py-2.5 bg-blue-600 text-white font-bold text-[13px] rounded-lg shadow-sm hover:bg-blue-700 hover:shadow transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {enrollingId === course.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enroll Now'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
        {filteredCourses.length === 0 && !isLoading && (
          <div className="col-span-1 md:col-span-2 xl:col-span-3 py-16 flex flex-col items-center justify-center bg-white dark:bg-[#1e293b] rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
            <Search className="w-12 h-12 text-gray-300 dark:text-white mb-4" />
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-white">No Courses Found</h3>
            <p className="text-[13px] text-gray-500 dark:text-white mt-1">Try adjusting your search terms or check back later.</p>
          </div>
        )}
      </div>

      

      {selectedCourseForEnroll && (
        <CustomDialog
          isOpen={!!selectedCourseForEnroll}
          type="warning"
          title="Unlock Premium Course"
          message={
            <div className="space-y-3 mt-3 text-left bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Your Wallet Balance:</span>
                <span className="font-bold text-slate-800 dark:text-white">LKR {walletBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-slate-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Course Fee:</span>
                <span className="font-bold text-amber-600">LKR {parseFloat(selectedCourseForEnroll.points).toFixed(2)}</span>
              </div>
              {walletBalance < parseFloat(selectedCourseForEnroll.points) && (
                <div className="pt-2 text-center flex flex-col items-center gap-2">
                  <span className="text-xs text-red-500 font-medium">Insufficient balance. Please recharge your wallet.</span>
                </div>
              )}
            </div>
          }
          confirmText={
            walletBalance < parseFloat(selectedCourseForEnroll.points)
              ? "Go to Wallet"
              : (enrollingId === selectedCourseForEnroll.id ? "Processing..." : "Confirm Payment")
          }
          cancelText="Cancel"
          onConfirm={() => {
            if (walletBalance < parseFloat(selectedCourseForEnroll.points)) {
              router.push('/dashboard/student/wallet');
            } else {
              handleConfirmEnroll(selectedCourseForEnroll.id);
            }
          }}
          onCancel={() => setSelectedCourseForEnroll(null)}
          confirmDisabled={enrollingId === selectedCourseForEnroll.id}
        />
      )}
    </div>
  );
}
