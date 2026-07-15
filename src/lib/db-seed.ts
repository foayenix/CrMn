import { PrismaClient, ShiftKind } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const WHATS_ON = [
  { schedule: "Sundays", title: "Soul Night", description: "Records, low light, no rush." },
  { schedule: "Monthly", title: "Guided wine tasting", description: "Six pours, one theme, led by the sommelier." },
  { schedule: "Dates vary", title: "Live music & themed nights", description: "Announced on Instagram first." },
  { schedule: "Occasional", title: "Slow-dating socials", description: "With Everywhere We Meet — under the skylight." },
];

const STAFF = ["Harry", "Alex Newland", "Dan", "Felix", "Skye", "Dilan", "New team member", "Lily", "Liam", "Ali Edwards"];

const DAY_NOTES = [
  { dateKey: "2026-07-01", note: "1st England Game" },
  { dateKey: "2026-07-05", note: "Footie" },
  { dateKey: "2026-07-11", note: "England TBC" },
  { dateKey: "2026-07-15", note: "England TBC" },
  { dateKey: "2026-07-19", note: "Final TBC" },
  { dateKey: "2026-07-20", note: "MMC AWAY" },
  { dateKey: "2026-07-24", note: "MMC AWAY" },
  { dateKey: "2026-07-25", note: "MMC AWAY (PARTY)" },
  { dateKey: "2026-07-26", note: "MMC AWAY" },
  { dateKey: "2026-07-27", note: "MMC AWAY" },
  { dateKey: "2026-07-28", note: "MMC AWAY" },
  { dateKey: "2026-08-02", note: "Latin Night" },
];

