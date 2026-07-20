"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Loader2, Globe, Palette, Phone, Mail, MapPin, Link2, Share2, MessageCircle, AtSign } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";
import { digitsOnly, getEmailError, getPhoneError, normalizeEmail } from "@/lib/validation";

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    site_name: "",
    primary_color: "#1a3cb6",
    secondary_color: "#efc300",
    contact_email: "",
    contact_phone: "",
    address: "",
    facebook_url: "",
    youtube_url: "",
    instagram_url: "",
    linkedin_url: "",
    twitter_url: ""
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/system_settings`);
      const data = await res.json();
      if (data.success && data.settings) {
        const cleanSettings = {};
        for (const key in data.settings) {
          cleanSettings[key] = data.settings[key] === null ? "" : data.settings[key];
        }
        setSettings(prev => ({ ...prev, ...cleanSettings }));
      }
    } catch (error) {
      toast.error("Failed to load settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: name === "contact_phone" ? digitsOnly(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = getEmailError(settings.contact_email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    if (settings.contact_phone) {
      const phoneError = getPhoneError(settings.contact_phone);
      if (phoneError) {
        toast.error(phoneError);
        return;
      }
    }

    try {
      setIsSaving(true);
      const res = await fetch(`${API_BASE_URL}/admin/system_settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, contact_email: normalizeEmail(settings.contact_email) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        // Force reload to apply new CSS variables across the app
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(data.message || "Failed to update settings.");
      }
    } catch (error) {
      toast.error("Error saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300 pb-12">
      
      
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> System Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your platform's global configurations, theme colors, and social media links.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* General Settings */}
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-[16px] font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" /> General Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Site Name</label>
              <input 
                type="text" 
                name="site_name"
                value={settings.site_name} 
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:outline-none focus:border-primary dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-[16px] font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-500" /> Theme Colors
          </h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6">Select the primary and secondary colors that will be applied throughout the entire system interface.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Primary Color (Hex)</label>
              <div className="flex gap-3">
                <input 
                  type="color" 
                  name="primary_color"
                  value={settings.primary_color} 
                  onChange={handleChange}
                  className="w-12 h-10 p-1 rounded cursor-pointer bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700"
                />
                <input 
                  type="text" 
                  name="primary_color"
                  value={settings.primary_color} 
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] uppercase focus:outline-none focus:border-primary dark:text-white font-mono"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Secondary Color (Hex)</label>
              <div className="flex gap-3">
                <input 
                  type="color" 
                  name="secondary_color"
                  value={settings.secondary_color} 
                  onChange={handleChange}
                  className="w-12 h-10 p-1 rounded cursor-pointer bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700"
                />
                <input 
                  type="text" 
                  name="secondary_color"
                  value={settings.secondary_color} 
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] uppercase focus:outline-none focus:border-secondary dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-[#0f172a]">
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Live Preview</p>
            <div className="flex gap-4">
              <button type="button" style={{ backgroundColor: settings.primary_color }} className="px-6 py-2 rounded-lg text-white font-medium text-[13px] shadow-sm">Primary Button</button>
              <button type="button" style={{ backgroundColor: settings.secondary_color }} className="px-6 py-2 rounded-lg text-white font-medium text-[13px] shadow-sm text-slate-900">Secondary Button</button>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-[16px] font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-500" /> Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2"><Mail className="w-3.5 h-3.5"/> Support Email</label>
              <input 
                type="email" 
                name="contact_email"
                value={settings.contact_email} 
                onChange={handleChange}
                placeholder="support@example.com"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:outline-none focus:border-primary dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2"><Phone className="w-3.5 h-3.5"/> Contact Phone</label>
              <input 
                type="tel" 
                name="contact_phone"
                value={settings.contact_phone} 
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="94771234567"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:outline-none focus:border-primary dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2"><MapPin className="w-3.5 h-3.5"/> Office Address</label>
              <textarea 
                name="address"
                value={settings.address} 
                onChange={handleChange}
                placeholder="123 Main St, City, Country"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:outline-none focus:border-primary dark:text-white min-h-[80px]"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-[16px] font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" /> Social Media Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2"><Link2 className="w-4 h-4 text-blue-600"/> Facebook</label>
              <input 
                type="url" 
                name="facebook_url"
                value={settings.facebook_url} 
                onChange={handleChange}
                placeholder="https://facebook.com/yourpage"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:outline-none focus:border-primary dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2"><Share2 className="w-4 h-4 text-red-600"/> YouTube</label>
              <input 
                type="url" 
                name="youtube_url"
                value={settings.youtube_url} 
                onChange={handleChange}
                placeholder="https://youtube.com/yourchannel"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:outline-none focus:border-primary dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-pink-600"/> Instagram</label>
              <input 
                type="url" 
                name="instagram_url"
                value={settings.instagram_url} 
                onChange={handleChange}
                placeholder="https://instagram.com/yourprofile"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:outline-none focus:border-primary dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-700"/> LinkedIn</label>
              <input 
                type="url" 
                name="linkedin_url"
                value={settings.linkedin_url} 
                onChange={handleChange}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:outline-none focus:border-primary dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2"><AtSign className="w-4 h-4 text-sky-500"/> Twitter / X</label>
              <input 
                type="url" 
                name="twitter_url"
                value={settings.twitter_url} 
                onChange={handleChange}
                placeholder="https://twitter.com/yourprofile"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:outline-none focus:border-primary dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-medium text-[14px] hover:bg-primary/90 transition-colors disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save & Apply Settings
          </button>
        </div>

      </form>
    </div>
  );
}
