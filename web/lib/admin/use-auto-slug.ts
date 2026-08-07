"use client";

import { useState } from "react";
import { sanitizeSlugInput, slugify } from "@/lib/admin/slugify";

/**
 * Create-form slug: auto-fills from name until the user edits the slug field.
 */
export function useAutoSlug(initialName = "", initialSlug = "") {
  const [name, setNameState] = useState(initialName);
  const [slug, setSlugState] = useState(initialSlug || slugify(initialName));
  const [slugTouched, setSlugTouched] = useState(Boolean(initialSlug));

  function setName(next: string) {
    setNameState(next);
    if (!slugTouched) {
      setSlugState(slugify(next));
    }
  }

  function setSlug(next: string) {
    setSlugTouched(true);
    setSlugState(sanitizeSlugInput(next));
  }

  return { name, slug, slugTouched, setName, setSlug };
}
