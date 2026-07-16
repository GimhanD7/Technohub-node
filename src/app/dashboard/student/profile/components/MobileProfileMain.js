import { ChevronRight, User as UserIcon, Wallet, History, Bell, Mail, FileText, Lock, Hash } from "lucide-react";
import { BASE_URL } from "@/lib/api";
import Link from "next/link";

export default function MobileProfileMain({ user, setCurrentView, handleLogout, getProfileImage }) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Profile Info block */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-orange-200 overflow-hidden shrink-0 border border-gray-100 dark:border-slate-800 relative">
          {getProfileImage() ? (
            <img src={getProfileImage()} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-orange-600 font-bold text-2xl">{user.full_name?.charAt(0)}</div>
          )}
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-slate-800 dark:text-white leading-tight mb-1">{user.full_name},</h2>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/50">
               <Hash className="w-3 h-3" /> {user.index_number || "NO-INDEX"}
            </span>
          </div>
          <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-2 truncate">{user.email || user.phone_number}</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-full text-[12px] font-bold shadow-sm">
            <span className="opacity-70">LKR</span> {user.wallet_balance || "0.00"}
          </div>
        </div>
      </div>

      {/* PROFILE Section */}
      <div className="mb-6">
        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Profile</p>
        <div onClick={() => setCurrentView("details")} className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors -mx-3">
          <div className="flex items-center gap-4">
            <UserIcon className="w-5 h-5 text-blue-500" />
            <div>
              <h4 className="text-[14px] font-bold text-slate-800 dark:text-white">Profile Details</h4>
              <p className="text-[11px] text-gray-400">View & Edit details</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-500" />
        </div>
      </div>

      {/* WITHDRAW Section */}
      <div className="mb-6">
        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Withdraw</p>
        <Link href="/dashboard/student/wallet" className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors -mx-3">
          <div className="flex items-center gap-4">
            <Wallet className="w-5 h-5 text-blue-500" />
            <div>
              <h4 className="text-[14px] font-bold text-slate-800 dark:text-white">Bank Details</h4>
              <p className="text-[11px] text-gray-400">Add bank, or paypal account</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-500" />
        </Link>
        <Link href="/dashboard/student/wallet" className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors -mx-3">
          <div className="flex items-center gap-4">
            <History className="w-5 h-5 text-blue-500" />
            <div>
              <h4 className="text-[14px] font-bold text-slate-800 dark:text-white">History</h4>
              <p className="text-[11px] text-gray-400">History of all transactions</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-500" />
        </Link>
      </div>

      {/* SETTINGS Section */}
      <div className="mb-8">
        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Settings</p>
        
        <div className="flex items-center justify-between p-3 rounded-xl -mx-3">
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-blue-500" />
            <div>
              <h4 className="text-[14px] font-bold text-slate-800 dark:text-white">Push notifications</h4>
              <p className="text-[11px] text-gray-400">On</p>
            </div>
          </div>
          <div className="w-10 h-6 rounded-full bg-green-500 relative cursor-pointer shadow-sm">
            <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow"></div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl -mx-3">
          <div className="flex items-center gap-4">
            <Mail className="w-5 h-5 text-blue-500" />
            <div>
              <h4 className="text-[14px] font-bold text-slate-800 dark:text-white">Email notifications</h4>
              <p className="text-[11px] text-gray-400">Off</p>
            </div>
          </div>
          <div className="w-10 h-6 rounded-full bg-gray-200 dark:bg-slate-700 relative cursor-pointer shadow-inner">
            <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow border border-gray-100 dark:border-slate-600"></div>
          </div>
        </div>

        <Link href="/terms" className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors -mx-3">
          <div className="flex items-center gap-4">
            <FileText className="w-5 h-5 text-blue-500" />
            <h4 className="text-[14px] font-bold text-slate-800 dark:text-white">Terms of use</h4>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-500" />
        </Link>

        <Link href="/privacy" className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors -mx-3">
          <div className="flex items-center gap-4">
            <Lock className="w-5 h-5 text-blue-500" />
            <h4 className="text-[14px] font-bold text-slate-800 dark:text-white">Privacy policy</h4>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-500" />
        </Link>
      </div>

      <button onClick={handleLogout} className="w-full max-w-[200px] mx-auto block py-3 px-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-white font-bold text-[14px] rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all shadow-sm">
        Logout
      </button>
    </div>
  );
}
