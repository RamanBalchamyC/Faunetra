"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AVATAR_OPTIONS, AvatarIcon } from "@/components/AvatarIcon";
import type { AvatarId } from "@/lib/types";

export function AvatarPicker({ userId, initial }: { userId: string; initial: AvatarId }) {
  const router = useRouter();
  const [selected, setSelected] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function choose(avatarId: AvatarId) {
    if (avatarId === selected || saving) return;
    setSelected(avatarId);
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ avatar_id: avatarId }).eq("id", userId);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-3">
      {AVATAR_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => choose(opt.id)}
          title={opt.label}
          aria-label={opt.label}
          aria-pressed={selected === opt.id}
          disabled={saving}
          className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition ${
            selected === opt.id ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted hover:border-accent hover:text-accent"
          }`}
        >
          <AvatarIcon avatarId={opt.id} size={30} />
        </button>
      ))}
    </div>
  );
}
