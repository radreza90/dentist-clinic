type JalaliDate = { year: number; month: number; day: number };

const persianCalendar = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});
const yearStartCache = new Map<number, string>();

function partsForUtcDate(date: Date): JalaliDate {
  const parts = persianCalendar.formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function parseIsoDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { year, month, day };
}

function isoDateFromUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function jalaliMonthStart(year: number, month: number): string {
  const yearStart = jalaliYearStart(year);
  const [startYear, startMonth, startDay] = yearStart.split("-").map(Number);
  const elapsedDays = month <= 7
    ? (month - 1) * 31
    : 6 * 31 + (month - 7) * 30;
  return isoDateFromUtc(new Date(Date.UTC(startYear, startMonth - 1, startDay + elapsedDays)));
}

export function toJalaliDate(isoDate: string): JalaliDate | null {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return null;
  return partsForUtcDate(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12)));
}

function jalaliYearStart(year: number): string {
  const cached = yearStartCache.get(year);
  if (cached) return cached;

  const start = Date.UTC(year + 621, 0, 1);
  for (let offset = 0; offset < 370; offset += 1) {
    const date = new Date(start + offset * 86_400_000);
    const parts = partsForUtcDate(date);
    if (parts.year === year && parts.month === 1 && parts.day === 1) {
      const value = isoDateFromUtc(date);
      yearStartCache.set(year, value);
      return value;
    }
  }

  throw new RangeError(`Unable to resolve the start of Jalali year ${year}.`);
}

export function fromJalaliDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1) return null;
  const monthStart = jalaliMonthStart(year, month);
  const nextMonthStart = month === 12 ? jalaliYearStart(year + 1) : jalaliMonthStart(year, month + 1);

  const [startYear, startMonth, startDay] = monthStart.split("-").map(Number);
  const [nextYear, nextMonth, nextDay] = nextMonthStart.split("-").map(Number);
  const monthLength = (Date.UTC(nextYear, nextMonth - 1, nextDay) - Date.UTC(startYear, startMonth - 1, startDay)) / 86_400_000;
  if (day > monthLength) return null;

  return isoDateFromUtc(new Date(Date.UTC(startYear, startMonth - 1, startDay + day - 1)));
}

export function formatJalaliDate(isoDate: string): string {
  const date = toJalaliDate(isoDate);
  if (!date) return "";
  const number = new Intl.NumberFormat("fa-IR", { useGrouping: false });
  return `${number.format(date.year)}/${number.format(date.month).padStart(2, "۰")}/${number.format(date.day).padStart(2, "۰")}`;
}

export function jalaliMonthLength(year: number, month: number): number {
  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const start = fromJalaliDate(year, month, 1);
  const next = fromJalaliDate(nextMonthYear, nextMonth, 1);
  if (!start || !next) return 0;
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [nextYear, nextMonthValue, nextDay] = next.split("-").map(Number);
  return (Date.UTC(nextYear, nextMonthValue - 1, nextDay) - Date.UTC(startYear, startMonth - 1, startDay)) / 86_400_000;
}
