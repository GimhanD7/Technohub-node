"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, Sun, Moon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

const navItems = [
  { label: "Home", href: "/home", exact: true },
  { label: "Courses", href: "/home/courses" },
  { label: "Online Class", href: "/home/online-class" },
  { label: "Exam Hall", href: "/home/exam-hall" },
  { label: "E-Book", href: "/home/e-book" },
  { label: "Contact Us", href: "/home/contact-us" },
  { label: "Gallery", href: "/home/gallery" },
  { label: "Ranker", href: "/home/ranker" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    const loadUserTimer = window.setTimeout(() => {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (!savedUser) return;

      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("techno_hub_user");
      }
    }, 0);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.clearTimeout(loadUserTimer);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("techno_hub_user");
    setUser(null);
    window.location.href = "/home";
  };

  const isActiveRoute = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname?.startsWith(`${item.href}/`);
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl shadow-sm border-b border-gray-200 dark:border-slate-800" 
          : "bg-white/40 dark:bg-[#0f172a]/40 backdrop-blur-md border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-2 group">
          <Cpu className="w-8 h-8 text-primary group-hover:text-secondary transition-colors" />
          <span className="font-bold text-xl tracking-tight">Techno-Hub</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
          {navItems.map((item) => {
            const active = isActiveRoute(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "transition-colors",
                  active
                    ? "text-primary font-bold dark:text-primary"
                    : "text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            suppressHydrationWarning 
            className="flex items-center justify-center cursor-pointer transition-colors text-foreground/80 hover:text-primary dark:text-gray-400 dark:hover:text-white"
          >
            <Sun className="hidden dark:block w-5 h-5" />
            <Moon className="block dark:hidden w-5 h-5" />
          </button>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">Hi, {user.full_name.split(' ')[0]}</span>
              <Link href={user.role === 'admin' ? '/dashboard/admin' : user.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student'}>
                <Button size="sm">Dashboard</Button>
              </Link>
              <button onClick={handleLogout} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors ml-1 cursor-pointer">
                Sign Out
              </button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="gradient" className="px-5 font-semibold shadow-md flex items-center gap-2 group">
                Login
                <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
