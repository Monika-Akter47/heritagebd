<?php

/**
 * Brings an older Supabase (PostgreSQL) database up to date with the payment and refund columns the
 * admin Payments page and refunds rely on: postgres/004_order_refunds.sql and 005_payment_details.sql.
 * The production database was created before these existed, and a hand-run migration that fails part
 * way leaves the page broken, so the API applies them itself. Every statement is idempotent; the check
 * runs once per PHP process and costs a single catalogue query once the columns are there.
 * MySQL databases are created from schema.sql, which already has everything, so this is PostgreSQL only.
 */
function ensure_payment_schema(PDO $pdo): void {
    static $done = false;
    if ($done || !db_is_pgsql()) return;
    $done = true;

    $needed = [
        'orders' => ['advance_payer_phone', 'advance_transaction_id', 'refund_method', 'refund_transaction_id', 'refunded_at'],
        'preorders' => ['advance_payer_phone', 'advance_transaction_id', 'pickup_payer_phone', 'pickup_transaction_id',
                        'refund_method', 'refund_transaction_id', 'refunded_at'],
        'guide_bookings' => ['advance_payment_method', 'advance_payer_phone', 'advance_transaction_id',
                             'refund_method', 'refund_transaction_id', 'refunded_at'],
        'guide_payments' => ['payer_phone', 'recorded_by'],
    ];
    $present = $pdo->query(
        "SELECT table_name || '.' || column_name FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name IN ('orders','preorders','guide_bookings','guide_payments')"
    )->fetchAll(PDO::FETCH_COLUMN);
    $missing = false;
    foreach ($needed as $table => $columns) {
        foreach ($columns as $column) $missing = $missing || !in_array("$table.$column", $present, true);
    }
    // The order status rule must also allow 'refund_pending', or cancelling a paid order fails.
    $rule = (string)$pdo->query(
        "SELECT COALESCE(string_agg(pg_get_constraintdef(oid), ' '), '') FROM pg_constraint
         WHERE conrelid = 'orders'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%advance_status%'"
    )->fetchColumn();
    if (!$missing && str_contains($rule, 'refund_pending')) return;

    $statements = [];
    foreach (['orders', 'preorders', 'guide_bookings'] as $table) {
        $statements[] = "ALTER TABLE $table DROP CONSTRAINT IF EXISTS {$table}_advance_status_check";
        $statements[] = "ALTER TABLE $table ADD CONSTRAINT {$table}_advance_status_check
                         CHECK (advance_status IN ('held','released','refund_pending','refunded'))";
    }
    foreach ($needed as $table => $columns) {
        foreach ($columns as $column) {
            $type = $column === 'refunded_at' ? 'TIMESTAMP NULL'
                : ($column === 'recorded_by' ? "VARCHAR(20) NOT NULL DEFAULT 'tourist'"
                : (str_ends_with($column, '_phone') ? 'VARCHAR(20) NULL'
                : (in_array($column, ['refund_method', 'advance_payment_method'], true) ? 'VARCHAR(20) NULL' : 'VARCHAR(40) NULL')));
            $statements[] = "ALTER TABLE $table ADD COLUMN IF NOT EXISTS $column $type";
        }
    }
    $pdo->beginTransaction();
    try {
        foreach ($statements as $sql) $pdo->exec($sql);
        $pdo->commit();
        error_log('[HeritageBD] Added missing payment/refund columns to the database.');
    } catch (Throwable $e) {
        $pdo->rollBack();
        error_log('[HeritageBD] Could not update the payment schema: ' . $e->getMessage());
    }
}
