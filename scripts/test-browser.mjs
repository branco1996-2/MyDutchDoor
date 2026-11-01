// Browser end-to-end: form errors, happy path, step 2, accessibility (axe), JS weight.
// Needs a build in dist/ and Google Chrome. Run: npm run build && node scripts/test-browser.mjs
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, rmSync, mkdtempSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const axeSrc = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');

// Serve a copy of dist/ with its own data dir so the test never touches real data.
const root = mkdtempSync(join(tmpdir(), 'mdd-e2e-'));
cpSync('dist', join(root, 'site'), { recursive: true });
const data = join(root, 'data');
const cfg = `<?php define('NOTIFY_TRANSPORT','log');define('LEAD_RECIPIENT_EMAIL','test-recipient@example.com');define('PARTNER_NAME','Test Partner BV');define('TOKEN_SECRET','e2e');define('DATA_DIR',${JSON.stringify(data)});`;
(await import('node:fs')).writeFileSync(join(root, 'site', 'smtp-config.php'), cfg);
const port = 8900 + Math.floor(Math.random() * 90);
const srv = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', join(root, 'site')], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const base = `http://127.0.0.1:${port}`;

let fail = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fail++; };

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => process.env.DEBUG_E2E && console.log('console:', m.text()));
  page.on('response', (r) => process.env.DEBUG_E2E && r.url().includes('.php') && console.log('resp', r.status(), r.url()));

  // ---- error state
  await page.goto(`${base}/get-in-touch/`, { waitUntil: 'networkidle0' });
  await page.click('button[type=submit]');
  await page.waitForSelector('[data-summary]:not([hidden])');
  const focused = await page.evaluate(() => document.activeElement?.hasAttribute('data-summary'));
  ok(focused, 'focus moves to the error summary on submit');
  const items = await page.$$eval('[data-summary-list] a', (a) => a.map((x) => x.getAttribute('href')));
  ok(items.length === 4, `summary lists 4 problems with anchor links (${items.join(', ')})`);
  const invalid = await page.$$eval('[aria-invalid=true]', (e) => e.length);
  ok(invalid === 4, 'all four fields aria-invalid');
  const described = await page.$eval('#form-email', (e) => !!document.getElementById(e.getAttribute('aria-describedby')));
  ok(described, 'aria-describedby points at the error text');

  await page.type('#form-name', 'Sam Carter');
  await page.type('#form-email', 'sam.carter@gmail');
  await page.type('#form-phone', '6 1234');
  await page.click('#form-consent');
  await page.click('button[type=submit]');
  await page.waitForFunction(() => document.querySelectorAll('[data-summary-list] li').length === 2);
  ok(true, 'fixing the consent and name clears those items; email and phone remain');

  // ---- happy path (US number to exercise the country select)
  await page.select('select[name=country]', 'US');
  await page.$eval('#form-email', (e) => (e.value = ''));
  await page.type('#form-email', 'sam.carter@example.com');
  await page.$eval('#form-phone', (e) => (e.value = ''));
  await page.type('#form-phone', '(202) 456-1111');
  await new Promise((r) => setTimeout(r, 3200));
  await page.click('button[type=submit]');
  try { await page.waitForFunction(() => location.pathname.endsWith('/thank-you/'), { timeout: 8000 }); }
  catch {
    const dbg = await page.evaluate(() => ({ status: document.querySelector('[data-status]')?.textContent, summary: document.querySelector('[data-summary-list]')?.textContent, phoneErr: document.querySelector('#form-phone-err')?.textContent, phone: document.querySelector('#form-phone').value }));
    console.log('DEBUG submit did not navigate', JSON.stringify(dbg), 'pageerrors:', errors);
  }
  ok(page.url().endsWith('/get-in-touch/thank-you/'), 'redirected to thank-you');
  const h1 = await page.$eval('h1', (e) => e.textContent);
  ok(h1.includes('Sam'), `thank-you greets by first name: "${h1}"`);
  await page.waitForSelector('#step2:not([hidden])');
  await page.click('input[name=us][value=yes]');
  await page.click('input[name=currency][value=usd]');
  await page.click('#step2 button[type=submit]');
  await page.waitForSelector('.saved');
  ok(true, 'step 2 saved');

  const mails = readFileSync(join(data, 'mail-log.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  ok(mails.some((m) => m.body.includes('+12024561111')), 'US number stored in E.164');
  ok(mails.some((m) => m.subject.startsWith('Update to lead') && m.body.includes('currency: usd')), 'step 2 update reached the recipient');
  ok(mails.some((m) => m.to === 'sam.carter@example.com' && m.body.includes('Test Partner BV')), 'confirmation email names the partner');

  // ---- accessibility + JS weight
  for (const path of ['/', '/get-in-touch/', '/get-in-touch/thank-you/', '/guides/', '/guides/can-americans-get-a-mortgage-in-the-netherlands/', '/privacy/', '/how-it-works/']) {
    const jsBytes = { n: 0 };
    const p = await browser.newPage();
    await p.setViewport({ width: 1280, height: 900 });
    p.on('response', async (r) => {
      if ((r.headers()['content-type'] || '').includes('javascript')) {
        try { jsBytes.n += gzipSync(await r.buffer()).length; } catch {}
      }
    });
    await p.goto(base + path, { waitUntil: 'networkidle0' });
    await p.evaluate(axeSrc);
    const res = await p.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }));
    const v = res.violations.map((x) => `${x.id} (${x.nodes.length})`);
    ok(v.length === 0, `axe ${path}${v.length ? ': ' + v.join(', ') : ''}`);
    if (!path.includes('thank-you') && !path.includes('get-in-touch')) ok(jsBytes.n < 30 * 1024, `JS on ${path}: ${(jsBytes.n / 1024).toFixed(1)} KB gzip (< 30)`);
    else console.log(`INFO  JS on ${path}: ${(jsBytes.n / 1024).toFixed(1)} KB gzip`);
    await p.close();
  }
  ok(errors.length === 0, `no page errors ${errors.join('; ')}`);
} finally {
  await browser.close();
  srv.kill();
  rmSync(root, { recursive: true, force: true });
}
console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
