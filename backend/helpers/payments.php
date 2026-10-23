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
