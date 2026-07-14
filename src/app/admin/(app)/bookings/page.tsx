import { fetchBookings, isCalConfigured } from "@/lib/cal";
import { startOfWeekMonday, endOfWeekSunday, startOfDay, addDays } from "@/lib/dates";

export const dynamic = "force-dynamic";

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}
function fmtDay(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

export default async function BookingsPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = addDays(todayStart, 1);
  const weekStart = startOfWeekMonday(now);
  const weekEnd = addDays(endOfWeekSunday(now), 1);

  if (!isCalConfigured()) {
    return (
      <div>
        <h1 className="admin-h1">Bookings</h1>
        <p className="admin-sub">Table reservations made through the website.</p>
        <div className="card">
          <h2>Not connected yet</h2>
          <p style={{ fontSize: 13, lineHeight: 1.7 }}>
            Bookings appear here once cal.diy is deployed and connected. Set these
            in the app&apos;s environment:
          </p>
          <ul style={{ fontSize: 13, lineHeight: 1.9 }}>
            <li><code>CAL_API_URL</code> — your cal.diy API base, e.g. <code>https://cal.crescentmoonbar.co.uk/api</code></li>
            <li><code>CAL_API_KEY</code> — an API key from cal.diy → Settings → Developer</li>
          </ul>
          <p style={{ fontSize: 13 }}>
            The website&apos;s &ldquo;Hold this table&rdquo; button will also start
            creating real bookings once <code>NEXT_PUBLIC_CAL_URL_BASE</code> and{" "}
            <code>NEXT_PUBLIC_CAL_BOOKING_LINK</code> are set.
          </p>
        </div>
      </div>
    );
  }

  const [today, week] = await Promise.all([
    fetchBookings(todayStart, todayEnd),
    fetchBookings(weekStart, weekEnd),
  ]);

  return (
    <div>
      <h1 className="admin-h1">Bookings</h1>
      <p className="admin-sub">Table reservations pulled live from cal.diy — no need to log into cal.diy itself.</p>

      {today.configured && !today.ok && (
        <div className="alert error">Couldn&apos;t reach cal.diy: {today.error}</div>
      )}

      <Section title="Today" result={today} fmtDay={false} />
      <Section title="This week" result={week} fmtDay={true} />
    </div>
  );
}

function Section({
  title,
  result,
  fmtDay: showDay,
}: {
  title: string;
  result: Awaited<ReturnType<typeof fetchBookings>>;
  fmtDay: boolean;
}) {
  const bookings = result.configured && result.ok ? result.bookings : [];
  return (
    <div className="card">
      <h2>{title} <span className="muted" style={{ fontSize: 13 }}>({bookings.length})</span></h2>
      {bookings.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>No bookings.</p>
      ) : (
        <table className="grid">
          <thead>
            <tr>
              {showDay && <th>Day</th>}
              <th>Time</th>
              <th>Party</th>
              <th>Name</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={String(b.id)}>
                {showDay && <td>{fmtDay(b.start)}</td>}
                <td>{fmtTime(b.start)}–{fmtTime(b.end)}</td>
                <td>{b.partySize ?? "—"}</td>
                <td>{b.name}</td>
                <td style={{ fontSize: 11.5 }}>
                  {b.email && <div>{b.email}</div>}
                  {b.phone && <div>{b.phone}</div>}
                  {!b.email && !b.phone && <span className="muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
