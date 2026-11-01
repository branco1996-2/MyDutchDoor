# Start prompt for Claude Code

Paste this as the first message in the new Claude Code session, after you have put `CLAUDE.md`, `BUILD_BRIEF.md` and the `design-reference/` folder in an empty project folder.

---

We're building **My Dutch Door** (mydutchdoor.com): a lead-generation site for US and other non-EU expats who want a mortgage in the Netherlands. The site only connects visitors with an independent mortgage adviser. It never gives advice.

1. Read `CLAUDE.md` (project rules: compliance, design tokens, definition of done) and `BUILD_BRIEF.md` (scope, sitemap, page specs, build order).
2. Look through `design-reference/`. These are the approved designs for:
   - the homepage, desktop and mobile;
   - the pillar guide, desktop and mobile;
   - the lead form, error state and thank-you page.

   Use them as the source for copy, layout, SVGs and spacing.
3. Ask me first:
   - whether you can look at my eerlijketaxatie.nl repo, so we reuse its Astro setup, form endpoint and hosting;
   - which hosting and email service to use if that repo isn't available.
4. Then follow the build order in the brief. Start with the scaffold, tokens and base layout, then the homepage. **Stop after the homepage** so I can review it in the browser before you continue.

Throughout, keep a `VERIFY.md` with every placeholder and unverified claim. Never put the lead partner's name anywhere except the privacy policy config.

Talk to me in Dutch; all site content is in English.
