import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/booking-form";
import { LetterForm } from "@/components/letter-form";
import Script from "next/script";
import "./home.css";

// Read live at request time so the boss's What's On edits appear immediately,
// with no redeploy.
export const dynamic = "force-dynamic";

const INSTAGRAM = "https://www.instagram.com/crescentmoonbar";

const BY_THE_GLASS = [
  ["Foncastel Picpoul de Pinet", "7.50"],
  ["Balauri Pinot Noir", "6.50"],
  ["Logan Clementine Orange", "8.95"],
  ["Pirani Prosecco", "10.95"],
] as const;

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
        <div className="cmh-dateline cmh-mono">
          <span>Wine bar · Est. April 2025</span>
          <span>67 Crouch St, Colchester</span>
          <span>Wed–Sat 12pm–12am · Sun 12–6pm</span>
        </div>
        <h1 className="cmh-nameplate">
          Crescent Moon
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <path d="M 52 8 A 42 42 0 1 0 52 92 A 31 42 0 1 1 52 8 Z" fill="var(--cmh-green)" />
          </svg>
        </h1>
        <div className="cmh-strap">
          <span className="cmh-fact">A wine bar on Crouch Street</span>
          <p>Thirty-five wines, chosen for character, poured slowly in a room built to keep you.</p>
          <nav aria-label="Main">
            <a href="/menu">Menu</a>
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
          <span className="cmh-fact">35 wines · glasses from £4.95</span>
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
            Thirty-five wines: light and bright, bold and structured, orange, sparkling. Read and
            poured by a sommelier who tasted every one. Nothing here to fill a shelf.
          </p>
          <div className="cmh-block">
            <span className="cmh-fact">By the glass tonight</span>
            <ul className="cmh-list">
              {BY_THE_GLASS.map(([name, price]) => (
                <li key={name}>
                  <span>{name}</span>
                  <span className="cmh-price">{price}</span>
                </li>
              ))}
            </ul>
            <div className="cmh-under">
              <span className="cmh-fact">Glasses from £4.95 · cocktails £11.95 · spritz from £12.50</span>
              <a href="/menu"><span className="cmh-ul">The full menu</span> →</a>
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

      <footer className="cmh-foot">
        <div className="cmh-foot-grid">
          <div>
            <span className="cmh-mono">Crescent Moon</span>
            <span className="cmh-foot-big">Wine bar,<br />Crouch Street</span>
          </div>
          <div>
            <span className="cmh-mono">Find us</span>
            67 Crouch St<br />Colchester CO3 3EY<br />01206 525566
          </div>
          <div>
            <span className="cmh-mono">Hours</span>
            Wed–Sat 12pm–12am<br />Sun 12–6pm<br />Mon–Tue closed
          </div>
          <div>
            <span className="cmh-mono">The occasional letter</span>
            New wines, quiet nights. No more than once a month.
            <LetterForm />
          </div>
        </div>
        <div className="cmh-base cmh-mono">
          <span>© 2026 Crescent Moon Wine Bar</span>
          <a href={INSTAGRAM} target="_blank" rel="noopener">@crescentmoonbar ↗</a>
        </div>
      </footer>

      {/* The Wine / Navy / Green switcher; here it recolours the booking band. */}
      <Script src="/legacy/theme-toggle.js" strategy="afterInteractive" />
    </div>
  );
}
