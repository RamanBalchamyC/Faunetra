"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LeaderboardOptIn({ userId, initialOptIn }: { userId: string; initialOptIn: boolean }) {
  const router = useRouter();
  const [optIn, setOptIn] = useState(initialOptIn);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const supabase = createClient();
    const next = !optIn;
    const { error } = await supabase
      .from("profiles")
      .update({ leaderboard_opt_in: next })
      .eq("id", userId);
    setSaving(false);
    if (!error) {
      setOptIn(next);
      router.refresh();
    }
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={optIn} disabled={saving} onChange={toggle} />
      Show me on the leaderboard
    </label>
  );
}
