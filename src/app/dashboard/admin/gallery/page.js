"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, BASE_URL, fetchApi } from "@/lib/api";
import Button from "@/components/ui/Button";
import { CustomDialog } from "@/components/ui/CustomDialog";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  Images,
  Loader2,
  MapPin,
  Newspaper,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  UploadCloud,
  X,
} from "lucide-react";

const initialForm = {
  title: "",
  entryType: "event",
  category: "",
  eventDate: "",
  location: "",
  summary: "",
  details: "",
  imageUrl: "",
  imageUrls: [],
  ctaLabel: "",
  ctaUrl: "",
  isFeatured: false,
  isPublished: true,
};

const galleryTypes = [
  { value: "event", label: "Event", icon: CalendarDays },
  { value: "news", label: "News", icon: Newspaper },
  { value: "achievement", label: "Achievement", icon: Trophy },
  { value: "workshop", label: "Workshop", icon: GraduationCap },
  { value: "facility", label: "Facility", icon: Sparkles },
  { value: "other", label: "Other", icon: Images },
];

const getFullImageUrl = (url) => url?.startsWith('/uploads/') ? `${BASE_URL}${url}` : url;

const typeLabels = galleryTypes.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

function formatDate(value) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function uniqueUrls(urls) {
  return urls.map((url) => (url || "").trim()).filter(Boolean).filter((url, index, list) => list.indexOf(url) === index);
}

function getItemImageUrls(item) {
  return uniqueUrls([item.imageUrl, ...(item.images || []).map((image) => image.imageUrl)]);
}

