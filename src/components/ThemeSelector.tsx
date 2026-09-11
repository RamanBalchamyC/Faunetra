"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ThemePreference } from "@/lib/types";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeSelector({ userId, initial }: { userId: string; initial: ThemePreference }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function choose(next: ThemePreference) {
    if (next === value) return;
    setValue(next);
    // Apply immediately so it feels instant, ahead of the server round trip.
    if (next === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", next);
    }

    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ theme_preference: next }).eq("id", userId);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="inline-flex rounded-md border border-border p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => choose(opt.value)}
          disabled={saving}
          className={`rounded px-3 py-1.5 text-sm transition ${
            value === opt.value ? "bg-primary text-white" : "text-text-muted hover:text-text-primary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
