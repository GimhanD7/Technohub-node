"use client";

import Link from "next/link";
import { FileText, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

export default function TermsOfUse() {
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
         <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-primary"></div>
         <div className="max-w-4xl mx-auto px-6 py-16 md:py-20 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 border border-blue-100 dark:border-blue-900/50">
              <FileText className="w-4 h-4" /> Legal Document
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              Terms of Use
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Please read these terms carefully before using the Techno-Hub platform. By accessing our services, you agree to be bound by these terms.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-6 font-medium">
              Last Updated: June 27, 2026
            </p>
         </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary">
          
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6 mb-10 flex gap-4">
            <ShieldCheck className="w-8 h-8 text-blue-500 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-0 mb-2">Agreement to Terms</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 m-0 leading-relaxed">
                By accessing or using the Techno-Hub Learning Management System (the "Service"), you agree to be bound by these Terms of Use. If you disagree with any part of the terms, you may not access the Service.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Account Registration and Security</h2>
          <p className="mb-4">
            To access certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </p>
          <ul className="space-y-3 mt-4 mb-8">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>You are responsible for safeguarding the password that you use to access the Service.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>You may not use as a username the name of another person or entity or that is not lawfully available for use.</span>
            </li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Intellectual Property Rights</h2>
          <p className="mb-4">
            The Service and its original content, features, functionality, course materials, videos, and PDFs are and will remain the exclusive property of Techno-Hub and its licensors. The Service is protected by copyright, trademark, and other laws of both the local and foreign jurisdictions.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-5 my-6 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200 m-0">
              <strong className="font-bold">Strictly Prohibited:</strong> You may not modify, reproduce, distribute, create derivative works or adaptations of, publicly display or in any way exploit any of the course materials or content available on Techno-Hub without our express written consent.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Payments and Wallets</h2>
          <p className="mb-4">
            Techno-Hub utilizes a digital wallet system for course enrollments and payments. By adding funds to your wallet:
          </p>
          <ul className="list-disc pl-5 mb-8 space-y-2 text-slate-700 dark:text-slate-300">
            <li>You agree to provide valid and accurate payment or bank transfer slips.</li>
            <li>Wallet funds are strictly for purchasing educational content on the platform and cannot be withdrawn as cash.</li>
            <li>Fraudulent payment slips or chargebacks will result in immediate permanent suspension of your account.</li>
            <li>All course purchases are final and non-refundable once the material has been accessed.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. User Conduct</h2>
          <p className="mb-4">
            You agree not to use the Service to:
          </p>
          <ul className="list-disc pl-5 mb-8 space-y-2 text-slate-700 dark:text-slate-300">
            <li>Upload or transmit viruses, trojan horses, or other malicious code.</li>
            <li>Attempt to bypass or circumvent any security features of the platform.</li>
            <li>Share your account credentials with third parties to allow unauthorized access to paid courses.</li>
            <li>Harass, abuse, or harm other users, teachers, or administrators.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Termination</h2>
          <p className="mb-8">
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease, and you will lose access to all purchased courses without refund.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Changes to Terms</h2>
          <p className="mb-8">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>

          <hr className="my-10 border-gray-200 dark:border-slate-800" />
          
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-800">
             <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm shrink-0">
                <HelpCircle className="w-6 h-6 text-slate-500 dark:text-slate-400" />
             </div>
             <div>
               <h4 className="text-base font-bold text-slate-800 dark:text-white m-0">Questions about our Terms?</h4>
               <p className="text-sm text-slate-600 dark:text-slate-400 m-0 mt-1">
                 If you have any questions about these Terms of Use, please contact us at <a href="mailto:support@techno-hub.com" className="font-medium text-primary hover:underline">support@techno-hub.com</a>.
               </p>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
