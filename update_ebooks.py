import sys

with open('src/app/dashboard/admin/e-books/page.js', 'r') as f:
    code = f.read()

# Add handleCoverUpload
handle_upload_func = '''
  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCoverUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const uploadData = new FormData();
    uploadData.append("resource", file);

    try {
      const response = await fetch(`${API_BASE_URL}/ebook/upload`, {
        method: "POST",
        body: uploadData,
      });
      const data = await response.json();

      if (data.success) {
        setForm((current) => ({ ...current, coverUrl: data.fileUrl }));
        setSuccessMsg("Cover image uploaded.");
      } else {
        setErrorMsg(data.message || "Upload failed.");
      }
    } catch {
      setErrorMsg("Upload failed.");
    } finally {
      setIsCoverUploading(false);
    }
  };

  const beginEditResource'''

code = code.replace('  const beginEditResource', handle_upload_func)


# Add Refresh button
refresh_html = '''      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Library Manager
          </h1>
          <p className="text-sm text-slate-500 dark:text-white mt-1">Manage e-books, study materials, and track library engagement</p>
        </div>
        <button onClick={loadResources} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-white rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[13px] font-medium transition-colors">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>'''

code = code.replace('''      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
          <BookOpen className="w-7 h-7 text-primary" />
          E-Book Library Manager
        </h1>
        <p className="text-slate-500 dark:text-white">Add and manage digital learning resources shown in the public e-book library.</p>
      </div>''', refresh_html)


# Add Cover Upload Input
cover_input_html = '''          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Cover Image URL / File</label>
            <div className="flex gap-2">
              <input
                value={form.coverUrl}
                onChange={(event) => updateField("coverUrl", event.target.value)}
                placeholder="Image URL"
                className="flex-1 rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
              />
              <label className="flex items-center justify-center px-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-[12px] font-semibold text-slate-600 dark:text-white cursor-pointer hover:border-primary hover:text-primary transition-colors">
                {isCoverUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Upload</span>
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              </label>
            </div>
          </div>'''

code = code.replace('''          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-white uppercase tracking-wider mb-1.5">Cover Image URL</label>
            <input
              value={form.coverUrl}
              onChange={(event) => updateField("coverUrl", event.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-primary dark:bg-[#0f172a]"
            />
          </div>''', cover_input_html)

# Add Upload import
code = code.replace('from "lucide-react";', 'from "lucide-react";\nimport { Upload } from "lucide-react";')

with open('src/app/dashboard/admin/e-books/page.js', 'w') as f:
    f.write(code)
