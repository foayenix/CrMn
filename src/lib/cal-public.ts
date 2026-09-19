// The public half of the cal.diy integration: the booking link the website's
// "Hold this table" button opens.
//
// Both values are NEXT_PUBLIC_, so Next inlines them into the bundle at BUILD
// time. Setting them on the deployment and not rebuilding leaves the old values
// in the shipped JavaScript — which is the failure this module exists to make
// visible, because the button's fallback is a mailto: and a mail client opening
// looks nothing like a misconfiguration.
//
// Server and client both read from here rather than each testing the variables
// themselves: the admin's "is it configured" answer has to be the same answer
// the button acts on, or the dashboard reassures the boss about a button that
// is quietly emailing.

export const BOOKINGS_EMAIL = "bookings@crescentmoonwinebar.co.uk";

// How long the website says a table is held for. cal.diy only honours this when
// the reservation event type has multiple durations configured and this value is
// one of them; otherwise the booking silently takes the event type's own length.
export const HOLD_MINUTES = 90;

function parts(): { base: string; link: string } {
  return {
    base: process.env.NEXT_PUBLIC_CAL_URL_BASE || "",
    link: process.env.NEXT_PUBLIC_CAL_BOOKING_LINK || "",
  };
}

// True when the shipped bundle can actually reach a cal.diy booking page.
export function isPublicBookingConfigured(): boolean {
  const { base, link } = parts();
  return !!base && !!link;
}

// The URL the button opens, or null when it would fall back to email.
export function publicBookingUrl(partySize: string): string | null {
  const { base, link } = parts();
  if (!base || !link) return null;
  const url = new URL(`${base.replace(/\/$/, "")}/${link}`);
  url.searchParams.set("metadata[partySize]", partySize);
  url.searchParams.set("duration", String(HOLD_MINUTES));
  return url.toString();
}

export function bookingsMailto(partySize: string): string {
  return `mailto:${BOOKINGS_EMAIL}?subject=${encodeURIComponent(`Table for ${partySize}`)}`;
}
