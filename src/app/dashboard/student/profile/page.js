"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, AlignRight, Loader2 } from "lucide-react";
import { fetchApi, BASE_URL } from "@/lib/api";
import ProfileForm from "@/components/ProfileForm";
import MobileProfileMain from "./components/MobileProfileMain";
import MobileProfileDetails from "./components/MobileProfileDetails";
import MobileProfilePassword from "./components/MobileProfilePassword";
import { toast } from "react-hot-toast";
import { getEmailError, getPasswordError, normalizeEmail } from "@/lib/validation";

export default function StudentProfilePage() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState("main"); // "main", "details", "password"
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [educationCategory, setEducationCategory] = useState("");
  const [educationInfo, setEducationInfo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setFullName(parsed.full_name || "");
      setEmail(parsed.email || "");
      setAddress(parsed.address || "");
      setBirthdate(parsed.birthdate || "");
      setEducationCategory(parsed.education_category || "");
      setEducationInfo(parsed.education_info || "");
    }
  }, []);

  if (!user) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const handleBack = () => {
    if (currentView === "password") {
      setCurrentView("details");
    } else {
      setCurrentView("main");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("techno_hub_user");
    window.location.href = "/";
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    const formDataObj = new FormData();
    formDataObj.append('image', file);
    formDataObj.append('id', user.id);

    try {
        const response = await fetch(`${BASE_URL}/api/user/upload_profile`, {
            method: 'POST',
            body: formDataObj
        });
        const data = await response.json();
        
        if (data.success) {
            const updatedUser = { ...user, profile_picture: data.imageUrl };
            setUser(updatedUser);
            localStorage.setItem("techno_hub_user", JSON.stringify(updatedUser));
            
            // Still need to update via update_profile API to save it to DB permanently.
            await fetchApi("/user/update_profile", {
              method: "POST",
              body: JSON.stringify({
                id: user.id,
                phoneNumber: user.phone_number,
                fullName: user.full_name,
                address: user.address || "-",
                profilePicture: data.imageUrl
              })
            });
        }
    } catch (error) {
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    const emailError = getEmailError(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    setIsLoading(true);
    
    const response = await fetchApi("/user/update_profile", {
      method: "POST",
      body: JSON.stringify({
        id: user.id,
        phoneNumber: user.phone_number,
        fullName,
        email: normalizeEmail(email),
        address: address || "-",
        birthdate,
        educationCategory,
        educationInfo
      })
    });
    
    if (response.success) {
      toast.success("Profile updated successfully");
      const updatedUser = { ...user, full_name: fullName, email, address, birthdate, education_category: educationCategory, education_info: educationInfo };
      setUser(updatedUser);
      localStorage.setItem("techno_hub_user", JSON.stringify(updatedUser));
    } else {
      toast.error(response.message || "Failed to update profile");
    }
    setIsLoading(false);
  };

  const handleChangePassword = async () => {
    const passwordError = getPasswordError(password, { required: true });
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    
    const response = await fetchApi("/user/update_profile", {
      method: "POST",
      body: JSON.stringify({
        id: user.id,
        phoneNumber: user.phone_number,
        fullName: user.full_name,
        address: user.address || "-",
        password: password
      })
    });
    
    if (response.success) {
      toast.success("Password changed successfully");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setCurrentView("details");
      }, 1500);
    } else {
      toast.error(response.message || "Failed to change password");
    }
    setIsLoading(false);
  };

  const getProfileImage = () => {
    if (user.profile_picture) {
      return user.profile_picture.startsWith('http') ? user.profile_picture : `${BASE_URL}${user.profile_picture}`;
    }
    return null;
  };

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block p-8 max-w-7xl mx-auto h-full">
        <ProfileForm initialUser={user} />
      </div>

      {/* Mobile View */}
      <div className="md:hidden bg-[#1A2238] min-h-full mx-auto overflow-hidden relative flex flex-col font-sans -m-4">
      
      {/* Header */}
      <div className="px-6 py-8 flex items-center justify-between text-white shrink-0">
        <button onClick={currentView !== "main" ? handleBack : undefined} className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center ${currentView === "main" ? "invisible" : ""}`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[17px] font-bold tracking-wide">
          {currentView === "main" && "Profile"}
          {currentView === "details" && "Profile Details"}
          {currentView === "password" && "Profile Details"}
        </h1>
        <button onClick={() => document.dispatchEvent(new CustomEvent('open-mobile-sidebar'))} className="w-8 h-8 flex items-center justify-center">
          <AlignRight className="w-6 h-6" />
        </button>
      </div>

      {/* White Card Container */}
      <div className="bg-white dark:bg-[#0f172a] flex-1 rounded-t-[30px] p-6 pb-24 overflow-y-auto">
        
        {currentView === "main" && (
          <MobileProfileMain 
            user={user} 
            setCurrentView={setCurrentView} 
            handleLogout={handleLogout} 
            getProfileImage={getProfileImage} 
          />
        )}

        {currentView === "details" && (
          <MobileProfileDetails 
            user={user}
            getProfileImage={getProfileImage}
            fileInputRef={fileInputRef}
            handleImageUpload={handleImageUpload}
            isLoading={isLoading}
            fullName={fullName}
            setFullName={setFullName}
            email={email}
            setEmail={setEmail}
            address={address}
            setAddress={setAddress}
            birthdate={birthdate}
            setBirthdate={setBirthdate}
            educationCategory={educationCategory}
            setEducationCategory={setEducationCategory}
            educationInfo={educationInfo}
            setEducationInfo={setEducationInfo}
            setCurrentView={setCurrentView}
            handleSaveDetails={handleSaveDetails}
          />
        )}

        {currentView === "password" && (
          <MobileProfilePassword 
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            isLoading={isLoading}
            handleChangePassword={handleChangePassword}
          />
        )}

      </div>
    </div>
    </>
  );
}
