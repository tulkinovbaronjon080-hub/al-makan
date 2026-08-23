import uz from "./locales/uz.json";
import ru from "./locales/ru.json";

/**
 * Minimal dictionary lookup — deliberately not next-intl/next-i18next yet.
 * Enough to keep every string out of components from Phase 0 onward
 * (retrofitting i18n after screens are hard-coded is expensive); swap for
 * a routing-aware library once locale-per-URL is actually needed.
 */

export const locales = ["uz", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "uz";

const dictionaries: Record<Locale, typeof uz> = { uz, ru };

export function getDictionary(locale: Locale = defaultLocale) {
  return dictionaries[locale];
}
