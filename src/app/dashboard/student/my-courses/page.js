"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Loader2, PlayCircle, Star, Image as ImageIcon, Clock, Search } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function StudentMyCourses() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadMyCourses = useCallback(async (studentId) => {
    setIsLoading(true);
    const data = await fetchApi(`/student/get_my_courses?student_id=${studentId}`);
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
        loadMyCourses(parsed.id);
      } else {
        router.push("/login");
      }
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadMyCourses, router]);

  if (isLoading && courses.length === 0) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight">My Courses</h1>
        <p className="text-[13px] text-gray-500 dark:text-white mt-1">Pick up right where you left off.</p>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search your courses by title or instructor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 && !isLoading ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 flex flex-col items-center justify-center bg-white dark:bg-[#1e293b] rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-white mb-4" />
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-white">No Enrollments Yet</h3>
            <p className="text-[13px] text-gray-500 dark:text-white mt-1 mb-6">You haven&apos;t enrolled in any courses. Head over to the Course Explorer to get started!</p>
            <button 
              onClick={() => router.push('/dashboard/student/courses')}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold text-[13px] rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          courses.filter(course => 
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            course.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 py-12 text-center text-gray-500 dark:text-gray-400">
              No courses found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            courses.filter(course => 
              course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              course.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(course => {
              const enrolledDate = new Date(course.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const progress = Number(course.progress_percentage || 0);
              const completedLessons = Number(course.completed_materials || 0);
              const totalLessons = Number(course.total_materials || 0);
              
              return (
                <div key={course.id} className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
                  <div className="h-36 bg-slate-100 relative overflow-hidden">
                    {course.banner_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.banner_url} alt="Course Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-white"><ImageIcon className="w-8 h-8" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-4">
                      {course.points > 0 && (
                        <div className="bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3 fill-white" /> LKR {course.points}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-[15px] font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight mb-2">{course.title}</h3>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-white mb-4">Instructor: {course.teacher_name}</p>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-slate-300">Course Progress</span>
                        <span className={`text-[11px] font-bold ${progress >= 100 ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                          {progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? "bg-green-500" : "bg-blue-600"}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] font-medium text-gray-500 dark:text-slate-300">
                        {completedLessons} of {totalLessons} lessons completed
                      </p>
                    </div>
                    
                    <div className="flex-1"></div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-white bg-gray-50 dark:bg-slate-800/50 p-2 rounded border border-gray-100 dark:border-slate-800/50">
                         <div className="flex items-center gap-1.5">
                           <Clock className="w-3.5 h-3.5 text-blue-500" />
                           <span>Enrolled: {enrolledDate}</span>
                         </div>
                         <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-white">
                           <BookOpen className="w-3.5 h-3.5" />
                           {course.module_count} Modules
                         </div>
                      </div>
                      
                      <button 
                        onClick={() => router.push(`/dashboard/student/learn?id=${course.id}`)}
                        className="w-full py-2.5 bg-slate-800 dark:bg-slate-700 text-white font-bold text-[13px] rounded-lg shadow-sm hover:bg-slate-900 dark:hover:bg-slate-600 hover:shadow transition-all flex items-center justify-center gap-2 group-hover:bg-blue-600"
                      >
                        <PlayCircle className="w-4 h-4" /> {progress >= 100 ? "Review Course" : "Continue Learning"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
