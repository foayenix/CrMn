import {
  weekDays,
  dateKey,
  dayLabel,
  addDays,
  minutesTo24h,
  minutesToCompact,
  endsNextDay,
} from "@/lib/dates";
import { slotHours } from "@/lib/rota";

// Shaping the rota for the staff app's two views. The admin grid stays as it
// is; this is the same data read the way someone reads it on a phone.

export type ShiftRow = {
  id: string;
  staffMemberId: string;
  date: Date;
  slot: number;
  kind: "WORKING" | "CLOSED" | "UNAVAILABLE" | "HOLIDAY";
  startMinutes: number | null;
  endMinutes: number | null;
  notes: string | null;
};

export type Slot = {
  // "17:00 → 01:00", or "Closed" / "Unavailable" / "Holiday" / "Off".
  label: string;
  working: boolean;
  // "Ends Sat" — printed whenever a shift runs past midnight, so nobody has to
  // decode a bare "01:00".
  endsLabel: string | null;
  note: string | null;
};

export type MineDay = {
  key: string;
  // "Mon 20", plus any following days merged into the same run.
  dayLabels: string[];
  today: boolean;
  slots: Slot[];
  hours: number;
  dayNote: string | null;
  split: boolean;
};

function slotFrom(s: ShiftRow): Slot {
  if (s.kind !== "WORKING" || s.startMinutes === null || s.endMinutes === null) {
    const label =
      s.kind === "CLOSED" ? "Closed" : s.kind === "HOLIDAY" ? "Holiday" : "Unavailable";
    return { label, working: false, endsLabel: null, note: s.notes };
  }
  const overnight = endsNextDay(s.startMinutes, s.endMinutes);
  return {
    label: `${minutesTo24h(s.startMinutes)} → ${minutesTo24h(s.endMinutes)}`,
    working: true,
    endsLabel: overnight ? `Ends ${dayLabel(addDays(s.date, 1))}` : null,
    note: s.notes,
  };
}

// One row per day of the Mon–Sun week. Consecutive closed days collapse into a
// single row the way the sheet reads them — "Mon 20 / Tue 21 · Closed".
export function mineWeek(
  anchor: Date,
  shifts: ShiftRow[],
  dayNotes: Map<string, string>,
  today: Date,
): MineDay[] {
  const todayKey = dateKey(today);
  const rows: MineDay[] = [];

  for (const day of weekDays(anchor)) {
    const key = dateKey(day);
    const onDay = shifts
      .filter((s) => dateKey(s.date) === key)
      .sort((a, b) => a.slot - b.slot);
    const slots = onDay.length ? onDay.map(slotFrom) : [{ label: "Off", working: false, endsLabel: null, note: null }];
    const row: MineDay = {
      key,
      dayLabels: [`${dayLabel(day)} ${day.getUTCDate()}`],
      today: key === todayKey,
      slots,
      hours: onDay.reduce((sum, s) => sum + slotHours(s), 0),
      dayNote: dayNotes.get(key) ?? null,
      split: onDay.filter((s) => s.kind === "WORKING").length > 1,
    };

    // Merge a run of closed days, but never swallow today — today always keeps
    // its own row so it can carry the brass highlight.
    const prev = rows[rows.length - 1];
    const mergeable =
      prev &&
      !prev.today &&
      !row.today &&
      !prev.dayNote &&
      !row.dayNote &&
      prev.slots.length === 1 &&
      row.slots.length === 1 &&
      prev.slots[0].label === "Closed" &&
      row.slots[0].label === "Closed";

    if (mergeable) prev.dayLabels.push(row.dayLabels[0]);
    else rows.push(row);
  }

  return rows;
}

export type TeamMember = { id: string; name: string; times: string };
export type TeamDay = {
  key: string;
  label: string;
  today: boolean;
  members: TeamMember[];
  dayNote: string | null;
};

// The team view lists only days somebody is actually working — an empty day is
// nothing to scroll past.
export function teamWeek(
  anchor: Date,
  shifts: ShiftRow[],
  staff: { id: string; name: string }[],
  dayNotes: Map<string, string>,
  today: Date,
  meId?: string,
): TeamDay[] {
  const todayKey = dateKey(today);
  const days: TeamDay[] = [];
  // You first, then the rota's own order — you're looking for yourself before
  // you're looking for anyone else.
  const ordered = meId ? [...staff].sort((a, b) => Number(b.id === meId) - Number(a.id === meId)) : staff;

  for (const day of weekDays(anchor)) {
    const key = dateKey(day);
    const members: TeamMember[] = [];

    for (const person of ordered) {
      const theirs = shifts
        .filter(
          (s) =>
            s.staffMemberId === person.id &&
            dateKey(s.date) === key &&
            s.kind === "WORKING" &&
            s.startMinutes !== null &&
            s.endMinutes !== null,
        )
        .sort((a, b) => a.slot - b.slot);
      if (!theirs.length) continue;
      members.push({
        id: person.id,
        name: person.name,
        times: theirs
          .map((s) => `${minutesToCompact(s.startMinutes!)}–${minutesToCompact(s.endMinutes!)}`)
          .join(" · "),
      });
    }

    if (!members.length) continue;
    days.push({
      key,
      label: `${dayLabel(day)} ${day.getUTCDate()}`,
      today: key === todayKey,
      members,
      dayNote: dayNotes.get(key) ?? null,
    });
  }

  return days;
}

// Tonight's shift for the home screen: the one on the trading night's date,
// with its slots in order. Split shifts stay two slots, never one merged range.
export function shiftsOn(shifts: ShiftRow[], date: Date): ShiftRow[] {
  const key = dateKey(date);
  return shifts.filter((s) => dateKey(s.date) === key).sort((a, b) => a.slot - b.slot);
}

// The next shift after `after`, for the nights someone isn't on.
export function nextWorkingShift(shifts: ShiftRow[], after: Date): ShiftRow | null {
  const key = dateKey(after);
  return (
    shifts
      .filter((s) => s.kind === "WORKING" && dateKey(s.date) > key && s.startMinutes !== null)
      .sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)) || a.slot - b.slot)[0] ?? null
  );
}

export { slotFrom };