const WEEK_DATA = [
  {
    dateKeys: ["2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-05"],
    rows: [
      { rowName: "Harry Shift 1", shifts: ["Closed", "Closed", "unavailable", "unavailable", "unavailable", "unavailable", "unavailable"] },
      { rowName: "Harry Shift 2", shifts: ["Closed", "Closed", "unavailable", "unavailable", "unavailable", "unavailable", "unavailable"] },
      { rowName: "Alex Newland Shift 1", shifts: ["Closed", "Closed", "7-11pm (4 hours)", "7-11pm (4 hours)", "8pm - 12am (4 hours)", "", "7-10pm (3 hours)"] },
      { rowName: "Alex Newland Shift 2", shifts: ["Closed", "Closed", "", "", "", "", ""] },
      { rowName: "Dan Shift 1", shifts: ["Closed", "Closed", "", "CCC 7.30am - 12.30pm (5 hours)", "CCC - 7.30am-12.30pm (5hrs)", "", ""] },
      { rowName: "Dan Shift 2", shifts: ["Closed", "Closed", "", "7pm - 12am (5 hours)", "7pm - 12am (5 hours)", "", ""] },
      { rowName: "Felix", shifts: ["Closed", "Closed", "", "7pm - 12am (5 hours)", "7pm - 12am (5 hours)", "10pm - 1am (3 hours)", ""] },
      { rowName: "Skye Shift 1", shifts: ["unavailable", "Closed", "unavailable", "unavailable", "unavailable", "unavailable", "unavailable"] },
      { rowName: "Skye Shift 2", shifts: ["unavailable", "Closed", "unavailable", "unavailable", "unavailable", "unavailable", "unavailable"] },
      { rowName: "Dilan", shifts: ["Closed", "Closed", "4-8pm (4 hours)", "", "3-7pm (4 hours)", "3-7pm (4 hours)", "12am - 4am (4 hours)"] }
    ]
  },
  {
    dateKeys: ["2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10", "2026-07-11", "2026-07-12"],
    rows: [
      { rowName: "Harry Shift 1", shifts: ["unavailable", "", "7-11pm (4 hours)", "", "CCC 7.30am - 12.30pm (5 hours)", "Unavailable", ""] },
      { rowName: "Harry Shift 2", shifts: ["unavailable", "Closed", "", "", "8pm - 12am (4 hours)", "Unavailable", "Unavailable"] },
      { rowName: "Alex Newland Shift 1", shifts: ["Closed", "Closed", "unavailable", "7-11pm (4 hours)", "", "8pm - 12am (4 hours)", "2-6pm (4 hours)"] },
      { rowName: "Dan Shift 1", shifts: ["", "Closed", "", "", "7pm - 12am (5 hours)", "8-12", ""] },
      { rowName: "Dan Shift 2", shifts: ["CCC 7.30am - 12.30pm (5 hours)", "", "", "", "8pm - 12am (4 hours)", "", ""] },
      { rowName: "Felix", shifts: ["Closed", "Closed", "", "", "7pm - 12am (5 hours)", "8pm - 12am (4 hours)", ""] },
      { rowName: "Felix Shift 2", shifts: ["", "", "", "", "CCC 7.30am - 12.30pm (5 hours)", "", ""] },
      { rowName: "Skye Shift 1", shifts: ["unavailable", "Closed", "unavailable", "", "3-8pm (5 hours)", "3-8pm (5 hours)", "unavailable"] },
      { rowName: "Dilan", shifts: ["Closed", "Closed", "", "unavailable", "unavailable", "unavailable", "unavailable"] }
    ]
  },
  {
    dateKeys: ["2026-07-13", "2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-18", "2026-07-19"],
    rows: [
      { rowName: "Harry Shift 1", shifts: ["CCC 7.30am - 12.30pm (5 hours)", "Closed", "", "", "CCC 7.30am - 12.30pm (5 hours)", "CCC 7.30am - 12.30pm (5 hours)", ""] },
      { rowName: "Harry Shift 2", shifts: ["Closed", "Closed", "", "", "8pm - 12am (4 hours)", "8pm - 12am (4 hours)", ""] },
      { rowName: "Alex Newland Shift 1", shifts: ["Closed", "Closed", "7-11pm (4 hours)", "7-11pm (4 hours)", "", "unavailable", "4-10pm  (6 hours) TBC"] },
      { rowName: "Dan Shift 1", shifts: ["Closed", "Closed", "", "", "3-8pm  (5 hours)", "3-8pm  (5 hours)", ""] },
      { rowName: "Felix", shifts: ["Closed", "Closed", "7-11pm (4 hours) TBC", "", "8pm - 12am (4 hours)", "7pm - 12am (5 hours)", "6-10pm (4 hours) TBC"] },
      { rowName: "Skye Shift 1", shifts: ["unavailable", "Closed", "unavailable", "unavailable", "unavailable", "unavailable", "unavailable"] },
      { rowName: "Dilan", shifts: ["unavailable", "Closed", "", "", "unavailable", "unavailable", "unavailable"] }
    ]
  },
  {
    dateKeys: ["2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23", "2026-07-24", "2026-07-25", "2026-07-26"],
    rows: [
      { rowName: "Harry Shift 1", shifts: ["CCC 7.30am - 12.30pm (5 hours)", "", "", "", "CCC 7.30am - 12.30pm (5 hours)", "CCC 7.30am - 12.30pm (5 hours)", ""] },
      { rowName: "Harry Shift 2", shifts: ["Closed", "Closed", "", "", "12.30-4pm (3.5hr)", "12.30-2pm (1.5hr) / 8pm-12am (4hr)", "2-8pm (6 hours)"] },
      { rowName: "Alex Newland Shift 1", shifts: ["Closed", "Closed", "7-11pm (4 hours)", "7-11pm (4 hours)", "8pm - 12am (4 hours)", "6pm - 12am (6 hours)", ""] },
      { rowName: "Dan Shift 1", shifts: ["Closed", "Closed", "Holiday 20/7 - 14/11", "Holiday 20/7 - 14/12", "Holiday 20/7 - 14/13", "Holiday 20/7 - 14/14", "Holiday 20/7 - 14/15"] },
      { rowName: "Felix", shifts: ["Closed", "Closed", "", "", "8pm - 12am (4 hours)", "8pm - 12am (4hours)", ""] },
      { rowName: "Skye Shift 1", shifts: ["Closed", "Closed", "", "", "4-8pm (4 hours)", "2-8pm (6 hours)", "4-8pm (4hrs)"] },
      { rowName: "Dilan", shifts: ["Closed", "Closed", "", "", "4-8pm (4 hours)", "2-6pm (4 hours)", ""] }
    ]
  },
  {
    dateKeys: ["2026-07-27", "2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31", "2026-08-01", "2026-08-02"],
    rows: [
      { rowName: "Harry Shift 1", shifts: ["CCC 7.30am - 12.30pm (5 hours)", "Closed", "", "", "CCC 7.30am - 12.30pm (5 hours)", "CCC 7.30am - 12.30pm (5 hours)", ""] },
      { rowName: "Harry Shift 2", shifts: ["Closed", "Closed", "", "", "8pm - 12am (4 hours)", "8pm - 12am (4 hours)", "2-8pm (6 hours)"] },
      { rowName: "Alex Newland Shift 1", shifts: ["Closed", "Closed", "7-11pm (4 hours)", "7-11pm (4 hours)", "8pm - 12am (4 hours)", "8pm - 12am (4 hours)", ""] },
      { rowName: "Dan Shift 1", shifts: ["Holiday 20/7 - 14/9", "Holiday 20/7 - 14/10", "Holiday 20/7 - 14/11", "Holiday 20/7 - 14/12", "Holiday 20/7 - 14/13", "Holiday 20/7 - 14/9", "Holiday 20/7 - 14/9"] },
      { rowName: "Felix", shifts: ["Closed", "Closed", "", "", "unavailable", "unavailable", ""] },
      { rowName: "Skye Shift 1", shifts: ["Closed", "", "", "7-11pm (4 hours)", "6pm - 12am (6 hours)", "3-8pm (5 hours)", ""] },
      { rowName: "Dilan", shifts: ["Closed", "Closed", "", "", "unavailable", "back 10/8", "Back 10/8"] }
    ]
  }
];

