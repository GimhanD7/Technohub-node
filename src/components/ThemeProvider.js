"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
});

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children, defaultTheme = "light" }) {
  const [theme, setThemeState] = useState(defaultTheme);

  useEffect(() => {
    const themeTimer = window.setTimeout(() => {
      const storedTheme = localStorage.getItem("theme");
      const initialTheme = storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : defaultTheme;

      setThemeState(initialTheme);
      applyTheme(initialTheme);
    }, 0);

    return () => window.clearTimeout(themeTimer);
  }, [defaultTheme]);

  const setTheme = useCallback((nextTheme) => {
    setThemeState((currentTheme) => {
      const resolvedTheme = typeof nextTheme === "function"
        ? nextTheme(currentTheme)
        : nextTheme;
      const safeTheme = resolvedTheme === "dark" ? "dark" : "light";

      localStorage.setItem("theme", safeTheme);
      applyTheme(safeTheme);
      return safeTheme;
    });
  }, []);

  const value = useMemo(() => ({
    theme,
    resolvedTheme: theme,
    setTheme,
  }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
