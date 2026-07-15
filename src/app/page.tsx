import { prisma } from "@/lib/prisma";
import { BookingWidget } from "@/components/booking-widget";
import Link from "next/link";
import { ensureSeeded } from "@/lib/db-seed";

// Force request-time rendering so events update immediately without redeploys.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeeded();
  const entries = await prisma.whatsOnEntry.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div style={{ backgroundColor: "var(--bg-dark)", color: "var(--text-light)" }}>
      
      {/* ============ HERO SECTION ============ */}
      <section
        style={{
          position: "relative",
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundImage: "linear-gradient(rgba(13, 12, 12, 0.8), rgba(13, 12, 12, 0.85)), url('/uploads/hero-wine-bar.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "clamp(20px, 4vw, 44px)",
        }}
      >
        {/* Navigation Bar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(245, 243, 239, 0.72)",
            zIndex: 10,
          }}
        >
          <span>Est. April 2025</span>
          <nav style={{ display: "flex", gap: "clamp(20px, 3vw, 40px)" }}>
            <Link href="/menu" style={{ color: "var(--text-light)" }}>Menu</Link>
            <a href="#whats-on" style={{ color: "var(--text-light)" }}>What's On</a>
            <a href="#book" style={{ color: "var(--text-light)" }}>Book</a>
          </nav>
          <span style={{ textAlign: "right" }}>Colchester · Crouch St</span>
        </header>

        {/* Hero Body */}
        <div className="editorial-grid" style={{ width: "100%", padding: "80px 0", zIndex: 10 }}>
          <div className="col-12" style={{ marginBottom: "20px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--accent-gold)",
                display: "block",
                marginBottom: "12px",
              }}
            >
              Wine Bar &amp; Lounge
            </span>
            <h1
              style={{
                fontSize: "clamp(60px, 12vw, 150px)",
                lineHeight: "0.85",
                letterSpacing: "-0.02em",
                fontWeight: 300,
                color: "#ffffff",
              }}
            >
              Crescent<br />
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>Moon</span>
            </h1>
          </div>
          
          <div className="col-12" style={{ maxWidth: "36ch", marginTop: "20px" }}>
            <p
              style={{
                fontSize: "clamp(16px, 1.8vw, 20px)",
                lineHeight: "1.6",
                color: "rgba(245, 243, 239, 0.9)",
                fontWeight: 300,
              }}
            >
              A wine bar on Crouch Street, Colchester. Thirty-five wines, chosen for character — poured slowly, in a room built to keep you.
            </p>
          </div>
        </div>

        {/* Hero Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: "100%",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(245, 243, 239, 0.4)",
            zIndex: 10,
          }}
        >
          <span>Scroll Down &darr;</span>
          <a
            href="https://www.instagram.com/crescentmoonbar"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(245, 243, 239, 0.6)" }}
          >
            @crescentmoonbar &rarr;
          </a>
        </div>
      </section>

      {/* ============ SECTION 1: THE LIST ============ */}
      <section className="section-light" style={{ padding: "clamp(80px, 10vw, 140px) 0" }}>
        <div className="editorial-grid" style={{ alignItems: "center" }}>
          
          {/* Left Column: Overlapping Visual Card */}
          <div className="col-d-6-left" style={{ display: "flex", flexDirection: "column", position: "relative" }}>
            <div className="luxury-image-wrapper" style={{ width: "90%" }}>
              <img src="/uploads/wine-pour.png" alt="Curated wine list being poured" />
            </div>
            
            {/* Overlapping Glass Card */}
            <div className="glass-panel glass-panel-light overlapping-card">
              <span className="section-num">01 / Glass</span>
              <h3 style={{ fontSize: "24px", marginBottom: "20px" }}>Tonight's Pour</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid rgba(18, 18, 18, 0.06)", paddingBottom: "8px" }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: "17px" }}>Foncastel Picpoul</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>£7.50</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid rgba(18, 18, 18, 0.06)", paddingBottom: "8px" }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: "17px" }}>Balauri Pinot Noir</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>£6.50</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid rgba(18, 18, 18, 0.06)", paddingBottom: "8px" }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: "17px" }}>Logan Orange</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>£8.95</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: "4px" }}>
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: "17px" }}>Pirani Prosecco</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>£10.95</span>
                </div>
              </div>
              <Link href="/menu" className="editorial-link" style={{ marginTop: "24px" }}>
                The Wine Cellar Menu &rarr;
              </Link>
            </div>
          </div>

          {/* Right Column: Narrative */}
          <div className="col-d-6-right" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span className="section-tag">Curated Cellar</span>
            <h2 style={{ fontSize: "clamp(36px, 4vw, 56px)", lineHeight: "1.05", marginBottom: "24px" }}>
              Chosen for <span style={{ fontStyle: "italic" }}>character</span>
            </h2>
            <p style={{ color: "var(--text-muted-dark)", fontSize: "16px", marginBottom: "28px" }}>
              Thirty-five wines — light &amp; bright, bold &amp; structured, orange, sparkling. Read and poured by a sommelier who tasted every one. Nothing here to fill a shelf.
            </p>
            <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "20px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-gold)" }}>
                Glasses from £4.95 · Cocktails £11.95 · Spritz from £12.50
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ============ SECTION 2: UPSTAIRS LOUNGE ============ */}
      <section className="section-light" style={{ padding: "clamp(60px, 8vw, 120px) 0", borderTop: "none" }}>
        <div className="editorial-grid">
          
          {/* Left Column: Narrative (stacks on top on mobile naturally) */}
          <div className="col-d-5-left" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span className="section-tag">The Space</span>
            <h2 style={{ fontSize: "clamp(36px, 4vw, 56px)", lineHeight: "1.05", marginBottom: "24px" }}>
              Under the <span style={{ fontStyle: "italic" }}>skylight</span>
            </h2>
            <p style={{ color: "var(--text-muted-dark)", fontSize: "16px", marginBottom: "24px" }}>
              A lounge that keeps its own hours. The light shifts across the afternoon and the room asks nothing of you. Second-glass territory.
            </p>
            <div style={{ marginBottom: "30px" }}>
              <Link href="/menu#lounge" className="editorial-link">
                Private Hire Details &rarr;
              </Link>
            </div>
          </div>

          {/* Right Column: Image */}
          <div className="col-d-7-right">
            <div className="luxury-image-wrapper">
              <img src="/uploads/lounge-skylight.png" alt="Upstairs lounge at Crescent Moon" />
            </div>
          </div>

        </div>
      </section>

      {/* ============ SECTION 3: SOUL NIGHT (DARK BAND) ============ */}
      <section
        className="section-dark"
        style={{
          padding: "clamp(100px, 12vw, 160px) 0",
          backgroundImage: "linear-gradient(rgba(13, 12, 12, 0.9), rgba(13, 12, 12, 0.95))",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0 20px" }}>
          <span className="section-tag" style={{ color: "var(--accent-gold)" }}>Sundays</span>
          <h2 style={{ fontSize: "clamp(48px, 6vw, 84px)", fontStyle: "italic", lineHeight: "1", color: "#ffffff", marginBottom: "24px" }}>
            Soul Night
          </h2>
          <p style={{ color: "var(--text-muted-light)", fontSize: "18px", lineHeight: "1.7", fontWeight: 300, marginBottom: "30px" }}>
            Records, low light, no rush. The one night the room turns up its own volume — a little.
          </p>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--accent-gold)",
              border: "1px solid rgba(182, 151, 102, 0.3)",
              padding: "8px 18px",
            }}
          >
            Weekly from 6:00pm
          </span>
        </div>
      </section>

      {/* ============ SECTION 4: WHAT'S ON ============ */}
      <section id="whats-on" className="section-light" style={{ padding: "clamp(80px, 10vw, 140px) 0" }}>
        <div className="editorial-grid">
          
          {/* Header left */}
          <div className="col-d-4-left" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", marginBottom: "30px" }}>
            <span className="section-tag">Gatherings</span>
            <h2 style={{ fontSize: "clamp(36px, 4vw, 56px)", lineHeight: "1.05", marginBottom: "20px" }}>
              This month at <span style={{ fontStyle: "italic" }}>the Moon</span>
            </h2>
            <a
              href="https://www.instagram.com/crescentmoonbar"
              target="_blank"
              rel="noopener noreferrer"
              className="editorial-link"
              style={{ alignSelf: "flex-start", marginTop: "12px" }}
            >
              Follow @crescentmoonbar &rarr;
            </a>
          </div>

          {/* Ledger right */}
          <div className="col-d-7-right-offset" style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--border-light)" }}>
            {entries.length === 0 && (
              <div style={{ padding: "30px 0", color: "var(--text-muted-dark)", fontFamily: "var(--font-mono)", fontSize: "14px" }}>
                Nothing listed just now — check back soon.<br />
                <Link href="/admin/whats-on" className="editorial-link" style={{ marginTop: "16px" }}>
                  Manage What's On &rarr;
                </Link>
              </div>
            )}
            {entries.map((e) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "26px 0",
                  borderBottom: "1px solid var(--border-light)",
                  transition: "var(--transition-fast)",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--accent-green)",
                    }}
                  >
                    {e.schedule}
                    {e.date && (
                      <span style={{ color: "var(--accent-gold)" }}>
                        {" · "}{new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                      </span>
                    )}
                  </span>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(22px, 2.2vw, 28px)", fontWeight: 400, flexBasis: "100%", marginTop: "6px", order: 2 }}>
                    {e.title}
                  </h3>
                </div>
                <p style={{ color: "var(--text-muted-dark)", fontSize: "14.5px", lineHeight: "1.6" }}>
                  {e.description}
                </p>
              </div>
            ))}
            
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "rgba(18, 18, 18, 0.4)",
                marginTop: "24px",
                letterSpacing: "0.08em",
              }}
            >
              Dates land on Instagram first — or call 01206 525566
            </p>
          </div>

        </div>
      </section>

      {/* ============ SECTION 5: FOOD / COUNTER ============ */}
      <section className="section-light" style={{ padding: "clamp(60px, 8vw, 120px) 0", borderTop: "none" }}>
        <div className="editorial-grid" style={{ alignItems: "center" }}>
          
          {/* Left Column: Food Details Card */}
          <div className="col-d-5-left" style={{ display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: "30px" }}>
            <span className="section-tag">Specials</span>
            <h2 style={{ fontSize: "clamp(36px, 4vw, 56px)", lineHeight: "1.05", marginBottom: "24px" }}>
              From <span style={{ fontStyle: "italic" }}>near here</span>
            </h2>
            <p style={{ color: "var(--text-muted-dark)", fontSize: "16px", marginBottom: "24px" }}>
              English cheese and charcuterie. Spirits distilled in Bury St Edmunds. A short kitchen and a list that knows exactly where it is.
            </p>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-gold)" }}>
              Seasonal menu items · Handcrafted locally
            </span>
          </div>

          {/* Right Column: The board */}
          <div className="col-d-6-right">
            <div
              className="glass-panel glass-panel-light"
              style={{
                padding: "clamp(20px, 4vw, 40px)",
                border: "1px solid var(--border-light)",
                boxShadow: "0 15px 35px rgba(0, 0, 0, 0.03)",
              }}
            >
              <span className="section-num">Snack Board</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                <div style={{ borderBottom: "1px solid rgba(18, 18, 18, 0.06)", paddingBottom: "12px", fontFamily: "var(--font-serif)", fontSize: "20px" }}>Cheese board</div>
                <div style={{ borderBottom: "1px solid rgba(18, 18, 18, 0.06)", paddingBottom: "12px", fontFamily: "var(--font-serif)", fontSize: "20px" }}>Charcuterie board</div>
                <div style={{ borderBottom: "1px solid rgba(18, 18, 18, 0.06)", paddingBottom: "12px", fontFamily: "var(--font-serif)", fontSize: "20px" }}>Giant pitted olives &amp; Smoked almonds</div>
                <div style={{ borderBottom: "1px solid rgba(18, 18, 18, 0.06)", paddingBottom: "12px", fontFamily: "var(--font-serif)", fontSize: "20px" }}>Dingley Dell beer sticks</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "20px" }}>Weekend sausage rolls &amp; Toasties</div>
              </div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(18, 18, 18, 0.4)", marginTop: "24px" }}>
                Items are subject to daily change — ask the team.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ============ SECTION 6: RESERVE / BOOKING ============ */}
      <section id="book" className="section-dark" style={{ padding: "clamp(80px, 10vw, 140px) 0" }}>
        <div className="editorial-grid" style={{ alignItems: "center" }}>
          
          {/* Left Column: Booking details */}
          <div className="col-d-5-left" style={{ marginBottom: "30px" }}>
            <span className="section-tag" style={{ color: "var(--accent-gold)" }}>Reserve</span>
            <h2 style={{ fontSize: "clamp(36px, 4.5vw, 64px)", lineHeight: "1.05", color: "#ffffff", marginBottom: "24px" }}>
              A table for <span style={{ fontStyle: "italic" }}>the evening</span>
            </h2>
            <p style={{ color: "var(--text-muted-light)", fontSize: "16px", lineHeight: "1.7", marginBottom: "28px" }}>
              Tables seat two to eight and go quickly — pick a size or tell us the exact number, choose a time, and we'll hold it. Booking out the whole Lounge? Email <a href="mailto:bookings@crescentmoonwinebar.co.uk" style={{ color: "var(--accent-gold)", textDecoration: "underline" }}>bookings@crescentmoonwinebar.co.uk</a>.
            </p>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(245, 243, 239, 0.4)", display: "block" }}>
              FREE CANCELLATION UP TO 24 HOURS AHEAD
            </span>
          </div>

          {/* Right Column: The Widget */}
          <div className="col-d-6-right">
            <BookingWidget />
          </div>

        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer
        style={{
          backgroundColor: "#080708",
          color: "var(--text-light)",
          padding: "clamp(60px, 8vw, 100px) 0 40px",
          borderTop: "1px solid rgba(245, 243, 239, 0.05)",
        }}
      >
        <div className="editorial-grid" style={{ gap: "40px" }}>
          
          {/* Col 1: Brand & Contact */}
          <div className="footer-col-1">
            <h2 style={{ fontSize: "28px", color: "#ffffff", marginBottom: "20px" }}>Crescent Moon</h2>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "rgba(245, 243, 239, 0.6)", lineHeight: "1.8" }}>
              <p>67 Crouch St</p>
              <p>Colchester CO3 3EY</p>
              <p style={{ marginTop: "10px" }}>01206 525566</p>
              <a
                href="https://www.instagram.com/crescentmoonbar"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-gold)", display: "inline-block", marginTop: "10px" }}
              >
                @crescentmoonbar &rarr;
              </a>
            </div>
          </div>

          {/* Col 2: Hours */}
          <div className="footer-col-2">
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--accent-gold)",
                display: "block",
                marginBottom: "16px",
              }}
            >
              Hours
            </span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "rgba(245, 243, 239, 0.6)", lineHeight: "1.8" }}>
              <p>Wed–Sat &nbsp;12pm–12am</p>
              <p>Sun &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;12pm–6pm</p>
              <p style={{ marginTop: "10px", color: "rgba(245, 243, 239, 0.3)" }}>Mon–Tue &nbsp;Closed</p>
            </div>
          </div>

          {/* Col 3: Newsletter */}
          <div className="footer-col-3">
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--accent-gold)",
                display: "block",
                marginBottom: "16px",
              }}
            >
              The occasional letter
            </span>
            <p style={{ fontSize: "13.5px", color: "rgba(245, 243, 239, 0.5)", marginBottom: "16px", lineHeight: "1.5" }}>
              New wines, quiet nights. No more than once a month.
            </p>
            <form
              action="#"
              style={{
                display: "flex",
                borderBottom: "1px solid rgba(182, 151, 102, 0.4)",
                paddingBottom: "4px",
              }}
            >
              <input
                type="email"
                placeholder="you@email"
                aria-label="Email address"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: 0,
                  outline: "none",
                  color: "#ffffff",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  color: "var(--accent-gold)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  paddingLeft: "10px",
                }}
              >
                Join
              </button>
            </form>
          </div>

          {/* Footer Line */}
          <div
            className="col-12"
            style={{
              borderTop: "1px solid rgba(245, 243, 239, 0.08)",
              paddingTop: "24px",
              marginTop: "40px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <nav
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "24px",
                fontFamily: "var(--font-mono)",
                fontSize: "11.5px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(245, 243, 239, 0.6)",
              }}
            >
              <Link href="/">Home</Link>
              <Link href="/menu">Menu</Link>
              <a href="#whats-on">What's On</a>
              <a href="#book">Book</a>
              <a href="mailto:bookings@crescentmoonwinebar.co.uk">Private Hire</a>
            </nav>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(245, 243, 239, 0.3)" }}>
              © 2026 Crescent Moon Wine Bar
            </span>
          </div>

        </div>
      </footer>

    </div>
  );
}
