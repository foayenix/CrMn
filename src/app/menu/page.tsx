import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu — Crescent Moon",
  description: "Wines of character, spirits, cocktails and seasonal snacks at Crescent Moon Colchester.",
};

export default function MenuPage() {
  const whiteWines = [
    { name: "Viña Palomeras Navarra Blanco", origin: "Spain", body: "1", tags: "VE", desc: "Fresh, easy house white; pear drop and apple.", bottle: "27.50", glass: "4.95" },
    { name: "Sereno Catarratto Pinot Grigio", origin: "Italy", body: "2", tags: "V", desc: "Sicilian Pinot Grigio; tropical notes behind apple and lemon.", bottle: "29.95", glass: "5.50" },
    { name: "Viña Cerrada Rioja Blanco", origin: "Spain", body: "2", tags: "VE", desc: "Citrus, stone fruit and a touch of creaminess. SWA Gold.", bottle: "32.50", glass: "5.95" },
    { name: "3 Passo Bianco Chardonnay Fiano", origin: "Italy", body: "2", tags: "VE ORG", desc: "Star-bright organic blend; grapefruit and pineapple, long finish.", bottle: "37.50", glass: "6.95" },
    { name: "Foncastel Picpoul de Pinet", origin: "France", body: "2", tags: "", desc: "Zingy lemon zest with a slight sea-salt tang. Made for seafood.", bottle: "37.95", glass: "7.50" },
    { name: "Long White Cloud Sauvignon Blanc", origin: "New Zealand", body: "2", tags: "VE", desc: "Benchmark Marlborough; passionfruit, gooseberry, elderflower.", bottle: "37.50", glass: "7.95" },
    { name: "Teixadal Albariño Treixadura", origin: "Spain", body: "2", tags: "", desc: "Stone-fruit scented beauty from the shores of the Atlantic.", bottle: "37.50", glass: "7.95" },
    { name: "Villa Pani Gavi", origin: "Italy", body: "2", tags: "", desc: "From a fabulous producer. Intense, refined and peachy.", bottle: "39.95", glass: "8.25" },
    { name: "Pierre André Chablis", origin: "France", body: "1", tags: "", desc: "Dry, steely, super-crisp; granny smith and lemon zest.", bottle: "47.50", glass: "9.50" },
    { name: "Lacheteau Boisjoli Sancerre", origin: "France", body: "1", tags: "", desc: "Arguably the greatest expression of Sauvignon Blanc; floral and crisp.", bottle: "49.95", glass: "10.95" },
  ];

  const colorWines = [
    { name: "Sereno Catarratto Pinot Grigio Rosé", origin: "Italy", body: "2", tags: "V", desc: "Made in Sicily; strawberries-and-cream depth.", bottle: "29.95", glass: "5.50" },
    { name: "La Baume Rosé", origin: "France", body: "3", tags: "VE ORG", desc: "For lovers of elegant, crisp and dry rosé.", bottle: "39.95", glass: "7.95" },
    { name: "Mirada Rosé", origin: "Spain", body: "2", tags: "VE ORG", desc: "Ripe strawberries, rose petals, a fine streak of minerality.", bottle: "42.50", glass: "8.50" },
    { name: "Ultimate Côtes de Provence Rosé", origin: "France", body: "2", tags: "", desc: "Star-bright, dashing red fruits and subtle spice.", bottle: "49.95", glass: "10.95" },
    { name: "Domaine de la Baume Orange", origin: "France", body: "1", tags: "", desc: "The first type of wine ever made: skin-contact depth and texture.", bottle: "34.95", glass: "6.50" },
    { name: "Logan Clementine Pinot Gris Orange", origin: "Australia", body: "2", tags: "VE", desc: "Natural yeasts, two weeks skin-contact; red apple, fennel, cherry. Stunning.", bottle: "44.95", glass: "8.95" },
  ];

  const redWines = [
    { name: "Viña Palomeras Navarra Tinto", origin: "Spain", body: "C", tags: "VE", desc: "Lovely house Tempranillo, medium-bodied with soft fruit.", bottle: "29.95", glass: "5.50" },
    { name: "Patriarche Merlot", origin: "France", body: "B", tags: "VE", desc: "Super-soft; ripe plum, dark chocolate, black cherry.", bottle: "32.50", glass: "5.95" },
    { name: "Dega Montepulciano d'Abruzzo", origin: "Italy", body: "C", tags: "VE ORG", desc: "Fresh raspberry and plum with a little herb complexity.", bottle: "34.95", glass: "6.50" },
    { name: "Balauri Pinot Noir", origin: "Romania", body: "B", tags: "VE", desc: "Light, fresh, incredibly smooth; raspberry, strawberry, violet.", bottle: "34.95", glass: "6.50" },
    { name: "Descobre Douro Tinto", origin: "Portugal", body: "D", tags: "VE", desc: "Big, concentrated, lots of dark fruit. A bold beauty.", bottle: "37.50", glass: "6.95" },
    { name: "Progreso Malbec", origin: "Argentina", body: "D", tags: "VE", desc: "Full-bodied organic Malbec; summer fruits, black pepper.", bottle: "37.50", glass: "6.95" },
    { name: "Viña Cerrada Rioja Crianza", origin: "Spain", body: "C", tags: "VE", desc: "A year in oak, a year in bottle; vanilla and cedar. SWA Gold.", bottle: "39.95", glass: "8.25" },
    { name: "Doppio Primitivo di Manduria", origin: "Italy", body: "C", tags: "", desc: "A brooding beast; great big dollops of black fruit and sweet spice.", bottle: "39.95", glass: "8.25" },
    { name: "Monteci Valpolicella Ripasso Superiore", origin: "Italy", body: "D", tags: "ORG", desc: "Refermented on grape skins. Mad, bad and dangerous to know.", bottle: "49.95", glass: "10.95" },
  ];

  const sparkleWines = [
    { name: "Pirani Prosecco", origin: "Italy", body: "2", tags: "V", desc: "Fermented longer for a creamier texture and smaller bubbles. SWA Silver.", bottle: "34.95", glass: "10.95" },
    { name: "Sauvion Crémant de Loire Blanc", origin: "France", body: "1", tags: "VE ORG", desc: "Champagne method, drunk by people in the know.", bottle: "42.50", glass: "12.50" },
    { name: "Silverhand Estate Silver Reign Brut Rosé", origin: "England", body: "1", tags: "VE ORG", desc: "From the UK's largest organic vineyard, in Kent. What English wine does best.", bottle: "49.95", glass: "17.50" },
    { name: "Champagne Colin Alliance Brut Tradition", origin: "France", body: "1", tags: "", desc: "True growers Champagne. Stunning, complex, worth every penny.", bottle: "69.95", glass: "" },
    { name: "Taittinger Brut", origin: "France", body: "1", tags: "", desc: "White peach, blossom and vanilla; fresh yet complex, creamy texture.", bottle: "94.95", glass: "" },
    { name: "Laurent-Perrier Cuvée Rosé", origin: "France", body: "2", tags: "", desc: "Fresh raspberry and wild strawberry pirouetting across the palate.", bottle: "165.00", glass: "" },
  ];

  const cocktails = [
    "Amaretto Sour", "Bloody Mary", "Cosmopolitan", "Elderflower Collins",
    "Espresso Martini", "Kumquat Margarita", "Lychee Martini", "Mojito",
    "Negroni", "Old Fashioned", "Passionfruit Martini", "Strawberry Daiquiri"
  ];

  const spritzes = [
    { name: "Aperol Spritz", price: "12.50" },
    { name: "Hugo Spritz", price: "15.00" },
    { name: "Limoncello Spritz", price: "15.00" },
    { name: "Tequila Spritz", price: "15.00" },
    { name: "Campari Spritz", price: "15.00" }
  ];

  const spirits = {
    Rum: [
      { name: "Lambs Navy", price: "6.50" },
      { name: "Captain Morgan Spiced", price: "6.50" },
      { name: "Captain Morgan Dark", price: "6.50" },
      { name: "Bacardi", price: "6.50" },
      { name: "Sailor Jerry Spiced", price: "6.50" },
      { name: "Kraken Black Spiced Roast Coffee", price: "7.00" },
      { name: "Doorly's 3 Year Old", price: "7.00" },
      { name: "Las Olas Spiced", price: "8.00" },
      { name: "Bumbu Original", price: "8.00" },
    ],
    Gin: [
      { name: "Gordon's", price: "6.50" },
      { name: "Gordon's Pink", price: "6.50" },
      { name: "Bombay Sapphire", price: "7.50" },
      { name: "Adnams Copper House Dry", price: "7.50" },
      { name: "Adnams Copper House Pink", price: "7.50" },
      { name: "Hendrick's", price: "7.75" },
      { name: "Hendrick's Grand Cabaret", price: "7.75" },
      { name: "Hendrick's Chocolate Orange", price: "7.75" },
      { name: "Plymouth", price: "8.00" },
      { name: "Adnams First Rate Triple Malt", price: "9.00" },
    ],
    Vodka: [
      { name: "Smirnoff", price: "6.50" },
      { name: "Smirnoff Raspberry Crush", price: "7.00" },
      { name: "Fris", price: "6.50" },
      { name: "Haku", price: "8.00" },
      { name: "Grey Goose", price: "8.00" },
    ],
    Bourbon: [
      { name: "Jack Daniel's", price: "6.50" },
      { name: "Southern Comfort", price: "6.50" },
      { name: "Four Roses", price: "7.00" },
      { name: "Buffalo Trace", price: "7.75" },
      { name: "Maker's Mark", price: "7.75" },
    ],
    Whisky: [
      { name: "Famous Grouse", price: "6.50" },
      { name: "Isle of Jura 10 Year Old", price: "7.75" },
      { name: "Glenmorangie 12 Year Old", price: "7.75" },
      { name: "Monkey Shoulder", price: "7.75" },
      { name: "Jameson", price: "7.75" },
      { name: "Talisker Skye Single Malt", price: "9.00" },
      { name: "Laphroaig Islay Single Malt", price: "9.00" },
      { name: "Johnnie Walker Black Label", price: "9.00" },
      { name: "Bowmore 12 Year Single Malt", price: "9.00" },
    ]
  };

  const beers = {
    tap: [
      { name: "Cruzcampo", price: "6.75" },
      { name: "Camden Eazy IPA", price: "6.75" },
      { name: "Sale di Mare by Birra Moretti", price: "6.95" },
      { name: "Guinness", price: "6.95" }
    ],
    bottle: [
      { name: "Asahi Super Dry", price: "5.00" },
      { name: "Adnams Southwold", price: "6.95" },
      { name: "Noam", price: "6.95" },
      { name: "Aspall Suffolk Cyder", price: "6.95" },
      { name: "Old Mout Cider — four ways", price: "6.95" }
    ]
  };

  const lono = {
    free: [
      { name: "Lucky Saint 0.5%", price: "7.50" },
      { name: "Kopparberg Strawberry & Lime 0%", price: "7.50" },
      { name: "Guinness 0.0%", price: "7.50" },
      { name: "Adnams Ghost Ship 0%", price: "7.50" },
      { name: "Sipsmith FreeGlider 0% (25ml + mixer)", price: "6.50" }
    ],
    mocktails: [
      { name: "Bellini", price: "5.50" },
      { name: "Paloma", price: "5.50" },
      { name: "Moscow Mule", price: "6.00" },
      { name: "Mojito", price: "6.50" }
    ]
  };

  return (
    <div style={{ backgroundColor: "var(--bg-light)", color: "var(--text-dark)", minHeight: "100vh" }}>
      
      {/* ============ HEADER ============ */}
      <header
        className="section-dark"
        style={{
          padding: "clamp(40px, 6vw, 80px) clamp(20px, 5vw, 80px) clamp(60px, 8vw, 100px)",
          backgroundImage: "linear-gradient(rgba(13, 12, 12, 0.95), rgba(13, 12, 12, 0.98))",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          
          {/* Top navigation row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              borderBottom: "1px solid rgba(245, 243, 239, 0.1)",
              paddingBottom: "20px",
              marginBottom: "60px",
            }}
          >
            <Link href="/" style={{ color: "rgba(245, 243, 239, 0.7)", transition: "var(--transition-fast)" }}>
              &larr; Crescent Moon
            </Link>
            <Link href="/#book" style={{ color: "var(--accent-gold)", transition: "var(--transition-fast)" }}>
              Book a table
            </Link>
          </div>

          {/* Heading */}
          <div>
            <span className="section-tag" style={{ color: "var(--accent-gold)" }}>The Cellar &amp; Kitchen</span>
            <h1 style={{ fontSize: "clamp(52px, 8vw, 96px)", color: "#ffffff", lineHeight: "1", marginBottom: "24px" }}>
              The <span style={{ fontStyle: "italic" }}>Menu</span>
            </h1>
            <p style={{ color: "var(--text-muted-light)", fontSize: "16px", maxWidth: "64ch", lineHeight: "1.7" }}>
              White, Orange, Rosé &amp; Sparkling: <span style={{ color: "var(--accent-gold)" }}>1</span> driest — <span style={{ color: "var(--accent-gold)" }}>5</span> sweetest.
              Red: <span style={{ color: "var(--accent-gold)" }}>A</span> light-bodied — <span style={{ color: "var(--accent-gold)" }}>E</span> full-bodied. 
              <br />
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", opacity: 0.8 }} className="section-tag">
                V vegetarian · VE vegan · ORG organic. Wines also poured in 500ml and 250ml carafes.
              </span>
            </p>
          </div>

        </div>
      </header>

      {/* ============ STICKY MENU SHORTCUTS ============ */}
      <nav className="sticky-shortcuts">
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            gap: "24px",
            justifyContent: "space-between",
            fontFamily: "var(--font-mono)",
            fontSize: "11.5px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <a href="#white" style={{ fontWeight: 500 }}>White</a>
          <a href="#colour" style={{ fontWeight: 500 }}>Orange &amp; Rosé</a>
          <a href="#red" style={{ fontWeight: 500 }}>Red</a>
          <a href="#sparkle" style={{ fontWeight: 500 }}>Sparkling</a>
          <a href="#cocktails" style={{ fontWeight: 500 }}>Cocktails &amp; Spritz</a>
          <a href="#spirits" style={{ fontWeight: 500 }}>Spirits</a>
          <a href="#beer" style={{ fontWeight: 500 }}>Beer</a>
          <a href="#food" style={{ fontWeight: 500 }}>Food</a>
          <a href="#lounge" style={{ color: "var(--accent-green)", fontWeight: 600 }}>The Lounge</a>
        </div>
      </nav>

      {/* ============ MAIN MENU ============ */}
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "60px 20px 120px" }}>
        
        {/* 1. White Wines */}
        <section id="white" style={{ marginBottom: "100px", scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--text-dark)", paddingBottom: "12px", marginBottom: "30px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 400 }}>Something White</h2>
            <div style={{ display: "flex", gap: "40px", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.5 }} className="hide-on-mobile">
              <span>Bottle</span>
              <span style={{ minWidth: "48px", textAlign: "right" }}>125ml</span>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {whiteWines.map((w, idx) => (
              <div key={idx} className="menu-item-row">
                <div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", fontWeight: 400, fontStyle: "italic" }}>
                    {w.name}
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--text-muted-dark)", marginTop: "4px" }}>
                    {w.origin} &middot; Body {w.body} {w.tags && `&middot; ${w.tags}`} &mdash; {w.desc}
                  </p>
                </div>
                <div className="menu-item-prices">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "14.5px", fontWeight: 500 }}><span className="show-on-mobile-inline" style={{ fontSize: "10px", color: "var(--text-muted-dark)" }}>Btl &nbsp;</span>{w.bottle}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "14.5px", fontWeight: 500, color: "var(--accent-gold)", minWidth: "48px", textAlign: "right" }}>
                    <span className="show-on-mobile-inline" style={{ fontSize: "10px", color: "var(--text-muted-dark)" }}>Gls &nbsp;</span>{w.glass || "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Orange & Rose */}
        <section id="colour" style={{ marginBottom: "100px", scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--text-dark)", paddingBottom: "12px", marginBottom: "30px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 400 }}>A Touch of Colour</h2>
            <div style={{ display: "flex", gap: "40px", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.5 }} className="hide-on-mobile">
              <span>Bottle</span>
              <span style={{ minWidth: "48px", textAlign: "right" }}>125ml</span>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {colorWines.map((w, idx) => (
              <div key={idx} className="menu-item-row">
                <div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", fontWeight: 400, fontStyle: "italic" }}>
                    {w.name}
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--text-muted-dark)", marginTop: "4px" }}>
                    {w.origin} &middot; Body {w.body} {w.tags && `&middot; ${w.tags}`} &mdash; {w.desc}
                  </p>
                </div>
                <div className="menu-item-prices">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "14.5px", fontWeight: 500 }}><span className="show-on-mobile-inline" style={{ fontSize: "10px", color: "var(--text-muted-dark)" }}>Btl &nbsp;</span>{w.bottle}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "14.5px", fontWeight: 500, color: "var(--accent-gold)", minWidth: "48px", textAlign: "right" }}>
                    <span className="show-on-mobile-inline" style={{ fontSize: "10px", color: "var(--text-muted-dark)" }}>Gls &nbsp;</span>{w.glass || "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Red Wines */}
        <section id="red" style={{ marginBottom: "100px", scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--text-dark)", paddingBottom: "12px", marginBottom: "30px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 400 }}>Something Red</h2>
            <div style={{ display: "flex", gap: "40px", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.5 }} className="hide-on-mobile">
              <span>Bottle</span>
              <span style={{ minWidth: "48px", textAlign: "right" }}>125ml</span>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {redWines.map((w, idx) => (
              <div key={idx} className="menu-item-row">
                <div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", fontWeight: 400, fontStyle: "italic" }}>
                    {w.name}
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--text-muted-dark)", marginTop: "4px" }}>
                    {w.origin} &middot; Body {w.body} {w.tags && `&middot; ${w.tags}`} &mdash; {w.desc}
                  </p>
                </div>
                <div className="menu-item-prices">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "14.5px", fontWeight: 500 }}><span className="show-on-mobile-inline" style={{ fontSize: "10px", color: "var(--text-muted-dark)" }}>Btl &nbsp;</span>{w.bottle}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "14.5px", fontWeight: 500, color: "var(--accent-gold)", minWidth: "48px", textAlign: "right" }}>
                    <span className="show-on-mobile-inline" style={{ fontSize: "10px", color: "var(--text-muted-dark)" }}>Gls &nbsp;</span>{w.glass || "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Sparkling Wines */}
        <section id="sparkle" style={{ marginBottom: "100px", scrollMarginTop: "140px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--text-dark)", paddingBottom: "12px", marginBottom: "30px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 400 }}>Sparkle or Fizz</h2>
            <div style={{ display: "flex", gap: "40px", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.5 }} className="hide-on-mobile">
              <span>Bottle</span>
              <span style={{ minWidth: "48px", textAlign: "right" }}>Glass</span>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {sparkleWines.map((w, idx) => (
              <div key={idx} className="menu-item-row">
                <div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", fontWeight: 400, fontStyle: "italic" }}>
                    {w.name}
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--text-muted-dark)", marginTop: "4px" }}>
                    {w.origin} &middot; Body {w.body} {w.tags && `&middot; ${w.tags}`} &mdash; {w.desc}
                  </p>
                </div>
                <div className="menu-item-prices">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "14.5px", fontWeight: 500 }}><span className="show-on-mobile-inline" style={{ fontSize: "10px", color: "var(--text-muted-dark)" }}>Btl &nbsp;</span>{w.bottle}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "14.5px", fontWeight: 500, color: "var(--accent-gold)", minWidth: "48px", textAlign: "right" }}>
                    <span className="show-on-mobile-inline" style={{ fontSize: "10px", color: "var(--text-muted-dark)" }}>Gls &nbsp;</span>{w.glass || "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Cocktails & Spritz */}
        <section id="cocktails" style={{ marginBottom: "100px", scrollMarginTop: "140px" }}>
          <div style={{ borderBottom: "1px solid var(--text-dark)", paddingBottom: "12px", marginBottom: "35px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 400 }}>Cocktails &amp; Spritz</h2>
            <p style={{ fontSize: "14.5px", color: "var(--text-muted-dark)", marginTop: "8px" }}>
              House cocktails &pound;11.95 &mdash; mixology by Edmunds, Bury St Edmunds.
            </p>
          </div>

          {/* Cocktails list grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px 40px", marginBottom: "50px" }}>
            {cocktails.map((c, idx) => (
              <div
                key={idx}
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "21px",
                  fontStyle: "italic",
                  borderBottom: "1px solid rgba(18, 18, 18, 0.08)",
                  paddingBottom: "10px",
                }}
              >
                {c}
              </div>
            ))}
          </div>

          {/* Spritzes */}
          <h3 style={{ fontSize: "20px", fontFamily: "var(--font-mono)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent-gold)", marginBottom: "20px" }}>
            Spritz Classics
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {spritzes.map((s, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid rgba(18, 18, 18, 0.08)", paddingBottom: "8px" }}>
                <span style={{ fontFamily: "var(--font-serif)", fontSize: "22px", fontStyle: "italic" }}>{s.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "14.5px" }}>{s.price}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Spirits */}
        <section id="spirits" style={{ marginBottom: "100px", scrollMarginTop: "140px" }}>
          <div style={{ borderBottom: "1px solid var(--text-dark)", paddingBottom: "12px", marginBottom: "35px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 400 }}>Spirits</h2>
            <p style={{ fontSize: "14.5px", color: "var(--text-muted-dark)", marginTop: "8px" }}>
              25ml pours, mixer included. Doubles available.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "50px 40px" }}>
            {Object.entries(spirits).map(([category, items]) => (
              <div key={category}>
                <h3
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--accent-green)",
                    borderBottom: "1px solid rgba(18, 18, 18, 0.15)",
                    paddingBottom: "8px",
                    marginBottom: "16px",
                  }}
                >
                  {category}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {items.map((i, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                      <span>{i.name}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>{i.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Brandy and others */}
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--accent-green)",
                  borderBottom: "1px solid rgba(18, 18, 18, 0.15)",
                  paddingBottom: "8px",
                  marginBottom: "16px",
                }}
              >
                And the rest
              </h3>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "var(--text-muted-dark)" }}>
                Brandy &amp; Cognac &mdash; Three Barrels to Rémy Martin XO. 
                Tequila &mdash; Tequila Rose to Don Julio 1942. 
                Sambuca, Aperol, Campari, Limoncello, Cointreau, Baileys, Disaronno and more. Ask at the bar.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Beer */}
        <section id="beer" style={{ marginBottom: "100px", scrollMarginTop: "140px" }}>
          <div style={{ borderBottom: "1px solid var(--text-dark)", paddingBottom: "12px", marginBottom: "35px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 400 }}>Draught &amp; Bottles</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent-gold)", borderBottom: "1px solid rgba(18, 18, 18, 0.15)", paddingBottom: "8px", marginBottom: "16px" }}>
                On Tap &middot; Pint
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {beers.tap.map((b, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                    <span>{b.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>{b.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent-gold)", borderBottom: "1px solid rgba(18, 18, 18, 0.15)", paddingBottom: "8px", marginBottom: "16px" }}>
                Bottles &amp; Cans
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {beers.bottle.map((b, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                    <span>{b.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>{b.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 8. Low, No & Softs */}
        <section id="lono" style={{ marginBottom: "100px", scrollMarginTop: "140px" }}>
          <div style={{ borderBottom: "1px solid var(--text-dark)", paddingBottom: "12px", marginBottom: "35px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 400 }}>Low, No &amp; Soft</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent-green)", borderBottom: "1px solid rgba(18, 18, 18, 0.15)", paddingBottom: "8px", marginBottom: "16px" }}>
                Alcohol-Free
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {lono.free.map((l, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                    <span>{l.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>{l.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent-green)", borderBottom: "1px solid rgba(18, 18, 18, 0.15)", paddingBottom: "8px", marginBottom: "16px" }}>
                Mocktails
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {lono.mocktails.map((l, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                    <span>{l.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>{l.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent-green)", borderBottom: "1px solid rgba(18, 18, 18, 0.15)", paddingBottom: "8px", marginBottom: "16px" }}>
                Softs &amp; Mixers
              </h3>
              <p style={{ fontSize: "14.5px", lineHeight: "1.8", color: "var(--text-muted-dark)" }}>
                Coke / Diet Coke 3.00 &bull; Frobishers juices from 4.50 &bull; Fever-Tree tonics, ginger ale &amp; lemonade 3.00 &bull; Fentimans ginger beer 4.50 &bull; Marlish water 1.75 &bull; Draught Coke &amp; lemonade &mdash; half 2.50, pint 4.00
              </p>
            </div>
          </div>
        </section>

        {/* 9. Food */}
        <section id="food" style={{ marginBottom: "100px", scrollMarginTop: "140px" }}>
          <div style={{ borderBottom: "1px solid var(--text-dark)", paddingBottom: "12px", marginBottom: "35px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 400 }}>Food &amp; Snacks</h2>
            <p style={{ fontSize: "14.5px", color: "var(--text-muted-dark)", marginTop: "8px" }}>
              Locally supplied, changing seasonally. Ask the team for today's specials.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px 40px", marginBottom: "30px" }}>
            <div style={{ borderBottom: "1px solid rgba(18, 18, 18, 0.08)", padding: "12px 0", fontFamily: "var(--font-serif)", fontSize: "21px", fontStyle: "italic" }}>Cheese board</div>
            <div style={{ borderBottom: "1px solid rgba(18, 18, 18, 0.08)", padding: "12px 0", fontFamily: "var(--font-serif)", fontSize: "21px", fontStyle: "italic" }}>Charcuterie board</div>
            <div style={{ borderBottom: "1px solid rgba(18, 18, 18, 0.08)", padding: "12px 0", fontFamily: "var(--font-serif)", fontSize: "21px", fontStyle: "italic" }}>Giant pitted olives</div>
            <div style={{ borderBottom: "1px solid rgba(18, 18, 18, 0.08)", padding: "12px 0", fontFamily: "var(--font-serif)", fontSize: "21px", fontStyle: "italic" }}>Smoked almonds</div>
            <div style={{ borderBottom: "1px solid rgba(18, 18, 18, 0.08)", padding: "12px 0", fontFamily: "var(--font-serif)", fontSize: "21px", fontStyle: "italic" }}>Dingley Dell beer sticks</div>
            <div style={{ borderBottom: "1px solid rgba(18, 18, 18, 0.08)", padding: "12px 0", fontFamily: "var(--font-serif)", fontSize: "21px", fontStyle: "italic" }}>Sausage rolls (Weekends)</div>
            <div style={{ borderBottom: "1px solid rgba(18, 18, 18, 0.08)", padding: "12px 0", fontFamily: "var(--font-serif)", fontSize: "21px", fontStyle: "italic" }}>Toasties (Seasonal selection)</div>
            <div style={{ borderBottom: "1px solid rgba(18, 18, 18, 0.08)", padding: "12px 0", fontFamily: "var(--font-serif)", fontSize: "21px", fontStyle: "italic" }}>Hand-cooked crisps</div>
          </div>
          <p style={{ fontSize: "14.5px", color: "var(--text-muted-dark)" }}>
            Plus coffee and specialty teas. Oat milk and 1883 syrups available on request.
          </p>
        </section>

        {/* 10. The Lounge */}
        <section
          id="lounge"
          className="section-dark"
          style={{
            padding: "50px",
            textAlign: "center",
            backgroundImage: "linear-gradient(rgba(13, 12, 12, 0.95), rgba(13, 12, 12, 0.98))",
            scrollMarginTop: "140px",
          }}
        >
          <span className="section-tag" style={{ color: "var(--accent-gold)" }}>Private Bookings</span>
          <h2 style={{ fontSize: "40px", color: "#ffffff", marginBottom: "16px" }}>The Lounge</h2>
          <p style={{ color: "var(--text-muted-light)", fontSize: "15px", maxWidth: "44ch", margin: "0 auto 28px", lineHeight: "1.7" }}>
            The first floor, all yours. The space holds up to 20 guests for private tastings, intimate events, or special gatherings.
          </p>
          <a href="mailto:bookings@crescentmoonwinebar.co.uk" className="luxury-btn">
            Bookings Enquiry &rarr;
          </a>
        </section>

        {/* Back Link */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "80px" }}>
          <Link href="/" className="editorial-link">
            &larr; Back to Crescent Moon Home
          </Link>
        </div>

      </main>
      
    </div>
  );
}
