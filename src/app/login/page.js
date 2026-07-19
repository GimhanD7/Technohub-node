"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { LogIn, Phone, KeyRound, Cpu, ArrowLeft, User, Mail, MessageCircle, X, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load remembered credentials on mount
  useEffect(() => {
    const savedPhone = localStorage.getItem("techno_hub_phone");
    const savedPassword = localStorage.getItem("techno_hub_password");
    if (savedPhone && savedPassword) {
      setPhoneNumber(savedPhone);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (rememberMe) {
      localStorage.setItem("techno_hub_phone", phoneNumber);
      localStorage.setItem("techno_hub_password", password);
    } else {
      localStorage.removeItem("techno_hub_phone");
      localStorage.removeItem("techno_hub_password");
    }
    
    setIsLoading(true);
    const data = await fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, password })
    });

    if (data.success) {
      toast.success(data.message || "Login successful!");
      
      // Save user session
      localStorage.setItem("techno_hub_user", JSON.stringify(data.user));
      
      // Redirect based on role
      setTimeout(() => {
        if (data.user.role === 'teacher') {
          router.push("/dashboard/teacher");
        } else if (data.user.role === 'admin') {
          router.push("/dashboard/admin");
        } else {
          router.push("/dashboard/student");
        }
      }, 1000);
      
    } else {
      toast.error(data.message || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full relative bg-[#F8F9FB] dark:bg-slate-900">
      
      {/* =========================================
          DESKTOP VIEW (hidden on small screens)
      ========================================= */}
      <div className="hidden lg:flex w-full min-h-screen">
        {/* Left side - Decorative / Branding */}
        <div className="flex flex-col justify-between w-1/2 bg-foreground text-white p-12 relative overflow-hidden">
          {/* Background gradient effects */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-primary/40 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[100px]"></div>
          </div>

          <div className="relative z-10">
            <Link href="/home" className="flex items-center gap-2 w-max group">
              <Cpu className="w-8 h-8 text-primary group-hover:text-secondary transition-colors" />
              <span className="font-bold text-2xl tracking-tight">Techno-Hub</span>
            </Link>
          </div>
          
          <div className="relative z-10 max-w-lg">
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Unlock your <span className="text-secondary">potential</span> today.
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8">
              Join the premier online learning ecosystem designed to accelerate your career and help you master the skills of tomorrow.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-4">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-foreground bg-primary/50 flex items-center justify-center backdrop-blur-sm">
                    <User className="w-4 h-4 text-white" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium text-white/90">Join 10,000+ top rankers</p>
            </div>
          </div>
          
          <div className="relative z-10 text-sm text-white/60">
            © {new Date().getFullYear()} Techno-Hub. All rights reserved.
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-1/2 flex flex-col justify-center items-center p-12 bg-white dark:bg-[#1e293b] relative">
          <div className="w-full max-w-md">
            <div className="mb-10 text-left">
              <h2 className="text-4xl font-bold text-foreground mb-3">Welcome back</h2>
              <p className="text-zinc-500">Please enter your details to access your account.</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-all bg-zinc-50/50" 
                    placeholder="07x xxx xxxx" 
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-all bg-zinc-50/50" 
                    placeholder="••••••••" 
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 text-primary focus:ring-primary accent-primary" 
                  />
                  <span className="text-sm text-zinc-600">Remember for 30 days</span>
                </label>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-secondary transition-colors">
                  Forgot password?
                </Link>
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full py-6 text-lg rounded-xl shadow-[0_4px_14px_0_rgba(26,60,182,0.39)]">
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="mt-8 pt-8 border-t border-black/5 text-center">
              <p className="text-sm text-zinc-600">
                Don't have an account? <Link href="/register" className="font-semibold text-primary hover:text-secondary transition-colors">Sign up</Link>
              </p>
            </div>
            
            <div className="mt-10 text-left">
              <Link href="/home" className="text-sm font-medium text-zinc-500 hover:text-foreground transition-colors inline-flex items-center gap-2 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          MOBILE VIEW (visible only on small screens)
      ========================================= */}
      <div className="flex lg:hidden flex-col w-full min-h-screen relative overflow-hidden">
        
        {/* Top Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-b-[40px] pt-16 pb-10 px-8 shadow-sm relative z-10">
          <div className="flex justify-between items-start">
            <div className="w-28 h-28 bg-primary rounded-full relative flex items-center justify-center shadow-lg">
              <div className="w-6 h-6 bg-white dark:bg-slate-800 rounded-full absolute bottom-4 right-4 shadow-sm"></div>
            </div>
            <div className="opacity-80 pr-2 pt-2">
              <Cpu className="w-24 h-24 text-slate-100 dark:text-slate-700" />
            </div>
          </div>
          
          <div className="mt-10">
            <h1 className="text-4xl font-extrabold text-primary inline-block relative">
              Login
              <div className="absolute -bottom-2 left-0 w-[80%] h-[3px] bg-primary rounded-full"></div>
            </h1>
          </div>
        </div>

        {/* Mobile Form */}
        <div className="px-8 mt-12 space-y-5 relative z-10 flex-1">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] rounded-full">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-16 pr-6 py-4 rounded-full bg-white dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-[15px] dark:text-white" 
                placeholder="phone number" 
                required
              />
            </div>
            
            <div className="relative shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] rounded-full">
              <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-16 pr-12 py-4 rounded-full bg-white dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-[15px] dark:text-white" 
                placeholder="••••••••••••" 
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-5 flex items-center text-gray-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-4 bg-primary text-white rounded-full font-bold text-lg shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)] mt-8 flex justify-center items-center">
              {isLoading ? "LOADING..." : "LOGIN"}
            </button>
          </form>

          <div className="flex flex-col items-center gap-5 mt-10 pb-8">
            <button type="button" onClick={() => setShowSupportModal(true)} className="text-primary font-bold text-[13px] tracking-wide uppercase">
              FORGET PASSWORD?
            </button>
            <Link href="/register" className="text-primary font-bold text-[13px] tracking-wide uppercase">
              SIGN UP
            </Link>
          </div>
        </div>
        
        {/* Bottom Right Decorative Curve */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gray-200/50 dark:bg-slate-800/50 rounded-tl-full -z-0 translate-x-12 translate-y-12"></div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowSupportModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            
            <h3 className="text-xl font-bold mb-2">Need Help?</h3>
            <p className="text-zinc-500 text-sm mb-6">Contact our support team to recover your account or reset your password.</p>
            
            <div className="space-y-3">
              <a href="mailto:support@techno-hub.com" className="flex items-center gap-3 p-3 rounded-xl border border-black/5 hover:bg-black/5 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Email Support</p>
                  <p className="text-xs text-zinc-500">support@techno-hub.com</p>
                </div>
              </a>
              
              <a href="https://wa.me/94701234567" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-black/5 hover:bg-black/5 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">WhatsApp</p>
                  <p className="text-xs text-zinc-500">+94 70 123 4567</p>
                </div>
              </a>
              
              <a href="tel:+94701234567" className="flex items-center gap-3 p-3 rounded-xl border border-black/5 hover:bg-black/5 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <Phone className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Phone Call</p>
                  <p className="text-xs text-zinc-500">+94 70 123 4567</p>
                </div>
              </a>
            </div>
            
            <Button className="w-full mt-6" onClick={() => setShowSupportModal(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
