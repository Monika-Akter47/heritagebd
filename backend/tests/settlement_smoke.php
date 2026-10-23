<?php

require_once __DIR__ . '/../helpers/earnings.php';

$cases = [
    ['order', 850000, 20, 10, [170000, 85000, 85000, 680000, 765000]],
    ['preorder', 280000, 30, 10, [84000, 28000, 56000, 196000, 252000]],
    ['guide_booking', 700000, 20, 10, [140000, 70000, 70000, 560000, 630000]],
];

foreach ($cases as [$flow, $gross, $advancePercent, $commissionPercent, $expected]) {
    $split = compute_split($gross, $advancePercent, $commissionPercent);
    $actual = [
        $split['advance'],
        $split['commission'],
        $split['released'],
        $split['cash'],
        $split['partnerTotal'],
    ];
    if ($actual !== $expected) {
        fwrite(STDERR, "{$flow} settlement mismatch: " . json_encode($actual) . PHP_EOL);
        exit(1);
    }
}

echo "Settlement split smoke test passed (orders, Ready to Pick, guide bookings)." . PHP_EOL;
