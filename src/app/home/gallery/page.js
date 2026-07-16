"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { fetchApi } from "@/lib/api";
import {
  ArrowRight,
  CalendarDays,
  GraduationCap,
  Images,
  Loader2,
  MapPin,
  Newspaper,
  Search,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

const fallbackItems = [
  {
    id: "sample-event",
    title: "Annual ICT Excellence Day",
    entryType: "event",
    category: "Campus Event",
    eventDate: "2026-07-18",
    location: "Techno-Hub Main Auditorium",
    summary: "A celebration of student projects, live coding challenges, and digital learning milestones.",
    details: "Students present practical projects, meet mentors, and discover the next learning pathways available through the platform.",
    imageUrl: "",
    ctaLabel: "View Highlights",
    ctaUrl: "",
    isFeatured: true,
    images: [],
  },
  {
    id: "sample-news",
    title: "New Professional Learning Track Opened",
    entryType: "news",
    category: "Platform News",
    eventDate: "2026-06-24",
    location: "Online",
    summary: "Professional learners can now follow a guided path for web development, databases, and career-ready portfolio work.",
    details: "The new track combines e-books, video lessons, quizzes, and guided assignments for practical progress.",
    imageUrl: "",
    ctaLabel: "Read News",
    ctaUrl: "",
    isFeatured: false,
    images: [],
  },
];

const typeFilters = [
  { label: "All", value: "All", icon: Images },
  { label: "Events", value: "event", icon: CalendarDays },
  { label: "News", value: "news", icon: Newspaper },
  { label: "Achievements", value: "achievement", icon: Trophy },
  { label: "Workshops", value: "workshop", icon: GraduationCap },
];

const typeStyles = {
  event: {
    label: "Event",
    icon: CalendarDays,
    card: "from-[#0f172a] via-[#1a3cb6] to-[#efc300]",
    badge: "bg-primary text-white",
  },
  news: {
    label: "News",
    icon: Newspaper,
    card: "from-[#123047] via-[#0f766e] to-[#efc300]",
    badge: "bg-teal-600 text-white",
  },
  achievement: {
    label: "Achievement",
    icon: Trophy,
    card: "from-[#241437] via-[#7c3aed] to-[#efc300]",
    badge: "bg-violet-600 text-white",
  },
  workshop: {
    label: "Workshop",
    icon: GraduationCap,
    card: "from-[#172554] via-[#2563eb] to-[#14b8a6]",
    badge: "bg-blue-600 text-white",
  },
};

function formatDate(value) {
  if (!value) return "Recently added";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getItemImages(item) {
  const urls = (item.images || []).map((image) => image.imageUrl).filter(Boolean);
  if (item.imageUrl && !urls.includes(item.imageUrl)) {
    urls.unshift(item.imageUrl);
  }
  return urls;
}

function GalleryVisual({ item, className = "" }) {
  const imageUrl = getItemImages(item)[0];
  const style = imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined;
  const TypeIcon = typeStyles[item.entryType]?.icon || Images;

  return (
    <div className={`relative overflow-hidden bg-slate-950 ${className}`}>
      {imageUrl ? (
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={style} />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${typeStyles[item.entryType]?.card || typeStyles.event.card}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
      <div className="absolute left-4 top-4 h-11 w-11 rounded-lg border border-white/20 bg-white dark:bg-[#1e293b]/15 backdrop-blur flex items-center justify-center text-white">
        <TypeIcon className="h-5 w-5" />
      </div>
      {item.isFeatured && (
        <span className="absolute right-4 top-4 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase text-slate-950">
          Featured
        </span>
      )}
    </div>
  );
}

function GalleryDetailsModal({ item, onClose }) {
  const images = getItemImages(item);
  const [activeImage, setActiveImage] = useState(() => images[0] || "");
  const currentImage = activeImage || images[0] || "";
  const TypeIcon = typeStyles[item.entryType]?.icon || Images;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto bg-white dark:bg-[#1e293b] rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${typeStyles[item.entryType]?.badge || typeStyles.event.badge}`}>
              <TypeIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">{typeStyles[item.entryType]?.label || "Gallery"} / {item.category}</p>
              <h2 className="text-lg md:text-xl font-bold text-slate-950 truncate">{item.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-white hover:text-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
          <div className="bg-slate-950 p-4">
            <div
              className={`min-h-[320px] md:min-h-[520px] rounded-lg bg-cover bg-center ${currentImage ? "" : `bg-gradient-to-br ${typeStyles[item.entryType]?.card || typeStyles.event.card}`}`}
              style={currentImage ? { backgroundImage: `url("${currentImage}")` } : undefined}
            />
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-3">
                {images.map((imageUrl) => (
                  <button
                    key={imageUrl}
                    onClick={() => setActiveImage(imageUrl)}
                    className={`h-20 rounded-lg bg-cover bg-center border-2 transition ${currentImage === imageUrl ? "border-secondary" : "border-white/15 hover:border-white/60"}`}
                    style={{ backgroundImage: `url("${imageUrl}")` }}
                    aria-label="View gallery image"
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="p-6 lg:p-8 flex flex-col">
            <div className="flex flex-wrap gap-2 mb-5">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${typeStyles[item.entryType]?.badge || typeStyles.event.badge}`}>
                <TypeIcon className="h-3.5 w-3.5" />
                {typeStyles[item.entryType]?.label || "Gallery"}
              </span>
              {item.isFeatured && (
                <span className="rounded-full bg-secondary/30 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-900 dark:text-white">
                  Featured
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold text-slate-950 leading-tight">{item.title}</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-500 dark:text-white">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                {formatDate(item.eventDate || item.createdAt)}
              </span>
              {item.location && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {item.location}
                </span>
              )}
            </div>

            <p className="mt-6 text-base leading-7 text-slate-700 dark:text-white">{item.summary}</p>
            {item.details && <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-white whitespace-pre-line">{item.details}</p>}

            <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-white">{images.length || 1} image{(images.length || 1) === 1 ? "" : "s"}</span>
              {item.ctaUrl && (
                <a href={item.ctaUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" className="gap-2">
                    {item.ctaLabel || "Open Link"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeType, setActiveType] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      const data = await fetchApi("/gallery/list");
      setIsLoading(false);

      if (data.success && data.items.length > 0) {
        setItems(data.items);
      } else {
        setItems(fallbackItems);
      }
    };

    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType = activeType === "All" || item.entryType === activeType;
      const matchesSearch = [item.title, item.category, item.summary, item.details, item.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchText);

      return matchesType && matchesSearch;
    });
  }, [activeType, items, query]);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8fafc]">
        <section className="pt-28 pb-8 px-6 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-5">
                <Sparkles className="w-4 h-4" />
                Campus Stories and Learning Moments
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950 mb-5">
                Gallery
              </h1>
              <p className="text-slate-600 dark:text-white text-lg leading-8">
                Explore educational events, workshop updates, student achievements, and important platform news from the Techno-Hub learning community.
              </p>
            </div>

            <div className="mt-8 max-w-4xl">
              <label className="relative block">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search gallery stories, events, images, or news..."
                  className="w-full h-14 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 pl-12 pr-4 text-sm text-slate-700 dark:text-white outline-none focus:border-primary dark:bg-[#0f172a] focus:bg-white dark:bg-[#1e293b] focus:ring-4 focus:ring-primary/10"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex flex-wrap gap-2">
              {typeFilters.map((filter) => {
                const FilterIcon = filter.icon;
                const selected = activeType === filter.value;

                return (
                  <button
                    key={filter.value}
                    onClick={() => setActiveType(filter.value)}
                    className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-xs font-bold transition-colors ${
                      selected
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] text-slate-600 dark:text-white hover:border-primary/40"
                    }`}
                  >
                    <FilterIcon className="w-4 h-4" />
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {isLoading ? (
              <div className="py-20 flex justify-center text-slate-500 dark:text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredItems.map((item) => {
                  const TypeIcon = typeStyles[item.entryType]?.icon || Images;
                  const imageCount = getItemImages(item).length || 1;

                  return (
                    <article key={item.id} className="group bg-white dark:bg-[#1e293b] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                      <button onClick={() => setSelectedItem(item)} className="text-left">
                        <GalleryVisual item={item} className="h-56" />
                      </button>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${typeStyles[item.entryType]?.badge || typeStyles.event.badge}`}>
                            <TypeIcon className="h-3.5 w-3.5" />
                            {typeStyles[item.entryType]?.label || "Gallery"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600 dark:text-white">
                            {imageCount} Image{imageCount === 1 ? "" : "s"}
                          </span>
                        </div>

                        <button onClick={() => setSelectedItem(item)} className="text-left">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-primary transition-colors">{item.title}</h2>
                        </button>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-500 dark:text-white">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            {formatDate(item.eventDate || item.createdAt)}
                          </span>
                          {item.location && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-primary" />
                              {item.location}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-600 dark:text-white leading-6 mt-4 flex-1">{item.summary}</p>

                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-slate-500 dark:text-white">{item.category}</span>
                          <Button type="button" size="sm" className="gap-2" onClick={() => setSelectedItem(item)}>
                            More Details
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!isLoading && filteredItems.length === 0 && (
              <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg py-16 text-center text-slate-500 dark:text-white">
                <Images className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium">No gallery stories match your search.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      {selectedItem && <GalleryDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      <Footer />
    </>
  );
}
