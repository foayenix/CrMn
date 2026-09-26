import { prisma } from "@/lib/prisma";
import { shiftLine, swapClashes } from "@/lib/swaps";
import { approveSwap, declineSwap } from "./actions";

export async function swapsAwaitingApproval() {
  const swaps = await prisma.shiftSwap.findMany({
    where: { status: "ACCEPTED" },
    include: {
      shift: true,
      returnShift: true,
      from: { select: { name: true } },
      to: { select: { name: true } },
    },
    orderBy: { acceptedAt: "asc" },
  });
  return Promise.all(swaps.map(async (s) => ({ ...s, clashes: await swapClashes(s) })));
}

export type AwaitingSwap = Awaited<ReturnType<typeof swapsAwaitingApproval>>[number];

// "Dan covers Harry's Fri 10 Oct · 19:00–23:00", or both halves of a swap.
export function swapSentence(s: AwaitingSwap): string {
  const to = s.to?.name ?? "Someone";
  return s.returnShift
    ? `${s.from.name} swaps ${shiftLine(s.shift)} with ${to} for ${shiftLine(s.returnShift)}`
    : `${to} covers ${s.from.name}'s ${shiftLine(s.shift)}`;
}

// Approve / decline, where the decision is made. `back` is the page to land on.
export function SwapDecisions({ swaps, back }: { swaps: AwaitingSwap[]; back: string }) {
  return (
    <ul className="decision-list">
      {swaps.map((s) => (
        <li key={s.id} className="decision">
          <div className="decision-text">
            <strong>{swapSentence(s)}</strong>
            {s.clashes.map((c) => (
              <span key={c} className="decision-warn">
                {c}
              </span>
            ))}
          </div>
          <div className="decision-actions">
            <form action={approveSwap}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="back" value={back} />
              <button className="btn" type="submit">
                Approve
              </button>
            </form>
            <form action={declineSwap}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="back" value={back} />
              <button className="btn ghost danger" type="submit">
                Decline
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

const MESSAGES: Record<string, { text: string; error?: boolean }> = {
  approved: { text: "Approved. The rota has been updated." },
  declined: { text: "Declined. The rota is unchanged." },
  stale: {
    text: "The rota changed after they agreed this swap, so it's been declined rather than applied. They can offer it again.",
    error: true,
  },
  gone: { text: "That swap was already decided or withdrawn.", error: true },
};

export function DecisionMessage({ m }: { m?: string }) {
  const msg = m ? MESSAGES[m] : undefined;
  if (!msg) return null;
  return (
    <div className={msg.error ? "alert error" : "alert ok"} role="status">
      {msg.text}
    </div>
  );
}
