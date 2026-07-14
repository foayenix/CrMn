import { minutesToLabel, shiftHours, formatHours } from "@/lib/dates";

export type ShiftLike = {
  kind: "WORKING" | "CLOSED" | "UNAVAILABLE" | "HOLIDAY";
  startMinutes: number | null;
  endMinutes: number | null;
  // Not used by the helpers below; accepts either the DB Date or a serialized
  // string so both server and client callers can pass their shape directly.
  holidayEnd?: Date | string | null;
  notes: string | null;
};

// Human summary of a single slot, in the style of the Excel sheet:
//   "7pm–11pm (4h)", "Closed", "Unavailable", "Holiday".
export function describeShift(s: ShiftLike): string {
  switch (s.kind) {
    case "WORKING":
      if (s.startMinutes != null && s.endMinutes != null) {
        const h = shiftHours(s.startMinutes, s.endMinutes);
        return `${minutesToLabel(s.startMinutes)}–${minutesToLabel(s.endMinutes)} (${formatHours(h)}h)`;
      }
      return "—";
    case "CLOSED":
      return "Closed";
    case "UNAVAILABLE":
      return "Unavailable";
    case "HOLIDAY":
      return "Holiday";
  }
}

// Hours a single slot contributes to the weekly total (only WORKING counts).
export function slotHours(s: ShiftLike): number {
  if (s.kind === "WORKING" && s.startMinutes != null && s.endMinutes != null) {
    return shiftHours(s.startMinutes, s.endMinutes);
  }
  return 0;
}
