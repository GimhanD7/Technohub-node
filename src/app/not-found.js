import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found | Techno-Hub",
  description: "The page you are looking for does not exist or has been moved.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="max-w-2xl w-full text-center relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* 404 Graphic */}
        <div className="relative mb-8">
          <h1 className="text-[150px] md:text-[200px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary to-blue-300 dark:to-blue-900 opacity-20 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-[#1e293b] rounded-full shadow-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800">
              <Search className="w-10 h-10 md:w-14 md:h-14 text-primary animate-pulse" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4">
          Oops! Page Not Found
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-lg mx-auto">
          It looks like the page you are looking for has been moved, deleted, or simply doesn't exist. Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

      </div>

      {/* Footer Text */}
      <div className="absolute bottom-8 text-center text-sm text-slate-400 font-medium">
        &copy; {new Date().getFullYear()} Techno-Hub. All rights reserved.
      </div>
    </div>
  );
}
