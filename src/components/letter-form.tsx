"use client";

// The footer's "occasional letter" sign-up. It does not send anywhere yet: there
// is no newsletter model or provider (docs/ROADMAP.md, "Newsletter form cannot
// submit"). Submission is blocked here, as it was in the old static markup, so
// the page never reloads with the address in the query string.
export function LetterForm() {
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <input type="email" placeholder="you@email" aria-label="Email address" />
      <button type="submit">Join</button>
    </form>
  );
}
