import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import type { CSSProperties } from "react";
import { Dateline, MoonMark, SiteFooter } from "@/components/site-chrome";
import { BOOKINGS_EMAIL } from "@/lib/cal-public";
import { MENU, MENU_FACTS, type MenuGroup, type MenuItem } from "@/lib/menu";
import "../site.css";

export const metadata: Metadata = {
  title: "Menu — Crescent Moon",
  description:
    "The drinks menu at Crescent Moon, Crouch Street, Colchester: wine by the glass and bottle, cocktails, spritz, spirits, beer, low and no alcohol, and food from the counter.",
};

// The printed menu, same file the bar prints from.
const PDF = "/uploads/Crescent%20Moon%20Drinks%20Menu%20A5%2016pp.pdf";

// The side label and the contents row for each section. The facts on the right
// are computed from the menu so they cannot drift from it.
const CONTENTS: Record<string, { label: string; summary: string; fact: string }> = {
  wine: {
    label: "Wine",
    summary: "White, rosé and orange, red, and sparkling.",
    fact: `${MENU_FACTS.wines} wines · glasses from £${MENU_FACTS.glassFrom}`,
  },
  cocktails: {
    label: "Cocktails",
    summary: "Made by Edmunds, from Bury St Edmunds.",
    fact: `${MENU_FACTS.cocktailCount} cocktails · all £${MENU_FACTS.cocktailPrice}`,
  },
  spritz: { label: "Spritz", summary: "Aperol, Hugo, Limoncello, Tequila and Campari.", fact: `From £${MENU_FACTS.spritzFrom}` },
  spirits: {
    label: "Spirits",
    summary: "Rum, gin, vodka, whiskey, bourbon, brandy, tequila and liqueurs.",
    fact: `${MENU_FACTS.spiritCount} to choose from`,
  },
  beer: { label: "Beer & cider", summary: "Four on tap, plus bottled beer and cider.", fact: `Pints from £${MENU_FACTS.pintFrom}` },
  "low-no": { label: "Low / no", summary: "Alcohol-free beer, cider and gin, and mocktails.", fact: `Mocktails £${MENU_FACTS.mocktailFrom}` },
  soft: { label: "Soft drinks", summary: "Water, soft drinks, juices and mixers.", fact: `From £${MENU_FACTS.softFrom}` },
  food: { label: "Food", summary: "Boards, snacks, toasties, coffee and tea.", fact: "Seasonal · ask the team" },
};

function keyLabel(key: string): string {
  // The printed tasting guide: 1-5 driest to sweetest; A-E light to full-bodied.
  return /^\d$/.test(key) ? `Sweetness ${key}` : `Body ${key}`;
}

function Item({ item, group }: { item: MenuItem; group: MenuGroup }) {
  const meta = [item.origin, item.key && keyLabel(item.key), item.size].filter(Boolean).join(" · ");
  const cols = group.columns.length;
  return (
    <div className={cols ? "cmh-item has-cols" : "cmh-item"} style={{ "--cols": cols } as CSSProperties}>
      <div className="cmh-item-text">
        <h4>
          {item.name}
          {item.tags && <span className="cmh-tags">{item.tags.join(" · ")}</span>}
        </h4>
        {meta && <span className="cmh-fact">{meta}</span>}
        {item.note && <p>{item.note}</p>}
        {item.award && <p className="cmh-award">{item.award}</p>}
      </div>
      {group.columns.map((col, k) => (
        <span key={k} className="cmh-cell" data-l={col}>
          {item.cells?.[k] ?? ""}
        </span>
      ))}
    </div>
  );
}

