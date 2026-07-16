import { Lock, Loader2 } from "lucide-react";

export default function MobileProfilePassword({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  isLoading,
  handleChangePassword
}) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
      <h2 className="text-[20px] font-bold text-slate-800 dark:text-white mb-1 mt-2">Change password</h2>
      <p className="text-[13px] text-gray-400 mb-8">Type your new password</p>

      <div className="space-y-4 flex-1">
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-slate-800">
          <Lock className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 mb-0.5">New password</p>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-[14px] font-bold text-slate-800 dark:text-white focus:outline-none placeholder:text-gray-300 tracking-wider" placeholder="********" />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-slate-800">
          <Lock className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 mb-0.5">Retype password</p>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-transparent text-[14px] font-bold text-slate-800 dark:text-white focus:outline-none placeholder:text-gray-300 tracking-wider" placeholder="********" />
          </div>
        </div>
      </div>

      <button onClick={handleChangePassword} disabled={isLoading || !password} className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-[15px] transition-all shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] disabled:opacity-70 flex items-center justify-center">
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Change password"}
      </button>
    </div>
  );
}
