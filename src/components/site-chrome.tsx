import { LetterForm } from "@/components/letter-form";

export const INSTAGRAM = "https://www.instagram.com/crescentmoonbar";

// The strip across the top of every public page.
export function Dateline() {
  return (
    <div className="cmh-dateline cmh-mono">
      <span>Wine bar · Est. April 2025</span>
      <span>67 Crouch St, Colchester</span>
      <span>Wed–Sat 12pm–12am · Sun 12–6pm</span>
    </div>
  );
}

export function MoonMark() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M 52 8 A 42 42 0 1 0 52 92 A 31 42 0 1 1 52 8 Z" fill="var(--cmh-green)" />
    </svg>
  );
}

export function SiteFooter() {
  return (
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
  );
}
