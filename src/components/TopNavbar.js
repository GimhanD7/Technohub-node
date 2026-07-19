"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Settings, Moon, Sun, Globe, Menu, BookOpen, FileText, CreditCard, Info, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { API_BASE_URL, BASE_URL, fetchApi } from "@/lib/api";

export default function TopNavbar({ user, sidebarCollapsed = false, onMenuClick }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.profile-dropdown-container')) {
        setIsDropdownOpen(false);
      }
      if (!e.target.closest('.notif-dropdown-container')) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      if (!user || !user.id) return;
      try {
        const data = await fetchApi(`/notifications/get?user_id=${user.id}`);
        if (data && data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.unread_count);
        }
      } catch (err) {
        // Silently fail on network error to prevent Next.js overlay
      }
    };
    
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleOpenNotifications = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && unreadCount > 0 && user && user.id) {
      try {
        await fetchApi(`/notifications/mark_read`, {
          method: "POST",
          body: JSON.stringify({ user_id: user.id })
        });
        setUnreadCount(0);
      } catch (err) {
        // Silently fail
      }
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'exam': return <FileText className="w-4 h-4 text-purple-500" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-amber-500" />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("techno_hub_user");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 h-16 w-full flex items-center justify-between shrink-0 shadow-sm transition-colors duration-300">
      {/* Left Area (Logo) - width exactly matches sidebar */}
      <div className={`${sidebarCollapsed ? "md:w-20 md:justify-center md:px-3" : "md:w-64 md:justify-start md:px-6"} flex items-center border-r-0 md:border-r border-gray-200 dark:border-slate-800 h-full transition-all duration-300 px-4`}>
         {onMenuClick && (
           <button onClick={onMenuClick} className="mr-4 md:hidden text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors">
             <Menu className="w-5 h-5" />
           </button>
         )}
         <Link href="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">TH</div>
            <span className={`${sidebarCollapsed ? "md:hidden" : "inline"} font-bold text-[15px] tracking-tight text-slate-800 dark:text-slate-100 hidden md:inline`}>
               Techno-Hub <span className="text-gray-400 font-normal text-[10px] ml-1 tracking-normal">v1.0.0</span>
            </span>
         </Link>
      </div>

      {/* Center/Right Area */}
      <div className="flex-1 flex items-center justify-end md:justify-between px-4 md:px-6">
        {/* Navigation Links & Search */}
        <div className="items-center gap-6 hidden md:flex">
          {/* <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-slate-600">
            <Link href="#" className="hover:text-primary transition-colors">Components</Link>
            <Link href="#" className="flex items-center gap-1 hover:text-primary transition-colors">Dropdown <span className="text-[10px] text-gray-400">▼</span></Link>
            <Link href="#" className="flex items-center gap-1 hover:text-primary transition-colors">Mega Menu <span className="text-[10px] text-gray-400">▼</span></Link>
          </nav> */}
          
          <div className="relative ml-4 hidden lg:block">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search for something..." 
              className="pl-9 pr-4 py-1.5 bg-[#f4f7f9] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/30 w-64 text-slate-700 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
            />
          </div>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-4 md:gap-5 text-gray-500">
           <div className="hidden sm:flex items-center gap-1.5 text-[13px] font-medium px-2 py-1 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
             <Globe className="w-4 h-4 text-red-500" /> EN
           </div>
           
           <div className="relative cursor-pointer notif-dropdown-container">
             <div className="hover:text-slate-800 transition-colors" onClick={handleOpenNotifications}>
               <Bell className="w-[18px] h-[18px]" />
               {unreadCount > 0 && (
                 <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#0f172a] animate-pulse">
                   {unreadCount > 9 ? '9+' : unreadCount}
                 </span>
               )}
             </div>
             
             {/* Notifications Dropdown */}
             <div className={`fixed sm:absolute left-4 right-4 sm:left-auto sm:-right-20 top-[76px] sm:top-full sm:mt-5 w-auto sm:w-96 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-all z-50 flex flex-col overflow-hidden sm:origin-top-right origin-top ${isNotifOpen ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible translate-y-2 scale-95'}`}>
                <div className="px-4 py-3.5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                  <h3 className="text-[14px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    Notifications
                  </h3>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-full">{notifications.length} recent</span>
                </div>
                <div className="max-h-[260px] sm:max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-800/20">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center text-slate-500">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-[15px] font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
                      <p className="text-[13px] mt-1 text-slate-400 dark:text-slate-500">You don't have any new notifications.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className={`p-4 border-b border-gray-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700/80 transition-colors flex gap-3.5 cursor-pointer ${notif.is_unread ? 'bg-blue-50/80 dark:bg-blue-900/10' : ''}`} onClick={() => { if(notif.link) { router.push(notif.link); setIsNotifOpen(false); } }}>
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                          notif.type === 'course' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                          notif.type === 'exam' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' :
                          notif.type === 'payment' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}>
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-[13px] sm:text-[14px] font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{notif.title}</p>
                          <p className="text-[12px] sm:text-[13px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        {notif.is_unread && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {/* <Link href={`/dashboard/${user?.role}/notifications`} className="w-full text-center px-4 py-3 text-[13px] text-primary hover:bg-slate-50 dark:hover:bg-slate-700/50 font-bold transition-colors bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700" onClick={() => setIsNotifOpen(false)}>
                  View All Notifications
                </Link> */}
             </div>
           </div>
           
           <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} suppressHydrationWarning className="flex items-center justify-center cursor-pointer transition-colors text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white">
             <Sun className="hidden dark:block w-[18px] h-[18px]" />
             <Moon className="block dark:hidden w-[18px] h-[18px]" />
           </button>
           
           <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1 transition-colors"></div>

           <div className="relative cursor-pointer profile-dropdown-container" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
             {user?.profile_picture ? (
               <img src={user.profile_picture.startsWith('http') ? user.profile_picture : `${BASE_URL}${user.profile_picture}`} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-slate-700 shadow-sm" />
             ) : (
               <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 dark:bg-primary/20 dark:text-primary-foreground shadow-sm">
                  {user?.full_name?.charAt(0).toUpperCase() || "U"}
               </div>
             )}
             {/* Dropdown menu */}
             <div className={`absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg transition-all z-50 flex flex-col overflow-hidden ${isDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible'}`}>
                <Link href={user?.role === 'admin' ? '/dashboard/admin/settings' : `/dashboard/${user?.role}/profile`} className="w-full text-left px-4 py-2.5 text-[13px] text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors border-b border-gray-100 dark:border-slate-700" onClick={() => setIsDropdownOpen(false)}>
                  Profile Settings
                </Link>
                <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="w-full text-left px-4 py-2.5 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors">
                  Sign Out
                </button>
             </div>
           </div>
        </div>
      </div>
    </header>
  );
}
