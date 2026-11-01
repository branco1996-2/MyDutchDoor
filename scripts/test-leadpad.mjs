// Runs the real PHP endpoint on a local server and checks the lead path end to end.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, copyFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = mkdtempSync(join(tmpdir(), 'mdd-'));
for (const f of readdirSync('php')) if (f.endsWith('.php')) copyFileSync(join('php', f), join(root, f));
const data = join(root, 'data');
writeFileSync(join(root, 'smtp-config.php'),
  `<?php define('NOTIFY_TRANSPORT','log');define('ALLOW_TEST_LEADS',true);define('LEAD_RECIPIENT_EMAIL','test-recipient@example.com');define('PARTNER_NAME','Test Partner BV');define('TOKEN_SECRET','t');define('DATA_DIR',${JSON.stringify(data)});`);

const port = 8700 + Math.floor(Math.random() * 200);
const srv = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', root], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const base = `http://127.0.0.1:${port}`;

let fail = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fail++; };
const post = async (path, body) => {
  const r = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { s: r.status, j: await r.json() };
};
const old = () => Date.now() - 10000;
const good = () => ({ name: 'Sam Carter', email: 'sam@example.com', phone: '+31612345678', consent: true, t: old(), website: '' });
const mails = () => (existsSync(join(data, 'mail-log.jsonl')) ? readFileSync(join(data, 'mail-log.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)) : []);

try {
  let r = await post('/submit.php', good());
  ok(r.s === 200 && r.j.success && r.j.token, 'valid lead accepted, token returned');
  const token = r.j.token;
  const m = mails();
  ok(m.some((x) => x.to === 'test-recipient@example.com' && x.body.includes('Sam Carter')), 'lead mailed to recipient');
  const conf = m.find((x) => x.to === 'sam@example.com');
  ok(conf && conf.subject === 'Your request at My Dutch Door' && conf.body.includes('Test Partner BV'), 'confirmation email names the partner');
  const leads = readFileSync(join(data, 'leads.jsonl'), 'utf8');
  ok(leads.includes('2026-11-v1') && leads.includes('ipHash'), 'consent logged with version and ip hash');

  r = await post('/submit.php', { ...good(), consent: false });
  ok(r.s === 422 && r.j.fields.consent, 'missing consent rejected');
  r = await post('/submit.php', { ...good(), email: 'sam@gmail' });
  ok(r.s === 422 && r.j.fields.email, 'email without domain rejected');
  r = await post('/submit.php', { ...good(), phone: '+3161' });
  ok(r.s === 422 && r.j.fields.phone, 'short phone rejected');
  r = await post('/submit.php', { ...good(), name: 'S' });
  ok(r.s === 422 && r.j.fields.name, 'one-letter name rejected');
  r = await post('/submit.php', { ...good(), t: Date.now() });
  ok(r.s === 429 && r.j.error === 'too_fast', 'submit under 3s rejected');
  r = await post('/submit.php', { ...good(), t: 0 });
  ok(r.s === 400, 'missing timestamp (no JS) rejected');
  const before = mails().length;
  r = await post('/submit.php', { ...good(), website: 'http://spam' });
  ok(r.j.success && mails().length === before, 'honeypot: fake success, nothing sent');

  r = await post('/step2.php', { token, us: 'yes', currency: 'usd', ruling: 'no', when: '3m' });
  ok(r.s === 200 && r.j.success, 'step 2 saved with valid token');
  ok(mails().some((x) => x.subject.startsWith('Update to lead')), 'step 2 mailed as update');
  r = await post('/step2.php', { token, us: 'yes' });
  ok(r.s === 409, 'token is one-time');
  r = await post('/step2.php', { token: 'MDD-AAAAAAAAAA.9999999999.bad', us: 'yes' });
  ok(r.s === 403, 'forged token rejected');

  // rate limit: 5 per hour per IP; we already used several above
  let limited = false;
  for (let i = 0; i < 8 && !limited; i++) limited = (await post('/submit.php', good())).s === 429;
  ok(limited, 'rate limiting kicks in');
} finally {
  srv.kill();
  rmSync(root, { recursive: true, force: true });
}
console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
