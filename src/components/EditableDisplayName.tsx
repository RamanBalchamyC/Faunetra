"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { containsProfanity } from "@/lib/profanity";

const MIN_LENGTH = 2;
const MAX_LENGTH = 30;

export function EditableDisplayName({ userId, initial }: { userId: string; initial: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = value.trim();
    if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
      setError(`Name must be ${MIN_LENGTH}-${MAX_LENGTH} characters.`);
      return;
    }
    if (containsProfanity(trimmed)) {
      setError("Please choose a different name.");
      return;
    }

    setError(null);
    setSaving(true);
    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ display_name: trimmed })
      .eq("id", userId);
    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }
    setValue(trimmed);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">{value}</span>
        <button onClick={() => setEditing(true)} className="text-xs text-accent hover:underline">
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={MAX_LENGTH}
        className="rounded-md border border-border px-2 py-1 text-sm"
        autoFocus
      />
      <button
        onClick={save}
        disabled={saving}
        className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
      >
        Save
      </button>
      <button
        onClick={() => {
          setValue(initial);
          setError(null);
          setEditing(false);
        }}
        className="text-xs text-text-muted hover:text-text-primary"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
