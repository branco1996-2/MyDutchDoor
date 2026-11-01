# VERIFY: placeholders and unverified claims

Marked `<!-- VERIFY -->` or `.verify` in the site. Update as items are resolved.

## Homepage (step 2)
- [ ] "within one business day" partner response time (`site.responseTime`, how-it-works step 2)
- [ ] KvK number (footer, `site.kvk`)
- [ ] "Last site review" date (footer, `site.lastSiteReview`)
- [ ] Guide cards: reviewer name `[adviser name]` and review date `[date]`
- [ ] FAQ answers still to write (hidden until filled): cost, what happens to my details, residence permit, non-American
- [ ] "Reviewed by a licensed mortgage adviser" (guides section intro) is only true once a reviewer is confirmed
- [ ] "The advisers work nationwide" (trust strip) confirm with partner
- [ ] Trust strip "Never sold, never shared further": confirm with partner contract / lawyer

## Legal / lawyer
- [ ] Consent wording, disclaimer text, retention period
- [ ] Whether passing leads counts as mortgage intermediation under the Wft
- [ ] Whether "independent" may be used for the partner
- [ ] Privacy contact address (privacy@mydutchdoor.com?)
- [ ] Partner name in `privacyRecipient` (privacy page only)

## Sources / content
- [ ] Source URLs: CBS, Belastingdienst, 2026 lending norms, lender FATCA policies
- [ ] Purchase costs usually come from savings; documents checklist
- [ ] How lenders count the expat-ruling allowance; exchange rate banks use

## Other
- [ ] Trademark check "My Dutch Door" (BOIP, EUIPO, USPTO); register mydutchdoor.com / .nl
- [ ] Hosting: Vimexx domain/folder, SMTP mailbox, Plausible site, lead recipient

## Added with the full build (steps 3 to 8)
- [ ] Guide pillar: author name, reviewer name and credentials, "last reviewed" date (frontmatter `author`, `reviewer`, `lastReviewed`; Article schema gets `reviewedBy` automatically once set)
- [ ] Pillar guide sources: exact URLs for CBS, Belastingdienst, 2026 lending norms, lender FATCA policies
- [ ] Pillar guide: per-lender overview; exchange rate banks use; how lenders count the expat allowance; "purchase costs come from savings"; documents checklist
- [ ] Pillar FAQ: answers missing for 3 questions (hidden until written)
- [ ] The four stub guides, For advisers and Contact are noindex and out of the sitemap; remove from `astro.config.mjs` sitemap filter and drop `status: stub` when written
- [ ] About page: founder name and company details
- [ ] Privacy page: partner name (`privacyRecipient` in `src/config/site.ts`), processor list, retention period, privacy address
- [ ] Cookie page: confirm the analytics tool (Plausible, cookieless) and set `PUBLIC_PLAUSIBLE_DOMAIN`
- [ ] Confirmation email: wording and response time (`RESPONSE_TIME` in config; default "within one business day")
- [ ] Footer links to /contact/ which is still a stub
- [ ] Lead retention: `lead-data/` (outside `public_html`) keeps leads, consent log and mail log until deleted; add a cleanup job once the lawyer gives the retention period
- [ ] Google Search Console for mydutchdoor.com; trademark and domain registration (.com and .nl)

## Deploy checklist (Vimexx)
- GitHub secrets: VIMEXX_FTP_SERVER / USERNAME / PASSWORD, MDD_LEAD_RECIPIENT_EMAIL, MDD_LEAD_WEBHOOK_URL (optional), MDD_FALLBACK_EMAIL, MDD_PARTNER_NAME, MDD_SMTP_PASS, MDD_TOKEN_SECRET; repo variable PLAUSIBLE_DOMAIN
- Mailbox noreply@mydutchdoor.com on Vimexx; confirm SMTP host and STARTTLS port 587
- Confirm `/domains/mydutchdoor.com/public_html/` is the right path and that `lead-data/` lands outside it
- Verify the Vimexx PHP version (>= 8.1) and that `.htaccess` rewrites work
