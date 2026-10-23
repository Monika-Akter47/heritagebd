<?php

function json_ok($data = null, int $code = 200, array $extra = []): void {
    http_response_code($code);
    echo json_encode(array_merge(['success' => true, 'data' => $data], $extra), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $code = 400, array $extra = []): void {
    http_response_code($code);
    echo json_encode(array_merge(['success' => false, 'message' => $message], $extra), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function body(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? normalize_bools($data) : [];
}

// JSON true/false -> 1/0. PDO would otherwise bind `false` as '' which MySQL strict mode
// rejects for TINYINT columns (e.g. turning "available" or "location sharing" OFF failed).
function normalize_bools(array $data): array {
    foreach ($data as $k => $v) {
        if (is_bool($v)) $data[$k] = $v ? 1 : 0;
        elseif (is_array($v)) $data[$k] = normalize_bools($v);
    }
    return $data;
}

function require_fields(array $data, array $fields): void {
    $missing = [];
    foreach ($fields as $f) {
        if (!isset($data[$f]) || $data[$f] === '') $missing[] = $f;
    }
    if ($missing) {
        json_error('Missing required field(s): ' . implode(', ', $missing), 422);
    }
}

function uuid(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function id_with_prefix(string $prefix): string {
    return $prefix . '_' . bin2hex(random_bytes(8));
}
