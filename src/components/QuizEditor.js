"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, ArrowLeft, AlertCircle, CheckSquare, Square, RefreshCw, Star, Image as ImageIcon, X, User, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchApi, API_BASE_URL, BASE_URL } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function QuizEditor({ quizId = null, isEdit = false }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [fee, setFee] = useState("");
  const [questions, setQuestions] = useState([
    {
      text: "",
      marks: 1,
      imageUrl: null,
      options: [
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false }
      ]
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Admin teacher-selection state
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherSelected, setTeacherSelected] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    // Allow teachers to edit their own quizzes, or at least edit quizzes in general
    if (isEdit && parsedUser.role === "teacher") {
      setIsReadOnly(false);
    }

    // If admin is creating a quiz, fetch teachers list first
    if (!isEdit && parsedUser.role === "admin") {
      fetchApi("/course/get_teachers").then(data => {
        if (data.success) setTeachers(data.teachers || []);
      });
    } else {
      // Teacher creating their own quiz — skip teacher selection
      setTeacherSelected(true);
    }

    if (isEdit && quizId) {
      setTeacherSelected(true);
      loadQuizData(quizId, parsedUser);
    }
  }, [quizId, isEdit]);

  const loadQuizData = async (id, currentUser) => {
    setIsLoading(true);
    setErrorMsg("");
    const data = await fetchApi(`/quiz/get?quizId=${id}&userId=${currentUser.id}&role=${currentUser.role}`);
    setIsLoading(false);
    
    if (data.success) {
      setTitle(data.quiz.title);
      // Format dates to fit datetime-local inputs (YYYY-MM-DDTHH:MM)
      // Prisma returns ISO strings like 2026-07-18T08:32:00.000Z
      const formatTime = (timeStr) => {
        if (!timeStr) return "";
        return new Date(timeStr).toISOString().substring(0, 16);
      };
      
      setStartTime(formatTime(data.quiz.start_time));
      setEndTime(formatTime(data.quiz.end_time));
      setFee(data.quiz.fee != null ? String(data.quiz.fee) : "");
      
      const formattedQuestions = data.quiz.questions.map(q => ({
        text: q.question_text || "",
        marks: q.marks,
        imageUrl: q.image_url || null,
        options: q.options.map(opt => ({
          text: opt.option_text || "",
          is_correct: Boolean(opt.is_correct)
        }))
      }));
      setQuestions(formattedQuestions);
    } else {
      setErrorMsg(data.message || "Failed to load quiz data.");
    }
  };

  const handleAddQuestion = () => {
    if (isReadOnly) return;
    setQuestions([
      ...questions,
      {
        text: "",
        marks: 1,
        imageUrl: null,
        options: [
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false }
        ]
      }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (isReadOnly) return;
    if (questions.length === 1) {
      setErrorMsg("A quiz must have at least one question.");
      return;
    }
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleQuestionTextChange = (index, value) => {
    if (isReadOnly) return;
    const updated = [...questions];
    updated[index].text = value;
    setQuestions(updated);
  };

  const handleQuestionMarksChange = (index, value) => {
    if (isReadOnly) return;
    const updated = [...questions];
    updated[index].marks = Math.max(1, parseInt(value) || 1);
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIndex, oIndex, value) => {
    if (isReadOnly) return;
    const updated = [...questions];
    updated[qIndex].options[oIndex].text = value;
    setQuestions(updated);
  };

  const handleToggleOptionCorrect = (qIndex, oIndex) => {
    if (isReadOnly) return;
    const updated = [...questions];
    updated[qIndex].options[oIndex].is_correct = !updated[qIndex].options[oIndex].is_correct;
    setQuestions(updated);
  };

  const handleAddOption = (qIndex) => {
    if (isReadOnly) return;
    const updated = [...questions];
    if (updated[qIndex].options.length >= 6) {
      setErrorMsg("A question can have a maximum of 6 answers.");
      return;
    }
    updated[qIndex].options.push({ text: "", is_correct: false });
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    if (isReadOnly) return;
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) {
      setErrorMsg("A question must have at least 2 options.");
      return;
    }
    updated[qIndex].options.splice(oIndex, 1);
    setQuestions(updated);
  };

  const handleImageUpload = async (qIndex, file) => {
    if (!file) return;
    
    try {
      setErrorMsg("");
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        const updated = [...questions];
        updated[qIndex].imageUrl = data.imageUrl;
        setQuestions(updated);
      } else {
        setErrorMsg(data.message || "Failed to upload image.");
      }
    } catch (e) {
      setErrorMsg("Image upload error: " + e.message);
    }
  };

  const handleRemoveImage = (qIndex) => {
    if (isReadOnly) return;
    const updated = [...questions];
    updated[qIndex].imageUrl = null;
    setQuestions(updated);
  };

  const handleSave = async () => {
    if (isReadOnly) return;
    if (!user || !user.role) {
      setErrorMsg("Unable to determine your user role. Please log in again.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");

    if (!title.trim()) {
      setErrorMsg("Please enter a quiz title.");
      return;
    }
    if (!startTime || !endTime) {
      setErrorMsg("Please select start and end times.");
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setErrorMsg("End time must be after start time.");
      return;
    }

    // Validate questions and options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setErrorMsg(`Question ${i + 1} text cannot be empty.`);
        return;
      }
      
      let correctCount = 0;
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        if (!opt.text.trim()) {
          setErrorMsg(`Question ${i + 1}, Option ${j + 1} text cannot be empty.`);
          return;
        }
        if (opt.is_correct) correctCount++;
      }

      if (correctCount === 0) {
        setErrorMsg(`Please mark at least one correct option for Question ${i + 1}.`);
        return;
      }
    }

    setIsSaving(true);
    const endpoint = isEdit ? "/quiz/edit" : "/quiz/create";
    // If admin is creating on behalf of a teacher, use selectedTeacher's ID
    const creatorId = (!isEdit && user.role === "admin" && selectedTeacher)
      ? selectedTeacher.id
      : user.id;
    const payload = {
      teacherId: creatorId,
      userId: user.id,
      role: user.role,
      title,
      startTime,
      endTime,
      questions: questions.map(q => ({
        questionText: q.text,
        marks: q.marks,
        imageUrl: q.imageUrl || null,
        options: q.options.map(o => o.text),
        correctOptionIndex: q.options.findIndex(o => o.is_correct)
      })),
      fee: parseFloat(fee) || 0,
      ...(isEdit ? { quizId } : {})
    };

    const response = await fetchApi(endpoint, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setIsSaving(false);

    if (response.success) {
      setSuccessMsg(response.message);
      setTimeout(() => {
        router.push(user.role === "admin" ? "/dashboard/admin/quizzes" : "/dashboard/teacher/quizzes");
      }, 1500);
    } else {
      setErrorMsg(response.message || "An error occurred while saving the quiz.");
    }
  };

  const getBackUrl = () => {
    if (!user) return "/home";
    return user.role === "admin" ? "/dashboard/admin/quizzes" : "/dashboard/teacher/quizzes";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
        <p>Loading quiz details...</p>
      </div>
    );
  }

  // Admin creating quiz: show teacher selection step first
  if (!isEdit && user?.role === "admin" && !teacherSelected) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-slate-800 pb-5">
          <button
            onClick={() => router.push("/dashboard/admin/quizzes")}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Create Quiz — Select Teacher</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">Choose which teacher this quiz will be created for.</p>
          </div>
        </div>

        {teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mb-3" />
            <p className="text-sm">Loading teachers...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teachers.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedTeacher(t); setTeacherSelected(true); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group ${
                  selectedTeacher?.id === t.id
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0">
                  {t.profile_picture ? (
                    <img src={t.profile_picture} alt={t.full_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{t.full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t.email}</p>
                  {t.index_number && <p className="text-xs text-slate-400 dark:text-slate-500">{t.index_number}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => !isEdit && user?.role === "admin" ? setTeacherSelected(false) : router.push(getBackUrl())}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              {isEdit ? (isReadOnly ? "View Quiz Details" : "Edit Quiz") : "Create New Quiz"}
            </h1>
            {!isEdit && user?.role === "admin" && selectedTeacher && (
              <p className="text-xs text-primary dark:text-primary font-medium mt-0.5">For: {selectedTeacher.full_name}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-slate-400">Set quiz questions, options, timings, and correct answers.</p>
          </div>
        </div>
        
        {!isReadOnly && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Quiz
          </Button>
        )}
      </div>

      {isReadOnly && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex gap-2.5 items-start">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-bold">Read-Only Access:</span> Teachers cannot edit a quiz after it has been created. Only administrators have editing permissions.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-xl flex gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-600 text-sm font-medium rounded-xl">
          {successMsg}
        </div>
      )}

      {/* Quiz Details Form */}
      <div className="dark:bg-[#1e293b] bg-white rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700/50 pb-2">Quiz Information</h3>
        
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Quiz Title / Name</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            disabled={isReadOnly}
            placeholder="e.g. Mid-Term Mock Algebra Exam"
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 dark:disabled:bg-slate-800/50 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Start Date & Time</label>
            <input 
              type="datetime-local" 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)} 
              disabled={isReadOnly}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 dark:disabled:bg-slate-800/50 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">End Date & Time</label>
            <input 
              type="datetime-local" 
              value={endTime} 
              onChange={(e) => setEndTime(e.target.value)} 
              disabled={isReadOnly}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 dark:disabled:bg-slate-800/50 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Quiz Fee (LKR) - Set to 0 for Free</label>
          <input 
            type="number" 
            value={fee} 
            onChange={(e) => {
              const val = e.target.value;
              // Allow empty string while typing; store raw string so no leading zeros
              setFee(val === "" ? "" : val);
            }}
            onBlur={(e) => {
              // On blur, clamp to valid number >= 0
              const parsed = parseFloat(e.target.value);
              setFee(isNaN(parsed) || parsed < 0 ? "0" : String(parsed));
            }}
            onFocus={(e) => {
              // Clear the field if value is 0 so user doesn't have to delete it
              if (parseFloat(e.target.value) === 0) setFee("");
            }}
            disabled={isReadOnly}
            min="0"
            step="0.01"
            placeholder="0 (Free)"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Quiz Questions ({questions.length})</h3>
          {!isReadOnly && (
            <button 
              type="button" 
              onClick={handleAddQuestion}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-secondary transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          )}
        </div>

        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-4 relative group">
            
            {/* Question Header */}
            <div className="flex items-start justify-between gap-4">
              <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-400 shrink-0">
                {qIndex + 1}
              </span>
              
              <div className="flex-1">
                <input 
                  type="text" 
                  value={q.text} 
                  onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Type question description here..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 dark:disabled:bg-slate-800/50 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 font-medium"
                />
              </div>

              <div className="w-24 shrink-0 flex items-center gap-1.5">
                <input 
                  type="number" 
                  value={q.marks} 
                  onChange={(e) => handleQuestionMarksChange(qIndex, e.target.value)}
                  disabled={isReadOnly}
                  min="1"
                  className="w-full px-2 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-center font-bold text-slate-800 dark:text-slate-200 disabled:bg-gray-50 dark:disabled:bg-slate-800/50 bg-white dark:bg-[#0f172a]"
                />
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Marks</span>
              </div>

              {!isReadOnly && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveQuestion(qIndex)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Image Upload Section */}
            <div className="pl-9 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Question Image (Optional)</label>
              </div>
              {q.imageUrl ? (
                <div className="relative w-32 h-24 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                  <img 
                    src={q.imageUrl.startsWith('http') ? q.imageUrl : `${BASE_URL}${q.imageUrl}`} 
                    alt="Question" 
                    className="w-full h-full object-cover" 
                  />
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(qIndex)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <label className={`flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isReadOnly 
                    ? "border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/50 cursor-not-allowed" 
                    : "border-blue-300 bg-blue-50 hover:border-blue-500 dark:border-blue-500/30 dark:bg-blue-500/10 dark:hover:border-blue-500/60"
                }`}>
                  <div className="flex flex-col items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-blue-500 dark:text-blue-400 mb-1" />
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Upload Image</span>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => e.target.files && handleImageUpload(qIndex, e.target.files[0])}
                    disabled={isReadOnly}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-2.5 pl-9">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Answer Options</label>
                {!isReadOnly && q.options.length < 6 && (
                  <button 
                    type="button" 
                    onClick={() => handleAddOption(qIndex)}
                    className="text-xs text-primary hover:text-secondary font-medium transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    + Add Option
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3 group/opt">
                    
                    {/* Tick box to mark correct */}
                    <button
                      type="button"
                      onClick={() => handleToggleOptionCorrect(qIndex, oIndex)}
                      disabled={isReadOnly}
                      className={`flex items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                        opt.is_correct 
                          ? "bg-green-500 border-green-500 text-white dark:bg-green-600 dark:border-green-600" 
                          : "bg-white border-gray-200 hover:border-green-300 text-gray-300 hover:text-green-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-600 dark:hover:text-green-400 dark:hover:border-green-500/50"
                      }`}
                      title={opt.is_correct ? "Marked as correct" : "Mark correct"}
                    >
                      {opt.is_correct ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>

                    <input 
                      type="text" 
                      value={opt.text} 
                      onChange={(e) => handleOptionTextChange(qIndex, oIndex, e.target.value)}
                      disabled={isReadOnly}
                      placeholder={`Option ${oIndex + 1}`}
                      className={`w-full px-4 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all ${
                        opt.is_correct 
                          ? "bg-green-50/35 border-green-200 focus:border-green-500 dark:bg-green-900/10 dark:border-green-800/50 dark:focus:border-green-500" 
                          : "bg-white border-gray-200 focus:border-primary dark:bg-[#0f172a] dark:border-slate-700"
                      } disabled:bg-gray-50 dark:disabled:bg-slate-800/50 text-slate-700 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500`}
                    />

                    {!isReadOnly && q.options.length > 2 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveOption(qIndex, oIndex)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-gray-50 rounded transition-colors opacity-0 group-hover/opt:opacity-100"
                        title="Delete Option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
        
        {!isReadOnly && (
          <button 
            type="button" 
            onClick={handleAddQuestion}
            className="w-full py-4 border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-primary transition-all bg-white hover:bg-slate-50 font-semibold text-sm cursor-pointer shadow-sm dark:border-slate-700 dark:bg-[#1e293b] dark:hover:bg-slate-800 dark:hover:border-primary/50 dark:text-slate-400 dark:hover:text-primary"
          >
            <Plus className="w-5 h-5" /> Add Another Question
          </button>
        )}
      </div>

      {/* Footer Save Area */}
      {!isReadOnly && (
        <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-slate-800 pt-5">
          <Button 
            variant="ghost" 
            onClick={() => router.push(getBackUrl())}
            className="border border-gray-200 text-slate-700 hover:bg-gray-50 shadow-none px-6 rounded-lg text-sm py-2 h-10 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 rounded-lg text-sm py-2 h-10 flex items-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Quiz
          </Button>
        </div>
      )}

    </div>
  );
}
