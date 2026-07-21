"use client";

import { useEffect, useState } from "react";
import { Shield, Database, Users, User, ChevronDown, Activity, Settings, BookOpen, ClipboardList, Wallet, Images, MessageCircle, Home, DollarSign, ShieldAlert, Video, Tags, Bell, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import TopNavbar from "@/components/TopNavbar";
import { BASE_URL } from "@/lib/api";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (path) => pathname === path;
  const [user, setUser] = useState(null);

  // Dropdown states
  const [historyOpen, setHistoryOpen] = useState(isActive('/dashboard/admin/history') || isActive('/dashboard/admin/user-history') || isActive('/dashboard/admin/deleted-users'));
  const [walletOpen, setWalletOpen] = useState(isActive('/dashboard/admin/wallet') || isActive('/dashboard/admin/wallet-credits') || isActive('/dashboard/admin/bank-details'));
  const [homeOpen, setHomeOpen] = useState(pathname?.startsWith('/dashboard/admin/home') || false);

  useEffect(() => {
    const authTimer = window.setTimeout(() => {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (!savedUser) {
        router.push("/login");
        return;
      }

      const parsed = JSON.parse(savedUser);
      if (parsed.role !== "admin") {
        router.push("/login");
        return;
      } else {
        setUser(parsed);
      }

      setUser(parsed);
    }, 0);

    return () => window.clearTimeout(authTimer);
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

  if (!user) return <div className="h-screen flex items-center justify-center bg-[#f4f7f9] dark:bg-[#0f172a] transition-colors duration-300"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="h-screen flex flex-col bg-[#f4f7f9] dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
      <TopNavbar user={user} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-[#1e293b] border-r border-gray-200 dark:border-slate-800 flex flex-col overflow-y-auto shrink-0 z-10 transition-colors duration-300">
          
          {/* User Profile Block */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
             {user.profile_picture ? (
               <img src={user.profile_picture.startsWith('http') ? user.profile_picture : `${BASE_URL}${user.profile_picture.startsWith('/') ? '' : '/'}${user.profile_picture}`} alt={`${user.full_name} profile`} className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-slate-700 shadow-sm" />
             ) : (
               <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground flex items-center justify-center font-bold text-lg border border-primary/20 dark:border-transparent shrink-0">
                  {user.full_name.charAt(0).toUpperCase()}
               </div>
             )}
             <div className="min-w-0">
               <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">{user.full_name}</h3>
               <p className="text-[11px] text-gray-500 dark:text-slate-400 capitalize">{user.role} Head</p>
             </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Navigation</p>
            
            <Link href="/dashboard/admin" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <Shield className="w-[18px] h-[18px]" />
                <span>Dashboard</span>
              </div>
            </Link>

            <Link href="/dashboard/admin/notifications" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/notifications') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <Bell className="w-[18px] h-[18px]" />
                <span>Notifications</span>
              </div>
            </Link>

            <Link href="/dashboard/admin/sms-logs" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/sms-logs') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-[18px] h-[18px]" />
                <span>SMS Delivery Logs</span>
              </div>
            </Link>

            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-8 mb-3 px-2">Page Management</p>

            <div className="space-y-1">
              <div className={`flex items-center justify-between pr-1 rounded-lg transition-colors ${pathname?.startsWith('/dashboard/admin/home') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
                <Link 
                  href="/dashboard/admin/home"
                  className="flex-1 flex items-center gap-3 px-3 py-2 text-[13px] font-medium"
                >
                  <Home className="w-[18px] h-[18px]" />
                  <span>Home Page</span>
                </Link>
                <button 
                  onClick={() => setHomeOpen(!homeOpen)}
                  className="p-1.5 mr-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-md transition-colors"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${homeOpen ? 'rotate-180 text-primary dark:text-white' : 'text-gray-400 dark:text-slate-500'}`} />
                </button>
              </div>
              
              <div className={`overflow-hidden transition-all duration-200 ease-in-out ${homeOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pl-[38px] pr-3 py-1 space-y-1">
                  <Link 
                    href="/dashboard/admin/home/content" 
                    className={`block px-3 py-2 rounded-md text-[12px] font-medium transition-colors ${isActive('/dashboard/admin/home/content') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Homepage Content
                  </Link>
                  <Link 
                    href="/dashboard/admin/home/slides" 
                    className={`block px-3 py-2 rounded-md text-[12px] font-medium transition-colors ${isActive('/dashboard/admin/home/slides') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Slideshow Images
                  </Link>
                  <Link 
                    href="/dashboard/admin/home/lecturers" 
                    className={`block px-3 py-2 rounded-md text-[12px] font-medium transition-colors ${isActive('/dashboard/admin/home/lecturers') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Lecturer Cards
                  </Link>
                  <Link 
                    href="/dashboard/admin/home/timetable" 
                    className={`block px-3 py-2 rounded-md text-[12px] font-medium transition-colors ${isActive('/dashboard/admin/home/timetable') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Timetable Rows
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/dashboard/admin/e-books" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/e-books') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <BookOpen className="w-[18px] h-[18px]" />
                <span>E-Book Library</span>
              </div>
            </Link>

            <Link href="/dashboard/admin/gallery" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/gallery') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <Images className="w-[18px] h-[18px]" />
                <span>Gallery Manager</span>
              </div>
            </Link>

            <Link href="/dashboard/admin/contact" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/contact') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-[18px] h-[18px]" />
                <span>Contact Page</span>
              </div>
            </Link>

            <Link href="/dashboard/admin/analytics" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/analytics') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <Activity className="w-[18px] h-[18px]" />
                <span>Analytics</span>
              </div>
              <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider">HOT</span>
            </Link>

            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-8 mb-3 px-2">Teacher Customize </p>

            <Link href="/dashboard/admin/teachers" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/teachers') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <Users className="w-[18px] h-[18px]" />
                <span>Teacher Management</span>
              </div>
            </Link>
            
            <Link href="/dashboard/admin/earnings" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/earnings') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <DollarSign className="w-[18px] h-[18px]" />
                <span>Teacher Earnings</span>
              </div>
            </Link>

            <Link href="/dashboard/admin/teacher-messages" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/teacher-messages') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-[18px] h-[18px]" />
                <span>Teacher Messages</span>
              </div>
            </Link>
             <Link href="/dashboard/admin/courses" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/courses') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <BookOpen className="w-[18px] h-[18px]" />
                <span>Course Builder</span>
              </div>
            </Link>

            <Link href="/dashboard/admin/courses/categories" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/courses/categories') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <Tags className="w-[18px] h-[18px]" />
                <span>Course Categories</span>
              </div>
            </Link>
            
            <Link href="/dashboard/admin/quizzes" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/quizzes') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <ClipboardList className="w-[18px] h-[18px]" />
                <span>Quiz Management</span>
              </div>
            </Link>

            <Link href="/dashboard/admin/online-classes" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/online-classes') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <Video className="w-[18px] h-[18px]" />
                <span>Online Classes</span>
              </div>
            </Link>


            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-8 mb-3 px-2">Custom Pages</p>

            <Link href="/dashboard/admin/users" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/users') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <Users className="w-[18px] h-[18px]" />
                <span>User Management</span>
              </div>
            </Link>

            <div className="space-y-1">
              <div className={`flex items-center justify-between pr-1 rounded-lg transition-colors ${(isActive('/dashboard/admin/wallet') || isActive('/dashboard/admin/wallet-credits') || isActive('/dashboard/admin/bank-details')) ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
                <Link 
                  href="/dashboard/admin/wallet"
                  className="flex-1 flex items-center gap-3 px-3 py-2 text-[13px] font-medium"
                >
                  <Wallet className="w-[18px] h-[18px]" />
                  <span>Wallet Manager</span>
                </Link>
                <button 
                  onClick={() => setWalletOpen(!walletOpen)}
                  className="p-1.5 mr-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-md transition-colors"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${walletOpen ? 'rotate-180 text-primary dark:text-white' : 'text-gray-400 dark:text-slate-500'}`} />
                </button>
              </div>
              
              {walletOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  <Link href="/dashboard/admin/wallet" className={`block px-3 py-2 rounded-lg transition-colors text-[12px] font-medium ${isActive('/dashboard/admin/wallet') ? 'text-primary dark:text-white bg-primary/5 dark:bg-primary/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                    Wallet Approvals
                  </Link>
                  <Link href="/dashboard/admin/wallet-credits" className={`block px-3 py-2 rounded-lg transition-colors text-[12px] font-medium ${isActive('/dashboard/admin/wallet-credits') ? 'text-primary dark:text-white bg-primary/5 dark:bg-primary/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                    User Wallet Credits
                  </Link>
                  <Link href="/dashboard/admin/bank-details" className={`block px-3 py-2 rounded-lg transition-colors text-[12px] font-medium ${isActive('/dashboard/admin/bank-details') ? 'text-primary dark:text-white bg-primary/5 dark:bg-primary/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                    Bank Accounts
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className={`flex items-center justify-between pr-1 rounded-lg transition-colors ${(isActive('/dashboard/admin/history') || isActive('/dashboard/admin/user-history') || isActive('/dashboard/admin/deleted-users')) ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
                <Link 
                  href="/dashboard/admin/history"
                  className="flex-1 flex items-center gap-3 px-3 py-2 text-[13px] font-medium"
                >
                  <Activity className="w-[18px] h-[18px]" />
                  <span>System History</span>
                </Link>
                <button 
                  onClick={() => setHistoryOpen(!historyOpen)}
                  className="p-1.5 mr-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-md transition-colors"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${historyOpen ? 'rotate-180 text-primary dark:text-white' : 'text-gray-400 dark:text-slate-500'}`} />
                </button>
              </div>
              
              {historyOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  <Link href="/dashboard/admin/history" className={`block px-3 py-2 rounded-lg transition-colors text-[12px] font-medium ${isActive('/dashboard/admin/history') ? 'text-primary dark:text-white bg-primary/5 dark:bg-primary/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                    Global Timeline
                  </Link>
                  <Link href="/dashboard/admin/user-history" className={`block px-3 py-2 rounded-lg transition-colors text-[12px] font-medium ${isActive('/dashboard/admin/user-history') ? 'text-primary dark:text-white bg-primary/5 dark:bg-primary/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                    User Summaries
                  </Link>
                  <Link href="/dashboard/admin/deleted-users" className={`block px-3 py-2 rounded-lg transition-colors text-[12px] font-medium ${isActive('/dashboard/admin/deleted-users') ? 'text-primary dark:text-white bg-primary/5 dark:bg-primary/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                    Deleted Users Audit
                  </Link>
                </div>
              )}
            </div>

           

            <Link href="/dashboard/admin/uploads" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/uploads') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <Database className="w-[18px] h-[18px]" />
                <span>Storage & Uploads</span>
              </div>
            </Link>

            <Link href="/dashboard/admin/security" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/security') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-[18px] h-[18px]" />
                <span>Global Security</span>
              </div>
            </Link>

            <Link href="/dashboard/admin/profile" className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[13px] font-medium ${isActive('/dashboard/admin/profile') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
              <div className="flex items-center gap-3">
                <User className="w-[18px] h-[18px]" />
                <span>Profile Settings</span>
              </div>
            </Link>
          </nav>
          
          <div className="p-4 border-t border-gray-200 dark:border-slate-800 text-center">
             <Link href="/dashboard/admin/settings" className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-[13px] font-medium w-full ${isActive('/dashboard/admin/settings') ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}>
               <Settings className="w-4 h-4" /> System Settings
             </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
          
          {/* Footer */}
          <footer className="mt-8 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500 border-t border-gray-200 dark:border-slate-800 pt-4">
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
