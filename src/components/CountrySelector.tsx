"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, countryCodeToFlag } from "@/lib/countries";

// A plain native <select> rather than a react-select + flag-icon-package
// combo: it gets type-to-search for free in every browser, needs no extra
// dependencies, and flag emoji (see countryCodeToFlag) mean there are no
// flag image assets to bundle at all.
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
    <select
      value={value}
      onChange={(e) => choose(e.target.value)}
      disabled={saving}
      className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
    >
      <option value="">Not specified</option>
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {countryCodeToFlag(c.code)} {c.name}
        </option>
      ))}
    </select>
  );
}
