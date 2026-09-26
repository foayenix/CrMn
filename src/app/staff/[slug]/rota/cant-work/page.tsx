import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dateKey } from "@/lib/dates";
import { WEEKDAYS, describeUnavailability } from "@/lib/availability";
import { firstSwappableDate } from "@/lib/swaps";
import { requireStaff } from "../../access";
import { StaffShell } from "../../shell";
import { addUnavailabilityAction, removeUnavailabilityAction } from "../actions";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, { text: string; wrong?: boolean }> = {
  saved: { text: "Saved. The boss can see it on the rota." },
  "pick-day": { text: "Pick at least one day.", wrong: true },
  "pick-date": { text: "Pick a date.", wrong: true },
  past: { text: "That date has already gone.", wrong: true },
  backwards: { text: "The last day is before the first.", wrong: true },
  "too-long": { text: "That's more than two months. Talk to the boss about that one.", wrong: true },
};

// Days you can't work. Information for the boss while he writes the rota, not
// a request: nothing here needs approving, and nothing here changes a shift.
export default async function CantWorkScreen({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string; m?: string }>;
}) {
  const { slug } = await params;
  const { mode, m } = await searchParams;
  const { me, device } = await requireStaff(slug);
  const weekly = mode === "weekly";
  const today = firstSwappableDate();

  const mine = await prisma.unavailability.findMany({
    where: {
      staffMemberId: me.id,
      OR: [{ kind: "WEEKLY" }, { kind: "DATES", endDate: { gte: today } }],
    },
    orderBy: [{ kind: "desc" }, { startDate: "asc" }, { weekday: "asc" }],
  });
  const message = m ? MESSAGES[m] : undefined;
  const takenWeekdays = new Set(mine.filter((u) => u.kind === "WEEKLY").map((u) => u.weekday));

  return (
    <StaffShell
      slug={slug}
      section="rota"
      isPad={device === "ipad"}
      title="Can't work"
      stat={mine.length ? `${mine.length} set` : undefined}
      statAccent={false}
      backHref={`/staff/${slug}/rota`}
    >
      <p className="staff-note" style={{ margin: "0 0 6px" }}>
        Tell the boss the days you can&apos;t do before he writes the rota. He sees them beside your row.
      </p>

      {message && (
        <p className={message.wrong ? "staff-note wrong" : "staff-note"} role="status" style={{ margin: "12px 0 0" }}>
          {message.text}
        </p>
      )}

      {mine.length > 0 && (
        <>
          <div className="staff-section-head">Already set</div>
          <div className="staff-section-list">
            {mine.map((u) => (
              <div key={u.id} className="staff-band-row">
                <span className={`staff-band-mark ${u.kind === "WEEKLY" ? "sage" : "accent"}`} />
                <span className="staff-band-text">
                  {describeUnavailability(u)}
                  {u.note && <span className="staff-band-detail">{u.note}</span>}
                </span>
                <form action={removeUnavailabilityAction}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="id" value={u.id} />
                  <button type="submit" className="staff-inline-button">
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="staff-section-head">Add</div>
      <div className="staff-toggle">
        <Link
          href={`/staff/${slug}/rota/cant-work`}
          className={weekly ? "staff-toggle-opt" : "staff-toggle-opt on"}
        >
          Dates
        </Link>
        <Link
          href={`/staff/${slug}/rota/cant-work?mode=weekly`}
          className={weekly ? "staff-toggle-opt on" : "staff-toggle-opt"}
        >
          Every week
        </Link>
      </div>

      <form action={addUnavailabilityAction} className="staff-form">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="mode" value={weekly ? "weekly" : "dates"} />

        {weekly ? (
          <fieldset className="staff-fieldset">
            <legend className="staff-eyebrow">Which days, every week</legend>
            <div className="staff-weekdays">
              {WEEKDAYS.map((d, i) => (
                <label key={d} className={takenWeekdays.has(i) ? "staff-chip set" : "staff-chip"}>
                  <input type="checkbox" name="weekday" value={i} disabled={takenWeekdays.has(i)} />
                  <span>{d.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <div className="staff-date-pair">
            <label className="staff-field">
              <span className="staff-eyebrow">From</span>
              <input type="date" name="from" min={dateKey(today)} required className="staff-input" />
            </label>
            <label className="staff-field">
              <span className="staff-eyebrow">To (optional)</span>
              <input type="date" name="to" min={dateKey(today)} className="staff-input" />
            </label>
          </div>
        )}

        <label className="staff-field">
          <span className="staff-eyebrow">Reason (optional)</span>
          <input
            type="text"
            name="note"
            maxLength={140}
            placeholder={weekly ? "Uni on Mondays" : "Family wedding"}
            className="staff-input"
          />
        </label>

        <button type="submit" className="staff-button filled">
          Save
        </button>
      </form>
    </StaffShell>
  );
}
