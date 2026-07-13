import type { Metadata } from "next";
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
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
