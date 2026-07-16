"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { fetchApi, API_BASE_URL } from "@/lib/api";

export default function TeachersPage() {
  const [lecturers, setLecturers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchApi("/home/get_content");
        if (data.success) {
          // Only show active lecturer cards managed by the admin
          setLecturers((data.lecturers || []).filter((l) => l.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch lecturers:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Our Talented Teachers</h1>
          <p className="text-zinc-600 max-w-2xl mx-auto text-lg">
            Learn from industry experts, dedicated mentors, and experienced educators who are committed to your success.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : lecturers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {lecturers.map((lecturer) => (
              <div
                key={lecturer.id}
                className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Card header with image or initials */}
                <div className="h-36 bg-gradient-to-br from-primary/80 to-primary flex items-end justify-center relative">
                  {lecturer.imageUrl ? (
                    <img
                      src={`${API_BASE_URL}${lecturer.imageUrl}`}
                      alt={lecturer.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg translate-y-1/2"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-white dark:bg-[#1e293b] rounded-full flex items-center justify-center text-2xl font-bold shadow-lg translate-y-1/2 text-primary">
                      {lecturer.initials || lecturer.name?.charAt(0) || "T"}
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="pt-14 pb-8 px-6 text-center flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{lecturer.name}</h3>
                  <p className="text-sm font-semibold text-primary mb-3">{lecturer.subject}</p>
                  {lecturer.focus && (
                    <p className="text-sm text-slate-500 dark:text-white leading-relaxed line-clamp-3">{lecturer.focus}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 dark:text-white">
            <p>No lecturers have been added yet.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
