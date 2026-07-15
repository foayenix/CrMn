"use client";

import { useState } from "react";

export function BookingWidget() {
  const [partySize, setPartySize] = useState<string>("2");
  const [selectedDate, setSelectedDate] = useState<string>("Fr 10");
  const [selectedTime, setSelectedTime] = useState<string>("7:00");
  const [customSize, setCustomSize] = useState<string>("");

  const dates = [
    { label: "Th 9", available: true },
    { label: "Fr 10", available: true },
    { label: "Sa 11", available: true },
    { label: "Su 12", available: true }
  ];

  const times = [
    { slot: "6:30", available: true },
    { slot: "7:00", available: true },
    { slot: "7:30", available: true },
    { slot: "8:00", available: false },
    { slot: "8:30", available: true }
  ];

  const handlePartySelect = (size: string) => {
    setPartySize(size);
    setCustomSize("");
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomSize(val);
    if (val) {
      setPartySize(val);
    } else {
      setPartySize("2");
    }
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    const bookingLink = process.env.NEXT_PUBLIC_CAL_BOOKING_LINK || "";
    const calBase = process.env.NEXT_PUBLIC_CAL_URL_BASE || "";
    const finalSize = customSize || partySize;

    if (bookingLink && calBase) {
      const url = new URL(`${calBase.replace(/\/$/, "")}/${bookingLink}`);
      url.searchParams.set("metadata[partySize]", finalSize);
      url.searchParams.set("duration", "90");
      window.open(url.toString(), "_blank", "noopener");
    } else {
      window.location.href =
        "mailto:bookings@crescentmoonwinebar.co.uk?subject=" +
        encodeURIComponent(`Table for ${finalSize} on ${selectedDate} at ${selectedTime}`);
    }
  };

  return (
    <form
      onSubmit={handleBook}
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        width: "100%",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      {/* Header Info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          borderBottom: "1px solid rgba(245, 243, 239, 0.15)",
          paddingBottom: "16px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--accent-gold)",
          }}
        >
          July 2026
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(245, 243, 239, 0.4)",
          }}
        >
          90 min hold
        </span>
      </div>

      {/* Guest Selection */}
      <div>
        <label
          style={{
            display: "block",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(245, 243, 239, 0.7)",
            marginBottom: "12px",
          }}
        >
          How many guests?
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {["2", "4", "6", "8"].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handlePartySelect(size)}
              className={`booking-chip ${partySize === size && !customSize ? "active" : ""}`}
            >
              {size}
            </button>
          ))}
          <label className={`booking-input-wrap ${customSize ? "active" : ""}`}>
            <span style={{ color: "rgba(245, 243, 239, 0.4)", fontSize: "12px" }}>Other</span>
            <input
              type="number"
              min="1"
              max="50"
              placeholder="#"
              value={customSize}
              onChange={handleCustomInput}
            />
          </label>
        </div>
        <p
          style={{
            fontSize: "11.5px",
            color: "rgba(245, 243, 239, 0.45)",
            marginTop: "10px",
            fontFamily: "var(--font-sans)",
            fontWeight: 300,
            lineHeight: 1.5,
          }}
        >
          Downstairs: 9 tables, up to 50 seated. Upstairs lounge: up to 20 private hire.
        </p>
      </div>

      {/* Date Selection */}
      <div>
        <label
          style={{
            display: "block",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(245, 243, 239, 0.7)",
            marginBottom: "12px",
          }}
        >
          Select Date
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {dates.map((date) => (
            <button
              key={date.label}
              type="button"
              onClick={() => setSelectedDate(date.label)}
              className={`booking-chip ${selectedDate === date.label ? "active" : ""}`}
              style={{ padding: "12px 0", textAlign: "center" }}
            >
              {date.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Selection */}
      <div>
        <label
          style={{
            display: "block",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(245, 243, 239, 0.7)",
            marginBottom: "12px",
          }}
        >
          {selectedDate} — Evening Slots
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {times.map((time) => (
            <button
              key={time.slot}
              type="button"
              disabled={!time.available}
              onClick={() => setSelectedTime(time.slot)}
              className={`booking-chip ${selectedTime === time.slot ? "active" : ""}`}
              style={{
                opacity: time.available ? 1 : 0.25,
                cursor: time.available ? "pointer" : "not-allowed",
              }}
            >
              {time.slot}
            </button>
          ))}
        </div>
        <p
          style={{
            fontSize: "11px",
            color: "rgba(245, 243, 239, 0.4)",
            marginTop: "10px",
            fontFamily: "var(--font-mono)",
          }}
        >
          Last seating at 10:00pm.
        </p>
      </div>

      {/* CTA Button */}
      <button
        type="submit"
        className="luxury-btn"
        style={{
          width: "100%",
          justifyContent: "center",
          marginTop: "10px",
        }}
      >
        Hold table for {customSize || partySize} guests at {selectedTime} &rarr;
      </button>
    </form>
  );
}
