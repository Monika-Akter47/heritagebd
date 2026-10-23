<?php
/**
 * CORS - allows the React frontend (running on a different origin/port
 * during development, e.g. Vite on :5173) to call this API.
 */

$allowedOrigin = env_or('CORS_ORIGIN', '*');

header("Access-Control-Allow-Origin: $allowedOrigin");
// Auth uses a Bearer token (not cookies), so credentials are only needed for a fixed origin.
if ($allowedOrigin !== '*') header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
