<?php
declare(strict_types=1);

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../integration/ApiTestCase.php';

// Same timezone as the API (APP_TIMEZONE), so "today" in tests matches the server.
date_default_timezone_set(getenv('APP_TIMEZONE') ?: 'Asia/Dhaka');
