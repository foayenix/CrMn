import { prisma } from "@/lib/prisma";
import { addDays } from "@/lib/dates";
import { LIVE_STATUSES, firstSwappableDate, shiftLine, upcomingShiftsFor } from "@/lib/swaps";
import { requireStaff } from "../../access";
import { StaffShell } from "../../shell";
import { cancelOfferAction, offerShiftAction, releaseShiftAction, takeShiftAction } from "../actions";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, { text: string; wrong?: boolean }> = {
  offered: { text: "Offered to the team. You're still on it until the boss approves a swap." },
  taken: { text: "Done. The boss has been asked to approve it." },
  gone: { text: "That shift isn't up for grabs any more.", wrong: true },
  "return-gone": { text: "The shift you picked to give back can't be swapped. Pick another.", wrong: true },
};

// Shift swaps: offer one of yours, take one of theirs (as cover or in exchange),
// and the boss approves before anything on the rota moves.
export default async function SwapsScreen({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { slug } = await params;
  const { m } = await searchParams;
  const { me, device } = await requireStaff(slug);
  const today = firstSwappableDate();

  const [myShifts, openOffers, live, decided] = await Promise.all([
    upcomingShiftsFor(me.id),
    prisma.shiftSwap.findMany({
      where: { status: "OFFERED", fromId: { not: me.id }, shift: { date: { gte: today } } },
      include: { shift: true, from: { select: { name: true } } },
      orderBy: { shift: { date: "asc" } },
    }),
    prisma.shiftSwap.findMany({
      where: { status: { in: [...LIVE_STATUSES] }, OR: [{ fromId: me.id }, { toId: me.id }] },
      include: { shift: true, returnShift: true, from: { select: { name: true } }, to: { select: { name: true } } },
    }),
    prisma.shiftSwap.findMany({
      where: {
        status: { in: ["APPROVED", "DECLINED"] },
        decidedAt: { gte: addDays(new Date(), -14) },
        OR: [{ fromId: me.id }, { toId: me.id }],
      },
      include: { shift: true, returnShift: true, from: { select: { name: true } }, to: { select: { name: true } } },
      orderBy: { decidedAt: "desc" },
    }),
  ]);

  // A shift already tied to a live swap can't be offered again or given back.
  const tied = new Set(live.flatMap((s) => [s.shiftId, s.returnShiftId].filter(Boolean) as string[]));
  const liveByShift = new Map(live.filter((s) => s.fromId === me.id).map((s) => [s.shiftId, s]));
  const givable = myShifts.filter((s) => !tied.has(s.id));
  const waiting = live.filter((s) => s.status === "ACCEPTED");
  const message = m ? MESSAGES[m] : undefined;

  return (
    <StaffShell
      slug={slug}
      section="rota"
      isPad={device === "ipad"}
      title="Swaps"
      stat={openOffers.length ? `${openOffers.length} up for grabs` : undefined}
      backHref={`/staff/${slug}/rota`}
    >
      {message && (
        <p className={message.wrong ? "staff-note wrong" : "staff-note"} role="status" style={{ margin: "0 0 6px" }}>
          {message.text}
        </p>
      )}

      <div className="staff-section-head">Up for grabs</div>
      {openOffers.length === 0 ? (
        <p className="staff-note">Nobody&apos;s offering a shift right now.</p>
      ) : (
        <div className="staff-section-list">
          {openOffers.map((o) => (
            <form key={o.id} action={takeShiftAction} className="staff-swap-row">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="id" value={o.id} />
              <span className="staff-band-text">
                {shiftLine(o.shift)}
                <span className="staff-band-detail">{o.from.name}&apos;s shift</span>
              </span>
              <div className="staff-swap-take">
                {givable.length > 0 && (
                  <select name="returnShiftId" className="staff-input" aria-label="Cover it, or swap one of yours">
                    <option value="">Just cover it</option>
                    {givable.map((s) => (
                      <option key={s.id} value={s.id}>
                        Swap for my {shiftLine(s)}
                      </option>
                    ))}
                  </select>
                )}
                <button type="submit" className="staff-inline-button">
                  Take it
                </button>
              </div>
            </form>
          ))}
        </div>
      )}

      {waiting.length > 0 && (
        <>
          <div className="staff-section-head">Waiting for the boss</div>
          <div className="staff-section-list">
            {waiting.map((s) => {
              const mineToGive = s.fromId === me.id;
              const other = mineToGive ? s.to?.name : s.from.name;
              const line = s.returnShift
                ? mineToGive
                  ? `Your ${shiftLine(s.shift)} for ${other}'s ${shiftLine(s.returnShift)}`
                  : `${other}'s ${shiftLine(s.shift)} for your ${shiftLine(s.returnShift)}`
                : mineToGive
                  ? `${other} covers your ${shiftLine(s.shift)}`
                  : `You cover ${other}'s ${shiftLine(s.shift)}`;
              return (
                <div key={s.id} className="staff-band-row">
                  <span className="staff-band-mark accent" />
                  <span className="staff-band-text">{line}</span>
                  <form action={mineToGive ? cancelOfferAction : releaseShiftAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="staff-inline-button">
                      {mineToGive ? "Withdraw" : "Back out"}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="staff-section-head">Your shifts</div>
      {myShifts.length === 0 ? (
        <p className="staff-note">You&apos;ve no shifts coming up on the rota.</p>
      ) : (
        <div className="staff-section-list">
          {myShifts.map((s) => {
            const offer = liveByShift.get(s.id);
            const givenBack = !offer && tied.has(s.id);
            return (
              <div key={s.id} className="staff-band-row">
                <span className="staff-band-text">
                  {shiftLine(s)}
                  {offer?.status === "OFFERED" && <span className="staff-band-detail">Offered · nobody yet</span>}
                  {offer?.status === "ACCEPTED" && <span className="staff-band-detail">Taken · waiting for the boss</span>}
                  {givenBack && <span className="staff-band-detail">In a swap · waiting for the boss</span>}
                </span>
                {offer?.status === "OFFERED" ? (
                  <form action={cancelOfferAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={offer.id} />
                    <button type="submit" className="staff-inline-button">
                      Withdraw
                    </button>
                  </form>
                ) : (
                  !offer &&
                  !givenBack && (
                    <form action={offerShiftAction}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="shiftId" value={s.id} />
                      <button type="submit" className="staff-inline-button">
                        Offer
                      </button>
                    </form>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {decided.length > 0 && (
        <>
          <div className="staff-section-head">Decided</div>
          <div className="staff-section-list">
            {decided.map((s) => (
              <div key={s.id} className="staff-band-row">
                <span className={`staff-band-mark ${s.status === "APPROVED" ? "sage" : "rose"}`} />
                <span className="staff-band-text">
                  {s.status === "APPROVED" ? "Approved" : "Declined"}
                  <span className="staff-band-detail">
                    {s.from.name}&apos;s {shiftLine(s.shift)}
                    {s.to ? ` → ${s.to.name}` : ""}
                    {s.returnShift ? ` · for ${shiftLine(s.returnShift)}` : ""}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="staff-footnote">You stay on a shift until the boss approves the swap.</p>
    </StaffShell>
  );
}
