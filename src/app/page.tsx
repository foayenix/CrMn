import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/booking-form";
import { Dateline, INSTAGRAM, MoonMark, SiteFooter } from "@/components/site-chrome";
import { MENU_FACTS, featuredByTheGlass, inWords } from "@/lib/menu";
import Link from "next/link";
import Script from "next/script";
import "./site.css";

// Read live at request time so the boss's What's On edits appear immediately,
// with no redeploy.
export const dynamic = "force-dynamic";

const BY_THE_GLASS = featuredByTheGlass();
const WINES = inWords(MENU_FACTS.wines);

const COUNTER = [
  "Cheese board",
  "Charcuterie board",
  "Giant pitted olives · Smoked almonds",
  "Dingley Dell beer sticks",
  "Weekend sausage rolls · Toasties",
];

// The homepage as a magazine cover and contents page ("Masthead", see
// design/home-options/). Each contents row carries a real fact rather than a
// page number.
export default async function HomePage() {
  const entries = await prisma.whatsOnEntry.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  const lead = entries[0];

  return (
    <div className="cmh" data-screen-label="Home">
      <header>
        <Dateline />
        <h1 className="cmh-nameplate">
          Crescent Moon
          <MoonMark />
        </h1>
        <div className="cmh-strap">
          <span className="cmh-fact">A wine bar on Crouch Street</span>
          <p>{WINES} wines, chosen for character, poured slowly in a room built to keep you.</p>
          <nav aria-label="Main">
            <Link href="/menu">Menu</Link>
            <a href="#whats-on">What&apos;s On</a>
            <a href="#book">Book a table</a>
          </nav>
        </div>
      </header>

      <nav className="cmh-contents" aria-label="On this page">
        <span className="cmh-mono">On this page</span>
        <a className="cmh-row" href="#list">
          <span className="cmh-row-title">The List</span>
          <p>Chosen for character, read and poured by a sommelier.</p>
          <span className="cmh-fact">{MENU_FACTS.wines} wines · glasses from £{MENU_FACTS.glassFrom}</span>
        </a>
        <a className="cmh-row" href="#upstairs">
          <span className="cmh-row-title">Upstairs</span>
          <p>A lounge under the skylight that keeps its own hours.</p>
          <span className="cmh-fact">The Lounge · up to 20</span>
        </a>
        <a className="cmh-row" href="#whats-on">
          <span className="cmh-row-title">What&apos;s On</span>
          <p>Nights, tastings and music, as they are announced.</p>
          <span className="cmh-fact">
            {lead ? `${lead.title} · ${lead.schedule}` : "Dates on Instagram"}
          </span>
        </a>
        <a className="cmh-row" href="#near">
          <span className="cmh-row-title">From near here</span>
          <p>English cheese and charcuterie, spirits from Bury St Edmunds.</p>
          <span className="cmh-fact">From the counter</span>
        </a>
        <a className="cmh-row" href="#book">
          <span className="cmh-row-title">Book</span>
          <p>Tables go quickly. Pick a size, then a time.</p>
          <span className="cmh-fact">Tables for 2–8</span>
        </a>
      </nav>

      <section className="cmh-sec" id="list">
        <div className="cmh-side"><span className="cmh-mono">The List</span></div>
        <div className="cmh-main">
          <h2>Chosen for character</h2>
          <p className="cmh-body">
            {WINES} wines: light and bright, bold and structured, orange, sparkling. Read and poured
            by a sommelier who tasted every one. Nothing here to fill a shelf.
          </p>
          <div className="cmh-block">
            <span className="cmh-fact">By the glass tonight</span>
            <ul className="cmh-list">
              {BY_THE_GLASS.map(({ name, measure, price }) => (
                <li key={name}>
                  <span>{name}</span>
                  <span className="cmh-price">
                    <span className="cmh-measure">{measure}</span> {price}
                  </span>
                </li>
              ))}
            </ul>
            <div className="cmh-under">
              <span className="cmh-fact">
                Glasses from £{MENU_FACTS.glassFrom} · cocktails £{MENU_FACTS.cocktailPrice} · spritz
                from £{MENU_FACTS.spritzFrom}
              </span>
              <Link href="/menu"><span className="cmh-ul">The full menu</span> →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cmh-sec" id="upstairs">
        <div className="cmh-side"><span className="cmh-mono">Upstairs</span></div>
        <div className="cmh-main">
          <h2>Under the skylight</h2>
          <p className="cmh-body">
            A lounge that keeps its own hours. The light shifts across the afternoon and the room
            asks nothing of you. Second-glass territory.
          </p>
        </div>
      </section>

      <section className="cmh-sec" id="whats-on">
        <div className="cmh-side"><span className="cmh-mono">What&apos;s On</span></div>
        <div className="cmh-main">
          <h2>This month at the Moon</h2>
          <div className="cmh-events">
            {entries.length === 0 && (
              <p className="cmh-empty">Nothing listed just now. Check back soon.</p>
            )}
            {entries.map((e) => (
              <div className="cmh-ev" key={e.id}>
                <span className="cmh-fact">{e.schedule}</span>
                <h3>{e.title}</h3>
                <p>{e.description}</p>
              </div>
            ))}
          </div>
          <p className="cmh-small">
            Dates land on <a className="cmh-ul" href={INSTAGRAM} target="_blank" rel="noopener">Instagram</a> first,
            or call 01206 525566.
          </p>
        </div>
      </section>

      <section className="cmh-sec" id="near">
        <div className="cmh-side"><span className="cmh-mono">Local, on purpose</span></div>
        <div className="cmh-main">
          <h2>From near here</h2>
          <p className="cmh-body">
            English cheese and charcuterie. Spirits distilled in Bury St Edmunds. A short kitchen and
            a list that knows exactly where it is.
          </p>
          <div className="cmh-block">
            <span className="cmh-fact">From the counter</span>
            <ul className="cmh-list">
              {COUNTER.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="cmh-small">Seasonal. Ask the team.</p>
          </div>
        </div>
      </section>

      <section className="cmh-book" id="book">
        <div className="cmh-sec">
          <div className="cmh-side"><span className="cmh-mono cmh-fact">Book</span></div>
          <BookingForm />
        </div>
      </section>

      <SiteFooter />

      {/* The Wine / Navy / Green switcher; here it recolours the booking band. */}
      <Script src="/legacy/theme-toggle.js" strategy="afterInteractive" />
    </div>
  );
}
