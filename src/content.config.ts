import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const guides = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    dek: z.string().optional(),
    category: z.string(),
    order: z.number().default(99),
    // 'stub' pages exist but are noindex placeholders until written.
    status: z.enum(['published', 'stub']).default('stub'),
    // Author and reviewer stay empty until Ben confirms real people (VERIFY.md).
    author: z.string().optional(),
    reviewer: z.object({ name: z.string(), credentials: z.string() }).optional(),
    lastReviewed: z.coerce.date().optional(),
    // Short label for the card on the guides index / homepage / footer.
    sources: z.array(z.object({ label: z.string(), url: z.url().optional(), verify: z.string().optional() })).default([]),
    // Only items with an answer are rendered (and put in FAQPage schema).
    faq: z.array(z.object({ q: z.string(), a: z.string().optional() })).default([]),
    related: z.array(z.string()).default([]),
  }),
});

export const collections = { guides };