function Group({ group }: { group: MenuGroup }) {
  const cols = group.columns.length;
  const headed = group.title || group.groupPrice || group.columns.some((c) => c);
  return (
    <div className="cmh-group">
      {headed && (
        <div className={cols ? "cmh-ghead has-cols" : "cmh-ghead"} style={{ "--cols": cols } as CSSProperties}>
          <h3>
            {group.title}
            {group.subtitle && <span> {group.subtitle}</span>}
          </h3>
          {group.columns.map((c, k) => (
            <span key={k} className="cmh-mono cmh-col">
              {k === 0 && group.columnNote && <span className="cmh-colnote">{group.columnNote}</span>}
              {c}
            </span>
          ))}
          {group.groupPrice && <span className="cmh-mono cmh-col">All £{group.groupPrice}</span>}
        </div>
      )}
      <div className={group.layout === "cards" ? "cmh-cards" : undefined}>
        {group.items.map((item) => (
          <Item key={item.name} item={item} group={group} />
        ))}
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <div className="cmh" data-screen-label="Menu">
      <header>
        <Dateline />
        <div className="cmh-topbar">
          <Link className="cmh-wordmark" href="/">
            Crescent Moon
            <MoonMark />
          </Link>
          <nav aria-label="Main">
            <Link href="/">Home</Link>
            <Link href="/#whats-on">What&apos;s On</Link>
            <Link href="/#book">Book a table</Link>
          </nav>
        </div>
        <h1 className="cmh-nameplate">Drinks Menu</h1>
        <div className="cmh-strap">
          <span className="cmh-fact">Wine · cocktails · spirits · beer</span>
          <p>
            {MENU_FACTS.wines} wines, {MENU_FACTS.cocktailCount} cocktails, spirits, beer and soft drinks,
            with food from the counter.
          </p>
          <nav aria-label="Menu downloads">
            <a href={PDF} target="_blank" rel="noopener">Printed menu (PDF) ↗</a>
          </nav>
        </div>
      </header>

      <nav className="cmh-contents" aria-label="On this menu">
        <span className="cmh-mono">On this menu</span>
        {MENU.map((s) => (
          <a key={s.id} className="cmh-row" href={`#${s.id}`}>
            <span className="cmh-row-title">{s.title}</span>
            <p>{CONTENTS[s.id]?.summary}</p>
            <span className="cmh-fact">{CONTENTS[s.id]?.fact}</span>
          </a>
        ))}
        <a className="cmh-row" href="#hire">
          <span className="cmh-row-title">The Lounge</span>
          <p>A private function room on the first floor.</p>
          <span className="cmh-fact">Private hire</span>
        </a>
      </nav>

      {MENU.map((s) => (
        <section key={s.id} className="cmh-sec" id={s.id}>
          <div className="cmh-side">
            <span className="cmh-mono">{CONTENTS[s.id]?.label ?? s.title}</span>
          </div>
          <div className="cmh-main">
            <h2>{s.title}</h2>
            {s.intro && <p className="cmh-body">{s.intro}</p>}
            {s.id === "wine" && (
              <dl className="cmh-guide">
                <div><dt className="cmh-mono">Sweetness</dt><dd>White, orange, rosé and sparkling: 1 driest to 5 sweetest</dd></div>
                <div><dt className="cmh-mono">Body</dt><dd>Red: A light-bodied to E full-bodied</dd></div>
                <div><dt className="cmh-mono">Tags</dt><dd>V vegetarian · VE vegan · ORG organic</dd></div>
              </dl>
            )}
            {s.groups.map((g, k) => (
              <Group key={k} group={g} />
            ))}
            {s.footnote && <p className="cmh-small">{s.footnote}</p>}
          </div>
        </section>
      ))}

      <section className="cmh-book" id="hire">
        <div className="cmh-sec">
          <div className="cmh-side"><span className="cmh-mono cmh-fact">Private hire</span></div>
          <div className="cmh-main">
            <h2>The Lounge</h2>
            <p className="cmh-body">
              Looking for a private function room? The Lounge is available to hire on the first floor.
              Enquire with the team for availability.
            </p>
            <p className="cmh-body">
              <a href={`mailto:${BOOKINGS_EMAIL}`}>{BOOKINGS_EMAIL}</a>
              <br />
              01206 525566
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* The Wine / Navy / Green switcher; here it recolours the Lounge band. */}
      <Script src="/legacy/theme-toggle.js" strategy="afterInteractive" />
    </div>
  );
}
