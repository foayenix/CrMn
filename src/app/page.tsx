import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/booking-form";
import { Dateline, INSTAGRAM, SiteFooter } from "@/components/site-chrome";
import { LogoMark } from "@/components/logo";
import { MENU_FACTS, featuredByTheGlass, fromTheCounter, inWords } from "@/lib/menu";
import Link from "next/link";
import "./site.css";

// Read live at request time so the boss's What's On edits appear immediately,
// with no redeploy.
export const dynamic = "force-dynamic";

const BY_THE_GLASS = featuredByTheGlass();
const COUNTER = fromTheCounter();
const WINES = inWords(MENU_FACTS.wines);
const COCKTAILS = inWords(MENU_FACTS.cocktailCount).toLowerCase();

// The copy follows the printed menu's voice: talks to you, has opinions, keeps
// it short. Every claim in it is on the menu or was already on the site.

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
          <LogoMark />
        </h1>
        <div className="cmh-strap">
          <span className="cmh-fact">A wine bar on Crouch Street</span>
          <p>{WINES} wines, {COCKTAILS} cocktails and a room you won&apos;t want to leave. Pull up a chair.</p>
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
          <p>The perfect pour, whatever you&apos;re after.</p>
          <span className="cmh-fact">{MENU_FACTS.wines} wines · glasses from £{MENU_FACTS.glassFrom}</span>
        </a>
        <a className="cmh-row" href="#upstairs">
          <span className="cmh-row-title">Upstairs</span>
          <p>The Lounge, under the skylight. Yours to hire.</p>
          <span className="cmh-fact">Private hire · up to 20</span>
        </a>
        <a className="cmh-row" href="#whats-on">
          <span className="cmh-row-title">What&apos;s On</span>
          <p>What&apos;s coming up at the Moon.</p>
          <span className="cmh-fact">
            {lead ? `${lead.title} · ${lead.schedule}` : "Dates on Instagram"}
          </span>
        </a>
        <a className="cmh-row" href="#near">
          <span className="cmh-row-title">From up the road</span>
          <p>Cocktails from Bury St Edmunds, beer from Suffolk, food from nearby.</p>
          <span className="cmh-fact">Locally supplied</span>
        </a>
        <a className="cmh-row" href="#book">
          <span className="cmh-row-title">Book</span>
          <p>Tables go quickly. Don&apos;t leave it to chance.</p>
          <span className="cmh-fact">Tables for 2–8</span>
        </a>
      </nav>

      <section className="cmh-sec" id="list">
        <div className="cmh-side"><span className="cmh-mono">The List</span></div>
        <div className="cmh-main">
          <h2>The perfect pour</h2>
          <p className="cmh-body">
            {WINES} wines, from a great little house white all the way to Champagne, and every one
            tasted by our sommelier. A few have the medals to prove it. Not sure where to start? Ask
            us. That&apos;s what we&apos;re here for.
          </p>
          <div className="cmh-block">
            <span className="cmh-fact">By the glass</span>
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
            Upstairs is the Lounge, our first-floor room under the skylight. Perfect for a second
            glass. Got something to celebrate? It&apos;s available to hire for up to 20. Just ask the
            team.
          </p>
        </div>
      </section>

      <section className="cmh-sec" id="whats-on">
        <div className="cmh-side"><span className="cmh-mono">What&apos;s On</span></div>
        <div className="cmh-main">
          <h2>This month at the Moon</h2>
          <div className="cmh-events">
            {entries.length === 0 && (
              <p className="cmh-empty">Nothing on the calendar just yet. Watch this space.</p>
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
            Dates land on <a className="cmh-ul" href={INSTAGRAM} target="_blank" rel="noopener">Instagram</a> first.
            Or give us a ring on 01206 525566.
          </p>
        </div>
      </section>

      <section className="cmh-sec" id="near">
        <div className="cmh-side"><span className="cmh-mono">Local, on purpose</span></div>
        <div className="cmh-main">
          <h2>From up the road</h2>
          <p className="cmh-body">
            Our cocktails are made by Edmunds, expert mixologists from Bury St Edmunds. The Adnams
            comes from up the road in Suffolk. And the food is locally supplied, so it changes with
            the seasons.
          </p>
          <div className="cmh-block">
            <span className="cmh-fact">From the counter</span>
            <ul className="cmh-list">
              {COUNTER.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="cmh-small">Check out our specials board or ask the team for seasonal options.</p>
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
    </div>
  );
}
