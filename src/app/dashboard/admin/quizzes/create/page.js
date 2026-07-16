"use client";

import QuizEditor from "@/components/QuizEditor";

export default function AdminCreateQuizPage() {
  return (
    <div className="py-6">
      <QuizEditor isEdit={false} />
    </div>
  );
}
