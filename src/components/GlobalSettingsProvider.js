"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

const GlobalSettingsContext = createContext({
  settings: null,
  isLoading: true
});

export function GlobalSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/system/settings`);
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (error) {
        console.error("Failed to fetch global settings", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <GlobalSettingsContext.Provider value={{ settings, isLoading }}>
      {/* Dynamic CSS injection for theme colors */}
      {settings && (
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --primary: ${settings.primary_color || '#1a3cb6'};
              --secondary: ${settings.secondary_color || '#efc300'};
            }
          `
        }} />
      )}
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export const useGlobalSettings = () => useContext(GlobalSettingsContext);
