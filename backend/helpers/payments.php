<?php

const PAYMENTS_DEMO_MODE = true;

function collect_advance(string $method, int $amountPoisha): bool {
    if (!PAYMENTS_DEMO_MODE) {
        throw new RuntimeException('A payment gateway must be configured before collecting advances.');
    }
    if (!in_array($method, ['bkash', 'nagad', 'card'], true) || $amountPoisha < 0) {
        throw new InvalidArgumentException('Invalid advance payment details.');
    }

    // TODO: Replace the demo success result with a verified gateway charge and store its transaction ID.
    return true;
}

/** Normalises a Bangladeshi mobile number (+880 1XXXXXXXXX, 8801…, 01…) to 01XXXXXXXXX, or null if invalid. */
function normalize_bd_phone(string $raw): ?string {
    $digits = preg_replace('/[\s\-()]/', '', $raw);
    if (str_starts_with($digits, '+')) $digits = substr($digits, 1);
    if (str_starts_with($digits, '880')) $digits = substr($digits, 2);
    return preg_match('/^01[3-9]\d{8}$/', $digits) ? $digits : null;
}

/**
 * Validates the payer's wallet number and transaction ID sent with a payment, e.g.
 * `advancePayerPhone` / `advanceTransactionId` for prefix 'advance'.
 *
 * Until a gateway is integrated, bKash and Nagad payments are made with "Send Money" outside
 * the app, so both values are required for them where the client collects them ($required):
 * they let the admin match the payment against the wallet statement. Card and cash need neither
 * (a reference is optional for card). Values sent where they are optional are still validated.
 * Returns [phone|null, transactionId|null]; ends the request with 422 on invalid input.
 */
function payment_proof(array $d, string $method, string $prefix, bool $required = true): array {
    $phoneRaw = trim((string)($d[$prefix . 'PayerPhone'] ?? ''));
    $txnRaw = strtoupper(trim((string)($d[$prefix . 'TransactionId'] ?? '')));
    $wallet = $required && in_array($method, ['bkash', 'nagad'], true);
    $label = $method === 'nagad' ? 'Nagad' : 'bKash';

    if ($wallet && $phoneRaw === '') json_error("Enter the {$label} number the payment was sent from.", 422);
    if ($wallet && $txnRaw === '') json_error("Enter the {$label} transaction ID (TrxID).", 422);

    $phone = null;
    if ($phoneRaw !== '' && $method !== 'cash') {
        $phone = normalize_bd_phone($phoneRaw);
        if ($phone === null) json_error('Enter a valid Bangladeshi mobile number, e.g. 01712345678.', 422);
    }
    $txn = null;
    if ($txnRaw !== '' && $method !== 'cash') {
        if (!preg_match('/^[A-Z0-9]{6,20}$/', $txnRaw)) {
            json_error('The transaction ID should be 6–20 letters and digits, as shown in the payment SMS.', 422);
        }
        $txn = $txnRaw;
    }
    return [$phone, $txn];
}
