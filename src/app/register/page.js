"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Phone, KeyRound, Cpu, ArrowLeft, User, MapPin, GraduationCap, Mail } from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [educationCategory, setEducationCategory] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // OTP States
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match!");
      return;
    }
    
    setIsLoading(true);

    if (!showOtpInput) {
      // Step 1: Send OTP
      const data = await fetchApi("/auth/send_otp", {
        method: "POST",
        body: JSON.stringify({ phoneNumber })
      });
      
      if (data.success) {
        setSuccessMsg(data.message);
        setShowOtpInput(true);
      } else {
        setErrorMsg(data.message);
      }
      setIsLoading(false);
      return;
    }

    // Step 2: Verify OTP & Register
    const data = await fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, phoneNumber, address, educationCategory, password, otp })
    });
    
    if (data.success) {
      setSuccessMsg(data.message + " Redirecting to login...");
      setFullName("");
      setPhoneNumber("");
      setAddress("");
      setEducationCategory("");
      setPassword("");
      setConfirmPassword("");
      setOtp("");
      setShowOtpInput(false);
      
      // Auto redirect to login page after 1.5s
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } else {
      setErrorMsg(data.message);
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);
    const data = await fetchApi("/auth/send_otp", {
      method: "POST",
      body: JSON.stringify({ phoneNumber })
    });
    
    if (data.success) {
      setSuccessMsg("A new OTP has been sent to your phone.");
    } else {
      setErrorMsg(data.message);
    }
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen flex relative">
      {/* Left side - Decorative / Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-foreground text-white p-12 relative overflow-hidden">
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
            Start your <span className="text-primary">journey</span> with us.
          </h1>
          <p className="text-lg text-white/80 leading-relaxed mb-8">
            Create an account to access premium video lessons, live classes, virtual exam halls, and become part of our elite learning community.
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

      {/* Right side - Registration Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-white dark:bg-[#1e293b] relative overflow-y-auto">
        <Link href="/home" className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-primary" />
        </Link>
        
        <div className="w-full max-w-md my-auto">
          <div className="mb-10 text-center lg:text-left mt-10 lg:mt-0">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {showOtpInput ? "Verify your phone" : "Create an account"}
            </h2>
            <p className="text-zinc-500">
              {showOtpInput 
                ? `Enter the 6-digit code sent to ${phoneNumber}` 
                : "Join Techno-Hub and start learning today."}
            </p>
          </div>
          
          {errorMsg && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 dark:border-red-900/50 text-red-600 text-sm font-medium">{errorMsg}</div>}
          {successMsg && <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 dark:border-green-900/50 text-green-600 text-sm font-medium">{successMsg}</div>}

          <form className="space-y-5" onSubmit={handleRegister}>
            {!showOtpInput ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-zinc-400" />
                    </div>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-all bg-zinc-50/50" 
                      placeholder="John Doe" 
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <label className="block text-sm font-medium mb-2 text-foreground">Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-zinc-400" />
                      </div>
                      <input 
                        type="text" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-all bg-zinc-50/50" 
                        placeholder="123 Education St" 
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-foreground">Education Category</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <GraduationCap className="h-5 w-5 text-zinc-400" />
                      </div>
                      <select 
                        value={educationCategory}
                        onChange={(e) => setEducationCategory(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-all bg-zinc-50/50 appearance-none" 
                        required
                      >
                        <option value="" disabled>Select Category</option>
                        <option value="school">School</option>
                        <option value="o/l">O/L</option>
                        <option value="a/l">A/L</option>
                        <option value="university">University</option>
                        <option value="vocational">Vocational</option>
                        <option value="professional">Professional</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <KeyRound className="h-5 w-5 text-zinc-400" />
                      </div>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-all bg-zinc-50/50" 
                        placeholder="••••••••" 
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Confirm</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <KeyRound className="h-5 w-5 text-zinc-400" />
                      </div>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-all bg-zinc-50/50" 
                        placeholder="••••••••" 
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground text-center">Verification Code</label>
                  <div className="relative max-w-[240px] mx-auto">
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-4 text-center text-2xl tracking-widest rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-[#0f172a] transition-all bg-zinc-50/50" 
                      placeholder="------" 
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-sm font-medium text-primary hover:text-secondary transition-colors"
                  >
                    Didn't receive a code? Resend
                  </button>
                </div>
                
                <div className="text-center pt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowOtpInput(false);
                      setSuccessMsg("");
                      setErrorMsg("");
                    }}
                    className="text-sm text-zinc-500 hover:text-foreground transition-colors"
                  >
                    Change phone number
                  </button>
                </div>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-6 text-lg rounded-xl shadow-[0_4px_14px_0_rgba(26,60,182,0.39)]"
            >
              {isLoading ? "Processing..." : (showOtpInput ? "Verify & Register" : "Create Account")}
            </Button>
          </form>
          
          {!showOtpInput && (
            <div className="mt-8 pt-8 border-t border-black/5 text-center">
              <p className="text-sm text-zinc-600">
                Already have an account? <Link href="/login" className="font-semibold text-primary hover:text-secondary transition-colors">Sign in</Link>
              </p>
            </div>
          )}
          
          <div className="mt-8 text-center lg:text-left pb-10 lg:pb-0">
            <Link href="/home" className="text-sm font-medium text-zinc-500 hover:text-foreground transition-colors inline-flex items-center gap-2 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
