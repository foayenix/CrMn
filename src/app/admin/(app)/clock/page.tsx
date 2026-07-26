import Link from "next/link";
import { weekSummary } from "@/lib/clock";
import {
  startOfWeekMonday,
  endOfWeekSunday,
  dateKey,
  parseDateKey,
  addWeeks,
  weekRangeLabel,
  formatHours,
} from "@/lib/dates";
import { EntryList } from "./entries";

export const dynamic = "force-dynamic";

const stamp = (d: Date) =>
  d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

const inputValue = (d: Date) => d.toISOString().slice(0, 16);

export default async function ClockPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  const anchor = sp.week ? parseDateKey(sp.week) : new Date();
  const monday = startOfWeekMonday(anchor);
  const sunday = endOfWeekSunday(anchor);
  const staff = await weekSummary(monday, sunday);

  const anyClocked = staff.some((s) => s.entries.length > 0);

  return (
    <div>
      <h1 className="admin-h1">Clock</h1>
      <p className="admin-sub">
        What people actually clocked, beside what they were rostered for.{" "}
        <strong>Rota hours are what get paid</strong> — the staff app says so on
        screen, and this page is here to spot the gaps, not to replace the rota.
        Clocking in is optional and nobody is chased for it, so a blank row means
        nothing at all.
      </p>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <Link className="btn ghost sm" href={`/admin/clock?week=${dateKey(addWeeks(monday, -1))}`}>
          ← Prev
        </Link>
        <Link className="btn ghost sm" href={`/admin/clock?week=${dateKey(addWeeks(monday, 1))}`}>
          Next →
        </Link>
        <Link className="btn ghost sm" href={`/admin/clock?week=${dateKey(startOfWeekMonday(new Date()))}`}>
          This week
        </Link>
        <span className="muted" style={{ fontSize: 12 }}>
          {weekRangeLabel(monday)}
        </span>
      </div>

      <div className="card">
        {!anyClocked && (
          <div className="alert ok" style={{ marginBottom: 16 }}>
            Nobody clocked anything this week. That&apos;s not a problem — the
            rota is still the record.
          </div>
        )}
        <table className="grid">
          <thead>
            <tr>
              <th style={{ minWidth: 130 }}>Staff</th>
              <th style={{ width: 90 }}>Rostered</th>
              <th style={{ width: 90 }}>Clocked</th>
              <th style={{ width: 90 }}>Difference</th>
              <th>Entries</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((person) => {
              const diff = person.clockedHours - person.rosteredHours;
              const shown = person.entries.length > 0;
              return (
                <tr key={person.id}>
                  <td style={{ fontWeight: 500 }}>{person.name}</td>
                  <td>
                    <strong>{formatHours(person.rosteredHours)}</strong>
                    <div className="muted" style={{ fontSize: 10 }}>
                      paid
                    </div>
                  </td>
                  <td>{shown ? formatHours(person.clockedHours) : <span className="muted">—</span>}</td>
                  <td>
                    {shown ? (
                      <span
                        style={
                          Math.abs(diff) >= 1
                            ? { color: "var(--danger)" }
                            : { color: "var(--green)" }
                        }
                      >
                        {diff > 0 ? "+" : ""}
                        {formatHours(diff)}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <EntryList
                      entries={person.entries.map((e) => ({
                        id: e.id,
                        inValue: inputValue(e.clockInAt),
                        outValue: e.clockOutAt ? inputValue(e.clockOutAt) : "",
                        label: e.clockOutAt
                          ? `${stamp(e.clockInAt)} → ${e.clockOutAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}`
                          : `${stamp(e.clockInAt)} → —`,
                        hours: e.hours !== null ? formatHours(e.hours) : null,
                        autoClosed: e.autoClosed,
                        adminEdited: e.adminEdited,
                        note: e.note,
                        open: e.clockOutAt === null,
                      }))}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: 11.5, marginTop: 14, lineHeight: 1.7 }}>
          <strong>auto-closed</strong> means nobody clocked out and the entry was
          closed at that person&apos;s rostered end (or capped at 12 hours if
          they weren&apos;t rostered). They aren&apos;t told, and it isn&apos;t
          held against them. <strong>edited</strong> means you changed it here.
        </p>
      </div>
    </div>
  );
}
