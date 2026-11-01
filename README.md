# My Dutch Door

Lead-generation site for non-EU expats buying a home in the Netherlands. Astro (static) plus a small PHP lead endpoint. Rules and compliance: see `CLAUDE.md` and `BUILD_BRIEF.md`. Open items: `VERIFY.md`.

```
npm install
npm run dev          # http://localhost:4321 (form posts need the PHP side: see below)
npm run build        # also copies php/ into dist/
npm test             # build, endpoint test (real PHP), browser e2e + axe
```

- `src/config/site.ts`: all site-wide copy and nav. The lead partner is named ONLY in `privacyRecipient` (privacy page).
- `src/content/guides/*.md`: guides (frontmatter: author, reviewer, lastReviewed, sources, faq; `status: stub` = noindex placeholder).
- `php/`: `submit.php` (step 1), `step2.php` (optional answers), `lib.php`. Config lives in `php/smtp-config.php` (gitignored; CI writes the production one from secrets).
- Local form test: `npm run build && php -S localhost:8080 -t dist`, then open http://localhost:8080 (`NOTIFY_TRANSPORT=log` writes mail to `lead-data/mail-log.jsonl`).
- Deploy: push to `main`, GitHub Actions builds, tests and uploads to Vimexx (`.github/workflows/deploy.yml`).
