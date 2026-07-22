"use client";

import { useEffect, useState } from "react";
import { BookOpen, Users, ClipboardList, User, Video, DollarSign, Library, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import TopNavbar from "@/components/TopNavbar";
import { BASE_URL } from "@/lib/api";

export default function TeacherLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUserTimer = window.setTimeout(() => {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (!savedUser) {
        router.push("/login");
      } else {
        const parsed = JSON.parse(savedUser);
        if (parsed.role !== "teacher") {
          router.push("/login");
        } else {
          setUser(parsed);
        }
      }
    }, 0);

    return () => window.clearTimeout(loadUserTimer);
  }, [router]);

  useEffect(() => {
    const syncUser = () => {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (savedUser) setUser(JSON.parse(savedUser));
    };
    window.addEventListener("techno-hub-user-updated", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("techno-hub-user-updated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  if (!user) return <div className="h-screen flex items-center justify-center bg-[#f4f7f9] dark:bg-slate-900"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  const isActive = (path) => pathname === path;
  const labelClass = "inline";

  return (
    <div className="h-screen flex flex-col bg-[#f4f7f9] dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
      <TopNavbar user={user} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-[#1e293b] border-r border-gray-200 dark:border-slate-800 flex flex-col overflow-y-auto shrink-0 z-10 transition-colors duration-300">
          
          {/* User Profile Block */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-800/50 flex items-center gap-3">
             {user.profile_picture ? (
               <img src={user.profile_picture.startsWith('http') ? user.profile_picture : `${BASE_URL}${user.profile_picture.startsWith('/') ? '' : '/'}${user.profile_picture}`} alt={`${user.full_name} profile`} className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-slate-700 shadow-sm" />
             ) : (
               <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                 {user.full_name.charAt(0).toUpperCase()}
               </div>
             )}
             <div className="min-w-0">
               <h3 className="text-[13px] font-bold text-slate-800 dark:text-white truncate">{user.full_name}</h3>
               <p className="text-[11px] text-gray-500 dark:text-slate-400 capitalize">{user.role} Account</p>
             </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Navigation</p>
            
            <Link href="/dashboard/teacher" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/teacher') ? 'bg-primary/5 text-primary' : 'text-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:text-white'}`}>
              <div className="flex items-center gap-3">
                <BookOpen className="w-[18px] h-[18px]" />
                <span className={labelClass}>Dashboard</span>
              </div>
            </Link>

            <Link href="/dashboard/teacher/quizzes" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/teacher/quizzes') ? 'bg-primary/5 text-primary' : 'text-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:text-white'}`}>
              <div className="flex items-center gap-3">
                <ClipboardList className="w-[18px] h-[18px]" />
                <span className={labelClass}>Quiz Management</span>
              </div>
            </Link>

            <Link href="/dashboard/teacher/online-classes" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/teacher/online-classes') ? 'bg-primary/5 text-primary' : 'text-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:text-white'}`}>
              <div className="flex items-center gap-3">
                <Video className="w-[18px] h-[18px]" />
                <span className={labelClass}>Online Classes</span>
              </div>
            </Link>

            <Link href="/dashboard/teacher/courses" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/teacher/courses') ? 'bg-primary/5 text-primary' : 'text-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:text-white'}`}>
              <div className="flex items-center gap-3">
                <Users className="w-[18px] h-[18px]" />
                <span className={labelClass}>My Courses</span>
              </div>

            </Link>

            <Link href="/dashboard/teacher/earnings" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/teacher/earnings') ? 'bg-primary/5 text-primary' : 'text-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:text-white'}`}>
              <div className="flex items-center gap-3">
                <DollarSign className="w-[18px] h-[18px]" />
                <span className={labelClass}>Earnings</span>
              </div>
            </Link>

            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-8 mb-3 px-2">Management</p>

            <Link href="/dashboard/teacher/e-books" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/teacher/e-books') ? 'bg-primary/5 text-primary' : 'text-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:text-white'}`}>
              <div className="flex items-center gap-3">
                <Library className="w-[18px] h-[18px]" />
                <span className={labelClass}>E-Book Library</span>
              </div>
            </Link>

            <Link href="/dashboard/teacher/messages" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/teacher/messages') ? 'bg-primary/5 text-primary' : 'text-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:text-white'}`}>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-[18px] h-[18px]" />
                <span className={labelClass}>Message Admin</span>
              </div>
            </Link>

            {/* <Link href="#" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium text-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:text-white`}>
              <div className="flex items-center gap-3">
                <ClipboardList className="w-[18px] h-[18px]" />
                <span className={labelClass}>Assignments</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-white" />
            </Link> */}

            <Link href="/dashboard/teacher/profile" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/teacher/profile') ? 'bg-primary/5 text-primary' : 'text-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:text-white'}`}>
              <div className="flex items-center gap-3">
                <User className="w-[18px] h-[18px]" />
                <span className={labelClass}>Profile Settings</span>
              </div>
            </Link>
          </nav>
          
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
          
          {/* Footer */}
          <footer className="mt-8 flex items-center justify-between text-[11px] text-gray-400 dark:text-white border-t border-gray-200 dark:border-slate-800 pt-4">
             <p className="flex items-center gap-1.5">
               <span>&copy; 2026 Design By</span>
               <a href="https://www.facebook.com/share/1BToLNwWPY/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-[#061a59] dark:text-[#20c8e8] hover:text-[#0877ee] transition-colors">
                 <img src="/vortex-digital-labs-icon.png" alt="Vortex Digital Labs" className="h-5 w-5 rounded-full object-cover" />
                 <span>Vortex Digital Labs</span>
               </a>
             </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