interface ShiftParsed {
  kind: ShiftKind;
  startMinutes?: number | null;
  endMinutes?: number | null;
  notes?: string | null;
}

function parseSingleShift(t: string): ShiftParsed | null {
  const val = t.trim();
  const lower = val.toLowerCase();
  if (!val) return null;
  if (lower === "closed") return { kind: ShiftKind.CLOSED };
  if (lower === "unavailable") return { kind: ShiftKind.UNAVAILABLE };
  if (lower.startsWith("holiday")) return { kind: ShiftKind.HOLIDAY, notes: val };
  if (lower.startsWith("back ")) return { kind: ShiftKind.UNAVAILABLE, notes: val };

  if (lower.includes("7-11pm")) {
    return { kind: ShiftKind.WORKING, startMinutes: 19 * 60, endMinutes: 23 * 60, notes: lower.includes("tbc") ? "TBC" : null };
  }
  if (lower.includes("8pm - 12am") || lower.includes("8pm-12am")) {
    return { kind: ShiftKind.WORKING, startMinutes: 20 * 60, endMinutes: 24 * 60 };
  }
  if (lower.includes("7-10pm")) {
    return { kind: ShiftKind.WORKING, startMinutes: 19 * 60, endMinutes: 22 * 60 };
  }
  if (lower.includes("7.30am - 12.30pm") || lower.includes("7.30am-12.30pm")) {
    return { kind: ShiftKind.WORKING, startMinutes: 7.5 * 60, endMinutes: 12.5 * 60, notes: "CCC" };
  }
  if (lower.includes("7pm - 12am")) {
    return { kind: ShiftKind.WORKING, startMinutes: 19 * 60, endMinutes: 24 * 60 };
  }
  if (lower.includes("10pm - 1am")) {
    return { kind: ShiftKind.WORKING, startMinutes: 22 * 60, endMinutes: 1 * 60 };
  }
  if (lower.includes("4-8pm")) {
    return { kind: ShiftKind.WORKING, startMinutes: 16 * 60, endMinutes: 20 * 60 };
  }
  if (lower.includes("3-7pm")) {
    return { kind: ShiftKind.WORKING, startMinutes: 15 * 60, endMinutes: 19 * 60 };
  }
  if (lower.includes("12am - 4am")) {
    return { kind: ShiftKind.WORKING, startMinutes: 0, endMinutes: 4 * 60 };
  }
  if (lower.includes("2-6pm")) {
    return { kind: ShiftKind.WORKING, startMinutes: 14 * 60, endMinutes: 18 * 60 };
  }
  if (lower === "8-12") {
    return { kind: ShiftKind.WORKING, startMinutes: 20 * 60, endMinutes: 24 * 60 };
  }
  if (lower.includes("3-8pm")) {
    return { kind: ShiftKind.WORKING, startMinutes: 15 * 60, endMinutes: 20 * 60 };
  }
  if (lower.includes("4-10pm")) {
    return { kind: ShiftKind.WORKING, startMinutes: 16 * 60, endMinutes: 22 * 60, notes: lower.includes("tbc") ? "TBC" : null };
  }
  if (lower.includes("6-10pm")) {
    return { kind: ShiftKind.WORKING, startMinutes: 18 * 60, endMinutes: 22 * 60, notes: lower.includes("tbc") ? "TBC" : null };
  }
  if (lower.includes("12.30-4pm")) {
    return { kind: ShiftKind.WORKING, startMinutes: 12.5 * 60, endMinutes: 16 * 60 };
  }
  if (lower.includes("2-8pm")) {
    return { kind: ShiftKind.WORKING, startMinutes: 14 * 60, endMinutes: 20 * 60 };
  }
  if (lower.includes("6pm - 12am")) {
    return { kind: ShiftKind.WORKING, startMinutes: 18 * 60, endMinutes: 24 * 60 };
  }
  if (lower.includes("12.30-2pm")) {
    return { kind: ShiftKind.WORKING, startMinutes: 12.5 * 60, endMinutes: 14 * 60 };
  }

  return { kind: ShiftKind.UNAVAILABLE, notes: val };
}

