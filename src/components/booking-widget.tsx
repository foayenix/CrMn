"use client";

import { useEffect } from "react";

// Progressive enhancement for the booking module that lives in the static
// homepage markup (HOME_TAIL). We attach behaviour by DOM id/class rather than
// re-rendering the markup, so the original design is untouched.
//
// Behaviour:
//   - party-size chips + "Other" box are mutually-exclusive selectable
//   - day tiles and time slots become selectable
//   - "Hold this table" builds a cal.diy booking URL from the current selection
//     and opens it. Until cal.diy is configured (NEXT_PUBLIC_CAL_BOOKING_LINK),
//     it falls back to the bookings email so the button is never dead.
export function BookingWidget() {
  useEffect(() => {
    const bookingLink = process.env.NEXT_PUBLIC_CAL_BOOKING_LINK || "";
    const calBase = process.env.NEXT_PUBLIC_CAL_URL_BASE || "";

    const state = { size: "2", day: "Fr 10", time: "7:00" };

    function selectParty(chip: HTMLElement) {
      const group = document.getElementById("cm-party-group");
      if (!group) return;
      group.querySelectorAll(".cm-chip").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      state.size = (chip.textContent || "").trim();
      const customInput = document.getElementById("cm-custom-size") as HTMLInputElement | null;
      if (customInput) customInput.value = "";
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;

      const chip = target.closest(".cm-chip") as HTMLElement | null;
      if (chip && document.getElementById("cm-party-group")?.contains(chip)) {
        selectParty(chip);
        return;
      }

      // "Hold this table" — the only real link in the module (href="#").
      const hold = target.closest('a[href="#"]') as HTMLAnchorElement | null;
      if (hold) {
        e.preventDefault();
        openBooking();
      }
    }

    function onInput(e: Event) {
      const target = e.target as HTMLElement;
      if (target.id !== "cm-custom-size") return;
      const group = document.getElementById("cm-party-group");
      group?.querySelectorAll(".cm-chip").forEach((c) => c.classList.remove("is-active"));
      state.size = (target as HTMLInputElement).value || "2";
    }

    function openBooking() {
      if (bookingLink && calBase) {
        // Deep-link into cal.diy's booking page with the party size as metadata.
        // cal.diy then shows real availability for the reservation event type.
        const url = new URL(`${calBase.replace(/\/$/, "")}/${bookingLink}`);
        url.searchParams.set("metadata[partySize]", state.size);
        url.searchParams.set("duration", "90");
        window.open(url.toString(), "_blank", "noopener");
      } else {
        // Not configured yet — never leave the button dead.
        window.location.href =
          "mailto:bookings@crescentmoonwinebar.co.uk?subject=" +
          encodeURIComponent(`Table for ${state.size}`);
      }
    }

    document.addEventListener("click", onClick);
    document.addEventListener("input", onInput);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("input", onInput);
    };
  }, []);

  return null;
}
