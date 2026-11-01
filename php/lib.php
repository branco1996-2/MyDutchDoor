<?php
// Shared helpers for the lead endpoint. Config comes from smtp-config.php
// (gitignored; written by CI from secrets). The lead recipient and partner
// name live ONLY in that config, never in the site source (CLAUDE.md rule 1).

const CONSENT_VERSION = '2026-11-v1';
const CONSENT_TEXT = 'I agree that My Dutch Door shares my name, email and phone number with one mortgage advisory partner, so one of their advisers can contact me about my question. The partner is named in our privacy policy. I can withdraw this at any time.';

$cfg = __DIR__ . '/smtp-config.php';
if (is_file($cfg)) require_once $cfg;

function cfg(string $k, $default = '') { return defined($k) ? constant($k) : $default; }

function data_dir(): string {
    $d = cfg('DATA_DIR', dirname(__DIR__) . '/lead-data');
    if (!is_dir($d)) @mkdir($d, 0700, true);
    return $d;
}

function json_out(int $status, array $body): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body);
    exit;
}

function read_input(): array {
    $raw = file_get_contents('php://input');
    if ($raw !== '' && str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'json')) {
        $j = json_decode($raw, true);
        return is_array($j) ? $j : [];
    }
    return $_POST;
}

function client_ip(): string { return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'; }
function ip_hash(): string { return hash_hmac('sha256', client_ip(), cfg('TOKEN_SECRET', 'dev-secret')); }

/** Allow at most $max hits per $window seconds per IP hash. Returns false when over the limit. */
function rate_ok(string $bucket, int $max, int $window): bool {
    $dir = data_dir() . '/rate';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $f = $dir . '/' . $bucket . '-' . substr(ip_hash(), 0, 24) . '.json';
    $now = time();
    $hits = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
    $hits = array_values(array_filter($hits, fn($t) => $t > $now - $window));
    if (count($hits) >= $max) return false;
    $hits[] = $now;
    file_put_contents($f, json_encode($hits), LOCK_EX);
    return true;
}

function valid_email(string $e): bool {
    return (bool)filter_var($e, FILTER_VALIDATE_EMAIL) && preg_match('/@[^@]+\.[a-z]{2,}$/i', $e) === 1;
}
function valid_e164(string $p): bool { return preg_match('/^\+[1-9]\d{6,14}$/', $p) === 1; }

function clean(string $s, int $max = 200): string {
    $s = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $s) ?? '');
    return mb_substr($s, 0, $max);
}

function new_lead_id(): string { return 'MDD-' . strtoupper(bin2hex(random_bytes(5))); }

/** Token = leadId.expiry.hmac. Links step 2 to the lead; usable once. */
function make_token(string $leadId, int $ttl = 7200): string {
    $exp = time() + $ttl;
    return $leadId . '.' . $exp . '.' . hash_hmac('sha256', $leadId . '.' . $exp, cfg('TOKEN_SECRET', 'dev-secret'));
}
function check_token(string $t): ?string {
    $p = explode('.', $t);
    if (count($p) !== 3) return null;
    [$id, $exp, $sig] = $p;
    if (!hash_equals(hash_hmac('sha256', $id . '.' . $exp, cfg('TOKEN_SECRET', 'dev-secret')), $sig)) return null;
    if ((int)$exp < time()) return null;
    return preg_match('/^MDD-[A-F0-9]{10}$/', $id) ? $id : null;
}
function token_used(string $leadId): bool { return is_file(data_dir() . "/used-$leadId"); }
function mark_token_used(string $leadId): void { file_put_contents(data_dir() . "/used-$leadId", (string)time()); }

function append_log(string $file, array $row): void {
    file_put_contents(data_dir() . '/' . $file, json_encode($row, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
}

/**
 * Send a mail. NOTIFY_TRANSPORT: 'email' (SMTP via PHPMailer), 'log' (tests/dev: written to mail-log.jsonl).
 */
function send_mail(string $to, string $subject, string $body, ?string $replyTo = null): bool {
    if (cfg('NOTIFY_TRANSPORT', 'log') === 'log') {
        append_log('mail-log.jsonl', ['to' => $to, 'subject' => $subject, 'body' => $body, 'replyTo' => $replyTo]);
        return true;
    }
    $autoload = __DIR__ . '/vendor/autoload.php';
    if (!is_file($autoload)) return false;
    require_once $autoload;
    try {
        $m = new PHPMailer\PHPMailer\PHPMailer(true);
        $m->isSMTP();
        $m->Host = cfg('SMTP_HOST');
        $m->SMTPAuth = true;
        $m->Username = cfg('SMTP_USER');
        $m->Password = cfg('SMTP_PASS');
        $m->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $m->Port = 587;
        $m->CharSet = 'UTF-8';
        $m->setFrom(cfg('SMTP_USER'), 'My Dutch Door');
        if ($replyTo) $m->addReplyTo($replyTo);
        $m->addAddress($to);
        $m->Subject = $subject;
        $m->Body = $body;
        $m->send();
        return true;
    } catch (Throwable $e) {
        append_log('errors.jsonl', ['t' => date('c'), 'mail_error' => $e->getMessage()]);
        return false;
    }
}

/** POST JSON to LEAD_WEBHOOK_URL when configured. */
function send_webhook(array $payload): bool {
    $url = cfg('LEAD_WEBHOOK_URL');
    if ($url === '') return true;
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => json_encode($payload), 'timeout' => 8, 'ignore_errors' => true]]);
    return @file_get_contents($url, false, $ctx) !== false;
}

function mask_email(string $e): string {
    [$u, $d] = explode('@', $e, 2) + ['', ''];
    return mb_substr($u, 0, 1) . '•••@' . $d;
}
