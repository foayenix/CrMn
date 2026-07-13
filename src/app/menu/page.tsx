import { MENU_BODY } from "@/lib/menu-template";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu — Crescent Moon",
};

export default function MenuPage() {
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: MENU_BODY }} />
      <Script src="/legacy/theme-toggle.js" strategy="afterInteractive" />
    </div>
  );
}
