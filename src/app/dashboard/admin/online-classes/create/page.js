"use client";

import ScheduleClassEditor from "@/components/ScheduleClassEditor";

export default function AdminCreateOnlineClassPage() {
  return (
    <div className="py-6">
      <ScheduleClassEditor isEdit={false} />
    </div>
  );
}
