"use client";

import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, FileText, User, PanelLeftClose, PanelLeftOpen, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import TopNavbar from "@/components/TopNavbar";
import { BASE_URL } from "@/lib/api";

export default function StudentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("techno_hub_student_sidebar_collapsed") === "true";
  });

  useEffect(() => {
    const handleOpen = () => setIsMobileSidebarOpen(true);
    document.addEventListener('open-mobile-sidebar', handleOpen);
    return () => document.removeEventListener('open-mobile-sidebar', handleOpen);
  }, []);

  useEffect(() => {
    const loadUserTimer = window.setTimeout(() => {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (!savedUser) {
        router.push("/login");
      } else {
        const parsed = JSON.parse(savedUser);
        if (parsed.role !== "student") {
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

  const isActive = (path, exact = false) => exact ? pathname === path : pathname === path || pathname?.startsWith(`${path}/`);
  const toggleSidebar = () => {
    setIsSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem("techno_hub_student_sidebar_collapsed", String(next));
      return next;
    });
  };
  const navLinkClass = (path, exact = false) => `flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "justify-between px-3"} py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive(path, exact) ? 'bg-primary/5 text-primary' : 'text-slate-600 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white dark:text-white'}`;
  const navInnerClass = `flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`;
  const labelClass = isSidebarCollapsed ? "hidden" : "inline";
  const sectionClass = isSidebarCollapsed ? "sr-only" : "text-[10px] font-bold text-gray-400 dark:text-white uppercase tracking-wider mb-3 px-2";

  return (
    <div className="h-screen flex flex-col bg-[#f4f7f9] dark:bg-slate-900 text-slate-800 dark:text-white font-sans overflow-hidden">
      <TopNavbar user={user} sidebarCollapsed={isSidebarCollapsed} onMenuClick={() => setIsMobileSidebarOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`${isSidebarCollapsed ? "md:w-20" : "md:w-64"} w-64 fixed md:relative inset-y-0 left-0 transform ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 bg-white dark:bg-[#1e293b] border-r border-gray-200 dark:border-slate-800 flex flex-col overflow-y-auto shrink-0 z-50 transition-transform duration-300`}>
          
          {/* User Profile Block */}
          <div className={`${isSidebarCollapsed ? "md:p-4 md:justify-center" : ""} p-6 border-b border-gray-100 dark:border-slate-800/50 flex items-center gap-3`}>
             {user.profile_picture ? (
               <img src={user.profile_picture.startsWith('http') ? user.profile_picture : `${BASE_URL}${user.profile_picture.startsWith('/') ? '' : '/'}${user.profile_picture}`} alt={`${user.full_name} profile`} className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-slate-700 shadow-sm" />
             ) : (
               <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                 {user.full_name.charAt(0).toUpperCase()}
               </div>
             )}
             <div className={`${isSidebarCollapsed ? "md:hidden" : "block"} min-w-0`}>
               <h3 className="text-[13px] font-bold text-slate-800 dark:text-white truncate">{user.full_name}</h3>
               <p className="text-[11px] text-gray-500 dark:text-white capitalize">{user.role} Portal</p>
             </div>
          </div>

          <nav className={`${isSidebarCollapsed ? "md:px-3" : "px-4"} px-4 flex-1 py-6 space-y-1`}>
            <p className={isSidebarCollapsed ? "hidden md:sr-only" : sectionClass}>Navigation</p>
            
            <Link href="/dashboard/student" title="My Dashboard" className={navLinkClass('/dashboard/student', true)}>
              <div className={navInnerClass}>
                <BookOpen className="w-[18px] h-[18px]" />
                <span className={labelClass}>My Dashboard</span>
              </div>
            </Link>

            <Link href="/dashboard/student/courses" title="Course Explorer" className={navLinkClass('/dashboard/student/courses')}>
              <div className={navInnerClass}>
                <BookOpen className="w-[18px] h-[18px]" />
                <span className={labelClass}>Course Explorer</span>
              </div>
            </Link>

            <Link href="/dashboard/student/exams" title="Exam Hall" className={navLinkClass('/dashboard/student/exams')}>
              <div className={navInnerClass}>
                <FileText className="w-[18px] h-[18px]" />
                <span className={labelClass}>Exam Hall</span>
              </div>
            </Link>

            <Link href="/dashboard/student/wallet" title="My Wallet" className={navLinkClass('/dashboard/student/wallet')}>
              <div className={navInnerClass}>
                <Wallet className="w-[18px] h-[18px]" />
                <span className={labelClass}>My Wallet</span>
              </div>
            </Link>

            <Link href="/dashboard/student/my-courses" title="My Courses" className={navLinkClass('/dashboard/student/my-courses')}>
              <div className={navInnerClass}>
                <GraduationCap className="w-[18px] h-[18px]" />
                <span className={labelClass}>My Courses</span>
              </div>
            </Link>

            <p className={`${sectionClass} mt-8`}>Academics</p>

            <Link href="/dashboard/student/reports" title="Grades & Reports" className={navLinkClass('/dashboard/student/reports')}>
              <div className={navInnerClass}>
                <FileText className="w-[18px] h-[18px]" />
                <span className={labelClass}>Grades & Reports</span>
              </div>
            </Link>

            <Link href="/dashboard/student/profile" title="Profile Settings" className={navLinkClass('/dashboard/student/profile')}>
              <div className={navInnerClass}>
                <User className="w-[18px] h-[18px]" />
                <span className={labelClass}>Profile Settings</span>
              </div>
            </Link>
          </nav>
          
          <div className="p-4 border-t border-gray-200 dark:border-slate-800 text-center">
             <button
               type="button"
               onClick={toggleSidebar}
               aria-label={isSidebarCollapsed ? "Expand menu" : "Collapse menu"}
               title={isSidebarCollapsed ? "Expand menu" : "Collapse menu"}
               className="text-[12px] font-medium text-slate-500 dark:text-white hover:text-slate-800 dark:hover:text-white transition-colors flex items-center justify-center gap-2 w-full"
             >
               {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
               <span className={labelClass}>{isSidebarCollapsed ? "Expand Menu" : "Collapse Menu"}</span>
             </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
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

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex justify-around items-center h-16 z-40 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link href="/dashboard/student" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/dashboard/student', true) ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
          <BookOpen className={`w-5 h-5 ${isActive('/dashboard/student', true) ? 'fill-primary/20' : ''}`} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link href="/dashboard/student/my-courses" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/dashboard/student/my-courses') ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
          <GraduationCap className={`w-5 h-5 ${isActive('/dashboard/student/my-courses') ? 'fill-primary/20' : ''}`} />
          <span className="text-[10px] font-medium">My Courses</span>
        </Link>
         <Link href="/dashboard/student/exams" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/dashboard/student/exams') ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
          <FileText className={`w-5 h-5 ${isActive('/dashboard/student/exams') ? 'fill-primary/20' : ''}`} />
          <span className="text-[10px] font-medium">Exams</span>
        </Link>
        <Link href="/dashboard/student/courses" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/dashboard/student/courses') ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
          <BookOpen className={`w-5 h-5 ${isActive('/dashboard/student/courses') ? 'fill-primary/20' : ''}`} />
          <span className="text-[10px] font-medium">All Classes</span>
        </Link>
        <Link href="/dashboard/student/wallet" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/dashboard/student/wallet') ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
          <Wallet className={`w-5 h-5 ${isActive('/dashboard/student/wallet') ? 'fill-primary/20' : ''}`} />
          <span className="text-[10px] font-medium">Payments</span>
        </Link>
       
      </div>
    </div>
  );
}
