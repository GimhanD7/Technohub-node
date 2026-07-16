"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export default function SecurityProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/security`);
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (error) {
        console.error("Failed to load global security settings", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!settings) return;

    let shouldRestrict = true;
    if (settings.developer_master_mode && user && user.role === 'admin') {
      shouldRestrict = false;
    }

    const disableRightClick = (e) => e.preventDefault();
    const disableDevTools = (e) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
      }
      // Ctrl+Shift+I (73), Ctrl+Shift+J (74), Ctrl+Shift+C (67)
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault();
      }
      // Ctrl+U (85)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
      }
    };

    let detectDevTools;
    let consoleClearInterval;

    if (shouldRestrict) {
      if (settings.right_click_restriction) {
        document.addEventListener("contextmenu", disableRightClick);
      }
      
      if (settings.developer_options_restriction) {
        document.addEventListener("keydown", disableDevTools);

        // Disable console output and clear it aggressively
        const noop = () => {};
        ['log', 'warn', 'info', 'error', 'dir', 'debug', 'table'].forEach((method) => {
          if (window.console && window.console[method]) {
            window.console[method] = noop;
          }
        });
        
        consoleClearInterval = setInterval(() => {
          console.clear();
        }, 1000);

        // Detect if DevTools is open via window size difference
        detectDevTools = () => {
          const threshold = 160;
          const widthDiff = window.outerWidth - window.innerWidth > threshold;
          const heightDiff = window.outerHeight - window.innerHeight > threshold;
          if (widthDiff || heightDiff) {
            setIsDevToolsOpen(true);
          } else {
            setIsDevToolsOpen(false);
          }
        };

        window.addEventListener('resize', detectDevTools);
        detectDevTools(); // Initial check
      }
    }

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
      document.removeEventListener("keydown", disableDevTools);
      if (detectDevTools) {
        window.removeEventListener('resize', detectDevTools);
      }
      if (consoleClearInterval) {
        clearInterval(consoleClearInterval);
      }
    };
  }, [settings, user]);

  // Determine if we should show watermark
  const showWatermark = settings?.anti_recording_watermark && 
                        !(settings?.developer_master_mode && user?.role === 'admin');

  if (isDevToolsOpen) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[99999] flex flex-col items-center justify-center text-white">
         <h1 className="text-3xl font-bold text-red-500 mb-4">Security Violation</h1>
         <p>Developer tools are restricted on this platform.</p>
         <p className="text-sm mt-2 text-slate-400">Please close the developer tools (F12) to continue using the application.</p>
      </div>
    );
  }

  return (
    <>
      {children}
      {isClient && showWatermark && (
        <div 
          className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" 
          aria-hidden="true"
        >
          {/* Create a repeating pattern of the user's ID or phone */}
          <div className="absolute inset-0 flex flex-wrap justify-center items-center opacity-[0.03] rotate-[-25deg] scale-150 select-none">
            {Array.from({ length: 150 }).map((_, i) => (
              <span key={i} className="text-xl font-bold p-10 whitespace-nowrap text-slate-900 dark:text-white">
                {user ? `${user.name} - ${user.phone_number || user.id}` : "Techno-Hub Viewer"}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
