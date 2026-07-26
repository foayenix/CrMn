import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crescent Moon — Wine Bar, Colchester",
  description:
    "A wine bar on Crouch Street, Colchester. English cheese & charcuterie, a list that knows where it is, and a quiet room to linger in.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const plausibleUrl = process.env.NEXT_PUBLIC_PLAUSIBLE_URL;
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Same families/weights the original static site loaded. Hanken Grotesk
            is the body face and Cormorant 300 the display weight — omitting
            either makes the whole page fall back to browser defaults. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;1,400&family=Hanken+Grotesk:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        {/* Self-hosted Plausible tracking — only when configured. */}
        {plausibleUrl && plausibleDomain && (
          <Script
            defer
            data-domain={plausibleDomain}
            src={`${plausibleUrl.replace(/\/$/, "")}/js/script.js`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
