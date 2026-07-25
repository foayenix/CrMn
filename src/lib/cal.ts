// cal.diy (Cal.com fork) booking integration.
//
// The boss never logs into cal.diy — we read bookings from its API and show a
// simple list in /admin/bookings. cal.diy exposes the Cal.com v1 REST API; the
// bookings endpoint is:
//
//   GET {CAL_API_URL}/v1/bookings?apiKey={CAL_API_KEY}
//
// where CAL_API_URL points at the API base of your self-hosted instance
// (e.g. https://cal.crescentmoonbar.example/api). Set CAL_API_KEY to an API key
// created in cal.diy → Settings → Developer → API keys.
//
// Everything here is defensive: if cal.diy isn't configured or is unreachable,
// callers get a typed result they can render as an empty/". not connected" state
// rather than crashing the admin area.

export type Booking = {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  status: string;
  name: string;
  email: string | null;
  phone: string | null;
  partySize: string | null;
  notes: string | null;
};

export type BookingsResult =
  | { configured: false }
  | { configured: true; ok: true; bookings: Booking[] }
  | { configured: true; ok: false; error: string };

export function isCalConfigured(): boolean {
  return !!process.env.CAL_API_URL && !!process.env.CAL_API_KEY;
}

// Pull a party size out of cal.com booking metadata / custom responses, since
// our widget submits it as metadata[partySize].
function extractPartySize(b: Record<string, unknown>): string | null {
  const meta = b.metadata as Record<string, unknown> | undefined;
  if (meta && typeof meta.partySize !== "undefined") return String(meta.partySize);
  const responses = b.responses as Record<string, unknown> | undefined;
  if (responses && typeof responses.partySize !== "undefined") return String(responses.partySize);
  const guests = b.attendees as unknown[] | undefined;
  if (Array.isArray(guests) && guests.length > 1) return String(guests.length);
  return null;
}

function firstAttendee(b: Record<string, unknown>): { name: string; email: string | null; phone: string | null } {
  const attendees = b.attendees as Array<Record<string, unknown>> | undefined;
  const a = attendees?.[0];
  const responses = b.responses as Record<string, unknown> | undefined;
  const phone =
    (responses?.phone as string | undefined) ??
    (a?.phoneNumber as string | undefined) ??
    null;
  return {
    name: (a?.name as string) || (b.title as string) || "Guest",
    email: (a?.email as string) || null,
    phone: phone || null,
  };
}

function normalize(raw: Record<string, unknown>): Booking {
  const who = firstAttendee(raw);
  return {
    id: (raw.uid as string) ?? (raw.id as number) ?? Math.random(),
    title: (raw.title as string) ?? "Reservation",
    start: new Date(raw.startTime as string),
    end: new Date(raw.endTime as string),
    status: ((raw.status as string) ?? "accepted").toLowerCase(),
    name: who.name,
    email: who.email,
    phone: who.phone,
    partySize: extractPartySize(raw),
    notes: (raw.description as string) || (raw.additionalNotes as string) || null,
  };
}

// Fetch bookings between two dates (inclusive of start, exclusive of end).
export async function fetchBookings(from: Date, to: Date): Promise<BookingsResult> {
  if (!isCalConfigured()) return { configured: false };

  const base = process.env.CAL_API_URL!.replace(/\/$/, "");
  const key = process.env.CAL_API_KEY!;
  const url = `${base}/v1/bookings?apiKey=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      // Bookings change often; never cache in the admin view.
      cache: "no-store",
    });
    if (!res.ok) {
      return { configured: true, ok: false, error: `cal.diy API returned ${res.status}` };
    }
    const data = (await res.json()) as { bookings?: Record<string, unknown>[] };
    // A 200 with no bookings array isn't a quiet night — it's a response we
    // can't read. Saying "no bookings tonight" to someone on the floor because
    // the API changed shape would be worse than saying nothing.
    if (!Array.isArray(data.bookings)) {
      return { configured: true, ok: false, error: "cal.diy returned an unreadable response" };
    }
    const list = data.bookings;
    const bookings = list
      .map(normalize)
      .filter((b) => b.start >= from && b.start < to && b.status !== "cancelled")
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    return { configured: true, ok: true, bookings };
  } catch (e) {
    return {
      configured: true,
      ok: false,
      error: e instanceof Error ? e.message : "Could not reach cal.diy",
    };
  }
}
