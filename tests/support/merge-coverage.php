<?php
// Merges the API server's per-request Xdebug data (*.xdebug) and PHPUnit's own coverage
// (phpunit.cov, from the unit tests) into one report: HTML, Clover XML and a text summary.
//   php tests/support/merge-coverage.php <partsDir> <outDir>
declare(strict_types=1);

require __DIR__ . '/../../vendor/autoload.php';

use SebastianBergmann\CodeCoverage\CodeCoverage;
use SebastianBergmann\CodeCoverage\Data\RawCodeCoverageData;
use SebastianBergmann\CodeCoverage\Driver\Selector;
use SebastianBergmann\CodeCoverage\Filter;
use SebastianBergmann\CodeCoverage\Report\Clover;
use SebastianBergmann\CodeCoverage\Report\Html\Facade as HtmlReport;
use SebastianBergmann\CodeCoverage\Report\Text;

[, $parts, $out] = $argv + [null, null, null];
$backend = realpath(__DIR__ . '/../../backend');

$filter = new Filter();
foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($backend)) as $f) {
    $path = $f->getRealPath();
    if ($f->isFile() && $f->getExtension() === 'php' && !str_contains($path, DIRECTORY_SEPARATOR . 'tests' . DIRECTORY_SEPARATOR)) {
        $filter->includeFile($path);
    }
}

$coverage = new CodeCoverage((new Selector())->forLineCoverage($filter), $filter);
$coverage->includeUncoveredFiles();

$requests = 0;
foreach (glob($parts . '/*.xdebug') as $file) {
    $coverage->append(RawCodeCoverageData::fromXdebugWithoutPathCoverage(unserialize(file_get_contents($file))), 'API request ' . ++$requests);
}
if (is_file($parts . '/phpunit.cov')) {
    $unit = include $parts . '/phpunit.cov';     // CodeCoverage object written by --coverage-php
    $coverage->merge($unit);
}

@mkdir($out, 0777, true);
(new HtmlReport())->process($coverage, $out . '/coverage');
(new Clover())->process($coverage, $out . '/coverage-clover.xml');
$text = (new Text(\SebastianBergmann\CodeCoverage\Report\Thresholds::from(50, 90), false, true))->process($coverage, false);
file_put_contents($out . '/coverage.txt', $text);
echo "Merged $requests API requests + unit tests\n", $text;
