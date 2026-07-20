"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { BASE_URL, fetchApi } from "@/lib/api";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Library,
  MessageSquareQuote,
  MonitorPlay,
  Play,
  Sparkles,
  Star,
  Trophy,
  UsersRound,
} from "lucide-react";

const reelImages = [
  {
    src: "/uploads/gallery/gallery_1781980894_6a36dede54489.jpg",
    title: "Industry Learning Events",
    label: "CodeFest 2025",
  },
  {
    src: "/uploads/gallery/gallery_1781980894_6a36dede55846.jpg",
    title: "Expert Mentor Sessions",
    label: "Professional Guidance",
  },
  {
    src: "/uploads/gallery/gallery_1781981634_6a36e1c236580.jpg",
    title: "Project-Based Learning",
    label: "Student Showcase",
  },
  {
    src: "/uploads/gallery/gallery_1781981634_6a36e1c2374e2.jpg",
    title: "Practical Classrooms",
    label: "Hands-on Training",
  },
];

const fallbackSettings = {
  heroBadge: "Sri Lanka's digital learning hub",
  heroTitle: "Learn smarter with one connected education platform.",
  heroSubtitle: "Techno-Hub brings video lessons, online classes, quizzes, e-books, events, and student progress tools together for school, university, vocational, and professional learners.",
  primaryCtaLabel: "Start Learning",
  primaryCtaUrl: "/register",
  secondaryCtaLabel: "Explore Courses",
  secondaryCtaUrl: "/home/online-class",
  coursesHeading: "Choose the learning path that fits your goal.",
  coursesSubtitle: "Browse guided lessons, live classes, exam practice, and digital resources.",
  lecturersHeading: "Learn from mentors who connect lessons with real outcomes.",
  lecturersSubtitle: "The lecturer team supports theory, practical skills, exam preparation, and professional growth across each learning category.",
  whyHeading: "A professional learning space built around student progress.",
  whySubtitle: "The platform is designed for repeated learning, guided resources, measurable exam practice, and easy communication between learners and administrators.",
  timetableHeading: "Plan your week with live classes and practice sessions.",
  timetableSubtitle: "Timetables help learners balance revision, live teaching, practical work, and assessments throughout the week.",
  faqHeading: "Questions students usually ask.",
};

const courseTracks = [
  {
    icon: MonitorPlay,
    title: "Courses",
    description: "Structured lessons for repeat study, revision, and self-paced learning.",
    href: "/home/courses",
  },
  {
    icon: UsersRound,
    title: "Online Classes",
    description: "Live sessions for school, university, vocational, and professional learners.",
    href: "/home/online-class",
  },
  {
    icon: Trophy,
    title: "Exam Hall",
    description: "Timed quizzes, rankings, and performance checks for exam preparation.",
    href: "/home/exam-hall",
  },
  {
    icon: Library,
    title: "E-Book Library",
    description: "Digital study guides, handouts, workbooks, and professional resources.",
    href: "/home/e-book",
  },
];

const whyItems = [
  "Category-based student learning paths",
  "Admin-managed resources, gallery, and contact pages",
  "Quizzes, rankings, e-books, and live class access in one place",
  "Built for school, O/L, A/L, university, vocational, and professional learners",
];

const lecturers = [
  {
    name: "Dr. Nuwan Jayasinghe",
    subject: "ICT and Software Engineering",
    focus: "Guides learners through programming, systems thinking, and project-based development.",
    initials: "NJ",
    tone: "from-[#1a3cb6] to-[#0f172a]",
  },
  {
    name: "Ms. Amaya Perera",
    subject: "Mathematics and Analytics",
    focus: "Builds strong foundations for exams, logical reasoning, and data-driven problem solving.",
    initials: "AP",
    tone: "from-[#0f766e] to-[#123047]",
  },
  {
    name: "Mr. Kavindu Silva",
    subject: "Web Development",
    focus: "Teaches practical frontend skills with real assignments, reviews, and portfolio outcomes.",
    initials: "KS",
    tone: "from-[#7c3aed] to-[#172554]",
  },
  {
    name: "Ms. Tharushi Fernando",
    subject: "Exam Strategy",
    focus: "Supports students with revision plans, timed practice, and confident exam preparation.",
    initials: "TF",
    tone: "from-[#b45309] to-[#1f2937]",
  },
  {
    name: "Mr. Lahiru Wijesinghe",
    subject: "Professional Skills",
    focus: "Mentors learners in communication, presentations, interviews, and career-ready habits.",
    initials: "LW",
    tone: "from-[#0f172a] to-[#1d4ed8]",
  },
];

