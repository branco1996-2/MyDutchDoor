export const site = {
  name: 'My Dutch Door',
  tagline: 'Your way into a Dutch home',
  domain: 'https://mydutchdoor.com',
  lang: 'en',
  // Placeholders. Every one of these is listed in VERIFY.md.
  kvk: '[number]',
  lastSiteReview: '[date]',
  responseTime: 'within one business day', // VERIFY
  pillarPath: '/guides/can-americans-get-a-mortgage-in-the-netherlands/',
  nav: [
    { label: 'Guides', href: '/guides/' },
    { label: 'For US citizens', href: '/guides/can-americans-get-a-mortgage-in-the-netherlands/' },
    { label: 'How it works', href: '/how-it-works/' },
    { label: 'About', href: '/about/' },
    { label: 'For advisers', href: '/for-advisers/' },
  ],
  footerGuides: [
    { label: 'Mortgages for Americans', href: '/guides/can-americans-get-a-mortgage-in-the-netherlands/' },
    { label: 'FATCA, TIN and CLN', href: '/guides/fatca-tin-cln-dutch-lenders/' },
    { label: 'Non-euro income', href: '/guides/mortgage-on-usd-income/' },
    { label: 'Expat ruling', href: '/guides/expat-ruling-mortgage/' },
    { label: 'Buying step by step', href: '/guides/buying-a-home-in-the-netherlands/' },
  ],
  footerCompany: [
    { label: 'How it works', href: '/how-it-works/' },
    { label: 'About', href: '/about/' },
    { label: 'For advisers', href: '/for-advisers/' },
    { label: 'Contact', href: '/contact/' },
  ],
  footerLegal: [
    { label: 'Privacy policy', href: '/privacy/' },
    { label: 'Cookie policy', href: '/cookies/' },
    { label: 'Disclaimer', href: '/disclaimer/' },
  ],
  disclaimerLead: 'We only connect you with an independent adviser.',
  disclaimerBody:
    'My Dutch Door is an introduction service. We do not give mortgage advice, we are not a lender and we are not a mortgage adviser. When you send a request, we pass your contact details to an independent mortgage advisory partner, whose advisers contact you directly. Information on this site is general and is not personal advice.',
  consentText:
    'I agree that My Dutch Door shares my name, email and phone number with one mortgage advisory partner, so one of their advisers can contact me about my question. The partner is named in our',
} as const;

/**
 * The current lead recipient. Hard rule: this value feeds ONLY the privacy page
 * (GDPR). Never import it anywhere else.
 */
export const privacyRecipient = '[partner name]'; // VERIFY
