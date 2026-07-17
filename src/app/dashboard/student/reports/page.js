"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi, BASE_URL } from "@/lib/api";
import {
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "exams", label: "Quiz & Exam Results" },
  { id: "courses", label: "Course Progress" },
];

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function gradeClass(percentage) {
  if (percentage >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900";
  if (percentage >= 50) return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900";
  return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900";
}

function downloadBinaryFile(filename, bytes, type) {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function normalizePdfText(value) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pdfString(value) {
  return normalizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapPdfText(value, maxChars) {
  const words = normalizePdfText(value).split(" ").filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function createPdfDocument() {
  const width = 595;
  const height = 842;
  const margin = 44;
  const pages = [];
  let content = "";
  let y = height - margin;

  const ensureSpace = (needed = 40) => {
    if (y - needed < margin) {
      pages.push(content);
      content = "";
      y = height - margin;
    }
  };

  const moveDown = (amount = 12) => {
    ensureSpace(amount + 8);
    y -= amount;
  };

  const color = (rgb) => `${rgb[0]} ${rgb[1]} ${rgb[2]} rg`;
  const stroke = (rgb) => `${rgb[0]} ${rgb[1]} ${rgb[2]} RG`;

  const text = (value, x, size = 10, options = {}) => {
    ensureSpace(size + 8);
    const font = options.bold ? "F2" : "F1";
    const rgb = options.color || [0.06, 0.09, 0.16];
    content += `BT /${font} ${size} Tf ${color(rgb)} 1 0 0 1 ${x} ${y} Tm (${pdfString(value)}) Tj ET\n`;
    y -= options.lineHeight || size + 5;
  };

  const wrappedText = (value, x, maxChars, size = 10, options = {}) => {
    wrapPdfText(value, maxChars).forEach((line) => text(line, x, size, options));
  };

  const line = (x1, y1, x2, y2, rgb = [0.88, 0.91, 0.95]) => {
    content += `${stroke(rgb)} ${x1} ${y1} m ${x2} ${y2} l S\n`;
  };

  const rule = () => {
    ensureSpace(18);
    line(margin, y, width - margin, y);
    y -= 18;
  };

  const sectionTitle = (value) => {
    ensureSpace(34);
    y -= 4;
    text(value, margin, 14, { bold: true, color: [0.06, 0.09, 0.16], lineHeight: 20 });
  };

  const statRow = (items) => {
    ensureSpace(70);
    const cardWidth = 122;
    const cardHeight = 54;
    items.forEach((item, index) => {
      const x = margin + index * (cardWidth + 10);
      content += `${stroke([0.88, 0.91, 0.95])} ${x} ${y - cardHeight + 8} ${cardWidth} ${cardHeight} re S\n`;
      content += `BT /F1 8 Tf ${color([0.39, 0.45, 0.55])} 1 0 0 1 ${x + 10} ${y - 14} Tm (${pdfString(item.label)}) Tj ET\n`;
      content += `BT /F2 17 Tf ${color([0.06, 0.09, 0.16])} 1 0 0 1 ${x + 10} ${y - 38} Tm (${pdfString(item.value)}) Tj ET\n`;
    });
    y -= 74;
  };

  const table = (headers, rows, columnX, rowHeight = 24) => {
    ensureSpace(48);
    content += `${stroke([0.88, 0.91, 0.95])} ${margin} ${y - rowHeight + 8} ${width - margin * 2} ${rowHeight} re S\n`;
    headers.forEach((header, index) => {
      content += `BT /F2 8 Tf ${color([0.39, 0.45, 0.55])} 1 0 0 1 ${columnX[index]} ${y - 8} Tm (${pdfString(header)}) Tj ET\n`;
    });
    y -= rowHeight;

    rows.forEach((row) => {
      ensureSpace(rowHeight + 8);
      line(margin, y + 7, width - margin, y + 7);
      row.forEach((cell, index) => {
        content += `BT /F1 9 Tf ${color([0.06, 0.09, 0.16])} 1 0 0 1 ${columnX[index]} ${y - 8} Tm (${pdfString(cell)}) Tj ET\n`;
      });
      y -= rowHeight;
    });
  };

  const finish = () => {
    pages.push(content);
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    ];

    pages.forEach((pageContent, index) => {
      const pageObjectNumber = 3 + index * 2;
      const contentObjectNumber = pageObjectNumber + 1;
      objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R /F2 ${4 + pages.length * 2} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
      objects.push(`<< /Length ${pageContent.length} >>\nstream\n${pageContent}endstream`);
    });

    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Uint8Array([...pdf].map((char) => char.charCodeAt(0)));
  };

  return { margin, text, wrappedText, moveDown, rule, sectionTitle, statRow, table, finish };
}

function buildReportPdf(student, stats, exams, courses, generatedAt) {
  const pdf = createPdfDocument();

  pdf.text("TECHNO-HUB EDUCATION PLATFORM", pdf.margin, 9, { bold: true, color: [0.15, 0.39, 0.92], lineHeight: 24 });
  pdf.text("Student Result Sheet", pdf.margin, 22, { bold: true, lineHeight: 36 });
  pdf.text(`Generated: ${formatDateTime(generatedAt)}`, pdf.margin, 9, { color: [0.39, 0.45, 0.55], lineHeight: 24 });
  pdf.rule();
  pdf.wrappedText(`Student: ${student?.fullName || "Student"} | Category: ${student?.educationCategory || "Not assigned"} | Joined: ${formatDate(student?.joinedAt)}`, pdf.margin, 96, 10, { lineHeight: 17 });
  pdf.moveDown(10);

  pdf.statRow([
    { label: "Average Score", value: `${stats.average_score || 0}%` },
    { label: "Best Score", value: `${stats.best_score || 0}%` },
    { label: "Exams Taken", value: String(stats.total_exams_taken || 0) },
    { label: "Completed Courses", value: `${stats.completed_courses || 0}/${stats.total_enrolled || 0}` },
  ]);

  pdf.sectionTitle("Quiz & Exam Results");
  const examRows = exams.length
    ? exams.map((exam) => [
      normalizePdfText(exam.exam_title).slice(0, 28),
      formatDate(exam.submitted_at),
      `${exam.score}/${exam.total_possible_score}`,
      `${exam.percentage}%`,
      exam.grade,
      exam.status,
    ])
    : [["No submitted exams yet", "", "", "", "", ""]];
  pdf.table(["Assessment", "Date", "Score", "Percent", "Grade", "Status"], examRows, [48, 220, 300, 360, 430, 480]);

  pdf.sectionTitle("Course Progress");
  const courseRows = courses.length
    ? courses.map((course) => [
      normalizePdfText(course.title).slice(0, 32),
      normalizePdfText(course.teacher_name || "Techno-Hub").slice(0, 18),
      `${course.completed_materials}/${course.total_materials}`,
      `${course.progress_percentage}%`,
      course.is_completed ? "Completed" : "In Progress",
    ])
    : [["No enrolled courses yet", "", "", "", ""]];
  pdf.table(["Course", "Instructor", "Lessons", "Progress", "Status"], courseRows, [48, 245, 340, 410, 475]);

  return pdf.finish();
}

function buildExamPdf(student, exam, generatedAt) {
  const pdf = createPdfDocument();

  pdf.text("TECHNO-HUB EDUCATION PLATFORM", pdf.margin, 9, { bold: true, color: [0.15, 0.39, 0.92], lineHeight: 24 });
  pdf.text("Assessment Result Sheet", pdf.margin, 22, { bold: true, lineHeight: 38 });
  pdf.text(`Generated: ${formatDateTime(generatedAt)}`, pdf.margin, 9, { color: [0.39, 0.45, 0.55], lineHeight: 28 });
  pdf.rule();
  pdf.wrappedText(`Student: ${student?.fullName || "Student"}`, pdf.margin, 96, 11, { bold: true, lineHeight: 22 });
  pdf.wrappedText(`Assessment: ${exam.exam_title}`, pdf.margin, 80, 12, { bold: true, lineHeight: 24 });
  pdf.moveDown(18);
  pdf.text(`${exam.percentage}%`, pdf.margin, 36, { bold: true, color: [0.15, 0.39, 0.92], lineHeight: 58 });
  pdf.text(`Grade: ${exam.grade} | Status: ${exam.status}`, pdf.margin, 12, { bold: true, lineHeight: 34 });
  pdf.moveDown(4);
  pdf.table(["Detail", "Value"], [
    ["Score", `${exam.score} / ${exam.total_possible_score}`],
    ["Question Count", String(exam.question_count || 0)],
    ["Submitted At", formatDateTime(exam.submitted_at)],
    ["Instructor", exam.teacher_name || "Techno-Hub"],
  ], [48, 210], 28);

  return pdf.finish();
}

export default function GradesAndReports() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const loadReportData = useCallback(async (studentId) => {
    setIsLoading(true);
    setErrorMsg("");
    const res = await fetchApi(`/student/get_grades_reports?student_id=${studentId}`);
    if (res.success) {
      setReportData(res);
    } else {
      setErrorMsg(res.message || "Failed to load grades and reports.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      const savedUser = localStorage.getItem("techno_hub_user");
      if (!savedUser) {
        router.push("/login");
        return;
      }

      const parsed = JSON.parse(savedUser);
      if (parsed.role !== "student") {
        router.push("/login");
        return;
      }

      setUser(parsed);
      loadReportData(parsed.id);
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadReportData, router]);

  const exams = useMemo(() => reportData?.exams || [], [reportData]);
  const courses = useMemo(() => reportData?.courses || [], [reportData]);
  const stats = useMemo(() => reportData?.stats || {}, [reportData]);
  const student = reportData?.student || user;

  const filteredExams = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return exams;
    return exams.filter((exam) =>
      `${exam.exam_title || ""} ${exam.grade || ""} ${exam.status || ""}`.toLowerCase().includes(q)
    );
  }, [exams, searchTerm]);

  const completedCourses = courses.filter((course) => course.is_completed);
  const inProgressCourses = courses.filter((course) => !course.is_completed);

  const downloadFullReport = () => {
    const pdf = buildReportPdf(student, stats, exams, courses, reportData?.generatedAt);
    downloadBinaryFile("techno-hub-result-sheet.pdf", pdf, "application/pdf");
  };

  const downloadExamReport = (exam) => {
    const pdf = buildExamPdf(student, exam, reportData?.generatedAt);
    downloadBinaryFile(`techno-hub-${exam.exam_title || "exam"}-result.pdf`.replace(/[\\/:*?"<>|]+/g, "-"), pdf, "application/pdf");
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[13px] font-medium text-gray-500 dark:text-white">Preparing your academic report...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-3xl mx-auto rounded-lg border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <div>
            <h1 className="font-bold">Unable to load reports</h1>
            <p className="text-[13px] mt-1">{errorMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-right-4 duration-300">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#1e293b]">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary shadow-sm">
              <GraduationCap className="w-4 h-4" />
              Student academic record
            </div>
            <h1 className="mt-4 text-[22px] font-semibold tracking-tight text-slate-800 dark:text-white">Grades & Reports</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-gray-500 dark:text-white">
              View completed courses, quiz performance, exam grades, and download a PDF result sheet for your records.
            </p>
          </div>
          <button
            onClick={downloadFullReport}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Student</p>
            <p className="mt-1 text-[13px] font-medium text-slate-800 dark:text-white">{student?.fullName || user?.full_name || "Student"}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Category</p>
            <p className="mt-1 text-[13px] font-medium text-slate-800 dark:text-white">{student?.educationCategory || "Not assigned"}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Report Date</p>
            <p className="mt-1 text-[13px] font-medium text-slate-800 dark:text-white">{formatDate(reportData?.generatedAt)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Overall Progress</p>
            <p className="mt-1 text-[13px] font-medium text-slate-800 dark:text-white">{stats.overall_progress || 0}% completed</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Target} label="Average Score" value={`${stats.average_score || 0}%`} tone="blue" />
        <StatCard icon={Award} label="Best Score" value={`${stats.best_score || 0}%`} tone="emerald" />
        <StatCard icon={FileText} label="Exams Taken" value={stats.total_exams_taken || 0} tone="purple" />
        <StatCard icon={BookOpen} label="Courses Completed" value={`${stats.completed_courses || 0}/${stats.total_enrolled || 0}`} tone="amber" />
      </section>

      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-[#1e293b] md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-0 md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search exams or grades..."
            className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-[13px] outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel title="Recent Quiz & Exam Performance" icon={TrendingUp}>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {exams.slice(0, 5).map((exam) => (
                <ExamListItem key={exam.attempt_id} exam={exam} onDownload={() => downloadExamReport(exam)} />
              ))}
              {exams.length === 0 && <EmptyState title="No exam results yet" text="Submitted quizzes and exam results will appear here." />}
            </div>
          </Panel>

          <Panel title="Learning Completion" icon={BarChart3}>
            <div className="space-y-4">
              {courses.slice(0, 5).map((course) => (
                <CourseProgress key={course.id} course={course} />
              ))}
              {courses.length === 0 && <EmptyState title="No course records yet" text="Enroll in a course to start building your academic report." />}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "exams" && (
        <Panel title="Quiz & Exam Result Sheet" icon={FileText}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                  <th className="px-4 py-3 font-bold">Assessment</th>
                  <th className="px-4 py-3 font-bold">Submitted</th>
                  <th className="px-4 py-3 font-bold text-center">Score</th>
                  <th className="px-4 py-3 font-bold text-center">Percentage</th>
                  <th className="px-4 py-3 font-bold text-center">Grade</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredExams.map((exam) => (
                  <tr key={exam.attempt_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-slate-800 dark:text-white">{exam.exam_title}</p>
                      <p className="mt-1 text-[11px] text-gray-500 dark:text-white">{exam.teacher_name || "Techno-Hub"} - {exam.question_count || 0} questions</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-500 dark:text-white">{formatDateTime(exam.submitted_at)}</td>
                    <td className="px-4 py-3 text-center text-[13px] font-medium text-slate-800 dark:text-white">{exam.score} / {exam.total_possible_score}</td>
                    <td className="px-4 py-3 text-center text-[13px] font-semibold text-slate-800 dark:text-white">{exam.percentage}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-bold ${gradeClass(Number(exam.percentage))}`}>
                        {exam.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/home/exam-hall/quiz?id=${exam.quiz_id}`} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:text-slate-300">
                          Review
                        </Link>
                        <button onClick={() => downloadExamReport(exam)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90">
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredExams.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <EmptyState title="No matching exam results" text="Try a different search term or complete a quiz first." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {activeTab === "courses" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Completed Courses" icon={CheckCircle2}>
            <div className="grid gap-4">
              {completedCourses.map((course) => (
                <CourseCard key={course.id} course={course} completed />
              ))}
              {completedCourses.length === 0 && <EmptyState title="No completed courses yet" text="Complete every material in a course to move it into this section." />}
            </div>
          </Panel>

          <Panel title="In Progress" icon={CalendarDays}>
            <div className="grid gap-4">
              {inProgressCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
              {inProgressCourses.length === 0 && <EmptyState title="No active course progress" text="Your active course progress will show here." />}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#1e293b]">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-slate-800 dark:text-white">{value}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#1e293b]">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-[14px] font-bold text-slate-800 dark:text-white">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ExamListItem({ exam, onDownload }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[13px] font-medium text-slate-800 dark:text-white">{exam.exam_title}</p>
        <p className="mt-1 text-[11px] text-gray-500 dark:text-white">{formatDateTime(exam.submitted_at)} - {exam.teacher_name || "Techno-Hub"}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`rounded-md border px-2.5 py-1 text-[11px] font-bold ${gradeClass(Number(exam.percentage))}`}>{exam.grade}</span>
        <p className="w-16 text-right text-[13px] font-semibold text-slate-800 dark:text-white">{exam.percentage}%</p>
        <button onClick={onDownload} className="rounded-md border border-slate-200 p-2 text-slate-500 hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:text-slate-300">
          <Download className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CourseProgress({ course }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="truncate text-[13px] font-medium text-slate-800 dark:text-white">{course.title}</p>
        <span className="text-[11px] font-bold text-primary">{course.progress_percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={course.is_completed ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-primary"} style={{ width: `${course.progress_percentage}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{course.completed_materials} of {course.total_materials} materials completed</p>
    </div>
  );
}

function CourseCard({ course, completed = false }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="grid sm:grid-cols-[150px_1fr]">
        <div className="h-32 bg-slate-200 dark:bg-slate-800">
          {course.banner_url ? (
            // Uploaded course banners are served by the PHP/XAMPP asset path.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.banner_url.startsWith('http') ? course.banner_url : `${BASE_URL}${course.banner_url.startsWith('/') ? '' : '/'}${course.banner_url}`} alt={course.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-slate-900 text-white">
              <BookOpen className="h-8 w-8 opacity-80" />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">{course.title}</h3>
            {completed && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Instructor: {course.teacher_name || "Techno-Hub"}</p>
          <div className="mt-4">
            <CourseProgress course={course} />
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
      <FileText className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
      <h3 className="mt-3 text-[13px] font-bold text-slate-800 dark:text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-[13px] leading-6 text-gray-500 dark:text-white">{text}</p>
    </div>
  );
}
