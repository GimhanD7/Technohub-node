"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, KeyRound, Lock, Save, RefreshCw, AlertTriangle, MonitorX, MousePointerClick, Copyright, Code } from "lucide-react";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";

export default function SecuritySettingsPage() {
  const [pin, setPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    developer_options_restriction: false,
    right_click_restriction: false,
    anti_recording_watermark: false,
    developer_master_mode: false
  });

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (pin !== "7845") {
      toast.error("Invalid security PIN.");
      return;
    }
    
    setIsUnlocked(true);
    fetchSettings();
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/security`);
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      toast.error("Failed to load security settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`${API_BASE_URL}/admin/security`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pin: pin,
          settings: settings
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setSettings(data.settings);
      } else {
        toast.error(data.message || "Failed to save settings.");
      }
    } catch (error) {
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto mt-20">
        
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Security Vault</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Enter the master PIN to access global security restrictions and system protections.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors text-center font-mono text-lg tracking-[0.5em] dark:text-white"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              disabled={!pin}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors shadow-sm"
            >
              Unlock Settings
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" /> Global Security Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage system-wide protections against piracy, content scraping, and unauthorized access.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading || isSaving}
          className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-400">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>Warning:</strong> These restrictions apply globally to all users connected to the system. Improper configuration may hinder normal usage. Enable Developer Master Mode to bypass restrictions for administrators.
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-primary" />
          <p>Loading security configuration...</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Developer Options Restriction */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-start justify-between gap-4 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
                <MonitorX className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Developer Options Restriction</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Blocks access to browser Developer Tools (F12, Ctrl+Shift+I, View Source) to prevent code inspection and video link extraction.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.developer_options_restriction}
                onChange={() => toggleSetting('developer_options_restriction')}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
            </label>
          </div>

          {/* Right-Click Restriction */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-start justify-between gap-4 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
                <MousePointerClick className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Right-Click Restriction</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Disables the right-click context menu across the entire application to prevent quick saving of images and text copying.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.right_click_restriction}
                onChange={() => toggleSetting('right_click_restriction')}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
            </label>
          </div>

          {/* Anti-Recording Watermark */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-start justify-between gap-4 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
                <Copyright className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Anti-Recording Watermark</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Overlays a dynamic, low-opacity watermark containing the active user's ID/Phone to deter screen recording and copyright theft.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.anti_recording_watermark}
                onChange={() => toggleSetting('anti_recording_watermark')}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
            </label>
          </div>

          {/* Developer Master Mode */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 p-5 shadow-sm flex items-start justify-between gap-4 transition-colors">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#1e293b] border border-blue-100 dark:border-blue-800/30 flex items-center justify-center shrink-0">
                <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Developer Master Mode</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Allows users with "Admin" privileges to bypass all restrictions globally. When disabled, administrators are restricted as well.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.developer_master_mode}
                onChange={() => toggleSetting('developer_master_mode')}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
            </label>
          </div>

        </div>
      )}
    </div>
  );
}
