<?php
// Optional step 2: radio answers, sent to the same recipient as an update to the lead.
require __DIR__ . '/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_out(405, ['success' => false, 'error' => 'method']);
$in = read_input();

$leadId = check_token((string)($in['token'] ?? ''));
if (!$leadId) json_out(403, ['success' => false, 'error' => 'bad_token']);
if (token_used($leadId)) json_out(409, ['success' => false, 'error' => 'already_used']);
if (!rate_ok('step2', 10, 3600)) json_out(429, ['success' => false, 'error' => 'rate_limited']);

// Fixed answer sets only. Free text is never accepted, so no sensitive data can slip in.
$allowed = [
    'us' => ['yes', 'no', 'dual'],
    'currency' => ['euro', 'usd', 'other', 'mix'],
    'ruling' => ['yes', 'no', 'unsure'],
    'when' => ['3m', '3-12m', 'exploring'],
];
$answers = [];
foreach ($allowed as $k => $opts) {
    $v = (string)($in[$k] ?? '');
    if ($v !== '' && in_array($v, $opts, true)) $answers[$k] = $v;
}
if (!$answers) json_out(422, ['success' => false, 'error' => 'empty']);

mark_token_used($leadId);
append_log('step2.jsonl', ['leadId' => $leadId, 'at' => gmdate('c'), 'answers' => $answers]);

$recipient = cfg('LEAD_RECIPIENT_EMAIL');
$lines = ["Update to lead $leadId (optional answers, shared by the visitor)", ''];
foreach ($answers as $k => $v) $lines[] = "$k: $v";
if ($recipient !== '') send_mail($recipient, "Update to lead $leadId", implode("\n", $lines) . "\n");
send_webhook(['type' => 'lead_update', 'leadId' => $leadId, 'answers' => $answers]);

json_out(200, ['success' => true]);
