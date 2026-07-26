import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  startOfWeekMonday,
  endOfWeekSunday,
  dateKey,
  dayLabel,
  dayDateLabel,
  formatHours,
} from "@/lib/dates";
import { slotHours } from "@/lib/rota";
import { mineWeek, teamWeek, type ShiftRow } from "@/lib/staff-rota";
import { requireStaff } from "../access";
import { StaffShell } from "../shell";

export const dynamic = "force-dynamic";

// Screen 03 — My rota.
//
// Your own week in serif, the rest of the team behind a 60px toggle. Split
// shifts stack as two slots in one day. Anything ending after midnight prints
// the day it ends — never a bare "01:00" you have to work out. Per-shift notes
// sit under the slot; per-day notes span the row in sage.
export default async function RotaScreen({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { slug } = await params;
  const { view } = await searchParams;
  const { me, device } = await requireStaff(slug);
  const isPad = device === "ipad";
  const team = view === "team";

  const now = new Date();
  const monday = startOfWeekMonday(now);
  const sunday = endOfWeekSunday(now);

  const [shifts, staff, notes] = await Promise.all([
    prisma.shift.findMany({
      where: { date: { gte: monday, lte: sunday } },
      orderBy: [{ date: "asc" }, { slot: "asc" }],
    }),
    prisma.staffMember.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.dayNote.findMany({ where: { date: { gte: monday, lte: sunday } } }),
  ]);

  const rows = shifts as ShiftRow[];
  const dayNotes = new Map(notes.map((n) => [dateKey(n.date), n.note]));
  const mine = rows.filter((s) => s.staffMemberId === me.id);
  const myHours = mine.reduce((sum, s) => sum + slotHours(s), 0);
  // "8 staff" means the people actually on this week, not everyone on the books.
  const rostered = new Set(rows.filter((s) => s.kind === "WORKING").map((s) => s.staffMemberId)).size;

  const weekLabel = `${dayLabel(monday)} ${dayDateLabel(monday)} – ${dayLabel(sunday)} ${dayDateLabel(sunday)}`;

  return (
    <StaffShell
      slug={slug}
      section="rota"
      isPad={isPad}
      title={team ? "Team rota" : "My rota"}
      stat={team ? `${rostered} staff` : `${formatHours(myHours)}h`}
      statBrass={!team}
    >
      <div className="staff-toggle">
        <Link href={`/staff/${slug}/rota`} className={team ? "staff-toggle-opt" : "staff-toggle-opt on"}>
          Mine
        </Link>
        <Link href={`/staff/${slug}/rota?view=team`} className={team ? "staff-toggle-opt on" : "staff-toggle-opt"}>
          Team
        </Link>
      </div>

      <div className="staff-mono staff-week-label">{weekLabel}</div>

      {team ? (
        <TeamView
          days={teamWeek(now, rows, staff.map((s) => ({ id: s.id, name: s.name })), dayNotes, now, me.id)}
          meId={me.id}
        />
      ) : (
        <MineView days={mineWeek(now, mine, dayNotes, now)} />
      )}
    </StaffShell>
  );
}

function MineView({ days }: { days: ReturnType<typeof mineWeek> }) {
  return (
    <div>
      {days.map((day) => {
        // The day a shift ends belongs to the last slot of the day: on a split
        // it's the late one that runs past midnight, never the lunchtime one.
        const ends = day.slots.map((s) => s.endsLabel).filter(Boolean);
        const footnote = [
          ends[ends.length - 1] ?? null,
          day.split ? `Split shift, ${formatHours(day.hours)}h paid` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <div key={day.key} className={day.today ? "staff-rota-day today" : "staff-rota-day"}>
            <div className="staff-rota-date">
              {day.dayLabels.map((l) => (
                <div key={l}>{l}</div>
              ))}
              {day.today && <div className="today-mark">Today</div>}
            </div>

            <div style={{ flex: 1 }}>
              {day.slots.map((slot, i) => (
                <div key={i}>
                  {i > 0 && <div className="staff-slot-rule" />}
                  <div
                    className="staff-serif"
                    style={{
                      fontSize: slot.working ? 27 : 24,
                      fontWeight: 400,
                      lineHeight: 1.1,
                      color: slot.working ? undefined : "rgba(232,224,207,.42)",
                    }}
                  >
                    {slot.label}
                  </div>
                  {slot.note && <div className="staff-slot-note">{slot.note}</div>}
                </div>
              ))}

              {footnote && <div className="staff-slot-ends">{footnote}</div>}
              {day.dayNote && <DayNote note={day.dayNote} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TeamView({ days, meId }: { days: ReturnType<typeof teamWeek>; meId: string }) {
  if (days.length === 0) {
    return (
      <p style={{ fontSize: 16, color: "var(--dim)", marginTop: 20 }}>
        Nobody&apos;s on the rota this week yet.
      </p>
    );
  }
  return (
    <div>
      {days.map((day) => (
        <div key={day.key}>
          <div className={day.today ? "staff-team-day today" : "staff-team-day"}>
            {day.label}
            {day.today && <>&nbsp;·&nbsp;Today</>}
          </div>
          <div className="staff-team-group">
            {day.members.map((m) => (
              <div key={m.id} className="staff-team-row">
                <span className="staff-serif" style={{ flex: 1, fontSize: 24, fontWeight: 400 }}>
                  {m.name}
                  {m.id === meId && <span className="staff-you">you</span>}
                </span>
                <span className="staff-team-times">{m.times}</span>
              </div>
            ))}
            {day.dayNote && <DayNote note={day.dayNote} />}
          </div>
        </div>
      ))}
    </div>
  );
}

// Per-day notes span the row in sage — the thing everyone on that day needs,
// not one person's shift note.
function DayNote({ note }: { note: string }) {
  return (
    <div className="staff-daynote">
      <span className="staff-band-mark sage" />
      <span className="serif-note">{note}</span>
    </div>
  );
}
