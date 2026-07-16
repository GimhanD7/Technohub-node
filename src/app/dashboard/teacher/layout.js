"use client";

import { useEffect, useState } from "react";
import { BookOpen, Users, ClipboardList, User, ChevronDown, PanelLeftClose, PanelLeftOpen, Video, DollarSign, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import TopNavbar from "@/components/TopNavbar";
import { BASE_URL } from "@/lib/api";

export default function TeacherLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("techno_hub_teacher_sidebar_collapsed") === "true";
  });

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

  if (!user) return <div className="h-screen flex items-center justify-center bg-[#f4f7f9] dark:bg-slate-900"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  const isActive = (path) => pathname === path;
  const toggleSidebar = () => {
    setIsSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem("techno_hub_teacher_sidebar_collapsed", String(next));
      return next;
    });
  };
  const navLinkClass = (path) => `flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "justify-between px-3"} py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive(path) ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'}`;
  const navInnerClass = `flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`;
  const labelClass = isSidebarCollapsed ? "hidden" : "inline";
  const sectionClass = isSidebarCollapsed ? "sr-only" : "text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2";

  return (
    <div className="h-screen flex flex-col bg-[#f4f7f9] dark:bg-slate-900 text-slate-800 dark:text-white font-sans overflow-hidden">
      <TopNavbar user={user} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-[#1e293b] border-r border-gray-200 dark:border-slate-800 flex flex-col overflow-y-auto shrink-0 z-10">
          
          {/* User Profile Block */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-800/50 flex items-center gap-3">
             {user.profile_picture ? (
               <img src={user.profile_picture.startsWith('http') ? user.profile_picture : `${BASE_URL}${user.profile_picture}`} alt="Profile" className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-slate-700 shadow-sm" />
             ) : (
               <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                 {user.full_name.charAt(0).toUpperCase()}
               </div>
             )}
             <div className="min-w-0">
               <h3 className="text-[13px] font-bold text-slate-800 dark:text-white truncate">{user.full_name}</h3>
               <p className="text-[11px] text-gray-500 dark:text-white capitalize">{user.role} Account</p>
             </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-white uppercase tracking-wider mb-3 px-2">Navigation</p>
            
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
                <span className={labelClass}>My Classes</span>
              </div>

            </Link>

            <Link href="/dashboard/teacher/earnings" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/teacher/earnings') ? 'bg-primary/5 text-primary' : 'text-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:text-white'}`}>
              <div className="flex items-center gap-3">
                <DollarSign className="w-[18px] h-[18px]" />
                <span className={labelClass}>Earnings</span>
              </div>
            </Link>

            <p className="text-[10px] font-bold text-gray-400 dark:text-white uppercase tracking-wider mt-8 mb-3 px-2">Management</p>

            <Link href="#" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium text-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:text-white`}>
              <div className="flex items-center gap-3">
                <ClipboardList className="w-[18px] h-[18px]" />
                <span className={labelClass}>Assignments</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-white" />
            </Link>

            <Link href="/dashboard/teacher/profile" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/teacher/profile') ? 'bg-primary/5 text-primary' : 'text-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:text-white'}`}>
              <div className="flex items-center gap-3">
                <User className="w-[18px] h-[18px]" />
                <span className={labelClass}>Profile Settings</span>
              </div>
            </Link>
          </nav>
          
          <div className="p-4 border-t border-gray-200 dark:border-slate-800 text-center">
             <button className="text-[12px] font-medium text-slate-500 dark:text-white hover:text-slate-800 dark:text-white transition-colors flex items-center justify-center gap-2 w-full">
               <Settings className="w-4 h-4" /> Collapse Menu
             </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
          
          {/* Footer */}
          <footer className="mt-8 flex items-center justify-between text-[11px] text-gray-400 dark:text-white border-t border-gray-200 dark:border-slate-800 pt-4">
             <p>&copy; 2026 Design By <a href="https://www.gimhan.me" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-white font-bold hover:text-blue-600 transition-colors">GDThemes</a></p>
          </footer>
        </main>
      </div>
    </div>
  );
}