const timetable = [
  { day: "Monday", time: "6.00 PM - 8.00 PM", title: "ICT Theory and Revision", mode: "Online" },
  { day: "Wednesday", time: "7.00 PM - 9.00 PM", title: "Practical Web Development", mode: "Live Lab" },
  { day: "Friday", time: "6.30 PM - 8.30 PM", title: "Exam Hall Practice", mode: "Assessment" },
  { day: "Saturday", time: "9.00 AM - 12.00 PM", title: "Professional Skills Workshop", mode: "Hybrid" },
];

const feedback = [
  {
    name: "A/L ICT Student",
    role: "Advanced Level",
    quote: "The quizzes and video lessons helped me revise faster because everything was connected in one platform.",
  },
  {
    name: "University Learner",
    role: "Software Foundation",
    quote: "The practical resources and e-books made it easier to prepare for assignments and project presentations.",
  },
  {
    name: "Professional Learner",
    role: "Career Upskilling",
    quote: "The platform feels focused. I can follow lessons, check resources, and keep track of learning activities clearly.",
  },
];

const faqs = [
  {
    question: "Can different student categories use the platform?",
    answer: "Yes. Techno-Hub supports school, O/L, A/L, university, vocational, and professional learners with category-focused resources.",
  },
  {
    question: "Are e-books and quizzes available online?",
    answer: "Yes. Students can access e-books, learning materials, quizzes, rankings, and exam practice from the platform.",
  },
  {
    question: "Can I join live or online classes?",
    answer: "Yes. Online classes and guided sessions can be managed through the platform alongside recorded video lessons.",
  },
  {
    question: "How do I contact the support team?",
    answer: "Use the Contact Us page to send a message or reach the education support team through the available contact details.",
  },
];

function getInitials(name) {
  return (name || "TH")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const getFullImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const cleanUrl = url.startsWith("/") ? url : "/" + url;
  return `${BASE_URL}${cleanUrl}`;
};

function mergeDisplayItems(adminItems, fallbackItems, minimumCount) {
  const activeItems = Array.isArray(adminItems) ? adminItems.filter(Boolean) : [];
  const merged = [...activeItems];
  const usedKeys = new Set(merged.map((item) => item.id || item.imageUrl || item.src || item.name));

  for (const item of fallbackItems) {
    const key = item.id || item.imageUrl || item.src || item.name;
    if (merged.length >= minimumCount) break;
    if (!usedKeys.has(key)) {
      merged.push(item);
      usedKeys.add(key);
    }
  }

  return merged.length > 0 ? merged : fallbackItems;
}

function buildLoopItems(items, minimumCount) {
  const baseItems = items.length > 0 ? items : [];
  const cycleCount = Math.max(2, Math.ceil(minimumCount / Math.max(baseItems.length, 1)));
  const evenCycleCount = cycleCount % 2 === 0 ? cycleCount : cycleCount + 1;

  return Array.from({ length: evenCycleCount }).flatMap(() => baseItems);
}

