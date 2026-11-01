# Build brief — My Dutch Door v1

Read `CLAUDE.md` first: its compliance rules override everything here.

## 1. Scope of v1
**Build these:**
- homepage;
- one full guide, "Can Americans get a mortgage in the Netherlands?";
- the lead form flow: get-in-touch, then error states, then the thank-you page with optional questions;
- How it works and About;
- legal pages: privacy, cookies, disclaimer.

**Stub only** (page exists, short placeholder copy, noindex until written):
- the other four guides;
- For advisers;
- Contact.

**Out of scope for v1:**
- EU-expat content;
- city or region pages;
- Dutch-language version;
- blog;
- reviews or testimonials.

## 2. Sitemap
| URL | Page | Status v1 |
|---|---|---|
| `/` | Homepage | build |
| `/get-in-touch/` | Lead form, step 1 | build |
| `/get-in-touch/thank-you/` | Thank-you + optional step 2 | build (noindex) |
| `/how-it-works/` | How it works | build |
| `/about/` | About My Dutch Door | build |
| `/guides/` | Guides index | build |
| `/guides/can-americans-get-a-mortgage-in-the-netherlands/` | Pillar guide | build |
| `/guides/fatca-tin-cln-dutch-lenders/` | FATCA, TIN and CLN | stub |
| `/guides/mortgage-on-usd-income/` | Non-euro income | stub |
| `/guides/expat-ruling-mortgage/` | Expat ruling 30% → 27% | stub |
| `/guides/buying-a-home-in-the-netherlands/` | Step-by-step buying guide | stub |
| `/for-advisers/` | B2B page | stub |
| `/privacy/` `/cookies/` `/disclaimer/` | Legal | build (text: lawyer) |

**Main nav:** Guides · For US citizens (goes to the pillar guide) · How it works · About · For advisers · [Request a call back].

**Footer:**
- Guides, Company and Legal columns;
- the disclaimer box;
- © line with the KvK number placeholder.

## 3. Pages (follow the design reference artboards)
### Homepage (`Main.dc.html`, `Home-Mobile.dc.html`)
Sections in this order:
1. Header.
2. Hero: eyebrow, H1 "A Dutch mortgage, explained in plain English.", intro line, three audience chips, link to the pillar guide, and the inline form card on the right (stacks under the copy on mobile).
3. Canal-house line illustration.
4. Trust strip with four items.
5. "Your situation, explained": four cards linking to guides.
6. "How it works": three steps.
7. US band: navy, with the CBS 78,700 stat and its source.
8. Guides: three cards with mini canal-house drawings.
9. FAQ: five questions; answers are TODO later — keep the `<details>` but hide items without an answer.
10. CTA band.
11. Footer.

### Pillar guide (`Article-Desktop.dc.html`, `Article-Mobile.dc.html`)
**Page structure:**
- breadcrumb, category chip, H1, dek;
- byline: author, reviewer (licensed mortgage adviser), last-reviewed date;
- a "The short answer" box;
- the H2 sections (copy is final in the design reference): who it's for, permit, FATCA with table, USD income with worked example, expat ruling, how much you can borrow, what to have ready;
- FAQ, then sources.

**Layout:**
- Desktop has a right sidebar with a table of contents (highlight the current section on scroll) and a CTA card.
- Mobile replaces the sidebar with a collapsible "On this page" box.
- A mid-article navy CTA band.

### Lead form (`Form-Step1`, `Form-Error`, `Form-ThankYou`)
**Step 1 fields:**
- Full name;
- Email;
- Phone: country-code select, default +31, plus the number;
- Consent checkbox (required, unticked).

**Validation**, on submit and on blur after the first submit. Error copy is in the design reference:
- name: 2+ characters;
- email: valid format with a domain;
- phone: E.164-valid for the chosen country (use `libphonenumber-js` min build);
- consent: must be ticked.

**Spam protection:** honeypot field, a time-to-submit check of at least 3s, and server-side rate limiting. No CAPTCHA puzzle.

**On success:**
1. POST to the endpoint.
2. The endpoint sends the lead to `LEAD_RECIPIENT_EMAIL` (and/or `LEAD_WEBHOOK_URL`).
3. It sends the visitor a confirmation email (outline below).
4. Redirect to `/get-in-touch/thank-you/` with a one-time token so step 2 can be linked to the lead.

**Thank-you page:**
- confirmation and a "What happens next" list;
- optional step 2, all radio questions:
  - US citizen? (Yes / No / Dual US and Dutch)
  - Currency paid in? (Euro / US dollar / Another / A mix)
  - On the expat ruling? (Yes / No / Not sure)
  - When buying? (Within 3 months / 3–12 months / Just exploring)
- "Save my answers" sends the answers to the same recipient as an update to the lead;
- "Skip" is always available;
- a line on how to withdraw consent.

**Store** leads only as long as needed (retention period: VERIFY with lawyer). Log consent with timestamp, consent-text version and IP hash.

### Confirmation email (outline)
- Subject: "Your request at My Dutch Door".
- Body:
  - what was shared and with whom: **name the partner here** (GDPR transparency);
  - what happens next and expected response time (VERIFY);
  - how to withdraw consent or delete data;
  - the disclaimer.

## 4. Analytics
- Use cookieless analytics (Plausible or similar; match eerlijketaxatie.nl if it already has one).
- Conversion events:
  - `form_start`
  - `form_error` (with field)
  - `lead_submitted`
  - `step2_saved`
  - `step2_skipped`
- Lead quality is tracked with the partner (outside the site): add a lead ID to each lead so outcomes can be matched later.
- Set up Google Search Console for mydutchdoor.com.

## 5. Build order
1. Astro project scaffold, design tokens, fonts, base layout (header, footer, disclaimer).
2. Homepage, desktop and mobile. **Stop and show Ben.**
3. Lead form, endpoint, error states, thank-you page, confirmation email. Test end-to-end with a test recipient.
4. Pillar guide plus the content collection schema (author, reviewer, lastReviewed, sources).
5. How it works, About, Guides index, stubs.
6. Legal pages (placeholders until the lawyer delivers), cookie approach.
7. SEO: meta, sitemap, robots, structured data, redirect .nl to .com.
8. QA: Lighthouse, accessibility (axe), form edge cases, mobile check. Write `VERIFY.md`.

## 6. Open items (put these in VERIFY.md)
- Partner response time ("within one business day").
- Reviewer name and credentials; author name.
- Source URLs: CBS, Belastingdienst, 2026 lending norms, lender FATCA policies.
- "Purchase costs usually come from savings" and the documents checklist.
- How lenders count the expat-ruling allowance; which exchange rate banks use.
- KvK number; privacy contact address (privacy@mydutchdoor.com?).
- **Lawyer:**
  - consent wording;
  - disclaimer;
  - retention period;
  - whether passing leads counts as mortgage intermediation under the Wft;
  - whether "independent" may be used for the partner.
- Trademark check for "My Dutch Door" at BOIP, EUIPO and USPTO; register mydutchdoor.com and mydutchdoor.nl.

## 7. Design reference
The `design-reference/` folder contains the approved artboards as `.dc.html` files. They were made in a design canvas and depend on its runtime, so they will not render perfectly in a plain browser. Use them as the **source for copy, structure, inline styles, SVGs and spacing**, not as code to copy one-to-one.
