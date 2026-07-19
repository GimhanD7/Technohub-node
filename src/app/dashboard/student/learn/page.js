"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchApi, BASE_URL } from "@/lib/api";
import { Loader2, ArrowLeft, Video, FileText, PlayCircle, ChevronDown, ChevronRight, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";

const APACHE_APP_URL = BASE_URL;

function getResourceUrl(url) {
  if (!url) return "";
  return url.startsWith("/uploads/") ? `${APACHE_APP_URL}${url}` : url;
}

function getPdfViewerUrl(url) {
  if (!url) return "";
  const uploadedPdfPrefix = "/uploads/course-materials/";

  if (url.startsWith(uploadedPdfPrefix)) {
    const filename = url.slice(uploadedPdfPrefix.length);
    return `${BASE_URL}/uploads/course-materials/${filename}`;
  }

  return getResourceUrl(url);
}

export default function CourseViewer() {
  const searchParams = useSearchParams();
  const courseId = searchParams?.get("id");
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data States
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);

  // UI States
  const [expandedModules, setExpandedModules] = useState({});
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [user, setUser] = useState(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const savedUser = localStorage.getItem("techno_hub_user");
    if (!savedUser) {
      router.push("/login");
      return;
    }

    const parsed = JSON.parse(savedUser);

    const loadCourseContent = async (student) => {
      const data = await fetchApi(`/student/get_course_content?course_id=${courseId}&student_id=${student.id}`);
      if (cancelled) return;

      setUser(student);

      if (data.success) {
        setCourse(data.course);
        setModules(data.modules);

        if (data.modules.length > 0) {
          setExpandedModules({ [data.modules[0].id]: true });

          if (data.modules[0].materials && data.modules[0].materials.length > 0) {
            setSelectedMaterial(data.modules[0].materials[0]);
          }
        }
      } else {
        setError(data.message);
      }
      setIsLoading(false);
    };

    const loadTimer = window.setTimeout(() => {
      loadCourseContent(parsed);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimer);
    };
  }, [router, courseId]);

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleMaterialSelect = (material) => {
    setSelectedMaterial(material);
    setCompletionMessage("");
  };

  const updateMaterialCompletion = (materialId) => {
    setModules((currentModules) =>
      currentModules.map((module) => ({
        ...module,
        materials: (module.materials || []).map((material) =>
          material.id === materialId
            ? { ...material, is_completed: true, completed_at: new Date().toISOString() }
            : material
        ),
      }))
    );

    setSelectedMaterial((currentMaterial) =>
      currentMaterial?.id === materialId
        ? { ...currentMaterial, is_completed: true, completed_at: new Date().toISOString() }
        : currentMaterial
    );
  };

  const handleMarkComplete = async () => {
    if (!selectedMaterial || !user) return;

    setIsMarkingComplete(true);
    setCompletionMessage("");

    const response = await fetchApi("/student/mark_material_complete", {
      method: "POST",
      body: JSON.stringify({
        student_id: user.id,
        material_id: selectedMaterial.id,
      }),
    });

    setIsMarkingComplete(false);

    if (response.success) {
      updateMaterialCompletion(selectedMaterial.id);
      setCompletionMessage("Lesson marked as complete.");
    } else {
      setCompletionMessage(response.message || "Could not mark this lesson as complete.");
    }
  };

  const getMaterialIcon = (type, isActive, isCompleted = false) => {
    if (isCompleted) {
      return <CheckCircle className={`w-4 h-4 ${isActive ? 'text-white' : 'text-green-500'}`} />;
    }

    const className = `w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400 dark:text-white'}`;
    if (type === 'video') return <Video className={className} />;
    if (type === 'pdf') return <FileText className={className} />;
    if (type === 'live_session') return <PlayCircle className={className} />;
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-[#1e293b] rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-12 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
          <ArrowLeft className="w-8 h-8" />
        </div>
        <h2 className="text-[18px] font-bold text-slate-800 dark:text-white mb-2">Access Denied</h2>
        <p className="text-[13px] text-gray-500 dark:text-white mb-6">{error}</p>
        <button onClick={() => router.push('/dashboard/student/my-courses')} className="px-6 py-2.5 bg-blue-600 text-white font-bold text-[13px] rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
          Return to My Courses
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-right-4 duration-300">

      {/* Header aligned with other pages */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/student/my-courses')} className="p-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-500 dark:text-white shadow-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-100 dark:border-blue-900/50">Course Viewer</span>
              <span className="text-[12px] text-gray-400 dark:text-white">•</span>
              <span className="text-[12px] text-slate-600 dark:text-white font-medium">{course?.teacher_name}</span>
            </div>
            <h1 className="text-[20px] font-bold text-slate-800 dark:text-white tracking-tight leading-none">{course?.title}</h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar Navigation */}
        <div className="w-full lg:w-80 shrink-0 space-y-3">
          <h2 className="text-[13px] font-bold text-slate-800 dark:text-white mb-2">Course Modules</h2>
          {modules.length === 0 ? (
            <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 p-6 text-center">
              <p className="text-[13px] text-gray-500 dark:text-white">No content available for this course yet.</p>
            </div>
          ) : (
            modules.map((module, index) => (
              <div key={module.id} className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800/50 transition-colors text-left border-b border-gray-100 dark:border-slate-800/50"
                >
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-800 dark:text-white leading-snug">Module {index + 1}: {module.title}</h3>
                    <p className="text-[11px] text-gray-500 dark:text-white mt-0.5">{module.materials?.length || 0} Lessons</p>
                  </div>
                  {expandedModules[module.id] ? <ChevronDown className="w-4 h-4 text-gray-400 dark:text-white shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 dark:text-white shrink-0" />}
                </button>

                {expandedModules[module.id] && (
                  <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
                    {(module.description || module.images) && (
                      <div className="p-3.5 bg-slate-50/50 border-b border-gray-100 dark:border-slate-800/50">
                        {module.description && <p className="text-[11.5px] text-slate-500 dark:text-white leading-relaxed mb-2">{module.description}</p>}
                        {module.images && (() => {
                          try {
                            const parsedImages = JSON.parse(module.images);
                            if (parsedImages.length > 0) {
                              return (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {parsedImages.map((img, idx) => (
                                    <a 
                                      key={idx} 
                                      href={img.url.startsWith('http') ? img.url : `${BASE_URL}${img.url}`} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="group relative h-10 w-14 rounded border border-gray-200 dark:border-slate-800 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 shadow-sm"
                                      title={img.name}
                                    >
                                      <img 
                                        src={img.url.startsWith('http') ? img.url : `${BASE_URL}${img.url}`} 
                                        alt={img.name} 
                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                                      />
                                    </a>
                                  ))}
                                </div>
                              );
                            }
                          } catch (e) {
                            return null;
                          }
                          return null;
                        })()}
                      </div>
                    )}
                    {(!module.materials || module.materials.length === 0) && (
                      <div className="p-4 text-[12px] text-gray-400 dark:text-white italic">No lessons added to this module.</div>
                    )}
                    {module.materials && module.materials.map((mat, matIndex) => {
                      const isActive = selectedMaterial?.id === mat.id;
                      const isCompleted = Boolean(mat.is_completed);
                      return (
                        <button
                          key={mat.id}
                          onClick={() => handleMaterialSelect(mat)}
                          className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-50/70 hover:bg-green-50 dark:bg-green-900/10 dark:hover:bg-green-900/20 text-slate-700 dark:text-white' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-white'}`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {getMaterialIcon(mat.type, isActive, isCompleted)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-[13px] font-medium leading-snug truncate ${isActive ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                              {matIndex + 1}. {mat.title}
                            </p>
                            {mat.type === 'video' && <p className={`text-[10px] mt-0.5 ${isActive ? 'text-blue-200' : isCompleted ? 'text-green-600' : 'text-gray-400 dark:text-white'}`}>{isCompleted ? 'Completed video lesson' : 'Video Lesson'}</p>}
                            {mat.type === 'pdf' && <p className={`text-[10px] mt-0.5 ${isActive ? 'text-blue-200' : isCompleted ? 'text-green-600' : 'text-gray-400 dark:text-white'}`}>{isCompleted ? 'Completed document' : 'Document'}</p>}
                            {mat.type === 'live_session' && <p className={`text-[10px] mt-0.5 ${isActive ? 'text-blue-200' : isCompleted ? 'text-green-600' : 'text-gray-400 dark:text-white'}`}>{isCompleted ? 'Completed live session' : 'Live Session'}</p>}
                          </div>
                          {isCompleted && (
                            <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-green-100 text-green-600'}`}>
                              <CheckCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Main Content Viewer */}
        <div className="flex-1 bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 lg:p-8 flex flex-col min-h-[600px]">
          {selectedMaterial ? (
            <div className="h-full flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-100 dark:border-blue-900/50">
                    {selectedMaterial.type.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-[22px] font-bold text-slate-800 dark:text-white leading-tight">{selectedMaterial.title}</h2>
                {selectedMaterial.description && (
                  <p className="text-[13px] text-gray-500 dark:text-white mt-2 leading-relaxed">{selectedMaterial.description}</p>
                )}
              </div>

              {/* Dynamic Content Renderer */}
              <div className="flex-1 bg-gray-100 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden relative shadow-inner min-h-[400px]">

                {selectedMaterial.type === 'video' && (
                  <CustomVideoPlayer url={getResourceUrl(selectedMaterial.content_url)} />
                )}

                {selectedMaterial.type === 'pdf' && (
                  selectedMaterial.content_url ? (
                    <div className="absolute inset-0 flex flex-col bg-slate-100">
                      <object
                        data={getPdfViewerUrl(selectedMaterial.content_url)}
                        type="application/pdf"
                        className="w-full flex-1"
                        aria-label={selectedMaterial.title}
                      >
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <FileText className="w-10 h-10 text-blue-500 mb-3" />
                          <h3 className="font-bold text-slate-800">PDF preview is unavailable in this browser</h3>
                          <p className="text-sm text-slate-500 mt-1">Use the Open PDF button below to view the document.</p>
                        </div>
                      </object>
                      <div className="shrink-0 flex justify-end bg-white border-t border-slate-200 px-3 py-2">
                        <a href={getResourceUrl(selectedMaterial.content_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                          Open PDF <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-50">
                      <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
                      <h3 className="font-bold text-slate-800">PDF file is missing</h3>
                      <p className="text-sm text-slate-500 mt-1">Ask the teacher to edit this material and upload the PDF again.</p>
                    </div>
                  )
                )}

                {selectedMaterial.type === 'live_session' && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <PlayCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Live Session Scheduled</h3>
                    <p className="text-[13px] text-gray-500 dark:text-white mb-8 max-w-sm">Click the button below to join the live session hosted by your instructor. It will open in a new tab.</p>
                    <a
                      href={getResourceUrl(selectedMaterial.content_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-bold shadow hover:bg-purple-700 hover:-translate-y-0.5 transition-all text-[13px]"
                    >
                      Join Live Session
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                {completionMessage && (
                  <p className={`mr-4 self-center text-[12px] font-medium ${selectedMaterial?.is_completed ? 'text-green-600' : 'text-amber-600'}`}>
                    {completionMessage}
                  </p>
                )}
                <button
                  onClick={handleMarkComplete}
                  disabled={isMarkingComplete || selectedMaterial?.is_completed}
                  className={`flex items-center gap-2 px-5 py-2 border font-bold text-[12px] rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed ${
                    selectedMaterial?.is_completed
                      ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                      : 'bg-white dark:bg-[#1e293b] border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white hover:border-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                >
                  {isMarkingComplete ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {selectedMaterial?.is_completed ? 'Completed' : 'Mark as Complete'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800/50 text-gray-300 dark:text-white rounded-full flex items-center justify-center mb-4">
                <PlayCircle className="w-8 h-8" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800 dark:text-white">Select a lesson to start</h3>
              <p className="text-[13px] text-gray-500 dark:text-white mt-1 max-w-sm">Choose a module and material from the navigation menu on the left to begin learning.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}