function parseShift(val: string): ShiftParsed[] {
  const t = val.trim();
  if (!t) return [];
  if (t.includes("/")) {
    const parts = t.split("/");
    const r1 = parseSingleShift(parts[0]);
    const r2 = parseSingleShift(parts[1]);
    const out: ShiftParsed[] = [];
    if (r1) out.push(r1);
    if (r2) out.push(r2);
    return out;
  }
  const r = parseSingleShift(t);
  return r ? [r] : [];
}

function getStaffNameAndSlot(rowName: string): { name: string; slot: number } {
  const lower = rowName.toLowerCase();
  let name = rowName;
  let slot = 1;
  if (lower.includes("shift 1")) {
    name = rowName.replace(/shift 1/i, "").trim();
    slot = 1;
  } else if (lower.includes("shift 2")) {
    name = rowName.replace(/shift 2/i, "").trim();
    slot = 2;
  } else {
    name = rowName.trim();
    slot = 1;
  }
  const mappings: { [key: string]: string } = {
    "harry": "Harry",
    "alex newland": "Alex Newland",
    "dan": "Dan",
    "felix": "Felix",
    "skye": "Skye",
    "dilan": "Dilan",
    "new team member": "New team member",
    "lily": "Lily",
    "liam": "Liam",
    "ali edwards": "Ali Edwards"
  };
  const lookupKey = name.toLowerCase();
  if (mappings[lookupKey]) name = mappings[lookupKey];
  return { name, slot };
}

function parseDateKey(key: string): Date {
  const [y, m, day] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export async function ensureSeeded() {
  // If the admin user already exists, we consider the DB is seeded or has data
  const adminCount = await prisma.adminUser.count();
  if (adminCount > 0) return;

  console.log("Database empty. Self-seeding admin credentials and July 2026 rota...");

  // 1. Seed default admin user
  const email = "boss@crescentmoonbar.co.uk";
  const password = "changeme123";
  await prisma.adminUser.create({
    data: { email, passwordHash: await bcrypt.hash(password, 12) },
  });

  // 2. Seed default What's On
  await prisma.whatsOnEntry.createMany({
    data: WHATS_ON.map((e, i) => ({ ...e, sortOrder: i, active: true })),
  });

  // 3. Seed settings
  await prisma.setting.create({
    data: { key: "staff_slug", value: "496060a0ef08922e9dbed259" }
  });
  await prisma.setting.create({
    data: { key: "staff_pin_hash", value: await bcrypt.hash("1234", 10) }
  });

  // 4. Seed staff
  const staffMap: { [name: string]: string } = {};
  for (let i = 0; i < STAFF.length; i++) {
    const name = STAFF[i];
    const created = await prisma.staffMember.create({
      data: { name, active: true, sortOrder: i }
    });
    staffMap[name] = created.id;
  }

  // 5. Seed day notes
  for (const n of DAY_NOTES) {
    await prisma.dayNote.create({
      data: { date: parseDateKey(n.dateKey), note: n.note }
    });
  }

  // 6. Seed shifts
  for (const week of WEEK_DATA) {
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dateKeyStr = week.dateKeys[dayIdx];
      const date = parseDateKey(dateKeyStr);
      
      for (const row of week.rows) {
        const val = row.shifts[dayIdx];
        if (!val) continue;
        
        const { name, slot } = getStaffNameAndSlot(row.rowName);
        const staffId = staffMap[name];
        if (!staffId) continue;
        
        const parsedShifts = parseShift(val);
        for (let sIdx = 0; sIdx < parsedShifts.length; sIdx++) {
          const parsed = parsedShifts[sIdx];
          const activeSlot = sIdx === 0 ? slot : slot + 1;
          
          await prisma.shift.create({
            data: {
              staffMemberId: staffId,
              date,
              slot: activeSlot,
              kind: parsed.kind,
              startMinutes: parsed.startMinutes ?? null,
              endMinutes: parsed.endMinutes ?? null,
              notes: parsed.notes ?? null
            }
          });
        }
      }
    }
  }

  console.log("Self-seeding completed.");
}
