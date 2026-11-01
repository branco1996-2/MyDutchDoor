// Lead form, step 1. No framework. libphonenumber-js/min loads on first use of the phone field.
type Field = 'name' | 'email' | 'phone' | 'consent';

const MSG: Record<Field, { text: string; summary: string }> = {
  name: { text: 'Please enter your full name (at least 2 characters).', summary: 'Full name is needed' },
  email: { text: 'This email looks incomplete. Check the part after the @, for example gmail.com.', summary: 'Email address looks incomplete' },
  phone: { text: 'This number looks incomplete or invalid for the country code you chose. A Dutch mobile number has 9 digits after +31, like 6 1234 5678. Using a US number? Choose +1.', summary: 'Phone number looks incomplete' },
  consent: { text: 'We need your OK before we can pass your details to our advisory partner.', summary: 'Your OK to share your details is needed' },
};

const track = (event: string, props?: Record<string, string>) => {
  try { (window as any).plausible?.(event, props ? { props } : undefined); } catch { /* analytics must never break the form */ }
};

// Blur validation changes the layout (errors appear or disappear). If that happens between
// mousedown and mouseup, the click lands on whatever moved under the pointer, so updates wait
// until the pointer is released.
let pointerDown = false;
let released: Array<() => void> = [];
const settle = (): Promise<void> => (pointerDown ? new Promise((r) => released.push(r)) : Promise.resolve());
const up = () => { pointerDown = false; const q = released; released = []; setTimeout(() => q.forEach((r) => r()), 0); };
document.addEventListener('pointerdown', () => { pointerDown = true; }, true);
document.addEventListener('pointerup', up, true);
document.addEventListener('pointercancel', up, true);

let phoneLib: Promise<typeof import('libphonenumber-js/min')> | null = null;
const loadPhone = () => (phoneLib ??= import('libphonenumber-js/min'));

function init(form: HTMLFormElement) {
  const q = <T extends HTMLElement>(sel: string) => form.querySelector<T>(sel)!;
  const inputs: Record<Field, HTMLInputElement> = {
    name: q('[name=name]'), email: q('[name=email]'), phone: q('[name=phone]'), consent: q('[name=consent]'),
  };
  const country = q<HTMLSelectElement>('[name=country]');
  const summary = q<HTMLElement>('[data-summary]');
  const list = q<HTMLUListElement>('[data-summary-list]');
  const countEl = q<HTMLElement>('[data-summary-count]');
  const statusEl = q<HTMLElement>('[data-status]');
  const button = q<HTMLButtonElement>('button[type=submit]');
  const stamp = q<HTMLInputElement>('[data-rendered]');
  stamp.value = String(Date.now());

  let submitted = false;
  let started = false;
  const start = () => { if (!started) { started = true; track('form_start'); } };
  form.addEventListener('focusin', start, { once: true });
  loadPhoneOnFocus();

  function loadPhoneOnFocus() {
    inputs.phone.addEventListener('focus', () => void loadPhone(), { once: true });
    country.addEventListener('focus', () => void loadPhone(), { once: true });
  }

  async function check(f: Field): Promise<boolean> {
    const v = inputs[f].value.trim();
    if (f === 'name') return v.length >= 2;
    if (f === 'email') return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v);
    if (f === 'consent') return inputs.consent.checked;
    const { parsePhoneNumberFromString } = await loadPhone();
    const p = parsePhoneNumberFromString(v, country.value as any);
    return !!p && p.isValid();
  }

  function setError(f: Field, bad: boolean) {
    const el = inputs[f];
    const err = form.querySelector<HTMLElement>(`#${el.id}-err`)!;
    if (bad) {
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', err.id);
      err.querySelector('[data-msg]')!.textContent = MSG[f].text;
      err.hidden = false;
    } else {
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
      err.hidden = true;
    }
  }

  async function validateAll(): Promise<Field[]> {
    const bad: Field[] = [];
    for (const f of ['name', 'email', 'phone', 'consent'] as Field[]) {
      const good = await check(f);
      setError(f, !good);
      if (!good) bad.push(f);
    }
    return bad;
  }

  function showSummary(bad: Field[]) {
    list.replaceChildren(...bad.map((f) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${inputs[f].id}`;
      a.textContent = MSG[f].summary;
      li.append(a);
      return li;
    }));
    countEl.textContent = bad.length === 1 ? '1 thing' : `${bad.length} things`;
    summary.hidden = false;
    summary.focus();
  }

  // After the first submit, re-validate each field on blur and clear the summary entries as they are fixed.
  for (const f of ['name', 'email', 'phone', 'consent'] as Field[]) {
    inputs[f].addEventListener(f === 'consent' ? 'change' : 'blur', async () => {
      if (!submitted) return;
      const good = await check(f);
      await settle();
      setError(f, !good);
      if (good) list.querySelector(`a[href="#${inputs[f].id}"]`)?.parentElement?.remove();
      if (!list.children.length) summary.hidden = true;
    });
  }
  country.addEventListener('change', async () => {
    if (!submitted || !inputs.phone.value) return;
    const good = await check('phone');
    setError('phone', !good);
    if (good) list.querySelector(`a[href="#${inputs.phone.id}"]`)?.parentElement?.remove();
    if (!list.children.length) summary.hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitted = true;
    const bad = await validateAll();
    if (bad.length) {
      showSummary(bad);
      for (const f of bad) track('form_error', { field: f });
      return;
    }
    summary.hidden = true;
    button.disabled = true;
    statusEl.textContent = 'Sending…';
    try {
      const { parsePhoneNumberFromString } = await loadPhone();
      const phone = parsePhoneNumberFromString(inputs.phone.value.trim(), country.value as any)!.number;
      const base = (import.meta.env.PUBLIC_LEAD_API as string | undefined) ?? '';
      const res = await fetch(`${base}/submit.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inputs.name.value.trim(), email: inputs.email.value.trim(), phone,
          consent: true, t: Number(stamp.value),
          website: (form.querySelector('[name=website]') as HTMLInputElement).value,
          source: location.pathname,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        track('lead_submitted');
        try {
          sessionStorage.setItem('mdd-lead', JSON.stringify({ token: data.token, name: inputs.name.value.trim().split(' ')[0], email: data.maskedEmail }));
        } catch { /* thank-you page still works without it */ }
        location.assign(data.redirect || '/get-in-touch/thank-you/');
        return;
      }
      if (res.status === 422 && data.fields) {
        const bad2 = Object.keys(data.fields) as Field[];
        bad2.forEach((f) => setError(f, true));
        showSummary(bad2);
      } else if (data.error === 'too_fast') {
        statusEl.textContent = 'That was very quick. Please check your details and press send again.';
      } else if (data.error === 'rate_limited') {
        statusEl.textContent = 'Too many requests from your connection. Please try again in a while.';
      } else {
        statusEl.textContent = 'Something went wrong on our side. Nothing was sent. Please try again in a moment.';
      }
    } catch {
      statusEl.textContent = 'We could not reach the server. Nothing was sent. Check your connection and try again.';
    }
    button.disabled = false;
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-lead-form]').forEach(init);
