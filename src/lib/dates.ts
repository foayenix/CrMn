// Date helpers. The rota runs Monday→Sunday like the Excel sheet, and we treat
// dates as calendar days in the venue's local timezone. To keep server/DB math
// stable regardless of host timezone, week/day keys are computed in UTC and
// shift dates are stored as date-only values.

export function startOfWeekMonday(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  x.setUTCDate(x.getUTCDate() - diff);
  return x;
}

export function endOfWeekSunday(d: Date): Date {
  const start = startOfWeekMonday(d);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return end;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export function addWeeks(d: Date, n: number): Date {
  return addDays(d, n * 7);
}

// YYYY-MM-DD key in UTC.
export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseDateKey(key: string): Date {
  const [y, m, day] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// The seven Mon→Sun days of the week containing `d`.
export function weekDays(d: Date): Date[] {
  const start = startOfWeekMonday(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function dayLabel(d: Date): string {
  return DOW[(d.getUTCDay() + 6) % 7];
}

// Spelled out, for prose: "Next shift Friday, 12:00."
export function dayLongLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
}

export function dayDateLabel(d: Date): string {
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;
}

// e.g. "Mon 7 Jul – Sun 13 Jul 2026"
export function weekRangeLabel(d: Date): string {
  const s = startOfWeekMonday(d);
  const e = endOfWeekSunday(d);
  return `${dayLabel(s)} ${s.getUTCDate()} ${MON[s.getUTCMonth()]} – ${dayLabel(e)} ${e.getUTCDate()} ${MON[e.getUTCMonth()]} ${e.getUTCFullYear()}`;
}

// ---- shift time helpers ----------------------------------------------------

// "7:00pm" style minutes-from-midnight → label. We render 24h→12h to match the
// sheet's "7-11pm" style.
export function minutesToLabel(mins: number): string {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h24 >= 12 ? "pm" : "am";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

// The staff app prints times in 24h — "17:00 → 01:00" reads the same at 01:00
// as it does at 17:00, which "1am" doesn't.
export function minutesTo24h(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// Compact form for the team list, where four people share a row's width:
// "12", "18", "01:30".
export function minutesToCompact(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = String(Math.floor(m / 60)).padStart(2, "0");
  return m % 60 === 0 ? h : `${h}:${String(m % 60).padStart(2, "0")}`;
}

// A shift ending at or before its start time runs past midnight.
export function endsNextDay(startMinutes: number, endMinutes: number): boolean {
  return endMinutes <= startMinutes;
}

// "HH:MM" (24h input value) ↔ minutes.
export function timeStringToMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function minutesToTimeString(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Hours between start and end (end after midnight allowed via +24h wrap).
export function shiftHours(startMinutes: number, endMinutes: number): number {
  let end = endMinutes;
  if (end <= startMinutes) end += 24 * 60; // crosses midnight
  return (end - startMinutes) / 60;
}

export function formatHours(h: number): string {
  return Number.isInteger(h) ? String(h) : h.toFixed(1).replace(/\.0$/, "");
}
