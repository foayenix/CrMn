// ESLint 9 flat config.
//
// `next lint` is deprecated in Next 15 and gone in Next 16, and with no config
// present it dropped into an interactive setup prompt and exited 1 — so the
// repo's `lint` script could never run unattended, which is exactly where a
// linter earns its keep. This replaces it with the ESLint CLI directly.
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    // Build output, and the two trees that are not ours to lint: `reference/`
    // holds the original design export the site was generated from (tsconfig
    // excludes it for the same reason), and `public/` holds plain browser
    // scripts — a service worker and a theme toggle — that never went through
    // the bundler and do not answer to Next's rules.
    ignores: [".next/**", "next-env.d.ts", "reference/**", "public/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default config;
