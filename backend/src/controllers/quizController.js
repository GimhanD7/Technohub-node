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

    const quizzes = await prisma.$queryRaw`
      SELECT q.*, u.full_name AS creator_name, COUNT(qs.id) AS question_count 
      FROM quizzes q 
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN questions qs ON q.id = qs.quiz_id
      GROUP BY q.id 
      ORDER BY q.start_time DESC
    `;

    const active = [];
    const upcoming = [];
    const past = [];
    const now = new Date();

    for (const quiz of quizzes) {
      let attempt = null;
      if (uid > 0) {
        attempt = await prisma.quiz_attempts.findFirst({
          where: { quiz_id: quiz.id, user_id: uid }
        });
      }

      let isPaid = true;
      const fee = quiz.fee ? parseFloat(quiz.fee) : 0;

      if (fee > 0) {
        if (uid > 0) {
          const user = await prisma.users.findUnique({ where: { id: uid }, select: { role: true } });
          if (user && user.role === 'student') {
            const payment = await prisma.quiz_payments.findFirst({
              where: { quiz_id: quiz.id, user_id: uid }
            });
            if (!payment) {
              isPaid = false;
            }
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
          isSubmitted: attempt.is_submitted === 1
        } : null
      };

      const qStart = new Date(quiz.start_time);
      const qEnd = new Date(quiz.end_time);

      if (now >= qStart && now <= qEnd) {
        active.push(formattedQuiz);
      } else if (now < qStart) {
        upcoming.push(formattedQuiz);
      } else {
        past.push(formattedQuiz);
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

    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const data = req.body;
    if (!data.teacherId || !data.title || !data.questions) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const quiz = await prisma.quizzes.create({
      data: {
        created_by: parseInt(data.teacherId),
        title: data.title,
        description: data.description || '',
        time_limit_minutes: parseInt(data.timeLimit),
        start_time: new Date(data.startTime),
        end_time: new Date(data.endTime),
        status: data.status || 'draft',
        is_paid: data.isPaid ? 1 : 0,
        price: data.isPaid ? parseFloat(data.price) : 0,
        questions: {
          create: data.questions.map(q => ({
            question_text: q.questionText,
            marks: parseFloat(q.marks),
            options: {
              create: q.options.map((opt, idx) => ({
                option_text: opt,
                is_correct: idx === q.correctOptionIndex ? 1 : 0
              }))
            }
          }))
        }
      }
    });

    await logActivity(data.teacherId, 'Created Quiz', `Title: ${data.title}`, req);
    res.json({ success: true, message: "Quiz created successfully." });
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

    // Since questions and options might have been added/removed, the easiest approach is to delete all existing questions for this quiz and recreate them. Prisma cascading deletes will handle options if configured, or we can manually delete.
    await prisma.$transaction(async (tx) => {
      await tx.quizzes.update({
        where: { id: parseInt(data.quizId) },
        data: {
          title: data.title,
          description: data.description || '',
          time_limit_minutes: parseInt(data.timeLimit),
          start_time: new Date(data.startTime),
          end_time: new Date(data.endTime),
          status: data.status,
          is_paid: data.isPaid ? 1 : 0,
          price: data.isPaid ? parseFloat(data.price) : 0
        }
      });

      // Delete old questions (options are usually CASCADE deleted by DB, if not, delete them first)
      const oldQuestions = await tx.questions.findMany({ where: { quiz_id: parseInt(data.quizId) } });
      const oldQIds = oldQuestions.map(q => q.id);
      await tx.options.deleteMany({ where: { question_id: { in: oldQIds } } });
      await tx.questions.deleteMany({ where: { quiz_id: parseInt(data.quizId) } });

      // Insert new
      for (const q of data.questions) {
        await tx.questions.create({
          data: {
            quiz_id: parseInt(data.quizId),
            question_text: q.questionText,
            marks: parseFloat(q.marks),
            options: {
              create: q.options.map((opt, idx) => ({
                option_text: opt,
                is_correct: idx === q.correctOptionIndex ? 1 : 0
              }))
            }
          }
        });
      }
    });

    if (data.teacherId) await logActivity(data.teacherId, 'Edited Quiz', `Quiz ID: ${data.quizId}`, req);
    res.json({ success: true, message: "Quiz updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update quiz: " + error.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Quiz ID required." });

    await prisma.quizzes.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Quiz deleted." });
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

    res.json({ success: true, quiz: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.startAttempt = async (req, res) => {
  try {
    const { userId, quizId } = req.body;
    if (!userId || !quizId) return res.status(400).json({ success: false, message: "Missing data." });

    const quiz = await prisma.quizzes.findUnique({ where: { id: parseInt(quizId) } });
    if (!quiz || quiz.status !== 'published') return res.status(400).json({ success: false, message: "Quiz unavailable." });

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
      // Create new attempt
      const endTime = new Date(now.getTime() + quiz.time_limit_minutes * 60000);
      const actualEndTime = endTime > quiz.end_time ? quiz.end_time : endTime;

      attempt = await prisma.quiz_attempts.create({
        data: {
          user_id: parseInt(userId),
          quiz_id: parseInt(quizId),
          start_time: now,
          end_time: actualEndTime,
          ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
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

    res.json({ success: true, attemptId: attempt.id, questions, endTime: attempt.end_time });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveProgress = async (req, res) => {
  try {
    const { attemptId, responses } = req.body; // responses: { [questionId]: optionId }
    if (!attemptId || !responses) return res.status(400).json({ success: false, message: "Missing data." });

    // Ensure attempt is active
    const attempt = await prisma.quiz_attempts.findUnique({ where: { id: parseInt(attemptId) } });
    if (!attempt || attempt.is_submitted) return res.status(400).json({ success: false, message: "Invalid or submitted attempt." });

    for (const [qId, oId] of Object.entries(responses)) {
      if (oId) {
        await prisma.student_responses.upsert({
          where: { attempt_id_question_id: { attempt_id: parseInt(attemptId), question_id: parseInt(qId) } },
          update: { option_id: parseInt(oId) },
          create: { attempt_id: parseInt(attemptId), question_id: parseInt(qId), option_id: parseInt(oId) }
        });
      }
    }

    res.json({ success: true, message: "Progress saved." });
  } catch (error) {
    // If the compound unique constraint doesn't exist natively on DB, we handle fallback:
    if (error.code === 'P2002' || error.message.includes('Unique')) {
       // Manual delete/insert fallback if upsert fails on missing constraint
       for (const [qId, oId] of Object.entries(req.body.responses)) {
           if (oId) {
             const existing = await prisma.student_responses.findFirst({ where: { attempt_id: parseInt(req.body.attemptId), question_id: parseInt(qId) } });
             if (existing) {
                await prisma.student_responses.update({ where: { id: existing.id }, data: { option_id: parseInt(oId) } });
             } else {
                await prisma.student_responses.create({ data: { attempt_id: parseInt(req.body.attemptId), question_id: parseInt(qId), option_id: parseInt(oId) } });
             }
           }
       }
       return res.json({ success: true, message: "Progress saved via fallback." });
    }
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
    const submitTime = now > attempt.end_time ? attempt.end_time : now;

    // Calculate score
    const questions = await prisma.questions.findMany({ where: { quiz_id: quiz.id }, include: { options: true } });
    const responses = await prisma.student_responses.findMany({ where: { attempt_id: parseInt(attemptId) } });

    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const q of questions) {
      maxPossibleScore += q.marks;
      const correctOption = q.options.find(o => Boolean(o.is_correct));
      const studentResponse = responses.find(r => r.question_id === q.id);

      if (correctOption && studentResponse && studentResponse.option_id === correctOption.id) {
        totalScore += q.marks;
      }
    }

    await prisma.quiz_attempts.update({
      where: { id: parseInt(attemptId) },
      data: { score: totalScore, submitted_at: submitTime, is_submitted: 1 }
    });

    res.json({
      success: true,
      message: "Quiz submitted successfully!",
      score: totalScore,
      maxScore: maxPossibleScore,
      submitTime
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
    let attempts;

    if (role === 'teacher') {
      attempts = await prisma.quiz_attempts.findMany({
        where: { quiz_id: parseInt(quizId), is_submitted: 1 },
        include: { users: { select: { full_name: true, index_number: true } } },
        orderBy: { score: 'desc' }
      });
    } else {
      attempts = await prisma.quiz_attempts.findMany({
        where: { user_id: parseInt(userId), quiz_id: parseInt(quizId) }
      });
    }

    const formatted = attempts.map(a => ({
      ...a,
      student_name: a.users?.full_name || 'Unknown',
      student_index: a.users?.index_number || 'Unknown',
      users: undefined
    }));

    res.json({ success: true, attempts: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRankings = async (req, res) => {
  try {
    const { quizId } = req.query;
    const attempts = await prisma.quiz_attempts.findMany({
      where: { quiz_id: parseInt(quizId), is_submitted: 1 },
      include: { users: { select: { full_name: true, index_number: true } } },
      orderBy: [{ score: 'desc' }, { submitted_at: 'asc' }]
    });

    let currentRank = 1;
    let displayRank = 1;
    let prevScore = null;

    const formatted = attempts.map((a, index) => {
      if (prevScore !== null && a.score < prevScore) {
        displayRank = currentRank;
      }
      prevScore = a.score;
      currentRank++;

      return {
        rank: displayRank,
        score: a.score,
        submitted_at: a.submitted_at,
        student_name: a.users?.full_name || 'Unknown',
        student_index: a.users?.index_number || 'Unknown',
      };
    });

    res.json({ success: true, rankings: formatted });
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
    if (!quiz || !quiz.is_paid) return res.json({ success: true, message: "Quiz is free." });

    // Calculate user balance
    const balanceAgg = await prisma.wallet_transactions.aggregate({
      where: { user_id: parseInt(userId), status: 'approved' },
      _sum: { amount: true }
    });
    const balance = balanceAgg._sum.amount || 0;

    if (balance < quiz.price) {
      return res.json({ success: false, message: `Insufficient balance. Quiz costs ${quiz.price} LKR, but your balance is ${balance} LKR.` });
    }

    // Deduct
    await prisma.wallet_transactions.create({
      data: {
        user_id: parseInt(userId),
        amount: -quiz.price,
        type: 'debit',
        status: 'approved',
        description: `Paid for quiz: ${quiz.title}`
      }
    });

    // Record teacher earning (80% by default if not set in teacher_commissions)
    const comm = await prisma.teacher_commissions.findUnique({ where: { teacher_id: quiz.created_by } });
    let percentage = 80;
    if (comm && comm.commission_type === 'percentage') percentage = comm.commission_value;
    
    const netEarning = quiz.price * (percentage / 100);

    await prisma.teacher_earnings_history.create({
      data: {
        teacher_id: quiz.created_by,
        amount: quiz.price,
        commission_rate: percentage,
        net_earning: netEarning,
        source: 'Quiz',
        source_id: quiz.id
      }
    });

    res.json({ success: true, message: "Payment successful." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
