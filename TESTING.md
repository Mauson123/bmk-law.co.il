# Testing Strategy — bmk-law.co.il

This document defines the testing baseline for the bmk-law.co.il website
before any production code is written. Once code lands, every PR should be
measured against the targets and checklists below.

## Goals

A law-firm site has three non-negotiables that drive its test plan:

1. **Trust** — broken forms, typos in practice-area names, or stale
   contact info erode credibility instantly.
2. **Accessibility** — Israeli Equal Rights for Persons with Disabilities
   regulations (and WCAG 2.1 AA more broadly) make a11y a legal as well
   as an ethical requirement.
3. **Discoverability** — most clients arrive via search. SEO regressions
   are silent revenue leaks.

Tests exist to defend those three properties on every change.

## Tooling

| Layer            | Tool                          | Why                                                  |
| ---------------- | ----------------------------- | ---------------------------------------------------- |
| Unit             | Vitest                        | Fast, ESM-native, works with Astro/Next/Vite.        |
| Component        | Vitest + Testing Library      | DOM-level assertions without a full browser.         |
| End-to-end       | Playwright                    | Real-browser flows, RTL/Hebrew rendering, mobile.    |
| Accessibility    | `@axe-core/playwright`        | WCAG checks run as part of e2e.                      |
| Visual regression| Playwright screenshots        | Catches RTL/layout regressions, especially on forms. |
| Link checking    | `lychee` (CI only)            | Stale links to court rulings or partner sites.       |
| SEO/meta         | Playwright + custom matchers  | Verifies `<title>`, OG, JSON-LD per page.            |
| Coverage         | `c8` (or `vitest --coverage`) | Reported to PRs via GitHub Actions.                  |

## Coverage Targets

Coverage is a floor, not a goal. Treat the numbers below as gates that
fail CI when missed; raise them once met.

- Lines / statements: **80%**
- Branches: **75%**
- Functions: **80%**
- Critical paths (see below): **100%**

### Critical paths (must be 100% covered)

- Contact form submission — happy path, validation errors, server error,
  rate-limit, spam/honeypot.
- Locale switching (Hebrew ↔ English) and RTL/LTR direction propagation.
- Sitemap and `robots.txt` generation.
- 404 and 500 pages render and are indexable as `noindex`.

## What to Test, By Surface

### 1. Contact / intake forms

- Required fields reject empty submission with localized error text.
- Email and phone fields validate format (Israeli phone formats:
  `05X-XXXXXXX`, `+9725XXXXXXXX`).
- CSRF / honeypot field rejects bot submissions.
- Successful submission shows confirmation and clears the form.
- Server failure surfaces a non-technical error message, not a stack
  trace.
- Submitted data is **not** echoed back unescaped (XSS regression test).

### 2. Practice-area pages

- Each practice area (e.g. Corporate, Litigation, Family, Real Estate)
  renders with:
  - A unique `<title>` and meta description.
  - `<h1>` matching the practice area name.
  - JSON-LD `LegalService` schema with firm name, address, and
    `areaServed`.
- Snapshot test on the rendered markdown/MDX content prevents accidental
  deletion of disclaimers.

### 3. Accessibility (WCAG 2.1 AA)

Run axe on every page template, not just the homepage.

- No `color-contrast` violations.
- Every `<img>` has `alt` (or `alt=""` if decorative).
- Form inputs have associated `<label>`s.
- Focus order is logical in both RTL and LTR.
- `lang` attribute is set and matches the document language.
- Skip-to-content link is present and reachable by keyboard.

### 4. SEO

- `<title>` ≤ 60 chars, meta description ≤ 160 chars, both unique per
  route.
- Canonical URL points to the production host.
- OpenGraph and Twitter card tags present on shareable pages.
- `sitemap.xml` includes every published page and excludes drafts.
- `robots.txt` allows indexing on production, disallows on preview
  deploys.

### 5. Internationalization

- Hebrew pages render with `dir="rtl"` and `lang="he"`.
- No hard-coded English strings leak into the Hebrew UI (assert via a
  test that scans rendered DOM for ASCII-only user-facing text in
  Hebrew routes).
- Date and currency formatting uses the locale (`Intl.DateTimeFormat`,
  `Intl.NumberFormat`).

### 6. Performance budgets (smoke tests in CI)

- Lighthouse CI thresholds: Performance ≥ 90, Accessibility ≥ 95,
  Best Practices ≥ 95, SEO ≥ 95 on mobile.
- Largest Contentful Paint < 2.5s on a throttled 4G profile.

### 7. Security smoke tests

- Security headers present: `Content-Security-Policy`,
  `Strict-Transport-Security`, `X-Content-Type-Options`,
  `Referrer-Policy`.
- No secrets in client bundles (grep for `process.env.*SECRET` in
  build output as a CI step).

## CI Wiring

GitHub Actions workflow expectations once code exists:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint` and `pnpm typecheck`
3. `pnpm test --coverage` — fails on coverage regression.
4. `pnpm exec playwright test` — runs e2e + a11y against a built
   preview.
5. Lighthouse CI against the preview URL.
6. Upload coverage report as a PR comment.

## Open Questions

These should be answered before implementation begins:

- Which CMS (if any) backs the content? That decides whether content
  tests live in the repo or in a CMS-side schema.
- Is there a client portal / authenticated area? If yes, auth flows
  become a critical-path surface.
- Will the contact form email, write to a database, or hit a CRM
  (e.g. HubSpot)? The integration boundary needs a contract test.