function ReelColumn({ slides, reverse = false }) {
  const repeatedImages = buildLoopItems(slides, 8);

  return (
    <div className="h-[620px] overflow-hidden rounded-lg">
      <div className={reverse ? "reel-track-reverse space-y-4" : "reel-track space-y-4"}>
        {repeatedImages.map((item, index) => (
          <article key={`${item.imageUrl || item.src}-${index}`} className="relative h-44 rounded-lg overflow-hidden border border-white/15 bg-slate-900 shadow-sm">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${getFullImageUrl(item.imageUrl || item.src)}")` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
            <div className="absolute left-4 right-4 bottom-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">{item.label}</p>
              <h3 className="text-sm font-bold mt-1">{item.title}</h3>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function LecturerSlider({ items }) {
  const repeatedLecturers = buildLoopItems(items, 12);

  return (
    <div className="relative overflow-hidden">
      <div className="lecturer-track flex gap-5 w-max">
        {repeatedLecturers.map((lecturer, index) => (
          <article key={`${lecturer.name}-${index}`} className="w-[310px] shrink-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] shadow-sm overflow-hidden">
            <div
              className={`h-40 ${lecturer.imageUrl ? "bg-cover bg-center" : `bg-gradient-to-br ${lecturer.tone || "from-[#1a3cb6] to-[#0f172a]"}`} relative p-5 text-white flex flex-col justify-between`}
              style={lecturer.imageUrl ? { backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.78), rgba(15,23,42,0.08)), url("${getFullImageUrl(lecturer.imageUrl)}")` } : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#1e293b]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                  Lecturer
                </span>
                <Award className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-white/70">{lecturer.subject}</p>
                  <h3 className="text-lg font-bold leading-tight mt-1">{lecturer.name}</h3>
                </div>
                <div className="h-16 w-16 shrink-0 rounded-lg border border-white/20 bg-white dark:bg-[#1e293b]/15 flex items-center justify-center text-xl font-black">
                  {lecturer.initials || getInitials(lecturer.name)}
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm leading-6 text-slate-600 dark:text-white">{lecturer.focus}</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50 pt-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  <GraduationCap className="w-4 h-4" />
                  Guided learning
                </span>
                <span className="text-xs font-semibold text-slate-400">Techno-Hub</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [settings, setSettings] = useState(fallbackSettings);
  const [slides, setSlides] = useState(reelImages);
  const [homeLecturers, setHomeLecturers] = useState(lecturers);
  const [homeTimetable, setHomeTimetable] = useState(timetable);

  useEffect(() => {
    const loadHomeContent = async () => {
      const data = await fetchApi("/home/get_content");
      if (!data.success) return;

      setSettings((current) => ({ ...current, ...data.settings }));
      setSlides(mergeDisplayItems(data.slides, reelImages, 4));
      if (data.timetable?.length > 0) setHomeTimetable(data.timetable);

      // Fetch real teachers from the system
      try {
        const teacherData = await fetchApi("/course/get_teachers");
        if (teacherData.success && teacherData.teachers.length > 0) {
          const tones = [
            "from-[#1a3cb6] to-[#0f172a]",
            "from-[#0f766e] to-[#123047]",
            "from-[#7c3aed] to-[#172554]",
            "from-[#b45309] to-[#1f2937]",
            "from-[#0f172a] to-[#1d4ed8]"
          ];
          const realTeachers = teacherData.teachers.map((t, index) => ({
            name: t.full_name,
            subject: "Teacher",
            focus: t.email || "Dedicated educator",
            initials: getInitials(t.full_name),
            tone: tones[index % tones.length],
          }));
          setHomeLecturers(realTeachers);
        } else {
          setHomeLecturers(mergeDisplayItems(data.lecturers, lecturers, 5));
        }
      } catch (e) {
        setHomeLecturers(mergeDisplayItems(data.lecturers, lecturers, 5));
      }
    };

    loadHomeContent();
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8fafc]">
        <section className="pt-24 pb-14 px-6 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.4fr] gap-12 items-center">
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="w-[280px]">
                <ReelColumn slides={slides} />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-5">
                <Sparkles className="w-4 h-4" />
                {settings.heroBadge}
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-950 leading-tight mb-6">
                {settings.heroTitle}
              </h1>
              <p className="text-slate-600 dark:text-white text-lg leading-8 max-w-2xl mb-4">
                {settings.heroSubtitle}
              </p>

              {settings.aitiDescription && (
                <div className="p-4 my-5 rounded-xl bg-slate-50 dark:bg-slate-850/40 flex items-center gap-4 animate-in fade-in duration-300 max-w-2xl">
                  {settings.aitiLogo && (
                    <img 
                      src={getFullImageUrl(settings.aitiLogo)} 
                      alt="AITI Logo" 
                      className="h-11 w-auto object-contain shrink-0 max-w-[120px]" 
                    />
                  )}
                  <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {settings.aitiDescription}
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href={settings.primaryCtaUrl || "/register"}>
                  <Button className="gap-2 w-full sm:w-auto">
                    {settings.primaryCtaLabel || "Start Learning"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href={settings.secondaryCtaUrl || "/home/online-class"}>
                  <Button variant="secondary" className="gap-2 w-full sm:w-auto">
                    {settings.secondaryCtaLabel || "Explore Courses"}
                    <BookOpen className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <div className="mt-8 grid sm:grid-cols-3 gap-3 max-w-2xl">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                  <p className="text-2xl font-bold text-slate-950">6</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-white">Learner categories</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                  <p className="text-2xl font-bold text-slate-950">24/7</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-white">Resource access</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                  <p className="text-2xl font-bold text-slate-950">Live</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-white">Classes and exams</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Explore Courses</p>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-950">{settings.coursesHeading}</h2>
                {settings.coursesSubtitle && <p className="text-sm leading-6 text-slate-600 dark:text-white max-w-xl mt-3">{settings.coursesSubtitle}</p>}
              </div>
              <Link href="/home/e-book" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-slate-950">
                Browse resources
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
              {courseTracks.map((track) => {
                const TrackIcon = track.icon;
                return (
                  <Link key={track.title} href={track.href} className="group bg-white dark:bg-[#1e293b] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:border-primary/35 hover:-translate-y-1 transition-all">
                    <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
                      <TrackIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-950">{track.title}</h3>
                    <p className="text-sm leading-6 text-slate-600 dark:text-white mt-3">{track.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden border-y border-slate-800">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-[100px] opacity-30 translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20 -translate-x-1/3 translate-y-1/3"></div>

          <div className="max-w-5xl mx-auto text-center relative z-10 px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">{settings.lecturersHeading}</h2>
            <p className="text-slate-300 mx-auto mb-10 text-center leading-relaxed text-lg">
              {settings.lecturersSubtitle}
            </p>

            <div className="flex justify-center">
              <Link href="/home/teachers">
                <Button variant="primary" className="px-8 py-4 bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-3 rounded-full font-bold shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1">
                  <span className="text-lg">Explore Our Teachers</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 bg-white dark:bg-[#1e293b] border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Why Techno-Hub</p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-950 leading-tight">{settings.whyHeading}</h2>
              <p className="text-slate-600 dark:text-white leading-7 mt-5">
                {settings.whySubtitle}
              </p>
              <Link href="/home/contact-us" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-slate-950">
                Talk to support
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {whyItems.map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-5 flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm font-medium leading-6 text-slate-700 dark:text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.8fr_1.2fr] gap-8 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Timetables</p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-950">{settings.timetableHeading}</h2>
              <p className="text-slate-600 dark:text-white leading-7 mt-5">
                {settings.timetableSubtitle}
              </p>
            </div>

            <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {homeTimetable.map((slot) => (
                <div key={`${slot.day}-${slot.title}`} className="grid md:grid-cols-[130px_1fr_auto] gap-4 p-5 border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 items-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">{slot.day}</p>
                    <p className="text-sm font-semibold text-slate-500 dark:text-white mt-1 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {slot.time}
                    </p>
                  </div>
                  <h3 className="font-bold text-slate-950">{slot.title}</h3>
                  <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:text-white">
                    {slot.mode}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 bg-slate-950 text-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-secondary mb-2">Student Feedback</p>
                <h2 className="text-3xl md:text-4xl font-bold">Learners trust focused, practical support.</h2>
              </div>
              <MessageSquareQuote className="w-10 h-10 text-secondary" />
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {feedback.map((item) => (
                <article key={item.name} className="rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-[#1e293b]/10 p-5">
                  <p className="text-sm leading-7 text-slate-700 dark:text-white/80">&ldquo;{item.quote}&rdquo;</p>
                  <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10">
                    <h3 className="font-bold text-slate-900 dark:text-white">{item.name}</h3>
                    <p className="text-xs font-semibold text-secondary mt-1">{item.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 bg-white dark:bg-[#1e293b]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">FAQ</p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-950">{settings.faqHeading}</h2>
            </div>

            <div className="grid gap-3">
              {faqs.map((faq) => (
                <details key={faq.question} className="group rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-5 open:bg-white dark:bg-[#1e293b] open:shadow-sm">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-bold text-slate-950">
                    {faq.question}
                    <span className="h-8 w-8 rounded-lg bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-primary group-open:rotate-90 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </summary>
                  <p className="text-sm leading-7 text-slate-600 dark:text-white mt-4 max-w-3xl">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-12">
          <div className="max-w-5xl mx-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Ready for the next class?
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-950">Start learning with Techno-Hub today.</h2>
            </div>
            <Link href="/register">
              <Button className="gap-2">
                Create Student Account
                <Play className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
