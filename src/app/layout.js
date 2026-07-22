import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import SecurityProvider from "@/components/SecurityProvider";
import { GlobalSettingsProvider } from "@/components/GlobalSettingsProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata = {
  title: "Techno-Hub | Simply Learning Digitally",
  description: "Join Techno-Hub, the ultimate online learning platform. Access video lessons, live online classes, virtual exam halls, e-books, and rank among top students.",
  keywords: ["online learning", "video lessons", "online classes", "exam hall", "e-books", "student ranker", "education platform", "Techno-Hub", "e-learning", "online courses"],
  authors: [{ name: "Techno-Hub" }],
  creator: "Techno-Hub",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
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
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3500,
                  style: {
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    color: "#0f172a",
                    fontSize: "14px",
                    fontWeight: 600,
                    maxWidth: "420px",
                    padding: "14px 16px",
                    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.14)",
                  },
                  success: {
                    iconTheme: {
                      primary: "#16a34a",
                      secondary: "#ffffff",
                    },
                  },
                  error: {
                    duration: 4500,
                    iconTheme: {
                      primary: "#dc2626",
                      secondary: "#ffffff",
                    },
                  },
                }}
              />
            </SecurityProvider>
          </ThemeProvider>
        </GlobalSettingsProvider>
      </body>
    </html>
  );
}
