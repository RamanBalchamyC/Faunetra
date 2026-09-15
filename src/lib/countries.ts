// ISO 3166-1 alpha-2 country list. Flags render via src/components/FlagIcon.tsx
// (the country-flag-icons package, real SVGs) — NOT Unicode flag emoji.
// Emoji flags render fine on macOS/iOS/Android but Windows' font stack
// shows the bare two-letter code instead (by design, no flag glyphs), which
// isn't a safe bet for a general audience.
//
// Not the full ISO-3166 list (~195 countries) — a ~70-country curated
// subset covering the large majority of likely users. Extend freely; the
// native <select> in CountrySelector.tsx needs no other changes to grow.
export const COUNTRIES: { code: string; name: string }[] = [
  { code: "AF", name: "Afghanistan" }, { code: "AL", name: "Albania" }, { code: "DZ", name: "Algeria" },
  { code: "AR", name: "Argentina" }, { code: "AM", name: "Armenia" }, { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" }, { code: "AZ", name: "Azerbaijan" }, { code: "BD", name: "Bangladesh" },
  { code: "BE", name: "Belgium" }, { code: "BR", name: "Brazil" }, { code: "BG", name: "Bulgaria" },
  { code: "KH", name: "Cambodia" }, { code: "CA", name: "Canada" }, { code: "CL", name: "Chile" },
  { code: "CN", name: "China" }, { code: "CO", name: "Colombia" }, { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croatia" }, { code: "CZ", name: "Czechia" }, { code: "DK", name: "Denmark" },
  { code: "EG", name: "Egypt" }, { code: "EE", name: "Estonia" }, { code: "FI", name: "Finland" },
  { code: "FR", name: "France" }, { code: "DE", name: "Germany" }, { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" }, { code: "HK", name: "Hong Kong" }, { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" }, { code: "IN", name: "India" }, { code: "ID", name: "Indonesia" },
  { code: "IE", name: "Ireland" }, { code: "IL", name: "Israel" }, { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" }, { code: "KE", name: "Kenya" }, { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" }, { code: "NP", name: "Nepal" }, { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" }, { code: "NG", name: "Nigeria" }, { code: "NO", name: "Norway" },
  { code: "PK", name: "Pakistan" }, { code: "PE", name: "Peru" }, { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" }, { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" }, { code: "SA", name: "Saudi Arabia" }, { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" }, { code: "KR", name: "South Korea" }, { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" }, { code: "SE", name: "Sweden" }, { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan" }, { code: "TH", name: "Thailand" }, { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" }, { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" }, { code: "US", name: "United States" },
  { code: "VN", name: "Vietnam" },
].sort((a, b) => a.name.localeCompare(b.name));

export function countryName(code: string | null): string | null {
  if (!code) return null;
  return COUNTRIES.find((c) => c.code === code)?.name ?? null;
}