export default function AdminGalleryPage() {
  const [user] = useState(() => {
    if (typeof window === "undefined") return null;
    const savedUser = localStorage.getItem("techno_hub_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [viewingItem, setViewingItem] = useState(null);
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'info', title: '', message: '', isAlertOnly: false, onConfirm: null, onCancel: null });

  const stats = useMemo(() => {
    const published = items.filter((item) => item.isPublished).length;
    const featured = items.filter((item) => item.isFeatured).length;
    const images = items.reduce((total, item) => total + Math.max(getItemImageUrls(item).length, 1), 0);

    return { published, featured, images };
  }, [items]);

  const formImageUrls = useMemo(() => uniqueUrls([form.imageUrl, ...form.imageUrls]), [form.imageUrl, form.imageUrls]);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");

    const data = await fetchApi("/gallery/list?role=admin");
    setIsLoading(false);

    if (data.success) {
      setItems(data.items);
    } else {
      setErrorMsg(data.message || "Failed to load gallery items.");
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadItems();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadItems]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const syncImages = (urls) => {
    const nextUrls = uniqueUrls(urls);
    setForm((current) => ({
      ...current,
      imageUrl: nextUrls[0] || "",
      imageUrls: nextUrls,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setSelectedImageName("");
  };

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const uploadData = new FormData();
    files.forEach((file) => uploadData.append("images", file));

    try {
      const response = await fetch(`${API_BASE_URL}/gallery/upload`, {
        method: "POST",
        body: uploadData,
      });
      const data = await response.json();

      if (data.success) {
        const uploadedUrls = (data.images || []).map((image) => image.imageUrl).filter(Boolean);
        syncImages([...formImageUrls, ...uploadedUrls]);
        setSelectedImageName(files.length === 1 ? files[0].name : `${files.length} images selected`);
        setSuccessMsg(files.length === 1 ? "Gallery image uploaded." : "Gallery images uploaded.");
      } else {
        setErrorMsg(data.message || "Upload failed.");
      }
    } catch {
      setErrorMsg("Upload failed. Please check that XAMPP Apache is running.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleMainImageChange = (value) => {
    setForm((current) => {
      const existing = uniqueUrls(current.imageUrls.filter((url) => url !== current.imageUrl));
      return {
        ...current,
        imageUrl: value,
        imageUrls: uniqueUrls([value, ...existing]),
      };
    });
  };

  const removeImage = (imageUrl) => {
    syncImages(formImageUrls.filter((url) => url !== imageUrl));
  };

  const moveImageToMain = (imageUrl) => {
    syncImages([imageUrl, ...formImageUrls.filter((url) => url !== imageUrl)]);
  };

  const beginEdit = (item) => {
    const imageUrls = getItemImageUrls(item);
    setEditingId(item.id);
    setSelectedImageName("");
    setErrorMsg("");
    setSuccessMsg("");
    setForm({
      title: item.title || "",
      entryType: item.entryType || "event",
      category: item.category || "",
      eventDate: item.eventDate || "",
      location: item.location || "",
      summary: item.summary || "",
      details: item.details || "",
      imageUrl: imageUrls[0] || "",
      imageUrls,
      ctaLabel: item.ctaLabel || "",
      ctaUrl: item.ctaUrl || "",
      isFeatured: Boolean(item.isFeatured),
      isPublished: Boolean(item.isPublished),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveItem = async (event) => {
    event.preventDefault();

    if (!user) return;
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      ...form,
      imageUrl: formImageUrls[0] || "",
      imageUrls: formImageUrls,
      userId: user.id,
      role: user.role,
    };

    const response = await fetchApi(editingId ? "/gallery/update" : "/gallery/create", {
      method: "POST",
      body: JSON.stringify(editingId ? { ...payload, itemId: editingId } : payload),
    });

    setIsSaving(false);

    if (response.success) {
      setSuccessMsg(response.message);
      resetForm();
      loadItems();
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setErrorMsg(response.message || "Failed to save gallery item.");
    }
  };

  const executeDeleteItem = async (itemId) => {
    setIsDeletingId(itemId);
    setErrorMsg("");
    setSuccessMsg("");

    const response = await fetchApi("/gallery/delete", {
      method: "POST",
      body: JSON.stringify({
        itemId,
        userId: user?.id,
        role: user?.role,
      }),
    });

    setIsDeletingId(null);

    if (response.success) {
      if (editingId === itemId) resetForm();
      setSuccessMsg(response.message);
      loadItems();
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setErrorMsg(response.message || "Failed to delete gallery item.");
    }
  };

  const handleDeleteItem = (itemId) => {
    setDialogState({
      isOpen: true,
      type: 'warning',
      title: 'Delete Gallery Item?',
      message: 'Are you sure you want to permanently delete this gallery item and all associated pictures?',
      isAlertOnly: false,
      onConfirm: async () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
        await executeDeleteItem(itemId);
      },
      onCancel: () => {
        setDialogState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-[20px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Images className="w-5 h-5 text-primary" />
            Gallery Manager
          </h1>
          <p className="text-xs text-gray-500 dark:text-white">Add and edit educational events, news, achievements, and multi-image galleries.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 min-w-[360px]">
          <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-white">Published</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.published}</p>
          </div>
          <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-white">Featured</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.featured}</p>
          </div>
          <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-white">Images</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.images}</p>
          </div>
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

      <div className="grid xl:grid-cols-[430px_1fr] gap-6 items-start">
        <form onSubmit={handleSaveItem} className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {editingId ? <Edit3 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
              {editingId ? "Edit Gallery Item" : "Add Gallery Item"}
            </h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-xs font-bold text-slate-500 dark:text-white hover:text-red-600">
                Cancel Edit
              </button>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Title</label>
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Type</label>
              <select
                value={form.entryType}
                onChange={(event) => updateField("entryType", event.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
              >
                {galleryTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Category</label>
              <input
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                placeholder="Seminar, Notice, Award..."
                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(event) => updateField("eventDate", event.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Location</label>
              <input
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                placeholder="Online or campus"
                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Summary</label>
            <textarea
              value={form.summary}
              onChange={(event) => updateField("summary", event.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Details</label>
            <textarea
              value={form.details}
              onChange={(event) => updateField("details", event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a] resize-none"
            />
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-2">Gallery Images</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-primary transition-colors">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                {isUploading ? "Uploading..." : "Bulk Upload"}
                <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
              </label>
              <span className="text-xs text-slate-500 dark:text-white truncate">{selectedImageName || "Select one or many images. First image becomes the cover."}</span>
            </div>
            <input
              value={form.imageUrl}
              onChange={(event) => handleMainImageChange(event.target.value)}
              placeholder="/uploads/gallery/image.jpg or image URL"
              className="mt-3 w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
              required
            />

            {formImageUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {formImageUrls.map((imageUrl, index) => (
                  <div key={imageUrl} className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b]">
                    <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url("${getFullImageUrl(imageUrl)}")` }} />
                    <div className="p-2 flex items-center justify-between gap-2">
                      <button type="button" onClick={() => moveImageToMain(imageUrl)} className="text-[10px] font-bold text-primary hover:text-slate-900 dark:text-white">
                        {index === 0 ? "Cover" : "Set Cover"}
                      </button>
                      <button type="button" onClick={() => removeImage(imageUrl)} className="h-7 w-7 rounded-md text-red-500 hover:bg-red-50 flex items-center justify-center">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Button Label</label>
              <input
                value={form.ctaLabel}
                onChange={(event) => updateField("ctaLabel", event.target.value)}
                placeholder="Read More"
                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Button Link</label>
              <input
                value={form.ctaUrl}
                onChange={(event) => updateField("ctaUrl", event.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-slate-800 p-3 text-sm font-medium text-slate-700 dark:text-white">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => updateField("isFeatured", event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                Featured
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-slate-800 p-3 text-sm font-medium text-slate-700 dark:text-white">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => updateField("isPublished", event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="flex items-center gap-2">
                {form.isPublished ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                Published
              </span>
            </label>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={isSaving || isUploading}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isSaving ? "Saving..." : editingId ? "Update Gallery Item" : "Add to Gallery"}
          </Button>
        </form>

        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800/50 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Gallery Items</h2>
              <p className="text-xs text-gray-500 dark:text-white">Edit content, upload image sets, or remove public gallery posts.</p>
            </div>
            <button
              onClick={loadItems}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 dark:border-slate-800 px-3 text-xs font-bold text-slate-600 dark:text-white hover:border-primary/40 hover:text-primary"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center text-slate-500 dark:text-white">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-slate-500 dark:text-white">
              <Images className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium">No gallery items added yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800/50">
              {items.map((item) => {
                const TypeIcon = galleryTypes.find((type) => type.value === item.entryType)?.icon || Images;
                const imageUrls = getItemImageUrls(item);

                return (
                  <div key={item.id} className={`p-4 grid lg:grid-cols-[150px_1fr_auto] gap-4 items-center ${editingId === item.id ? "bg-primary/5" : ""}`}>
                    <div
                      className="h-24 rounded-lg bg-slate-900 bg-cover bg-center border border-slate-200 dark:border-slate-800"
                      style={{ backgroundImage: imageUrls[0] ? `url("${getFullImageUrl(imageUrls[0])}")` : "linear-gradient(135deg,#0f172a,#1a3cb6,#efc300)" }}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase text-primary">
                          <TypeIcon className="w-3.5 h-3.5" />
                          {typeLabels[item.entryType] || "Gallery"}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${item.isPublished ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-slate-100 text-slate-500 dark:text-white"}`}>
                          {item.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {item.isPublished ? "Published" : "Draft"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500 dark:text-white">
                          {imageUrls.length || 1} Images
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">{item.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-white line-clamp-2 mt-1">{item.summary}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-white mt-2">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatDate(item.eventDate || item.createdAt)}
                        </span>
                        {item.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {item.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex lg:flex-col gap-2">
                      <button
                        onClick={() => setViewingItem(item)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 text-xs font-bold text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Eye className="w-4 h-4 text-blue-500" />
                        View Images
                      </button>
                      <button
                        onClick={() => beginEdit(item)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary/15 px-3 text-xs font-bold text-primary hover:bg-primary/5"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isDeletingId === item.id}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-100 px-3 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {isDeletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* View Images Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm px-4 py-6 overflow-y-auto flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-gray-50/80 dark:bg-slate-800/80">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{viewingItem.title}</h3>
                <p className="text-xs text-gray-500 dark:text-white mt-1">{getItemImageUrls(viewingItem).length} Images in this entry</p>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-white hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
                {getItemImageUrls(viewingItem).map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-100 dark:bg-slate-900 shadow-sm flex items-center justify-center">
                    <img 
                      src={getFullImageUrl(url)} 
                      alt={`Gallery item image ${idx + 1}`}
                      className="w-full h-full object-cover" 
                    />
                    <a
                      href={getFullImageUrl(url)}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1"
                    >
                      Open Full Size
                    </a>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50/80 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800/50 flex justify-end">
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-white bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 rounded hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <CustomDialog {...dialogState} />
    </div>
  );
}
