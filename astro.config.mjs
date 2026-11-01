// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { site } from './src/config/site.ts';
import { copyFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Copies php/ into the build. astro build empties dist/, so without this the endpoint would vanish. */
/** @returns {import('astro').AstroIntegration} */
function phpMeeleveren() {
  return {
    name: 'mdd-php',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const src = new URL('./php/', import.meta.url);
        if (!existsSync(src)) return;
        let n = 0;
        for (const f of readdirSync(src)) {
          if (!f.endsWith('.php') && f !== 'composer.json') continue;
          copyFileSync(new URL(f, src), join(dir.pathname, f));
          n++;
        }
        logger.info(`${n} PHP file(s) copied into the build`);
      },
    },
  };
}

export default defineConfig({
  site: site.domain,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    phpMeeleveren(),
    // noindex pages (thank-you, stubs) stay out of the sitemap. Remove a stub from this list when it is written.
    sitemap({
      filter: (page) =>
        !/\/(get-in-touch\/thank-you|for-advisers|contact|404)\/?$/.test(page) &&
        !/\/guides\/(fatca-tin-cln-dutch-lenders|mortgage-on-usd-income|expat-ruling-mortgage|buying-a-home-in-the-netherlands)\/$/.test(page),
    }),
  ],
});
