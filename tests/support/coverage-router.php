<?php
// Router for `php -S` during `npm run test:coverage`: starts line coverage for the request, then runs
// the API front controller. (php -S does not apply auto_prepend_file to its router script.)
require __DIR__ . '/coverage-prepend.php';
$_SERVER['SCRIPT_NAME'] = '/index.php';   // as when php -S runs backend/index.php itself
require __DIR__ . '/../../backend/index.php';
