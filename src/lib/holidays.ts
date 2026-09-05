export type HolidayCountry = "KR" | "US" | "JP" | "CN";

const SUPPORTED: HolidayCountry[] = ["KR", "US", "JP", "CN"];

export function resolveHolidayCountry(setting: string): HolidayCountry {
  if ((SUPPORTED as string[]).includes(setting)) return setting as HolidayCountry;
  const locale = typeof navigator !== "undefined" ? navigator.language : "ko-KR";
  const region = locale.split("-")[1]?.toUpperCase();
  if ((SUPPORTED as string[]).includes(region)) return region as HolidayCountry;
  return "KR";
}

export type HolidayMap = Record<string, string>; // "YYYY-MM-DD" -> local holiday name

const memCache = new Map<string, HolidayMap>();

// Nager.Date is a free, no-auth public holiday API — no backend of our own
// to maintain, and correctly handles lunar-calendar holidays (Korean 설날/
// 추석, Chinese New Year) whose dates shift every year and would be wrong
// if hardcoded.
export async function getHolidays(country: HolidayCountry, year: number): Promise<HolidayMap> {
  const key = `${country}-${year}`;
  const cached = memCache.get(key);
  if (cached) return cached;

  const storageKey = `damarock_holidays_${key}`;
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem(storageKey) : null;
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as HolidayMap;
      memCache.set(key, parsed);
      return parsed;
    } catch {
      // fall through and re-fetch
    }
  }

  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`);
    if (!res.ok) throw new Error(`holiday fetch failed: ${res.status}`);
    const data: { date: string; localName: string }[] = await res.json();
    const map: HolidayMap = {};
    for (const h of data) map[h.date] = h.localName;
    localStorage.setItem(storageKey, JSON.stringify(map));
    memCache.set(key, map);
    return map;
  } catch (err) {
    console.error("Failed to load holidays:", err);
    return {};
  }
}
