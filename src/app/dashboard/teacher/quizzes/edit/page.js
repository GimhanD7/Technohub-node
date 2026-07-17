"use client";

import { useSearchParams } from "next/navigation";
import QuizEditor from "@/components/QuizEditor";

export default function TeacherEditQuizPage() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");

  return (
    <div className="py-6">
      {id ? <QuizEditor isEdit={true} quizId={id} /> : <div>No Quiz ID provided.</div>}
    </div>
  );
}
