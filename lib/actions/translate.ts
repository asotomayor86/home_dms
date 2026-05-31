"use server";

import { requireSession } from "@/lib/auth-helpers";

// Traducción ES→EN para ayudar a buscar en fuentes en inglés (USDA). Usa MyMemory,
// una API de traducción gratuita y sin clave. Best-effort: si falla, se devuelve
// el texto original para no bloquear la búsqueda.

export type TranslateResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function translateToEnglish(text: string): Promise<TranslateResult> {
  await requireSession();
  const q = text.trim();
  if (q.length < 2) return { ok: true, text: q };

  const url =
    "https://api.mymemory.translated.net/get?" +
    new URLSearchParams({ q, langpair: "es|en" }).toString();

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "HomeDMS/1.0 (gestion-domestica)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Traductor respondió ${res.status}`);
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
    };
    const translated = data.responseData?.translatedText?.trim();
    if (!translated) return { ok: false, error: "Sin traducción" };
    return { ok: true, text: translated };
  } catch {
    return { ok: false, error: "No se pudo traducir ahora mismo." };
  }
}
