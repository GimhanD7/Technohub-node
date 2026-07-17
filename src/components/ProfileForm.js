"use client";

import { useState, useRef } from "react";
import { User, Camera, Loader2, KeyRound } from "lucide-react";
import { fetchApi, API_BASE_URL, BASE_URL } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function ProfileForm({ initialUser }) {
  // Form State
  const [fullName, setFullName] = useState(initialUser?.full_name || "");
  const [address, setAddress] = useState(initialUser?.address || "");
  const [educationInfo, setEducationInfo] = useState(initialUser?.education_info || "");
  const [educationCategory, setEducationCategory] = useState(initialUser?.education_category || "");
  const [email, setEmail] = useState(initialUser?.email || "");
  const [birthdate, setBirthdate] = useState(initialUser?.birthdate || "");
  const [subject, setSubject] = useState(initialUser?.subject || "");
  const [experience, setExperience] = useState(initialUser?.experience || "");
  const [certifications, setCertifications] = useState(initialUser?.certifications || "");
  const [profilePicture, setProfilePicture] = useState(initialUser?.profile_picture || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsLoading(true);
    const data = await fetchApi("/user/update_profile", {
      method: "POST",
      body: JSON.stringify({ 
        id: initialUser.id,
        phoneNumber: initialUser.phone_number, 
        fullName, 
        address, 
        educationInfo,
        educationCategory,
        email,
        birthdate,
        subject,
        experience,
        certifications,
        profilePicture,
        password: password || undefined 
      })
    });

    if (data.success) {
      toast.success(data.message || "Profile updated successfully");
      // Update local storage
      localStorage.setItem("techno_hub_user", JSON.stringify(data.user));
      setPassword("");
      setConfirmPassword("");
      
      // Update local initial user reference for view mode
      initialUser.full_name = fullName;
      initialUser.address = address;
      initialUser.education_info = educationInfo;
      initialUser.education_category = educationCategory;
      initialUser.email = email;
      initialUser.birthdate = birthdate;
      initialUser.subject = subject;
      initialUser.experience = experience;
      initialUser.certifications = certifications;
      initialUser.profile_picture = profilePicture;
      if (data.user.index_number) {
        initialUser.index_number = data.user.index_number;
      }
    } else {
      toast.error(data.message || "Failed to update profile");
    }
    setIsLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit.");
        return;
    }

    setUploadingImage(true);
    const formDataObj = new FormData();
    formDataObj.append('image', file);
    formDataObj.append('id', initialUser.id);

    try {
        const response = await fetch(`${API_BASE_URL}/user/upload_profile`, {
            method: 'POST',
            body: formDataObj
        });
        const data = await response.json();
        
        if (data.success) {
            setProfilePicture(data.imageUrl);
            toast.success("Image uploaded successfully");
        } else {
            toast.error(data.message || "Failed to upload image");
        }
    } catch (error) {
        toast.error("An error occurred during upload.");
    } finally {
        setUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm max-w-5xl mx-auto overflow-hidden relative mb-12">
      {/* Cover photo */}
      <div className="h-48 md:h-64 bg-gradient-to-tr from-blue-200 via-white to-orange-100 dark:from-slate-800 dark:to-slate-700 relative">
        <button className="absolute top-4 right-4 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl shadow-sm backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-white transition-colors">
          <Camera className="w-5 h-5" />
        </button>
      </div>
      
      {/* Profile Header section */}
      <div className="px-8 pb-8 relative">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between -mt-16 md:-mt-20 mb-10 gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full md:w-auto">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-[#1e293b] bg-gray-100 overflow-hidden shadow-md relative group">
                {profilePicture ? (
                  <img src={profilePicture.startsWith('http') ? profilePicture : `${BASE_URL}${profilePicture.startsWith('/') ? '' : '/'}${profilePicture}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-4xl font-bold">
                    {fullName?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                   <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="pb-2 text-center md:text-left">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex flex-col md:flex-row items-center gap-3">
                Profile
                {initialUser?.role === 'student' && initialUser?.index_number && (
                  <span className="text-[13px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    INDEX: {initialUser.index_number}
                  </span>
                )}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 md:mt-1">Update your photo and personal details</p>
            </div>
          </div>
          
          <div className="pb-2 flex gap-3 w-full md:w-auto justify-center md:justify-end">
            <button onClick={handleUpdate} disabled={isLoading} className="px-8 py-2.5 rounded-lg bg-slate-800 dark:bg-primary text-white font-medium hover:bg-slate-900 dark:hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save
            </button>
          </div>
        </div>

        {/* Form Fields container */}
        <div className="space-y-1">
          
          {/* Field Row: Full Name */}
          <div className="flex flex-col md:flex-row md:items-center py-6 border-t border-gray-100 dark:border-slate-800">
            <div className="w-full md:w-1/3 mb-3 md:mb-0">
              <label className="text-[14px] font-semibold text-slate-800 dark:text-white">Full Name</label>
            </div>
            <div className="w-full md:w-2/3">
              <input 
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none transition-all text-[15px]"
                placeholder="Name"
              />
            </div>
          </div>

          {/* Field Row: Phone Number */}
          <div className="flex flex-col md:flex-row md:items-center py-6 border-t border-gray-100 dark:border-slate-800">
            <div className="w-full md:w-1/3 mb-3 md:mb-0">
              <label className="text-[14px] font-semibold text-slate-800 dark:text-white">Phone Number</label>
            </div>
            <div className="w-full md:w-2/3">
              <input 
                type="text" 
                value={initialUser?.phone_number}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-gray-500 cursor-not-allowed text-[15px]"
              />
            </div>
          </div>

          {/* Field Row: Email */}
          <div className="flex flex-col md:flex-row md:items-center py-6 border-t border-gray-100 dark:border-slate-800">
            <div className="w-full md:w-1/3 mb-3 md:mb-0">
              <label className="text-[14px] font-semibold text-slate-800 dark:text-white">Email Address</label>
            </div>
            <div className="w-full md:w-2/3">
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none transition-all text-[15px]"
                placeholder="Email"
              />
            </div>
          </div>

          {/* Field Row: Date of Birth */}
          <div className="flex flex-col md:flex-row md:items-center py-6 border-t border-gray-100 dark:border-slate-800">
            <div className="w-full md:w-1/3 mb-3 md:mb-0">
              <label className="text-[14px] font-semibold text-slate-800 dark:text-white">Date of Birth</label>
            </div>
            <div className="w-full md:w-2/3">
              <input 
                type="date" 
                value={birthdate}
                onChange={e => setBirthdate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none transition-all text-[15px]"
              />
            </div>
          </div>

          {/* Field Row: Your Photo */}
          <div className="flex flex-col md:flex-row py-6 border-t border-gray-100 dark:border-slate-800">
            <div className="w-full md:w-1/3 mb-4 md:mb-0">
              <label className="text-[14px] font-semibold text-slate-800 dark:text-white">Your Photo</label>
              <p className="text-[13px] text-gray-500 mt-1 pr-4">Update your photo and personal details.</p>
            </div>
            <div className="w-full md:w-2/3 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 shadow-sm border border-gray-200 flex-shrink-0 relative group">
                  {profilePicture ? (
                    <img src={profilePicture.startsWith('http') ? profilePicture : `${BASE_URL}${profilePicture.startsWith('/') ? '' : '/'}${profilePicture}`} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                      {fullName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                     <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                 <button onClick={() => setProfilePicture("")} className="text-[13px] font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-300">
                   Delete
                 </button>
                 <button onClick={() => fileInputRef.current?.click()} className="text-[13px] font-medium text-primary hover:text-primary/80">
                   {uploadingImage ? "Uploading..." : "Update"}
                 </button>
              </div>
            </div>
          </div>

          {/* Role specific fields */}
          {initialUser?.role === 'student' && (
            <>
              <div className="flex flex-col md:flex-row py-6 border-t border-gray-100 dark:border-slate-800">
                <div className="w-full md:w-1/3 mb-3 md:mb-0">
                  <label className="text-[14px] font-semibold text-slate-800 dark:text-white">Index Number</label>
                </div>
                <div className="w-full md:w-2/3">
                  <div className="w-full px-4 py-3.5 rounded-xl border-2 border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-between shadow-[0_0_15px_rgba(59,130,246,0.15)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    <span className="relative z-10 text-[16px] tracking-wide">{initialUser?.index_number || "Auto-generated"}</span>
                    <span className="relative z-10 text-[11px] uppercase tracking-wider bg-blue-200 dark:bg-blue-800/50 px-2 py-1 rounded text-blue-800 dark:text-blue-200">Official ID</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row py-6 border-t border-gray-100 dark:border-slate-800">
                <div className="w-full md:w-1/3 mb-3 md:mb-0">
                  <label className="text-[14px] font-semibold text-slate-800 dark:text-white">Education Category</label>
                </div>
                <div className="w-full md:w-2/3">
                  <select 
                    value={educationCategory}
                    onChange={(e) => setEducationCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none transition-all text-[15px]"
                  >
                    <option value="">Select Category</option>
                    <option value="school">School</option>
                    <option value="university">University</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row py-6 border-t border-gray-100 dark:border-slate-800">
                <div className="w-full md:w-1/3 mb-3 md:mb-0">
                  <label className="text-[14px] font-semibold text-slate-800 dark:text-white">Your Bio</label>
                  <p className="text-[13px] text-gray-500 mt-1 pr-4">Write a short bio about your education.</p>
                </div>
                <div className="w-full md:w-2/3">
                  <textarea 
                    value={educationInfo}
                    onChange={e => setEducationInfo(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none transition-all resize-none text-[15px]"
                    placeholder="Add a short bio..."
                  />
                </div>
              </div>
            </>
          )}

          {initialUser?.role === 'teacher' && (
            <>
              <div className="flex flex-col md:flex-row py-6 border-t border-gray-100 dark:border-slate-800">
                <div className="w-full md:w-1/3 mb-3 md:mb-0">
                  <label className="text-[14px] font-semibold text-slate-800 dark:text-white">Subject</label>
                </div>
                <div className="w-full md:w-2/3">
                  <input 
                    type="text" 
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none transition-all text-[15px]"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row py-6 border-t border-gray-100 dark:border-slate-800">
                <div className="w-full md:w-1/3 mb-3 md:mb-0">
                  <label className="text-[14px] font-semibold text-slate-800 dark:text-white">Certifications</label>
                </div>
                <div className="w-full md:w-2/3">
                  <input 
                    type="text" 
                    value={certifications}
                    onChange={e => setCertifications(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none transition-all text-[15px]"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row py-6 border-t border-gray-100 dark:border-slate-800">
                <div className="w-full md:w-1/3 mb-3 md:mb-0">
                  <label className="text-[14px] font-semibold text-slate-800 dark:text-white">Experience</label>
                  <p className="text-[13px] text-gray-500 mt-1 pr-4">Detail your teaching experience.</p>
                </div>
                <div className="w-full md:w-2/3">
                  <textarea 
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none transition-all resize-none text-[15px]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Change Password Section */}
          <div className="flex flex-col md:flex-row py-6 border-t border-gray-100 dark:border-slate-800">
            <div className="w-full md:w-1/3 mb-4 md:mb-0">
              <label className="text-[14px] font-semibold text-slate-800 dark:text-white">Change Password</label>
              <p className="text-[13px] text-gray-500 mt-1 pr-4">Leave blank to keep your current password.</p>
            </div>
            <div className="w-full md:w-2/3 space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none transition-all text-[15px]"
                  placeholder="New Password"
                />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 outline-none transition-all text-[15px]"
                  placeholder="Confirm New Password"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
