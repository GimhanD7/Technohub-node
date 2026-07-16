import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import SecurityProvider from "@/components/SecurityProvider";
import { GlobalSettingsProvider } from "@/components/GlobalSettingsProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata = {
  title: "Techno-Hub | Premium Online Learning Platform",
  description: "Join Techno-Hub, the ultimate online learning platform. Access video lessons, live online classes, virtual exam halls, e-books, and rank among top students.",
  keywords: ["online learning", "video lessons", "online classes", "exam hall", "e-books", "student ranker", "education platform", "Techno-Hub", "e-learning", "online courses"],
  authors: [{ name: "Techno-Hub" }],
  creator: "Techno-Hub",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className="scroll-smooth antialiased"
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden transition-colors duration-300">
        <GlobalSettingsProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <SecurityProvider>
              {children}
              <Toaster position="top-right" />
            </SecurityProvider>
          </ThemeProvider>
        </GlobalSettingsProvider>
      </body>
    </html>
  );
}
