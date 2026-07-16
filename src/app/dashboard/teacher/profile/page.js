"use client";

import { useEffect, useState } from "react";
import ProfileForm from "@/components/ProfileForm";

export default function TeacherProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("techno_hub_user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  if (!user) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <ProfileForm initialUser={user} />
    </div>
  );
}
