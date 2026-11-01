# CLAUDE.md — My Dutch Door

Project rules for Claude Code. Read this first, then `BUILD_BRIEF.md`.

## What this is
**My Dutch Door** (mydutchdoor.com, with mydutchdoor.nl redirecting to it) is a lead-generation website for non-EU expats, mainly US citizens, who want a mortgage to buy a home in the Netherlands.

- Tagline: *Your way into a Dutch home*
- The site **does not give mortgage advice** and is **not a lender or adviser**. It collects contact requests and passes them to one independent mortgage advisory partner.
- Language: plain, US-friendly English. Explain every Dutch term the first time it appears.
- Owner: Ben (solo founder). He also runs eerlijketaxatie.nl, an Astro site for appraisal leads. Reuse its patterns (stack, form handling, hosting, deploy) where sensible. Ask Ben for that repo if you need it.

## Stack
- Astro, static output, mobile-first. No heavy JS frameworks; use islands only where needed (the form).
- Form submission goes to a small serverless endpoint. Use the same setup as eerlijketaxatie.nl if available; otherwise propose one before building.
- Content (guides) lives in Astro content collections (Markdown/MDX), with frontmatter for author, reviewer, lastReviewed and sources.

## Hard rules (compliance — never break these)
1. **Never name the lead partner** anywhere on the site, in page source, meta tags, structured data or JS. Leads may go to a different company later. The recipient lives only in config/env (e.g. `LEAD_RECIPIENT_EMAIL`, `LEAD_WEBHOOK_URL`).
   - Exception: the **privacy policy** must name the current recipient(s) (GDPR). Keep that name in one config value that feeds only the privacy page.
2. **No advice language.** Never write "you qualify", "we recommend", "best lender for you", or rank or name lenders. Use "lenders typically…", "it depends on the lender", "an adviser can tell you how this applies to you".
3. **Disclaimer on every page** (footer): "We only connect you with an independent adviser. My Dutch Door is an introduction service. We do not give mortgage advice, we are not a lender and we are not a mortgage adviser…" (exact text in the design reference).
4. **Lead form step 1 = name, email, phone, consent. Nothing else.** Optional questions come only after submission, and they never gate the request.
   - Never ask for income figures, ID numbers, BSN or other sensitive data on the site.
5. **Consent checkbox**: unticked by default and required. Wording: "I agree that My Dutch Door shares my name, email and phone number with one mortgage advisory partner, so one of their advisers can contact me about my question. The partner is named in our privacy policy. I can withdraw this at any time."
6. **No invented facts.** No statistics, interest rates, prices, reviews, testimonials, logos or quotes that are not in the verified list below.
   - Anything unverified gets `<!-- VERIFY -->` in content and is listed in `VERIFY.md`.
7. **No pushy UI.** No exit-intent pop-ups, countdowns or fake urgency.
   - The cookie banner must be calm, with "Reject" as easy as "Accept". Prefer cookieless analytics so no banner is needed.
8. **"Independent"** is used for the adviser. Keep the wording as is; Ben has decided this.

## Verified facts (Oct 2026) — the only numbers allowed
- 78,700 US nationals lived in the Netherlands on 1 Jan 2025 (CBS), up from 60,200 five years earlier.
- Non-EU buyers need a non-temporary residence permit; lenders typically want roughly six months of living and working in NL.
- Banks typically count only 90% of non-euro income (converted to euros) when calculating the maximum mortgage.
- The expat tax-free allowance drops from 30% to 27% on 1 Jan 2027, with transitional rules for people who used the 30% ruling before 2024.
- FATCA policy differs per bank:
  - some require a US TIN or a certificate of loss of nationality (CLN);
  - others lend if the customer has a payment account;
  - some non-bank lenders are not subject to FATCA obligations.
- Maximum mortgage is up to 100% of purchase value in 2026.

## Design tokens (from the approved design)
| Token | Value | Use |
|---|---|---|
| `--ink` | `#13233A` | text, navy bands, footer |
| `--ink-2` | `#3E4C5E` | body copy secondary |
| `--muted` | `#5B6878` | captions, meta |
| `--line` | `#DCE2E8` | borders |
| `--field-border` | `#8A97A6` | input borders (3:1 contrast) |
| `--paper` | `#F3F5F7` | alternate section background |
| `--accent` | `#C2410C` | buttons, links (white text passes AA) |
| `--accent-logo` | `#EA580C` | logo door, decorative only |
| `--accent-soft` | `#FFF4EC` | highlight panels |
| `--accent-on-dark` | `#FDBA8C` | accents on navy |
| `--link` / hover | `#B33A0A` / `#8A2C07` | text links |
| `--error` | `#B42318` on `#FEF3F2` | form errors |
| `--success` | `#1F7A4D` on `#E3F2EA` | confirmation |

- **Fonts:** Bricolage Grotesque 600/700 for headings; Instrument Sans 400/500/600 for body. Self-host both; no Google Fonts call at runtime.
- **Radii:** 10px for inputs and buttons, 14–16px for cards, 999px for chips.
- **Container:** max-width 1200px, 32px gutters (16px on mobile).
- **Logo:** arched orange door with a white knob, plus the "My Dutch Door" wordmark in Bricolage 700. SVG source is in the design reference.
- **Imagery:** no stock photos. Use line drawings of canal houses (navy strokes, one orange door). SVGs are in the design reference.
- **Icons:** inline stroke SVG (1.75px). No emoji.

## Accessibility (definition of done)
- WCAG 2.2 AA: text contrast ≥ 4.5:1, touch targets ≥ 44px, visible focus ring (`3px solid #EA580C`).
- Real `<button>`, `<a>`, `<label>` and `<input>` elements; `<fieldset>`/`<legend>` for radio groups.
- Form errors:
  - an error summary at the top with anchor links to each field;
  - `aria-invalid` and `aria-describedby` on each invalid field;
  - focus moves to the summary on submit.
- Works without JS for reading; the form needs a graceful fallback message.

## Performance and SEO
- Lighthouse ≥ 95 on all four categories, mobile. LCP < 2.0s; total JS < 30 KB on content pages.
- One H1 per page; canonical URLs; `lang="en"`; XML sitemap; robots.txt.
- Structured data:
  - Organization and WebSite;
  - BreadcrumbList;
  - FAQPage, only where Q&A is visible on the page;
  - Article, with `author` and `reviewedBy`.
- Every guide shows author, reviewer (licensed mortgage adviser), "last reviewed" date and a sources list.

## Working style
- Ben is Dutch. Talk to him in Dutch; write all site content in English.
- Build in small, reviewable steps. Show the homepage before building the rest.
- Keep a `VERIFY.md` checklist of every placeholder and unverified claim.
