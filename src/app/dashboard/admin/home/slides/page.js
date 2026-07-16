"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";

const initialSlide = {
  imageUrl: "",
  title: "",
  label: "",
  sortOrder: 0,
  isActive: true,
};

export default function HomePageSlidesManager() {
  const [user] = useState(() => {
    if (typeof window === "undefined") return null;
    const savedUser = localStorage.getItem("techno_hub_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [slides, setSlides] = useState([]);
  const [slideForm, setSlideForm] = useState(initialSlide);
  const [editingSlideId, setEditingSlideId] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    const data = await fetchApi("/home/get_content?role=admin");
    setIsLoading(false);

    if (data.success) {
      setSlides(data.slides || []);
    } else {
      setErrorMsg(data.message || "Failed to load slideshow images.");
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadContent();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadContent]);

  const updateSlideField = (field, value) => {
    setSlideForm((current) => ({ ...current, [field]: value }));
  };

  const uploadImage = async (file, onUploaded) => {
    if (!file) return;
    setIsUploading(true);
    setErrorMsg("");
    const uploadData = new FormData();
    uploadData.append("image", file);

    try {
      const response = await fetch(`${API_BASE_URL}/home/upload`, {
        method: "POST",
        body: uploadData,
      });
      const data = await response.json();
      if (data.success) {
        onUploaded(data.imageUrl);
        setSuccessMsg("Image uploaded.");
      } else {
        setErrorMsg(data.message || "Image upload failed.");
      }
    } catch {
      setErrorMsg("Image upload failed. Please check that XAMPP Apache is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const saveSlide = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const response = await fetchApi("/home/save_slide", {
      method: "POST",
      body: JSON.stringify({
        ...slideForm,
        slideId: editingSlideId,
        role: user?.role,
      }),
    });

    setIsSaving(false);
    if (response.success) {
      setSuccessMsg(response.message);
      setSlideForm(initialSlide);
      setEditingSlideId(null);
      loadContent();
    } else {
      setErrorMsg(response.message || "Failed to save slide.");
    }
  };

  const deleteSlide = async (slideId) => {
    if (!confirm("Delete this homepage slide?")) return;
    const response = await fetchApi("/home/delete_slide", {
      method: "POST",
      body: JSON.stringify({ slideId, role: user?.role }),
    });
    if (response.success) loadContent();
    else setErrorMsg(response.message || "Failed to delete slide.");
  };

  const editSlide = (slide) => {
    setEditingSlideId(slide.id);
    setSlideForm({
      imageUrl: slide.imageUrl || "",
      title: slide.title || "",
      label: slide.label || "",
      sortOrder: slide.sortOrder || 0,
      isActive: Boolean(slide.isActive),
    });
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-[20px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ImagePlus className="w-5 h-5 text-primary" />
            Slideshow Images
          </h1>
          <p className="text-xs text-gray-500 dark:text-white">Manage the hero section animated image slider.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 dark:border-red-900/50 text-red-600 text-sm font-medium rounded-lg flex gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 dark:border-green-900/50 text-green-700 text-sm font-medium rounded-lg flex gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}

      <section className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            {editingSlideId ? "Edit Slide" : "Add New Slide"}
          </h2>
          <button onClick={loadContent} className="inline-flex items-center gap-2 text-xs font-bold text-primary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <form onSubmit={saveSlide} className="grid lg:grid-cols-2 gap-4 mb-8">
          <input value={slideForm.title} onChange={(event) => updateSlideField("title", event.target.value)} placeholder="Slide title" className="rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" required />
          <input value={slideForm.label} onChange={(event) => updateSlideField("label", event.target.value)} placeholder="Small label" className="rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
          <input value={slideForm.imageUrl} onChange={(event) => updateSlideField("imageUrl", event.target.value)} placeholder="Image URL" className="rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" required />
          <input type="number" value={slideForm.sortOrder} onChange={(event) => updateSlideField("sortOrder", event.target.value)} placeholder="Order" className="rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-primary dark:bg-[#0f172a]" />
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary transition-colors">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            Upload Slide Image
            <input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0], (url) => updateSlideField("imageUrl", url))} className="hidden" />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-white bg-gray-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-800">
            <input type="checkbox" checked={slideForm.isActive} onChange={(event) => updateSlideField("isActive", event.target.checked)} className="accent-primary w-4 h-4" />
            Active Display
          </label>
          <div className="lg:col-span-2 flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Button type="submit" className="gap-2 w-full sm:w-auto" disabled={isSaving || isUploading}>
              {editingSlideId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingSlideId ? "Update Slide" : "Save New Slide"}
            </Button>
            {editingSlideId && (
              <button type="button" onClick={() => { setEditingSlideId(null); setSlideForm(initialSlide); }} className="text-sm font-bold text-slate-500 dark:text-white hover:text-red-600 px-4 py-2">
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-800/50 pb-2">Current Slides</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map((slide) => (
            <article key={slide.id} className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden group">
              <div className="h-40 bg-slate-900 bg-cover bg-center relative" style={{ backgroundImage: `url("${slide.imageUrl}")` }}>
                {!slide.isActive && (
                  <div className="absolute top-2 right-2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Hidden</div>
                )}
              </div>
              <div className="p-4">
                <p className="font-bold text-slate-900 dark:text-white text-sm truncate" title={slide.title}>{slide.title}</p>
                <p className="text-xs text-slate-500 dark:text-white mt-1">{slide.label || "No label"} • Order {slide.sortOrder}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => editSlide(slide)} className="flex-1 h-8 px-3 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-colors">Edit</button>
                  <button onClick={() => deleteSlide(slide.id)} className="h-8 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold inline-flex items-center gap-1 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
          {slides.length === 0 && (
            <div className="lg:col-span-3 p-8 text-center text-sm text-slate-500 dark:text-white bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-gray-300 dark:border-slate-700">
              No slideshow images added yet. Add your first slide above.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
