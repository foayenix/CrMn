// cal.diy (Cal.com fork) booking integration.
//
// The boss never logs into cal.diy — we read bookings from its API and show a
// simple list in /admin/bookings.
//
//   GET {CAL_API_URL}/v2/bookings
//   Authorization: Bearer {CAL_API_KEY}
//   cal-api-version: 2024-08-13
//
// cal.diy ships ONLY the v2 API: its docker-compose builds one API service, from
// apps/api/v2/Dockerfile, and there is no v1 anywhere in the tree. (The dev-only
// proxy in apps/api/index.js forwards "/" to a v1 on port 3003, but that service
// is not part of the repo.) An earlier version of this file called
// `GET {base}/v1/bookings?apiKey=...`, which is the hosted Cal.com API, not the
// self-hosted one.
//
// The version header is not optional in practice. Verified against a running
// cal.diy: omit it and the endpoint still answers HTTP 200 with
// status: "success", but `data` comes back as an OBJECT from an older version —
// {"bookings":[],"recurringInfo":[],"totalCount":0,"nextCursor":null} — with the
// list empty, because that version does not understand the query below. A client
// that trusted `status` alone would quietly report a quiet night on a night with
// tables in it. The Array.isArray(data) check further down is what catches this.
//
// CAL_API_URL points at the API base of your self-hosted instance. Both
// "https://cal.example" and "https://cal.example/api" work — the API rewrites
// "/api/v2/*" to "/v2/*" unless REWRITE_API_V2_PREFIX is explicitly disabled.
// CAL_API_KEY is an API key created in cal.diy → Settings → Developer → API
// keys; v2 expects it prefixed with "cal_".
//
// Everything here is defensive: if cal.diy isn't configured or is unreachable,
// callers get a typed result they can render as an empty/"not connected" state
// rather than crashing the admin area.

const CAL_API_VERSION = "2024-08-13";

// The endpoint caps `take` at 250. One trading night at a fifty-seat bar cannot
// approach that, so hitting it means the window or the filters are not doing
// what this file thinks they are — which is worth surfacing, not paging over.
const MAX_BOOKINGS = 250;

// The server-side window is deliberately wider than the night we actually want.
// `afterStart`/`beforeEnd` only need to bound the request; the exact [from, to)
// test still happens below, so a booking sitting on the boundary can never be
// dropped by a strict inequality or a timezone reading on cal.diy's side.
const WINDOW_MARGIN_MS = 12 * 60 * 60 * 1000;

// A booking in either of these states is not a table anyone is holding.
const DEAD_STATUSES = new Set(["cancelled", "rejected"]);

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

// Pull a party size out of cal.com booking metadata / booking field responses,
// since our widget submits it as metadata[partySize]. v2 renamed v1's
// `responses` to `bookingFieldsResponses`; both are read so a booking taken
// before the cutover still shows its party size.
//
// Metadata is the reliable half, and it is the half our widget uses. v2 returns
// metadata verbatim, but it parses the responses against a schema requiring a
// valid name and email: a booking whose stored responses fail that check comes
// back with the defaults and every extra key — partySize included — dropped.
function extractPartySize(b: Record<string, unknown>): string | null {
  const meta = b.metadata as Record<string, unknown> | undefined;
  if (meta && typeof meta.partySize !== "undefined") return String(meta.partySize);
  const responses = (b.bookingFieldsResponses ?? b.responses) as Record<string, unknown> | undefined;
  if (responses && typeof responses.partySize !== "undefined") return String(responses.partySize);
  const guests = b.attendees as unknown[] | undefined;
  if (Array.isArray(guests) && guests.length > 1) return String(guests.length);
  return null;
}

function firstAttendee(b: Record<string, unknown>): { name: string; email: string | null; phone: string | null } {
  const attendees = b.attendees as Array<Record<string, unknown>> | undefined;
  const a = attendees?.[0];
  const responses = (b.bookingFieldsResponses ?? b.responses) as Record<string, unknown> | undefined;
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
  // v2 returns `start`/`end`; v1 called them `startTime`/`endTime`.
  const start = (raw.start ?? raw.startTime) as string;
  const end = (raw.end ?? raw.endTime) as string;
  return {
    id: (raw.uid as string) ?? (raw.id as number) ?? Math.random(),
    title: (raw.title as string) ?? "Reservation",
    start: new Date(start),
    end: new Date(end),
    status: ((raw.status as string) ?? "accepted").toLowerCase(),
    name: who.name,
    email: who.email,
    phone: who.phone,
    partySize: extractPartySize(raw),
    notes: (raw.description as string) || (raw.additionalNotes as string) || null,
  };
}

type V2Response = {
  status?: string;
  data?: Record<string, unknown>[];
  pagination?: { remainingItems?: number };
  error?: unknown;
};

// Fetch bookings between two dates (inclusive of start, exclusive of end).
export async function fetchBookings(from: Date, to: Date): Promise<BookingsResult> {
  if (!isCalConfigured()) return { configured: false };

  const base = process.env.CAL_API_URL!.replace(/\/$/, "");
  const key = process.env.CAL_API_KEY!;

  const query = new URLSearchParams({
    afterStart: new Date(from.getTime() - WINDOW_MARGIN_MS).toISOString(),
    beforeEnd: new Date(to.getTime() + WINDOW_MARGIN_MS).toISOString(),
    sortStart: "asc",
    take: String(MAX_BOOKINGS),
  });

  try {
    const res = await fetch(`${base}/v2/bookings?${query}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        "cal-api-version": CAL_API_VERSION,
        "Content-Type": "application/json",
      },
      // Bookings change often; never cache in the admin view.
      cache: "no-store",
    });
    if (!res.ok) {
      // 401 here is nearly always the key: v2 wants it in the Authorization
      // header prefixed with "cal_", not as the ?apiKey= query v1 accepted.
      return { configured: true, ok: false, error: `cal.diy API returned ${res.status}` };
    }

    const body = (await res.json()) as V2Response;
    // A 200 with no readable list isn't a quiet night — it's a response we
    // can't read. Saying "no bookings tonight" to someone on the floor because
    // the API changed shape would be worse than saying nothing.
    if (body.status === "error" || !Array.isArray(body.data)) {
      return { configured: true, ok: false, error: "cal.diy returned an unreadable response" };
    }
    // Likewise a truncated page: a partial list rendered as the whole night is
    // the one failure that looks like success.
    if ((body.pagination?.remainingItems ?? 0) > 0) {
      return {
        configured: true,
        ok: false,
        error: `cal.diy returned more than ${MAX_BOOKINGS} bookings for this window`,
      };
    }

    const bookings = body.data
      .map(normalize)
      .filter((b) => b.start >= from && b.start < to && !DEAD_STATUSES.has(b.status))
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
