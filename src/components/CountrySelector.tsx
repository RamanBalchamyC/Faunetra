"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES } from "@/lib/countries";
import { FlagIcon } from "@/components/FlagIcon";

// A plain native <select> rather than a react-select combo: it gets
// type-to-search for free in every browser and needs no extra UI
// dependency. Native <option> elements can't render an SVG flag, so the
// dropdown itself is text-only — the selected flag previews next to it via
// FlagIcon (real SVGs, not emoji — see FlagIcon.tsx for why).
export function CountrySelector({ userId, initial }: { userId: string; initial: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);

  async function choose(code: string) {
    setValue(code);
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ country_code: code || null })
      .eq("id", userId);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {value && <FlagIcon code={value} className="h-4 w-auto rounded-[1px]" />}
      <select
        value={value}
        onChange={(e) => choose(e.target.value)}
        disabled={saving}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
      >
        <option value="">Not specified</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
