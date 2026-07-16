
"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { fetchApi, BASE_URL } from "@/lib/api";
import {
  ArrowDownToLine,
  BookOpen,
  FileText,
  GraduationCap,
  Library,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

const fallbackResources = [
  {
    id: "sample-1",
    title: "Advanced ICT Revision Guide",
    author: "Techno-Hub Academic Team",
    subject: "ICT",
    category: "Revision Guide",
    level: "Advanced Level",
    description: "A structured guide covering core theory, short notes, and exam-ready summaries.",
    fileUrl: "#",
    fileType: "PDF",
    fileSize: null,
    isFeatured: true,
  },
  {
    id: "sample-2",
    title: "Web Development Fundamentals",
    author: "Techno-Hub Academic Team",
    subject: "Programming",
    category: "E-Book",
    level: "Beginner",
    description: "Practical reading material for HTML, CSS, JavaScript, and frontend foundations.",
    fileUrl: "#",
    fileType: "PDF",
    fileSize: null,
    isFeatured: false,
  },
  {
    id: "sample-3",
    title: "Database Concepts Workbook",
    author: "Techno-Hub Academic Team",
    subject: "Database",
    category: "Workbook",
    level: "Intermediate",
    description: "Exercises, ER diagrams, normalization notes, and query practice for learners.",
    fileUrl: "#",
    fileType: "PDF",
    fileSize: null,
    isFeatured: false,
  },
];

function formatFileSize(size) {
  if (!size) return "Ready to read";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getResourceUrl(url) {
  if (!url || url === "#") return "#";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${BASE_URL}${url}`;
}

export default function EBookPage() {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const loadResources = async () => {
      setIsLoading(true);
      const data = await fetchApi("/ebook/list");
      setIsLoading(false);

      if (data.success && data.resources.length > 0) {
        setResources(data.resources);
      } else {
        setResources(fallbackResources);
      }
    };

    loadResources();
  }, []);

  const subjects = useMemo(() => ["All", ...new Set(resources.map((item) => item.subject).filter(Boolean))], [resources]);
  const categories = useMemo(() => ["All", ...new Set(resources.map((item) => item.category).filter(Boolean))], [resources]);

  const filteredResources = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    return resources.filter((item) => {
      const matchesSearch = [item.title, item.author, item.subject, item.category, item.level, item.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchText);
      const matchesSubject = subject === "All" || item.subject === subject;
      const matchesCategory = category === "All" || item.category === category;

      return matchesSearch && matchesSubject && matchesCategory;
    });
  }, [category, query, resources, subject]);

  const featuredCount = resources.filter((item) => item.isFeatured).length;

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8fafc]">
        <section className="pt-28 pb-10 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b]">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-5">
                <Library className="w-4 h-4" />
                Digital Learning Library
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950 mb-5">
                E-Book Library
              </h1>
              <p className="text-slate-600 dark:text-white text-lg max-w-2xl leading-8">
                Explore curated study guides, workbooks, past-paper resources, and professional reading materials for focused learning.
              </p>
              <div className="grid grid-cols-3 gap-3 max-w-xl mt-8">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                  <p className="text-2xl font-bold text-slate-950">{resources.length}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-white">Resources</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                  <p className="text-2xl font-bold text-slate-950">{subjects.length - 1}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-white">Subjects</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                  <p className="text-2xl font-bold text-slate-950">{featuredCount}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-white">Featured</p>
                </div>
              </div>
            </div>

            <div className="relative min-h-[310px] rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#1a3cb6_0%,#0f172a_52%,#efc300_120%)] opacity-90" />
              <div className="relative p-8 h-full flex flex-col justify-between text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/60 font-bold">Featured Stack</p>
                    <h2 className="text-2xl font-bold mt-3">Professional course resources</h2>
                  </div>
                  <Sparkles className="w-8 h-8 text-secondary" />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-10">
                  {["Notes", "Guides", "Workbooks"].map((item, index) => (
                    <div key={item} className="rounded-lg bg-white dark:bg-[#1e293b]/10 border border-white/15 p-4 min-h-32 flex flex-col justify-between">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${index === 1 ? "bg-secondary text-slate-950" : "bg-white dark:bg-[#1e293b]/15 text-white"}`}>
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-4 mb-6 grid lg:grid-cols-[1fr_180px_180px] gap-3">
              <label className="relative block">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by title, subject, author..."
                  className="w-full h-11 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 pl-10 pr-4 text-sm text-slate-700 dark:text-white outline-none focus:border-primary dark:bg-[#0f172a] focus:bg-white dark:bg-[#1e293b]"
                />
              </label>
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="h-11 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm text-slate-700 dark:text-white outline-none focus:border-primary dark:bg-[#0f172a]"
              >
                {subjects.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 text-sm text-slate-700 dark:text-white outline-none focus:border-primary dark:bg-[#0f172a]"
              >
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="py-20 flex justify-center text-slate-500 dark:text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredResources.map((resource) => (
                  <article key={resource.id} className="bg-white dark:bg-[#1e293b] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="h-40 bg-slate-900 relative overflow-hidden">
                      {resource.coverUrl ? (
                        <div
                          className="w-full h-full bg-cover bg-center"
                          style={{ backgroundImage: `url("${getResourceUrl(resource.coverUrl)}")` }}
                        />
                      ) : (
                        <div className="h-full p-5 flex flex-col justify-between bg-[linear-gradient(135deg,#0f172a,#1d4ed8_65%,#facc15_150%)] text-white">
                          <div className="w-12 h-12 rounded-lg bg-white dark:bg-[#1e293b]/12 border border-white/15 flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-white/60 font-bold">{resource.category}</p>
                            <h3 className="font-bold text-lg leading-tight mt-1 line-clamp-2">{resource.subject}</h3>
                          </div>
                        </div>
                      )}
                      {resource.isFeatured && (
                        <span className="absolute top-3 right-3 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase text-slate-950">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
                        <GraduationCap className="w-4 h-4" />
                        {resource.level}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">{resource.title}</h2>
                      <p className="text-xs text-slate-500 dark:text-white mt-1">{resource.author || "Techno-Hub Academic Team"}</p>
                      <p className="text-sm text-slate-600 dark:text-white leading-6 mt-4 flex-1">{resource.description}</p>
                      <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                        <span className="text-xs font-semibold text-slate-500 dark:text-white">{formatFileSize(resource.fileSize)}</span>
                        <a
                          href={getResourceUrl(resource.fileUrl)}
                          target={resource.fileUrl === "#" ? "_self" : "_blank"}
                          rel="noreferrer"
                          className={resource.fileUrl === "#" ? "pointer-events-none opacity-60" : ""}
                        >
                          <Button size="sm" className="gap-2">
                            <ArrowDownToLine className="w-4 h-4" />
                            Open
                          </Button>
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!isLoading && filteredResources.length === 0 && (
              <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg py-16 text-center text-slate-500 dark:text-white">
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium">No e-book resources match your search.</p>
              </div>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
