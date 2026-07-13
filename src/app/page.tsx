import { prisma } from "@/lib/prisma";
import { HOME_HEAD, HOME_TAIL } from "@/lib/home-template";
import { BookingWidget } from "@/components/booking-widget";
import Script from "next/script";

// Read live at request time so the boss's What's On edits appear immediately,
// with no redeploy.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const entries = await prisma.whatsOnEntry.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      {/* Static chrome up to the What's On list */}
      <div dangerouslySetInnerHTML={{ __html: HOME_HEAD }} />

      {/* Dynamic What's On list — same markup shape as the original design */}
      <div style={{ borderTop: "1px solid rgba(28,21,18,.18)" }}>
        {entries.length === 0 && (
          <div style={{ padding: "22px 0", color: "rgba(28,21,18,.6)" }}>
            Nothing listed just now — check back soon.
          </div>
        )}
        {entries.map((e) => (
          <div
            key={e.id}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 32px",
              alignItems: "baseline",
              padding: "22px 0",
              borderBottom: "1px solid rgba(28,21,18,.18)",
            }}
          >
            <span
              style={{
                flex: "0 0 150px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11.5px",
                letterSpacing: ".16em",
                textTransform: "uppercase",
                color: "#5C6B57",
              }}
            >
              {e.schedule}
            </span>
            <span
              style={{
                flex: "0 0 260px",
                fontFamily: "'Cormorant', serif",
                fontSize: "clamp(24px,2.4vw,32px)",
                lineHeight: 1.1,
              }}
            >
              {e.title}
            </span>
            <span
              style={{
                flex: "1 1 260px",
                fontSize: "15px",
                lineHeight: 1.6,
                color: "rgba(28,21,18,.72)",
              }}
            >
              {e.description}
            </span>
          </div>
        ))}
      </div>

      {/* Static chrome after the What's On list (includes booking + footer) */}
      <div dangerouslySetInnerHTML={{ __html: HOME_TAIL }} />

      {/* Progressive enhancement for the booking widget + theme switcher */}
      <BookingWidget />
      <Script src="/legacy/theme-toggle.js" strategy="afterInteractive" />
    </div>
  );
}
