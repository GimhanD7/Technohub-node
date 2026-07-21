import { User as UserIcon, Mail, Lock, Pencil, Loader2, MapPin, Calendar, GraduationCap, BookOpen, Phone } from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function MobileProfileDetails({ 
  user, 
  getProfileImage, 
  fileInputRef, 
  handleImageUpload, 
  isLoading, 
  fullName, 
  setFullName, 
  email, 
  setEmail, 
  emailValidationError,
  address, 
  setAddress, 
  birthdate, 
  setBirthdate, 
  educationCategory, 
  setEducationCategory, 
  educationInfo, 
  setEducationInfo, 
  setCurrentView, 
  handleSaveDetails 
}) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-orange-200 overflow-hidden border border-gray-100 dark:border-slate-800 shadow-md">
            {getProfileImage() ? (
              <img src={getProfileImage()} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-orange-600 font-bold text-3xl">{user.full_name?.charAt(0)}</div>
            )}
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-[#0f172a] hover:bg-blue-600 transition-colors">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-slate-800">
          <Phone className="w-5 h-5 text-gray-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 mb-0.5">Phone Number (Read Only)</p>
            <input type="tel" value={user.phone_number || ""} className="w-full bg-transparent text-[14px] font-bold text-gray-500 focus:outline-none cursor-not-allowed" disabled readOnly />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-slate-800">
          <UserIcon className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 mb-0.5">Full Name</p>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-transparent text-[14px] font-bold text-slate-800 dark:text-white focus:outline-none placeholder:text-gray-300" placeholder="Your Name" />
          </div>
        </div>

        <div className={`bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-start gap-4 border ${emailValidationError ? "border-red-500 dark:border-red-500" : "border-gray-100 dark:border-slate-800"}`}>
          <Mail className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 mb-0.5">Email Address</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(emailValidationError)} aria-describedby={emailValidationError ? "mobile-profile-email-error" : undefined} className="w-full bg-transparent text-[14px] font-bold text-slate-800 dark:text-white focus:outline-none placeholder:text-gray-300" placeholder="your@email.com" />
            {emailValidationError && (
              <p id="mobile-profile-email-error" role="alert" className="mt-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                {emailValidationError}
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-slate-800">
          <Calendar className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 mb-0.5">Date of Birth</p>
            <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="w-full bg-transparent text-[14px] font-bold text-slate-800 dark:text-white focus:outline-none" />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-slate-800">
          <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 mb-0.5">Address / Location</p>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-transparent text-[14px] font-bold text-slate-800 dark:text-white focus:outline-none placeholder:text-gray-300" placeholder="Your Address" />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-slate-800">
          <GraduationCap className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 mb-0.5">Education Category</p>
            <select value={educationCategory} onChange={(e) => setEducationCategory(e.target.value)} className="w-full bg-transparent text-[14px] font-bold text-slate-800 dark:text-white focus:outline-none appearance-none">
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

        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
          <div className="flex gap-4 mb-2">
            <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-400">Educational Information</p>
          </div>
          <textarea value={educationInfo} onChange={(e) => setEducationInfo(e.target.value)} placeholder="Degrees, skills, certifications..." className="w-full bg-transparent text-[14px] font-bold text-slate-800 dark:text-white focus:outline-none placeholder:text-gray-300 min-h-[60px]" />
        </div>

        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between gap-4 border border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-4 min-w-0">
            <Lock className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Password</p>
              <p className="text-[14px] font-bold text-slate-800 dark:text-white tracking-widest mt-1">********</p>
            </div>
          </div>
          <button onClick={() => setCurrentView("password")} className="text-[13px] font-bold text-blue-500 hover:text-blue-600 px-2 py-1">
            Change
          </button>
        </div>
      </div>

      <button onClick={handleSaveDetails} disabled={isLoading} className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-[15px] transition-all shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] disabled:opacity-70 flex items-center justify-center">
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
      </button>
    </div>
  );
}
