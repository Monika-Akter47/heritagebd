<?php
// Started by tests/support/coverage-router.php for every API request during `npm run test:coverage`.
// Records which lines the request executes (Xdebug) and saves Xdebug's raw data as one small file.
// Analysing the code and building the report happens once, at the end, in merge-coverage.php;
// doing it per request made each request take ~20 s.

$heritageCovDir = getenv('HERITAGE_COVERAGE_DIR');
if ($heritageCovDir && function_exists('xdebug_start_code_coverage')) {
    xdebug_start_code_coverage(XDEBUG_CC_UNUSED | XDEBUG_CC_DEAD_CODE);

    // The API ends every request with exit (json_ok / json_error), so collect in a shutdown function.
    register_shutdown_function(function () use ($heritageCovDir) {
        $backend = realpath(__DIR__ . '/../../backend');
        $data = array_filter(
            xdebug_get_code_coverage(),
            fn($file) => str_starts_with((string)realpath($file), $backend),
            ARRAY_FILTER_USE_KEY
        );
        xdebug_stop_code_coverage();
        file_put_contents($heritageCovDir . DIRECTORY_SEPARATOR . 'api-' . getmypid() . '-' . hrtime(true) . '.xdebug', serialize($data));
    });
}
