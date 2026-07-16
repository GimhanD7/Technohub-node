"use client";

import Link from "next/link";
import { Lock, ArrowLeft, ShieldAlert, Eye, UserCheck, HelpCircle } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 selection:bg-primary/20 transition-colors">
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2 group">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">TH</div>
             <span className="font-bold text-[15px] tracking-tight text-slate-800 dark:text-slate-100">Techno-Hub</span>
          </Link>
          <Link href="/home" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-800/50">
         <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-primary"></div>
         <div className="max-w-4xl mx-auto px-6 py-16 md:py-20 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 border border-emerald-100 dark:border-emerald-900/50">
              <Lock className="w-4 h-4" /> Privacy & Security
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              At Techno-Hub, we take your privacy seriously. This document explains how we collect, use, and protect your personal data when you use our platform.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-6 font-medium">
              Last Updated: June 27, 2026
            </p>
         </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary">
          
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-6 mb-10 flex gap-4">
            <Eye className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-0 mb-2">Our Privacy Promise</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 m-0 leading-relaxed">
                We are committed to maintaining the trust and confidence of all our users. We do not sell, rent, or trade email lists or user data with other companies and businesses for marketing purposes.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            When you interact with the Techno-Hub platform, we may collect the following information:
          </p>
          <ul className="space-y-3 mt-4 mb-8">
            <li className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Personal Identification Data:</strong> Name, email address, phone number, and physical address provided during registration.</span>
            </li>
            <li className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Educational Data:</strong> Course progress, quiz scores, enrolled subjects, and submitted assignments.</span>
            </li>
            <li className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Financial Data:</strong> Wallet balance, recharge history, and uploaded bank transfer slips (we do not store your direct bank or credit card details).</span>
            </li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Data</h2>
          <p className="mb-4">
            We use the collected information for the following purposes:
          </p>
          <ul className="list-disc pl-5 mb-8 space-y-2 text-slate-700 dark:text-slate-300">
            <li>To provide, operate, and maintain our Learning Management System.</li>
            <li>To track your academic progress and provide certificates of completion.</li>
            <li>To process your wallet top-up requests and verify payments securely.</li>
            <li>To send you important notifications regarding new courses, exams, and platform updates.</li>
            <li>To provide dedicated student and teacher support.</li>
          </ul>
          
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-5 my-6 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-200 m-0">
              <strong className="font-bold">Security Notice:</strong> Your password is cryptographically hashed in our database. Not even system administrators can see your actual password.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Data Sharing and Disclosure</h2>
          <p className="mb-4">
            We do not share your personal information with third parties except in the following limited circumstances:
          </p>
          <ul className="list-disc pl-5 mb-8 space-y-2 text-slate-700 dark:text-slate-300">
            <li><strong>With Teachers:</strong> Teachers can see the names and index numbers of students enrolled in their specific courses to track academic progress.</li>
            <li><strong>For Legal Reasons:</strong> If required by law, court order, or governmental regulation to protect the rights, property, or safety of Techno-Hub or others.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Your Data Rights</h2>
          <p className="mb-8">
            You have the right to request access to the personal data we hold about you, request corrections to inaccurate data, or request the deletion of your account and associated data. If you wish to exercise these rights, please contact our support team.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Cookies and Tracking</h2>
          <p className="mb-8">
            We use standard web cookies primarily to keep you logged into your account securely (authentication cookies). We do not use intrusive third-party tracking cookies for targeted advertising.
          </p>

          <hr className="my-10 border-gray-200 dark:border-slate-800" />
          
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-800">
             <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm shrink-0">
                <HelpCircle className="w-6 h-6 text-slate-500 dark:text-slate-400" />
             </div>
             <div>
               <h4 className="text-base font-bold text-slate-800 dark:text-white m-0">Privacy Questions?</h4>
               <p className="text-sm text-slate-600 dark:text-slate-400 m-0 mt-1">
                 If you have any questions or concerns regarding our privacy practices, please contact us at <a href="mailto:privacy@techno-hub.com" className="font-medium text-primary hover:underline">privacy@techno-hub.com</a>.
               </p>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
