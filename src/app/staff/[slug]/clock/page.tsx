import { readClock } from "@/lib/clock";
import { businessNightLabel } from "@/lib/business-date";
import { startOfWeekMonday, endOfWeekSunday, addWeeks } from "@/lib/dates";
import { requireStaff } from "../access";
import { StaffShell } from "../shell";
import { clockInAction, clockOutAction } from "./actions";
import { Elapsed } from "./dial";

export const dynamic = "force-dynamic";

const time = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

// Screen 07 — Clock in / out.
//
// One 240px target that flips state, outlined rather than filled: present, not
// pushy. No streaks, no missed-day warnings, no badge on Home. Elapsed time
// appears only once you've actually clocked in, and the copy says out loud that
// skipping it is fine.
export default async function ClockScreen({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { me, device } = await requireStaff(slug);
  const isPad = device === "ipad";

  const now = new Date();
  const lastWeekAnchor = addWeeks(now, -1);
  const state = await readClock(
    me.id,
    startOfWeekMonday(lastWeekAnchor),
    endOfWeekSunday(lastWeekAnchor),
  );
  const on = state.openEntry !== null;

  return (
    <StaffShell
      slug={slug}
      section="clock"
      isPad={isPad}
      title="Clock"
      stat={on ? "On" : undefined}
      statBrass={false}
    >
      <div className="staff-clock">
        <div style={{ textAlign: "center" }}>
          {on ? (
            <div className="staff-mono" style={{ color: "var(--sage)" }}>
              Clocked in {time(state.openEntry!.clockInAt)}
            </div>
          ) : (
            <>
              <div className="staff-mono">
                {businessNightLabel(now)}
                {state.shiftStart ? <>&nbsp;·&nbsp;shift {time(state.shiftStart)}</> : <>&nbsp;·&nbsp;not on tonight</>}
              </div>
              <div
                className="staff-serif"
                style={{ fontSize: 30, fontWeight: 300, lineHeight: 1.15, marginTop: 10, color: "rgba(232,224,207,.85)" }}
              >
                Not clocked in
              </div>
            </>
          )}
        </div>

        {on ? (
          <>
            <div className="staff-dial on">
              <Elapsed since={state.openEntry!.clockInAt.getTime()} />
              <span className="staff-dial-label">Hours on</span>
            </div>
            <form action={clockOutAction} style={{ width: "100%" }}>
              <input type="hidden" name="slug" value={slug} />
              <button type="submit" className="staff-button" style={{ height: 76 }}>
                Clock out
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Outlined, never filled. It's available, it isn't asking. */}
            <form action={clockInAction}>
              <input type="hidden" name="slug" value={slug} />
              <button type="submit" className="staff-dial button">
                <span className="staff-serif" style={{ fontSize: 40, fontWeight: 300, lineHeight: 1 }}>
                  Clock in
                </span>
                <span className="staff-dial-label brass">Tap once</span>
              </button>
            </form>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "rgba(232,224,207,.55)", textAlign: "center", maxWidth: "28ch" }}>
              Entirely optional. Nobody chases this, and nothing here changes if
              you never touch it.
            </p>
          </>
        )}
      </div>

      <div className="staff-clock-foot">
        {state.lastWasAutoClosed ? (
          // Only shown when it actually happened — and it is not a telling-off.
          <>Forgot to clock out last time? It closed itself at your rota end. No one was told.</>
        ) : (
          <>
            {state.lastWeek.shifts > 0 && (
              <>
                Last week&nbsp;·&nbsp;clocked {state.lastWeek.clocked} of {state.lastWeek.shifts}{" "}
                {state.lastWeek.shifts === 1 ? "shift" : "shifts"}
                <br />
              </>
            )}
            Rota hours are what get paid.
          </>
        )}
      </div>
    </StaffShell>
  );
}
