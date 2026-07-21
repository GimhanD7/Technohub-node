"use client";

import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import { BookOpen, PlayCircle, FileText, Video, ChevronLeft, Plus, Trash2, Edit3, X, Eye, EyeOff, Loader2, Users, Layout, Image as ImageIcon, ArrowLeft, Star, Upload, Link2, Search, UserCheck, Library, Layers3 } from "lucide-react";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { CustomDialog } from "@/components/ui/CustomDialog";
import { BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function TeacherCourseManagement() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation State
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Data States
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modules, setModules] = useState([]);
  const [materials, setMaterials] = useState({}); // { moduleId: [materials array] }

  // Filter State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [courseStatusFilter, setCourseStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & UI States
  const [dialogState, setDialogState] = useState({ isOpen: false });
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Edit States
  const [editCourseId, setEditCourseId] = useState(null);
  const [editModuleId, setEditModuleId] = useState(null);
  const [editMaterialId, setEditMaterialId] = useState(null);
  const [materialSource, setMaterialSource] = useState('link');
  const [materialUploadName, setMaterialUploadName] = useState('');
  const [moduleImages, setModuleImages] = useState([]);

  // Enrolled Students Modal
  const [enrolledModal, setEnrolledModal] = useState({ isOpen: false, courseId: null, courseTitle: "", students: [], isLoading: false, search: "" });

  // Form Data
  const [courseForm, setCourseForm] = useState({ title: '', category_id: '', description: '', duration: '', points: 0, banner_url: '' });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [materialForm, setMaterialForm] = useState({ module_id: '', type: 'video', title: '', description: '', content_url: '' });

  const showConfirm = (title, message, type, onConfirm) => {
    setDialogState({ isOpen: true, title, message, type, onConfirm: () => { setDialogState(s => ({ ...s, isOpen: false })); onConfirm(); }, onCancel: () => setDialogState(s => ({ ...s, isOpen: false })) });
  };
  const showAlert = (title, message, type = 'error') => {
    if (type === 'error') {
      toast.error(`${title}: ${message}`);
    } else if (type === 'success') {
      toast.success(`${title}: ${message}`);
    } else {
      toast(`${title}: ${message}`);
    }
  };

  // --- Initialize ---

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      loadCourses(parsed.id);
      loadCategories();
    } else {
      router.push("/login");
    }
  }, [router]);

  // --- API Calls ---

  const loadCourses = async (teacherId) => {
    setIsLoading(true);
    const data = await fetchApi(`/course/manage_courses?teacher_id=${teacherId}`);
    if (data.success) setCourses(data.courses);
    setIsLoading(false);
  };

  const loadCategories = async () => {
    const data = await fetchApi("/course/manage_categories");
    if (data.success) setCategories(data.categories || []);
  };

  const loadModules = async (courseId) => {
    setIsLoading(true);
    const data = await fetchApi(`/course/manage_modules?course_id=${courseId}`);
    if (data.success) {
      setModules(data.modules);
      const mats = {};
      for (const mod of data.modules) {
        const matData = await fetchApi(`/course/manage_materials?module_id=${mod.id}`);
        if (matData.success) mats[mod.id] = matData.materials;
      }
      setMaterials(mats);
    }
    setIsLoading(false);
  };

  // --- Handlers ---

  const handleCourseSelect = (c) => {
    setSelectedCourse(c);
    loadModules(c.id);
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setModules([]);
    loadCourses(user.id);
  };

  // --- Courses ---
  
  const openCourseModal = (course = null) => {
    if (course) {
      setEditCourseId(course.id);
      setCourseForm({ title: course.title, category_id: course.category_id || '', description: course.description || '', duration: course.duration || '', points: course.points || 0, banner_url: course.banner_url || '' });
    } else {
      setEditCourseId(null);
      setCourseForm({ title: '', category_id: '', description: '', duration: '', points: 0, banner_url: '' });
    }
    setShowCourseModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        let scaleSize = 1;
        if (img.width > MAX_WIDTH) {
           scaleSize = MAX_WIDTH / img.width;
        }
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL("image/webp", 0.6); 
        uploadCompressedImage(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const uploadCompressedImage = async (base64String) => {
    setActionLoading(true);
    const data = await fetchApi("/course/upload_banner", {
      method: "POST",
      body: JSON.stringify({ image: base64String })
    });
    if (data.success) {
      setCourseForm(s => ({ ...s, banner_url: data.url }));
    } else {
      showAlert("Upload Failed", data.message, "error");
    }
    setActionLoading(false);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    const method = editCourseId ? "PUT" : "POST";
    const body = editCourseId 
      ? { id: editCourseId, ...courseForm } 
      : { teacher_id: user.id, ...courseForm };

    const data = await fetchApi("/course/manage_courses", {
      method, body: JSON.stringify(body)
    });
    
    if (data.success) {
      setShowCourseModal(false);
      loadCourses(user.id);
    } else showAlert("Error", data.message);
    setActionLoading(false);
  };

  const handleDeleteCourse = (courseId) => {
    showConfirm("Delete Course", "Are you sure? This will delete all modules and materials inside it.", "error", async () => {
      const data = await fetchApi("/course/manage_courses", {
        method: "DELETE", body: JSON.stringify({ id: courseId })
      });
      if (data.success) loadCourses(user.id);
      else showAlert("Error", data.message);
    });
  };

  const handleToggleCourseStatus = (course) => {
    const newStatus = course.status === 'active' ? 'disabled' : 'active';
    showConfirm("Toggle Visibility", `Are you sure you want to ${newStatus === 'disabled' ? 'HIDE' : 'SHOW'} this course to students?`, "info", async () => {
      const data = await fetchApi("/course/manage_courses", {
        method: "PUT", body: JSON.stringify({ id: course.id, status: newStatus })
      });
      if (data.success) loadCourses(user.id);
      else showAlert("Error", data.message);
    });
  };

  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setActionLoading(true);
    const data = await fetchApi("/course/manage_categories", {
      method: "POST",
      body: JSON.stringify({ name: newCategoryName, user_id: user?.id })
    });

    if (data.success) {
      await loadCategories();
      setCourseForm(prev => ({ ...prev, category_id: data.category.id }));
      setNewCategoryName("");
      setShowCategoryModal(false);
    } else {
      showAlert("Error", data.message || "Failed to add category");
    }
    setActionLoading(false);
  };

  // --- Modules ---
  
  const openModuleModal = (module = null) => {
    if (module) {
      setEditModuleId(module.id);
      setModuleForm({ title: module.title, description: module.description || '' });
      try {
        setModuleImages(module.images ? JSON.parse(module.images) : []);
      } catch {
        setModuleImages([]);
      }
    } else {
      setEditModuleId(null);
      setModuleForm({ title: '', description: '' });
      setModuleImages([]);
    }
    setShowModuleModal(true);
  };

  const handleModuleImagesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setActionLoading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch(`${API_BASE_URL}/course/upload_module_image`, {
          method: "POST",
          body: formData
        });
        const data = await response.json();
        if (data.success) {
          setModuleImages(prev => [...prev, { name: file.name.split('.').slice(0, -1).join('.'), url: data.imageUrl }]);
        } else {
          toast.error(`Upload failed: ${data.message}`);
        }
      } catch (err) {
        toast.error("Upload error. Please try again.");
      }
    }
    setActionLoading(false);
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    const method = editModuleId ? "PUT" : "POST";
    const body = editModuleId 
      ? { id: editModuleId, ...moduleForm, images: JSON.stringify(moduleImages) }
      : { course_id: selectedCourse.id, ...moduleForm, images: JSON.stringify(moduleImages) };

    const data = await fetchApi("/course/manage_modules", {
      method, body: JSON.stringify(body)
    });
    
    if (data.success) {
      setShowModuleModal(false);
      loadModules(selectedCourse.id);
    } else showAlert("Error", data.message);
    setActionLoading(false);
  };

  const handleDeleteModule = (modId) => {
    showConfirm("Delete Module", "Are you sure? This will delete all materials inside it.", "warning", async () => {
      const data = await fetchApi("/course/manage_modules", {
        method: "DELETE", body: JSON.stringify({ id: modId })
      });
      if (data.success) loadModules(selectedCourse.id);
    });
  };

  // --- Materials ---
  
  const openMaterialModal = (moduleId, material = null) => {
    if (material) {
      setEditMaterialId(material.id);
      setMaterialForm({
        module_id: String(moduleId ?? ''),
        type: String(material.type ?? 'video'),
        title: String(material.title ?? ''),
        description: String(material.description ?? ''),
        content_url: String(material.content_url ?? '')
      });
      setMaterialSource(material.content_url?.startsWith('/uploads/') ? 'upload' : 'link');
      setMaterialUploadName(material.content_url?.startsWith('/uploads/') ? material.title || 'Uploaded PDF' : '');
    } else {
      setEditMaterialId(null);
      setMaterialForm({ module_id: String(moduleId ?? ''), type: 'video', title: '', description: '', content_url: '' });
      setMaterialSource('link');
      setMaterialUploadName('');
    }
    setShowMaterialModal(true);
  };

  const handleMaterialUpload = async (file) => {
    if (!file) return;

    setActionLoading(true);
    const uploadData = new FormData();
    uploadData.append("resource", file);

    try {
      const response = await fetch(`${API_BASE_URL}/course/upload_material`, {
        method: "POST",
        body: uploadData
      });
      const data = await response.json();

      if (data.success) {
        setMaterialForm((current) => ({
          ...current,
          type: 'pdf',
          content_url: String(data.fileUrl ?? ''),
          title: current.title || file.name.replace(/\.pdf$/i, '')
        }));
        setMaterialUploadName(file.name);
      } else {
        showAlert("Upload Failed", data.message);
      }
    } catch {
      showAlert("Upload Failed", "The server did not return a valid upload response.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.content_url.trim()) {
      showAlert("Resource Required", materialForm.type === 'pdf' ? "Upload a PDF or attach a PDF link before saving." : "Add a valid resource link before saving.");
      return;
    }
    setActionLoading(true);
    const method = editMaterialId ? "PUT" : "POST";
    const body = editMaterialId
      ? { id: editMaterialId, ...materialForm }
      : materialForm;

    const data = await fetchApi("/course/manage_materials", {
      method, body: JSON.stringify(body)
    });
    
    if (data.success) {
      setShowMaterialModal(false);
      loadModules(selectedCourse.id);
    } else showAlert("Error", data.message);
    setActionLoading(false);
  };

  const handleDeleteMaterial = (matId) => {
    showConfirm("Delete Material", "Are you sure you want to delete this resource?", "warning", async () => {
      const data = await fetchApi("/course/manage_materials", {
        method: "DELETE", body: JSON.stringify({ id: matId })
      });
      if (data.success) loadModules(selectedCourse.id);
    });
  };

  const openEnrolledStudents = async (course) => {
    setEnrolledModal({ isOpen: true, courseId: course.id, courseTitle: course.title, students: [], isLoading: true, search: "" });
    const data = await fetchApi(`/course/enrolled_students?course_id=${course.id}&teacher_id=${user.id}`);
    setEnrolledModal(prev => ({
      ...prev,
      isLoading: false,
      students: data.success ? data.students : []
    }));
  };

  const getMaterialIcon = (type) => {
    if (type === 'video') return <Video className="w-4 h-4 text-rose-500" />;
    if (type === 'pdf') return <FileText className="w-4 h-4 text-blue-500" />;
    if (type === 'live_session') return <PlayCircle className="w-4 h-4 text-purple-500" />;
  };

  // --- Renders ---

  if (isLoading && courses.length === 0 && !selectedCourse) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  // --- Derived State ---
  const displayedCourses = courses.filter(c => {
    const matchesCategory = selectedCategoryFilter === "all" || String(c.category_id) === String(selectedCategoryFilter);
    const matchesStatus = courseStatusFilter === "all" || (courseStatusFilter === "live" ? c.status !== "disabled" : c.status === "disabled");
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesStatus && matchesSearch;
  });
  const liveCourseCount = courses.filter(course => course.status !== "disabled").length;
  const hiddenCourseCount = courses.filter(course => course.status === "disabled").length;
  const usedCategoryCount = new Set(courses.map(course => course.category_id).filter(Boolean)).size;

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative pb-12">
      <CustomDialog {...dialogState} />

      {/* Enrolled Students Modal */}
      {enrolledModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200 dark:border-slate-800">
            <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Enrolled Students
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">{enrolledModal.courseTitle} · {enrolledModal.students.length} student{enrolledModal.students.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setEnrolledModal(p => ({ ...p, isOpen: false }))} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={enrolledModal.search} onChange={e => setEnrolledModal(p => ({ ...p, search: e.target.value }))}
                  placeholder="Search students..." className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary dark:bg-[#0f172a] dark:text-white" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {enrolledModal.isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : enrolledModal.students.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <Users className="w-10 h-10 text-gray-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-gray-400 dark:text-slate-500">No students enrolled yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800">
                    <tr className="border-b border-gray-200 dark:border-slate-700 text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500 font-bold">
                      <th className="text-left px-5 py-3">Student</th>
                      <th className="text-left px-5 py-3">Index No.</th>
                      <th className="text-left px-5 py-3">Contact</th>
                      <th className="text-left px-5 py-3">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {enrolledModal.students
                      .filter(s => !enrolledModal.search || s.fullName.toLowerCase().includes(enrolledModal.search.toLowerCase()) || (s.email || '').toLowerCase().includes(enrolledModal.search.toLowerCase()))
                      .map(s => (
                        <tr key={s.enrollmentId} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-800 dark:text-white text-[13px]">{s.fullName}</p>
                            <p className="text-[10px] text-gray-400">{s.studentCategory}</p>
                          </td>
                          <td className="px-5 py-3 text-[12px] text-slate-600 dark:text-slate-300">{s.indexNumber}</td>
                          <td className="px-5 py-3">
                            <p className="text-[12px] text-slate-600 dark:text-slate-300">{s.email}</p>
                            <p className="text-[11px] text-gray-400">{s.phone}</p>
                          </td>
                          <td className="px-5 py-3 text-[11px] text-gray-400">{s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stage 1: Manage Courses for logged-in Teacher */}
      {!selectedCourse && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-semibold text-slate-800 dark:text-white tracking-tight">My Courses</h1>
              <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-1">Manage your courses, enrolled students, and learning content.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search courses..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-[200px] pl-9 pr-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                />
              </div>
              <select 
                value={selectedCategoryFilter} 
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select value={courseStatusFilter} onChange={event => setCourseStatusFilter(event.target.value)} className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm">
                <option value="all">All Statuses</option><option value="live">Live</option><option value="hidden">Hidden</option>
              </select>
              <button onClick={() => openCourseModal()} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 text-[12px] font-medium transition-colors">
                <Plus className="w-4 h-4" /> Create Course
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Courses", value: courses.length, icon: Library, tone: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
              { label: "Live Courses", value: liveCourseCount, icon: Eye, tone: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
              { label: "Hidden Courses", value: hiddenCourseCount, icon: EyeOff, tone: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
              { label: "Categories Used", value: usedCategoryCount, icon: Layers3, tone: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
            ].map(({ label, value, icon: Icon, tone, bg }) => <div key={label} className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 shadow-sm"><div className={`w-10 h-10 rounded-xl ${bg} ${tone} flex items-center justify-center`}><Icon className="w-5 h-5" /></div><div><p className="text-xl font-bold text-slate-900 dark:text-white leading-none">{value}</p><p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">{label}</p></div></div>)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCourses.length === 0 && !isLoading ? (
              <div className="col-span-3 p-12 text-center bg-white dark:bg-[#1e293b] border border-dashed border-gray-300 dark:border-slate-700 rounded-xl">
                <BookOpen className="w-12 h-12 text-gray-300 dark:text-white mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700 dark:text-white">No Courses Found</h3>
                <p className="text-[13px] text-gray-500 dark:text-white mt-1 mb-6">We couldn&apos;t find any courses matching your criteria.</p>
                {courses.length === 0 && (
                  <button onClick={() => openCourseModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 text-[13px] font-medium transition-colors">
                    <Plus className="w-4 h-4" /> Create Your First Course
                  </button>
                )}
              </div>
            ) : (
              displayedCourses.map(c => (
              <div key={c.id} className={`bg-white dark:bg-[#1e293b] rounded-lg border shadow-sm overflow-hidden flex flex-col transition-all ${c.status === 'disabled' ? 'border-gray-200 dark:border-slate-800 opacity-75' : 'border-blue-100 dark:border-blue-900/50'}`}>
                <div className="h-32 bg-gray-100 relative overflow-hidden group">
                  {c.banner_url ? (
                    <img src={c.banner_url.startsWith('http') ? c.banner_url : `${BASE_URL}${c.banner_url.startsWith('/') ? '' : '/'}${c.banner_url}`} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-white"><ImageIcon className="w-8 h-8" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                     <button onClick={() => handleCourseSelect(c)} className="px-3 py-1.5 bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white font-medium text-[12px] rounded shadow-lg flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                       <Layout className="w-3.5 h-3.5" /> Build
                     </button>
                     <button onClick={() => openCourseModal(c)} className="px-3 py-1.5 bg-white dark:bg-[#1e293b] text-blue-600 font-medium text-[12px] rounded shadow-lg flex items-center gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                       <Edit3 className="w-3.5 h-3.5" /> Edit
                     </button>
                     <button onClick={() => handleDeleteCourse(c.id)} className="px-3 py-1.5 bg-white dark:bg-[#1e293b] text-red-600 font-medium text-[12px] rounded shadow-lg flex items-center gap-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  {c.category_name && (
                    <div className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded w-fit mb-2">
                      {c.category_name}
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[15px] font-bold text-slate-800 dark:text-white line-clamp-1">{c.title}</h3>
                    {c.status === 'disabled' ? 
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 dark:text-white text-[10px] uppercase font-bold rounded">Hidden</span> : 
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] uppercase font-bold rounded">Live</span>
                    }
                  </div>
                  <p className="text-[12px] text-gray-500 dark:text-slate-400 line-clamp-2 mb-3 flex-1">{c.description || "No description"}</p>
                  <button onClick={() => handleCourseSelect(c)} className="w-full mb-3 h-9 rounded-lg bg-primary/10 dark:bg-primary/15 text-primary dark:text-blue-300 hover:bg-primary hover:text-white flex items-center justify-center gap-2 text-[11px] font-bold transition-colors"><Layout className="w-3.5 h-3.5" />Build Course Content</button>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800/50 mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-white bg-slate-100 px-2 py-1 rounded">{c.duration || "N/A"}</span>
                      {c.points > 0 && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded flex items-center gap-1"><Star className="w-3 h-3 fill-amber-500" /> LKR {c.points}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEnrolledStudents(c)}
                        className="text-[11px] font-medium flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded transition-colors">
                        <Users className="w-3.5 h-3.5" /> {c.enrollment_count ?? 0} Students
                      </button>
                      <button 
                        onClick={() => handleToggleCourseStatus(c)}
                        className={`text-[11px] font-medium flex items-center gap-1.5 ${c.status === 'disabled' ? 'text-green-600 hover:text-green-700' : 'text-amber-600 hover:text-amber-700'}`}
                      >
                        {c.status === 'disabled' ? <><Eye className="w-3.5 h-3.5"/>Enable</> : <><EyeOff className="w-3.5 h-3.5"/>Disable</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* Stage 2: Manage Course Sub-Categories & Contents */}
      {selectedCourse && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-5 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={handleBackToCourses} className="p-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 rounded hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-500 dark:text-white shadow-sm transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-100 dark:border-blue-900/50">Course Builder</span>
                </div>
                <h1 className="text-[20px] font-bold text-slate-800 dark:text-white tracking-tight leading-none">{selectedCourse.title}</h1>
              </div>
            </div>
            <button onClick={() => openModuleModal()} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded shadow hover:bg-slate-700 dark:hover:bg-slate-600 text-[12px] font-medium transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4" /> Add Sub-Category (Module)
            </button>
          </div>

          <div className="space-y-4">
            {modules.length === 0 && <p className="text-center text-gray-500 dark:text-white py-12 bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 border-dashed">No modules created yet. Click &quot;Add Sub-Category&quot; to start building your course.</p>}
            
            {modules.map((mod, index) => (
              <div key={mod.id} className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-800 dark:text-white">Module {index + 1}: {mod.title}</h3>
                    {mod.description && <p className="text-[12px] text-gray-500 dark:text-white mt-0.5">{mod.description}</p>}
                    {mod.images && (() => {
                      try {
                        const parsedImages = JSON.parse(mod.images);
                        if (parsedImages.length > 0) {
                          return (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {parsedImages.map((img, idx) => (
                                <a 
                                  key={idx} 
                                  href={img.url.startsWith('http') ? img.url : `${BASE_URL}${img.url}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="group relative h-12 w-16 rounded border border-gray-200 dark:border-slate-800 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 shadow-sm"
                                  title={img.name}
                                >
                                  <img 
                                    src={img.url.startsWith('http') ? img.url : `${BASE_URL}${img.url}`} 
                                    alt={img.name} 
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                                  />
                                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 truncate text-[8px] font-medium text-white text-center">
                                    {img.name}
                                  </div>
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
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => openMaterialModal(mod.id)}
                      className="px-3 py-1.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-blue-600 text-[11px] font-bold uppercase rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm mr-2"
                    >
                      + Add Material
                    </button>
                    <button onClick={() => openModuleModal(mod)} className="p-1.5 text-blue-500 hover:text-blue-600 bg-blue-50 rounded transition-colors" title="Edit Module">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteModule(mod.id)} className="p-1.5 text-red-500 hover:text-red-600 bg-red-50 rounded transition-colors" title="Delete Module">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 bg-white dark:bg-[#1e293b]">
                  {(!materials[mod.id] || materials[mod.id].length === 0) ? (
                    <p className="text-[12px] text-gray-400 dark:text-white italic text-center py-4">No content added yet. Add videos, PDFs, or live sessions.</p>
                  ) : (
                    <div className="space-y-2">
                      {materials[mod.id].map(mat => (
                        <div key={mat.id} className="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800/50 hover:border-blue-100 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20/30 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-[#1e293b] rounded shadow-sm border border-gray-100 dark:border-slate-800/50">{getMaterialIcon(mat.type)}</div>
                            <div>
                              <p className="text-[13px] font-semibold text-slate-800 dark:text-white">{mat.title}</p>
                              {mat.description && <p className="text-[11px] text-gray-500 dark:text-white line-clamp-1">{mat.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a href={mat.content_url} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-blue-600 hover:underline mr-2">Test Link</a>
                            <button onClick={() => openMaterialModal(mod.id, mat)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteMaterial(mat.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/50 flex justify-between items-center bg-gray-50/80">
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-white">{editCourseId ? 'Edit Course' : 'Create New Course'}</h2>
              <button onClick={() => setShowCourseModal(false)} className="text-gray-400 dark:text-white hover:text-slate-800 dark:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Course Title *</label>
                <input required type="text" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none" placeholder="e.g. Advanced Web Development" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider">Category</label>
                  <button type="button" onClick={() => setShowCategoryModal(true)} className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> New Category
                  </button>
                </div>
                <select value={courseForm.category_id} onChange={e => setCourseForm({...courseForm, category_id: e.target.value})} className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-[#0f172a]">
                  <option value="">Select Category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Short Description</label>
                <textarea value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[80px]" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Duration</label>
                  <input type="text" value={courseForm.duration} onChange={e => setCourseForm({...courseForm, duration: e.target.value})} className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none" placeholder="e.g. 6 Months" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Star className="w-3 h-3"/> Price (LKR)</label>
                  <input type="number" min="0" value={courseForm.points} onChange={e => setCourseForm({...courseForm, points: parseInt(e.target.value) || 0})} className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none" placeholder="0" />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Banner Image</label>
                  <div className="flex gap-2">
                    <input type="text" value={courseForm.banner_url} onChange={e => setCourseForm({...courseForm, banner_url: e.target.value})} className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none" placeholder="https://... or Upload" />
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-white px-3 py-2.5 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[12px] font-bold transition-colors">
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800/50">
                <button type="button" onClick={() => setShowCourseModal(false)} className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-white bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 text-[12px] font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2">
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {editCourseId ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/50 flex justify-between items-center bg-gray-50/80">
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-white">Add New Category</h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 dark:text-white hover:text-slate-800 dark:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Category Name *</label>
                <input required type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none" placeholder="e.g. Information Technology" />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800/50">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-white bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 text-[12px] font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2">
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/50 flex justify-between items-center bg-gray-50/80">
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-white">{editModuleId ? 'Edit Sub-Category' : 'Add Sub-Category'}</h2>
              <button onClick={() => setShowModuleModal(false)} className="text-gray-400 dark:text-white hover:text-slate-800 dark:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveModule} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Module Title *</label>
                <input required type="text" value={moduleForm.title} onChange={e => setModuleForm({...moduleForm, title: e.target.value})} className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-slate-800 dark:focus:ring-slate-400 focus:outline-none" placeholder="e.g. Week 1: Introduction" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Description (Optional)</label>
                <textarea value={moduleForm.description} onChange={e => setModuleForm({...moduleForm, description: e.target.value})} className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-slate-800 dark:focus:ring-slate-400 focus:outline-none" />
              </div>
              <div className="border-t border-gray-100 dark:border-slate-800/50 pt-4">
                <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Module Images</label>
                
                <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                  {moduleImages.map((img, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-gray-50 dark:bg-[#0f172a] p-2 rounded border border-gray-200 dark:border-slate-800">
                      <img 
                        src={img.url.startsWith('http') ? img.url : `${BASE_URL}${img.url}`} 
                        alt={img.name} 
                        className="w-10 h-10 object-cover rounded shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <input 
                          type="text" 
                          value={img.name} 
                          onChange={(e) => {
                            const updated = [...moduleImages];
                            updated[idx].name = e.target.value;
                            setModuleImages(updated);
                          }} 
                          placeholder="Image name/caption" 
                          className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-slate-800 rounded bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setModuleImages(moduleImages.filter((_, i) => i !== idx));
                        }} 
                        className="text-red-500 hover:text-red-700 p-1 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-xs font-semibold py-2.5 px-4 rounded flex items-center justify-center gap-2 transition-colors border border-gray-200 dark:border-slate-800">
                    <Upload className="w-4 h-4" />
                    Upload Image(s) (Single/Bulk)
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleModuleImagesUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800/50">
                <button type="button" onClick={() => setShowModuleModal(false)} className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-white bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 text-[12px] font-medium text-white bg-slate-800 rounded hover:bg-slate-900 dark:hover:bg-slate-600 flex items-center gap-2">
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/50 flex justify-between items-center bg-gray-50/80">
              <h2 className="text-[16px] font-bold text-slate-800 dark:text-white">{editMaterialId ? 'Edit Course Material' : 'Add Course Material'}</h2>
              <button onClick={() => setShowMaterialModal(false)} className="text-gray-400 dark:text-white hover:text-slate-800 dark:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveMaterial} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Material Type *</label>
                <select required value={materialForm.type ?? ''} onChange={e => {
                  const type = e.target.value;
                  setMaterialForm({...materialForm, type, content_url: ''});
                  setMaterialUploadName('');
                  if (type !== 'pdf') setMaterialSource('link');
                }} className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-[#1e293b]">
                  <option value="video">Recorded Video</option>
                  <option value="pdf">PDF Document</option>
                  <option value="live_session">Live Session Link</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Title *</label>
                <input required type="text" value={materialForm.title ?? ''} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none" placeholder="e.g. HTML Basics Part 1" />
              </div>
              {materialForm.type === 'pdf' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">PDF Source *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => {
                      setMaterialSource('upload');
                      if (!materialForm.content_url?.startsWith('/uploads/')) setMaterialForm({...materialForm, content_url: ''});
                    }} className={`p-2.5 border rounded flex items-center justify-center gap-2 text-[12px] font-semibold ${materialSource === 'upload' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 dark:border-slate-800 text-gray-500 dark:text-white'}`}>
                      <Upload className="w-4 h-4" /> Upload PDF
                    </button>
                    <button type="button" onClick={() => {
                      setMaterialSource('link');
                      if (materialForm.content_url?.startsWith('/uploads/')) setMaterialForm({...materialForm, content_url: ''});
                      setMaterialUploadName('');
                    }} className={`p-2.5 border rounded flex items-center justify-center gap-2 text-[12px] font-semibold ${materialSource === 'link' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 dark:border-slate-800 text-gray-500 dark:text-white'}`}>
                      <Link2 className="w-4 h-4" /> Attach Link
                    </button>
                  </div>
                </div>
              )}
              {materialForm.type === 'pdf' && materialSource === 'upload' ? (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Choose PDF *</label>
                  <input required={!materialForm.content_url} type="file" accept="application/pdf,.pdf" onChange={e => handleMaterialUpload(e.target.files?.[0])} className="w-full p-2.5 text-[13px] border border-dashed border-gray-300 dark:border-slate-700 rounded" />
                  {materialForm.content_url?.startsWith('/uploads/') && <p className="mt-2 text-[11px] font-medium text-green-600">{materialUploadName || 'PDF'} uploaded and ready.</p>}
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">{materialForm.type === 'video' ? 'YouTube or Video Link *' : 'Resource URL (Link) *'}</label>
                  <input required type="url" value={materialForm.content_url ?? ''} onChange={e => setMaterialForm({...materialForm, content_url: e.target.value})} className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none" placeholder={materialForm.type === 'video' ? 'https://www.youtube.com/watch?v=...' : 'https://...'} />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={materialForm.description ?? ''} onChange={e => setMaterialForm({...materialForm, description: e.target.value})} className="w-full p-2.5 text-[13px] border border-gray-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[60px]" />
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800/50">
                <button type="button" onClick={() => setShowMaterialModal(false)} className="px-4 py-2 text-[12px] font-medium text-slate-600 dark:text-white bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded hover:bg-gray-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50">Cancel</button>
                <button type="submit" disabled={actionLoading || !materialForm.content_url.trim()} className="px-4 py-2 text-[12px] font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
