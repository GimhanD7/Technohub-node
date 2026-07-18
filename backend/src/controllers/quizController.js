const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logActivity } = require('../utils/logger');

// ==========================================
// 1. TEACHER MANAGEMENT (CRUD)
// ==========================================

exports.listQuizzes = async (req, res) => {
  try {
    const { userId } = req.query;
    const uid = userId ? parseInt(userId) : 0;

    let userRole = 'student';
    if (uid > 0) {
      const user = await prisma.users.findUnique({ where: { id: uid }, select: { role: true } });
      if (user) {
        userRole = user.role;
      }
    }

    let quizzes;
    if (userRole === 'teacher') {
      quizzes = await prisma.$queryRaw`
        SELECT q.*, u.full_name AS creator_name, COUNT(qs.id) AS question_count 
        FROM quizzes q 
        LEFT JOIN users u ON q.created_by = u.id
        LEFT JOIN questions qs ON q.id = qs.quiz_id
        WHERE q.created_by = ${uid}
        GROUP BY q.id 
        ORDER BY q.start_time DESC
      `;
    } else {
      quizzes = await prisma.$queryRaw`
        SELECT q.*, u.full_name AS creator_name, COUNT(qs.id) AS question_count 
        FROM quizzes q 
        LEFT JOIN users u ON q.created_by = u.id
        LEFT JOIN questions qs ON q.id = qs.quiz_id
        GROUP BY q.id 
        ORDER BY q.start_time DESC
      `;
    }

    const active = [];
    const upcoming = [];
    const past = [];
    const now = new Date();

    for (const quiz of quizzes) {
      let attempt = null;
      if (uid > 0 && userRole === 'student') {
        attempt = await prisma.quiz_attempts.findFirst({
          where: { quiz_id: quiz.id, user_id: uid }
        });
      }

      let isPaid = true;
      const fee = quiz.fee ? parseFloat(quiz.fee) : 0;

      if (fee > 0) {
        if (uid > 0 && userRole === 'student') {
          const payment = await prisma.quiz_payments.findFirst({
            where: { quiz_id: quiz.id, user_id: uid }
          });
          if (!payment) {
            isPaid = false;
          }
        } else {
          isPaid = false;
        }
      }

      const formattedQuiz = {
        id: quiz.id,
        title: quiz.title,
        startTime: quiz.start_time,
        endTime: quiz.end_time,
        createdBy: quiz.created_by,
        creatorName: quiz.creator_name,
        questionCount: Number(quiz.question_count) || 0,
        createdAt: quiz.created_at,
        fee: fee,
        isPaid: isPaid,
        attempt: attempt ? {
          id: attempt.id,
          score: attempt.score,
          startedAt: attempt.start_time,
          submittedAt: attempt.submitted_at,
          isSubmitted: Boolean(attempt.is_submitted)
        } : null
      };

      const qStart = new Date(quiz.start_time);
      const qEnd = new Date(quiz.end_time);

      if (now >= qStart && now <= qEnd) {
        active.push(formattedQuiz);
      } else if (now < qStart) {
        upcoming.push(formattedQuiz);
      } else {
        // For past quizzes: only include if the student has actually submitted an attempt.
        // For teachers and admins, show all past quizzes.
        if (userRole === 'student' && uid > 0) {
          if (attempt && Boolean(attempt.is_submitted)) {
            past.push(formattedQuiz);
          }
        } else {
          past.push(formattedQuiz);
        }
      }
    }

    res.json({
      success: true,
      quizzes: {
        active,
        upcoming,
        past
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const { quizId } = req.query;
    if (!quizId) return res.status(400).json({ success: false, message: "Quiz ID is required." });

    const quiz = await prisma.quizzes.findUnique({
      where: { id: parseInt(quizId) },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found." });

    res.json({ 
      success: true, 
      quiz: {
        ...quiz,
        startTime: quiz.start_time,
        endTime: quiz.end_time,
        now: new Date().toISOString()
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const data = req.body;

    const missing = [];
    if (!data.teacherId) missing.push('teacherId');
    if (!data.title) missing.push('title');
    if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) missing.push('questions');
    if (!data.startTime) missing.push('startTime');
    if (!data.endTime) missing.push('endTime');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({ success: false, message: "Cannot create a quiz in the past. Please select a future start time." });
    }
    if (end <= start) {
      return res.status(400).json({ success: false, message: "End time must be after the start time." });
    }

    const fee = parseFloat(data.fee) || 0;

    const quiz = await prisma.quizzes.create({
      data: {
        created_by: parseInt(data.teacherId),
        title: data.title.trim(),
        start_time: start,
        end_time: new Date(data.endTime),
        fee: fee,
        questions: {
          create: data.questions.map(q => ({
            question_text: q.questionText,
            marks: parseInt(q.marks) || 1,
            image_url: q.imageUrl || null,
            options: {
              create: q.options.map((opt, idx) => ({
                option_text: opt,
                is_correct: idx === q.correctOptionIndex
              }))
            }
          }))
        }
      }
    });

    await logActivity(data.teacherId, 'Created Quiz', `Title: ${data.title}`, req);
    res.json({ success: true, message: "Quiz created successfully.", quizId: quiz.id });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create quiz: " + error.message });
  }
};

exports.editQuiz = async (req, res) => {
  try {
    const data = req.body;
    if (!data.quizId || !data.title || !data.questions) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Validate times — prevent saving a quiz with a past start time
    if (!data.startTime || !data.endTime) {
      return res.status(400).json({ success: false, message: "Start time and end time are required." });
    }

    const start = new Date(data.startTime);
    const end   = new Date(data.endTime);
    const now   = new Date();

    if (start < now) {
      return res.status(400).json({
        success: false,
        message: "Cannot set a quiz start time in the past. Please select a future start time."
      });
    }
    if (end <= start) {
      return res.status(400).json({ success: false, message: "End time must be after the start time." });
    }

    const fee = parseFloat(data.fee) || 0;

    await prisma.$transaction(async (tx) => {
      await tx.quizzes.update({
        where: { id: parseInt(data.quizId) },
        data: {
          title: data.title.trim(),
          start_time: new Date(data.startTime),
          end_time: new Date(data.endTime),
          fee: fee
        }
      });

      // Delete old questions and their options
      const oldQuestions = await tx.questions.findMany({ where: { quiz_id: parseInt(data.quizId) } });
      const oldQIds = oldQuestions.map(q => q.id);
      if (oldQIds.length > 0) {
        await tx.options.deleteMany({ where: { question_id: { in: oldQIds } } });
      }
      await tx.questions.deleteMany({ where: { quiz_id: parseInt(data.quizId) } });

      // Insert new questions
      for (const q of data.questions) {
        await tx.questions.create({
          data: {
            quiz_id: parseInt(data.quizId),
            question_text: q.questionText,
            marks: parseInt(q.marks) || 1,
            image_url: q.imageUrl || null,
            options: {
              create: q.options.map((opt, idx) => ({
                option_text: opt,
                is_correct: idx === q.correctOptionIndex
              }))
            }
          }
        });
      }
    });

    const actorId = data.teacherId || data.userId;
    if (actorId) await logActivity(actorId, 'Edited Quiz', `Quiz ID: ${data.quizId}`, req);
    res.json({ success: true, message: "Quiz updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update quiz: " + error.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    // Support both `id` and `quizId` field names from frontend
    const id = req.body.quizId || req.body.id;
    if (!id) return res.status(400).json({ success: false, message: "Quiz ID required." });

    const quizId = parseInt(id);

    // Delete in correct order to respect FK constraints
    // 1. Get all questions for this quiz
    const questionsToDelete = await prisma.questions.findMany({ where: { quiz_id: quizId } });
    const questionIds = questionsToDelete.map(q => q.id);

    // 2. Delete student responses linked to attempts for this quiz
    const attemptsToDelete = await prisma.quiz_attempts.findMany({ where: { quiz_id: quizId } });
    const attemptIds = attemptsToDelete.map(a => a.id);

    if (attemptIds.length > 0) {
      await prisma.student_responses.deleteMany({ where: { attempt_id: { in: attemptIds } } });
    }
    await prisma.quiz_attempts.deleteMany({ where: { quiz_id: quizId } });
    await prisma.quiz_payments.deleteMany({ where: { quiz_id: quizId } });

    // 3. Delete options then questions
    if (questionIds.length > 0) {
      await prisma.options.deleteMany({ where: { question_id: { in: questionIds } } });
    }
    await prisma.questions.deleteMany({ where: { quiz_id: quizId } });

    // 4. Finally delete the quiz
    await prisma.quizzes.delete({ where: { id: quizId } });

    res.json({ success: true, message: "Quiz deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. STUDENT TAKING QUIZ
// ==========================================

exports.getLobby = async (req, res) => {
  try {
    const { quizId } = req.query;
    const quiz = await prisma.quizzes.findUnique({
      where: { id: parseInt(quizId) },
      include: {
        users: { select: { full_name: true } },
        _count: { select: { questions: true } }
      }
    });

    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found." });

    // Calculate total marks
    const marksAgg = await prisma.questions.aggregate({
      where: { quiz_id: parseInt(quizId) },
      _sum: { marks: true }
    });

    const formatted = {
      ...quiz,
      teacher_name: quiz.users?.full_name || 'Unknown',
      question_count: quiz._count.questions,
      total_marks: marksAgg._sum.marks || 0,
      users: undefined,
      _count: undefined
    };

    // Fetch students who have joined (have an active attempt) for the lobby list
    const activeAttempts = await prisma.quiz_attempts.findMany({
      where: { quiz_id: parseInt(quizId), is_submitted: false },
      include: { users: { select: { full_name: true } } }
    });
    const students = activeAttempts.map(a => ({ fullName: a.users?.full_name || 'Unknown' }));

    res.json({ success: true, quiz: formatted, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.startAttempt = async (req, res) => {
  try {
    const { userId, quizId } = req.body;
    if (!userId || !quizId) return res.status(400).json({ success: false, message: "Missing data." });

    const quiz = await prisma.quizzes.findUnique({ where: { id: parseInt(quizId) } });
    if (!quiz) return res.status(400).json({ success: false, message: "Quiz not found." });

    const now = new Date();
    if (now < quiz.start_time || now > quiz.end_time) {
      return res.status(400).json({ success: false, message: "Quiz is not currently active." });
    }

    // Check existing attempt
    let attempt = await prisma.quiz_attempts.findFirst({
      where: { user_id: parseInt(userId), quiz_id: parseInt(quizId) }
    });

    if (attempt) {
      if (attempt.is_submitted) {
        return res.json({ success: false, message: "You have already submitted this quiz.", alreadySubmitted: true });
      }
    } else {
      // Create new attempt - only use columns that exist in schema
      attempt = await prisma.quiz_attempts.create({
        data: {
          user_id: parseInt(userId),
          quiz_id: parseInt(quizId)
          // started_at has default(now()), is_submitted has default(false)
        }
      });
    }

    // Return the quiz data without the `is_correct` flags
    const questions = await prisma.questions.findMany({
      where: { quiz_id: parseInt(quizId) },
      include: {
        options: {
          select: { id: true, question_id: true, option_text: true } // Omit is_correct
        }
      }
    });

    res.json({ success: true, attemptId: attempt.id, questions, endTime: quiz.end_time });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveProgress = async (req, res) => {
  try {
    const { attemptId, questionId, selectedOptions, isFlagged } = req.body;
    if (!attemptId || !questionId) return res.status(400).json({ success: false, message: "Missing data." });

    const attempt = await prisma.quiz_attempts.findUnique({ where: { id: parseInt(attemptId) } });
    if (!attempt || attempt.is_submitted) return res.status(400).json({ success: false, message: "Invalid or submitted attempt." });

    // First delete all existing responses for this question and attempt
    await prisma.student_responses.deleteMany({
      where: { attempt_id: parseInt(attemptId), question_id: parseInt(questionId) }
    });

    // Insert new selected options
    if (selectedOptions && selectedOptions.length > 0) {
      const responsesToCreate = selectedOptions.map(optionId => ({
        attempt_id: parseInt(attemptId),
        question_id: parseInt(questionId),
        option_id: parseInt(optionId)
      }));
      await prisma.student_responses.createMany({
        data: responsesToCreate
      });
    }

    // Save flag status
    if (isFlagged !== undefined) {
      const existingFlag = await prisma.student_flags.findFirst({
        where: { attempt_id: parseInt(attemptId), question_id: parseInt(questionId) }
      });
      if (existingFlag) {
        await prisma.student_flags.update({
          where: { id: existingFlag.id },
          data: { is_flagged: Boolean(isFlagged) }
        });
      } else {
        await prisma.student_flags.create({
          data: {
            attempt_id: parseInt(attemptId),
            question_id: parseInt(questionId),
            is_flagged: Boolean(isFlagged)
          }
        });
      }
    }

    res.json({ success: true, message: "Progress saved." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { attemptId } = req.body;
    if (!attemptId) return res.status(400).json({ success: false, message: "Missing attempt ID." });

    const attempt = await prisma.quiz_attempts.findUnique({
      where: { id: parseInt(attemptId) },
      include: { quizzes: true }
    });

    if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found." });
    if (attempt.is_submitted) return res.json({ success: true, message: "Already submitted.", score: attempt.score });

    const quiz = attempt.quizzes;
    const now = new Date();

    // Calculate score
    const questions = await prisma.questions.findMany({ where: { quiz_id: quiz.id }, include: { options: true } });
    const responses = await prisma.student_responses.findMany({ where: { attempt_id: parseInt(attemptId) } });

    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const q of questions) {
      maxPossibleScore += q.marks;
      
      const correctOptions = q.options.filter(o => Boolean(o.is_correct)).map(o => o.id);
      const studentSelected = responses.filter(r => r.question_id === q.id).map(r => r.option_id);
      
      // Check if student selected EXACTLY the correct options
      if (correctOptions.length > 0 && 
          correctOptions.length === studentSelected.length && 
          correctOptions.every(id => studentSelected.includes(id))) {
        totalScore += q.marks;
      }
    }

    await prisma.quiz_attempts.update({
      where: { id: parseInt(attemptId) },
      data: { score: totalScore, submitted_at: now, is_submitted: true }
    });

    res.json({
      success: true,
      message: "Quiz submitted successfully!",
      score: totalScore,
      maxScore: maxPossibleScore,
      submitTime: now
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. RESULTS & RANKINGS
// ==========================================

exports.getSubmissions = async (req, res) => {
  try {
    const { quizId, userId, role } = req.query;

    // Fetch quiz details
    const quiz = await prisma.quizzes.findUnique({
      where: { id: parseInt(quizId) }
    });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });

    // Fetch questions with options for expanded answer view
    const questions = await prisma.questions.findMany({
      where: { quiz_id: parseInt(quizId) },
      include: { options: true }
    });

    let attempts;
    if (role === 'teacher' || role === 'admin') {
      attempts = await prisma.quiz_attempts.findMany({
        where: { quiz_id: parseInt(quizId), is_submitted: true },
        include: { users: { select: { full_name: true, index_number: true, phone_number: true, role: true } } },
        orderBy: [{ score: 'desc' }, { submitted_at: 'asc' }]
      });
    } else {
      attempts = await prisma.quiz_attempts.findMany({
        where: { user_id: parseInt(userId), quiz_id: parseInt(quizId) }
      });
    }

    // Calculate max possible score
    const marksAgg = await prisma.questions.aggregate({
      where: { quiz_id: parseInt(quizId) },
      _sum: { marks: true }
    });
    const maxScore = parseFloat(marksAgg._sum.marks) || 0;

    // First add timeTaken
    const mapped = attempts.map(a => {
      const timeTaken = a.submitted_at && a.started_at
        ? Math.round((new Date(a.submitted_at) - new Date(a.started_at)) / 1000)
        : 0;
      return { ...a, timeTaken };
    });

    // Sort by score desc, then timeTaken asc (if available)
    mapped.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeTaken - b.timeTaken;
    });

    let rank = 1;
    let displayRank = 1;
    let prevScore = null;
    let prevTime = null;

    const formatted = mapped.map((a, idx) => {
      if (prevScore !== null) {
         if (a.score < prevScore || (a.score === prevScore && a.timeTaken > prevTime)) {
             displayRank = rank;
         }
      }
      prevScore = a.score;
      prevTime = a.timeTaken;
      rank++;

      return {
        attemptId: a.id,
        rank: displayRank,
        score: a.score,
        percentage: maxScore > 0 ? Math.round((a.score / maxScore) * 100) : 0,
        submittedAt: a.submitted_at,
        timeTaken: a.timeTaken,
        fullName: a.users?.full_name || 'Unknown',
        indexNumber: a.users?.index_number || 'N/A',
        phone: a.users?.phone_number || 'N/A',
        role: a.users?.role || 'student',
        answers: {}
      };
    });

    // Attach student responses for expanded view
    if (formatted.length > 0) {
      const attemptIds = attempts.map(a => a.id);
      const responses = await prisma.student_responses.findMany({
        where: { attempt_id: { in: attemptIds } }
      });
      for (const sub of formatted) {
        const subResponses = responses.filter(r => r.attempt_id === sub.attemptId);
        sub.answers = subResponses.reduce((acc, r) => {
          if (!acc[r.question_id]) acc[r.question_id] = [];
          acc[r.question_id].push(r.option_id);
          return acc;
        }, {});
      }
    }

    // Statistics
    const totalSubmissions = formatted.length;
    const avgScore = totalSubmissions > 0
      ? Math.round((formatted.reduce((s, a) => s + a.score, 0) / totalSubmissions) * 100) / 100
      : 0;
    const avgPercentage = maxScore > 0 ? Math.round((avgScore / maxScore) * 100) : 0;

    res.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        startTime: quiz.start_time,
        endTime: quiz.end_time,
        fee: quiz.fee
      },
      questions: questions.map(q => ({
        id: q.id,
        text: q.question_text,
        imageUrl: q.image_url || null,
        options: q.options
      })),
      submissions: formatted,
      statistics: {
        totalSubmissions,
        averageScore: avgScore,
        averagePercentage: avgPercentage,
        maxScore
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRankings = async (req, res) => {
  try {
    const { quizId } = req.query;
    if (!quizId) return res.status(400).json({ success: false, message: 'quizId is required.' });

    const qId = parseInt(quizId);

    const attempts = await prisma.quiz_attempts.findMany({
      where: { quiz_id: qId, is_submitted: true },
      include: { users: { select: { full_name: true, index_number: true } } },
      orderBy: [{ score: 'desc' }, { submitted_at: 'asc' }]
    });

    // Calculate max possible marks for this quiz
    const questionsAgg = await prisma.questions.aggregate({
      where: { quiz_id: qId },
      _sum: { marks: true }
    });
    const maxMarks = questionsAgg._sum.marks || 0;

    // First add timeTaken
    const mapped = attempts.map(a => {
      const timeTaken = a.submitted_at && a.started_at
        ? Math.round((new Date(a.submitted_at) - new Date(a.started_at)) / 1000)
        : null;
      return { ...a, timeTaken };
    });

    // Sort by score desc, then timeTaken asc (if available)
    mapped.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.timeTaken !== null && b.timeTaken !== null) return a.timeTaken - b.timeTaken;
      return 0;
    });

    let currentRank = 1;
    let displayRank = 1;
    let prevScore = null;
    let prevTime = null;

    const formatted = mapped.map((a) => {
      if (prevScore !== null) {
         if (a.score < prevScore || (a.score === prevScore && a.timeTaken > prevTime)) {
             displayRank = currentRank;
         }
      }
      prevScore = a.score;
      prevTime = a.timeTaken;
      currentRank++;

      return {
        rank: displayRank,
        userId: a.user_id,
        score: a.score,
        submitted_at: a.submitted_at,
        fullName: a.users?.full_name || 'Unknown',
        indexNumber: a.users?.index_number || '-',
        timeTaken: a.timeTaken,
      };
    });

    res.json({ success: true, rankings: formatted, maxMarks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getReview = async (req, res) => {
  try {
    const { attemptId } = req.query;
    const attempt = await prisma.quiz_attempts.findUnique({
      where: { id: parseInt(attemptId) }
    });

    if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found." });

    const questions = await prisma.questions.findMany({
      where: { quiz_id: attempt.quiz_id },
      include: { options: true }
    });

    const responses = await prisma.student_responses.findMany({
      where: { attempt_id: attempt.id }
    });

    const reviewData = questions.map(q => {
      const correctOption = q.options.find(o => Boolean(o.is_correct));
      const studentResponse = responses.find(r => r.question_id === q.id);
      const isCorrect = correctOption && studentResponse && studentResponse.option_id === correctOption.id;

      return {
        id: q.id,
        question_text: q.question_text,
        marks: q.marks,
        options: q.options,
        selected_option_id: studentResponse ? studentResponse.option_id : null,
        correct_option_id: correctOption ? correctOption.id : null,
        is_correct: isCorrect
      };
    });

    res.json({ success: true, review: reviewData, score: attempt.score });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. PAYMENTS
// ==========================================
exports.payForQuiz = async (req, res) => {
  try {
    const { userId, quizId } = req.body;
    if (!userId || !quizId) return res.status(400).json({ success: false, message: "Missing data." });

    const quiz = await prisma.quizzes.findUnique({ where: { id: parseInt(quizId) } });
    const fee = quiz ? parseFloat(quiz.fee) : 0;
    
    if (!quiz || fee <= 0) return res.json({ success: true, message: "Quiz is free." });

    const user = await prisma.users.findUnique({ where: { id: parseInt(userId) } });
    const balance = user ? parseFloat(user.wallet_balance) : 0;

    if (balance < fee) {
      return res.json({ success: false, message: `Insufficient balance. Quiz costs ${fee} LKR, but your balance is ${balance} LKR.` });
    }

    await prisma.$transaction(async (tx) => {
      // Deduct wallet balance
      await tx.users.update({
        where: { id: parseInt(userId) },
        data: { wallet_balance: { decrement: fee } }
      });
      
      // Add wallet transaction
      await tx.wallet_transactions.create({
        data: {
          user_id: parseInt(userId),
          amount: fee,
          type: 'debit',
          status: 'approved',
          description: `Paid for quiz: ${quiz.title}`
        }
      });
      
      // Add to quiz_payments
      await tx.quiz_payments.create({
        data: {
          user_id: parseInt(userId),
          quiz_id: parseInt(quizId),
          amount: fee
        }
      });

      // Record teacher earning (80% by default if not set in teacher_commissions)
      const comm = await tx.teacher_commissions.findUnique({ where: { teacher_id: quiz.created_by } });
      let percentage = 80;
      if (comm && comm.commission_type === 'percentage') percentage = parseFloat(comm.commission_value);
      
      const netEarning = fee * (percentage / 100);

      await tx.teacher_earnings_history.create({
        data: {
          teacher_id: quiz.created_by,
          amount: fee,
          commission_type: 'percentage',
          commission_value: percentage,
          net_earning: netEarning,
          description: `Earning from quiz: ${quiz.title}`
        }
      });
    });

    res.json({ success: true, message: "Payment successful." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
