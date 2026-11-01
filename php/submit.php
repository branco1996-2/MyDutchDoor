<?php
// Step 1: name, email, phone, consent. Nothing else.
require __DIR__ . '/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_out(405, ['success' => false, 'error' => 'method']);

$in = read_input();
$test = !empty($in['test']) && cfg('ALLOW_TEST_LEADS', false);

// Honeypot: pretend success so bots learn nothing.
if (clean((string)($in['website'] ?? '')) !== '') json_out(200, ['success' => true, 'redirect' => '/get-in-touch/thank-you/']);

// Time-to-submit: the page stamps t (ms since epoch) on load; require >= 3s.
$t = (int)($in['t'] ?? 0);
if ($t <= 0) json_out(400, ['success' => false, 'error' => 'js_required']);
if ((microtime(true) * 1000 - $t) < 3000) json_out(429, ['success' => false, 'error' => 'too_fast']);

if (!rate_ok('submit', 5, 3600)) json_out(429, ['success' => false, 'error' => 'rate_limited']);

$name = clean((string)($in['name'] ?? ''), 120);
$email = clean((string)($in['email'] ?? ''), 200);
$phone = clean((string)($in['phone'] ?? ''), 20);
$consent = !empty($in['consent']) && $in['consent'] !== 'false';

$errors = [];
if (mb_strlen($name) < 2) $errors['name'] = 'invalid';
if (!valid_email($email)) $errors['email'] = 'invalid';
if (!valid_e164($phone)) $errors['phone'] = 'invalid';
if (!$consent) $errors['consent'] = 'required';
if ($errors) json_out(422, ['success' => false, 'error' => 'validation', 'fields' => $errors]);

$leadId = new_lead_id();
$now = gmdate('c');

// Consent log: timestamp, consent-text version, IP hash. Retention period: VERIFY with lawyer.
append_log('leads.jsonl', [
    'leadId' => $leadId, 'at' => $now, 'name' => $name, 'email' => $email, 'phone' => $phone,
    'consent' => ['at' => $now, 'version' => CONSENT_VERSION, 'ipHash' => ip_hash()],
    'source' => clean((string)($in['source'] ?? ''), 100),
]);

if (!$test) {
    $recipient = cfg('LEAD_RECIPIENT_EMAIL');
    $body = "New lead $leadId\n\nName: $name\nEmail: $email\nPhone: $phone\nReceived: $now\nConsent: version " . CONSENT_VERSION . " at $now\n";
    $sent = $recipient !== '' ? send_mail($recipient, "New lead $leadId", $body, $email) : false;
    $hook = send_webhook(['type' => 'lead', 'leadId' => $leadId, 'name' => $name, 'email' => $email, 'phone' => $phone, 'consentVersion' => CONSENT_VERSION, 'at' => $now]);
    // Never lose a lead silently: if both sinks failed, notify the fallback address.
    if (!$sent && !$hook || ($recipient === '' && cfg('LEAD_WEBHOOK_URL') === '')) {
        append_log('errors.jsonl', ['t' => $now, 'leadId' => $leadId, 'error' => 'no sink accepted the lead']);
        $fb = cfg('FALLBACK_EMAIL');
        if ($fb !== '') send_mail($fb, "LEAD NOT DELIVERED $leadId", $body);
    }

    // Confirmation to the visitor. This is the one place the partner is named (GDPR transparency).
    $partner = cfg('PARTNER_NAME', '[partner name]');
    $privacy = cfg('PRIVACY_EMAIL', 'privacy@mydutchdoor.com');
    $first = explode(' ', $name)[0];
    $confirm = "Hi $first,\n\nThanks for your request at My Dutch Door.\n\n"
        . "What we shared\nWe passed your name, email and phone number to $partner, an independent mortgage advisory partner. That is all we shared.\n\n"
        . "What happens next\nAn adviser from $partner will contact you, usually " . cfg('RESPONSE_TIME', 'within one business day') . ".\n\n"
        . "Changed your mind?\nYou can withdraw your consent and ask us to delete your details at any time by emailing $privacy. Your reference is $leadId.\n\n"
        . "—\nWe only connect you with an independent adviser. My Dutch Door is an introduction service. We do not give mortgage advice, we are not a lender and we are not a mortgage adviser.\n";
    send_mail($email, 'Your request at My Dutch Door', $confirm);
}

json_out(200, ['success' => true, 'redirect' => '/get-in-touch/thank-you/', 'token' => make_token($leadId), 'maskedEmail' => mask_email($email)]);
