"use client";

import { useState } from "react";
import { BOOKINGS_EMAIL, HOLD_MINUTES, bookingsMailto, publicBookingUrl } from "@/lib/cal-public";

const SIZES = ["2", "4", "6", "8"];

// The homepage's "A table for the evening" form.
//
// It asks for party size only, because that is all the booking link carries:
// the date and time are picked on cal.diy's own page, against real
// availability. The old static widget drew day tiles and time slots that
// nothing read (docs/ROADMAP.md, "Homepage date/time picker is inert").
//
// Until cal.diy is configured (NEXT_PUBLIC_CAL_BOOKING_LINK) the button falls
// back to the bookings email, so it is never dead.
export function BookingForm() {
  const [chip, setChip] = useState<string | null>("2");
  const [other, setOther] = useState("");

  const size = other.trim() || chip || "2";

  function openBooking(e: React.FormEvent) {
    e.preventDefault();
    // Deep-link into cal.diy's booking page with the party size as metadata.
    // metadata[partySize] was walked end to end against a running cal.diy: the
    // booker reads metadata[...] off the query string and it lands verbatim on
    // Booking.metadata, which is where src/lib/cal.ts reads it back from.
    // duration is conditional: cal.diy only honours it when the event type has
    // multiple durations configured and 90 is one of them. See .env.example.
    const url = publicBookingUrl(size);
    if (url) {
      window.open(url, "_blank", "noopener");
    } else {
      // Not configured yet. Admin → Dashboard says so in as many words, because
      // a mail client opening is not a symptom anyone reads as "the booking link
      // is missing from the build".
      window.location.href = bookingsMailto(size);
    }
  }

  return (
    <form className="cmh-main" onSubmit={openBooking}>
      <h2>A table for the evening</h2>
      <p className="cmh-body">
        Tables seat two to eight and go quickly. Booking out the whole Lounge? Email{" "}
        <a href={`mailto:${BOOKINGS_EMAIL}`}>{BOOKINGS_EMAIL}</a>.
      </p>
      <fieldset>
        <legend className="cmh-mono">How many of you?</legend>
        <div className="cmh-sizes">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={chip === s && !other}
              onClick={() => {
                setChip(s);
                setOther("");
              }}
            >
              {s}
            </button>
          ))}
          <label htmlFor="cmh-other" className={other ? "is-active" : undefined}>
            Other
            <input
              id="cmh-other"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              placeholder="#"
              value={other}
              onChange={(e) => {
                setOther(e.target.value);
                if (e.target.value) setChip(null);
                else setChip("2");
              }}
            />
          </label>
        </div>
      </fieldset>
      <p className="cmh-mono cmh-note">
        Downstairs: 9 tables, up to 50 seated. The Lounge upstairs holds up to 20 for private bookings.
      </p>
      <p className="cmh-mono cmh-note">
        Held {HOLD_MINUTES} min · last booking 10pm · free cancellation up to 24h ahead
      </p>
      <button className="cmh-hold" type="submit">
        <span>Choose a time</span>
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
