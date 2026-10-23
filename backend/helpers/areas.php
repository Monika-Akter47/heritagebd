<?php
/**
 * Bangladesh divisions → districts, plus common alternate spellings and well-known
 * places, so "Chittagong", "Sreemangal" or "Paharpur" resolve to the right area.
 * Used by the products `area` filter and the local foods API.
 */

const BD_DIVISIONS = [
    'Dhaka'      => ['Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail'],
    'Chattogram' => ['Bandarban', 'Brahmanbaria', 'Chandpur', 'Chattogram', 'Cumilla', "Cox's Bazar", 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati'],
    'Rajshahi'   => ['Bogura', 'Chapainawabganj', 'Joypurhat', 'Naogaon', 'Natore', 'Pabna', 'Rajshahi', 'Sirajganj'],
    'Khulna'     => ['Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 'Khulna', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'],
    'Barishal'   => ['Barguna', 'Barishal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
    'Sylhet'     => ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
    'Rangpur'    => ['Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon'],
    'Mymensingh' => ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'],
];

// Alternate spelling or landmark (lower-case) → canonical district.
const BD_AREA_ALIASES = [
    'chittagong' => 'Chattogram', 'ctg' => 'Chattogram', 'comilla' => 'Cumilla', 'mainamati' => 'Cumilla',
    'coxs bazar' => "Cox's Bazar", 'cox bazar' => "Cox's Bazar", 'barisal' => 'Barishal', 'bogra' => 'Bogura',
    'mahasthangarh' => 'Bogura', 'jessore' => 'Jashore', 'chapai nawabganj' => 'Chapainawabganj',
    'nawabganj' => 'Chapainawabganj', 'paharpur' => 'Naogaon', 'puthia' => 'Rajshahi',
    'maulvibazar' => 'Moulvibazar', 'sreemangal' => 'Moulvibazar', 'srimangal' => 'Moulvibazar',
    'jhalakathi' => 'Jhalokati', 'kuakata' => 'Patuakhali', 'sundarbans' => 'Khulna', 'mongla' => 'Bagerhat',
    'sonargaon' => 'Narayanganj', 'panam' => 'Narayanganj', 'old dhaka' => 'Dhaka', 'savar' => 'Dhaka',
    'muktagacha' => 'Mymensingh', 'kantajew' => 'Dinajpur', 'kantaji' => 'Dinajpur', 'netrakona' => 'Netrokona',
    'saint martin' => "Cox's Bazar", 'bhimruli' => 'Jhalokati', 'porabari' => 'Tangail',
];

function area_normalize(string $s): string {
    $s = strtolower(trim($s));
    $s = str_replace(["'", '’', '.', ','], '', $s);
    return preg_replace('/\s+/', ' ', $s);
}

function area_division_of(string $district): ?string {
    foreach (BD_DIVISIONS as $division => $districts) {
        if (in_array($district, $districts, true)) return $division;
    }
    return null;
}

/**
 * Resolves free text ("Chittagong", "Srimangal Tea Gardens", "Sylhet") to
 * ['type' => 'division'|'district', 'name', 'division', 'districts'] or null.
 * A division name wins over the same-named district ("Sylhet" → whole division)
 * unless $preferDistrict is set, which a place page uses for its own district.
 */
function resolve_area(string $input, bool $preferDistrict = false): ?array {
    $needle = area_normalize($input);
    if ($needle === '') return null;

    // Every division shares its name with a district, so $preferDistrict simply skips this.
    if (!$preferDistrict) {
        foreach (array_keys(BD_DIVISIONS) as $division) {
            if (area_normalize($division) === $needle) return area_for_division($division);
        }
    }
    $district = null;
    foreach (BD_DIVISIONS as $districts) {
        foreach ($districts as $d) if (area_normalize($d) === $needle) $district = $d;
    }
    $district = $district ?? (BD_AREA_ALIASES[$needle] ?? null);

    // Longer text such as a destination name: look for any known name inside it.
    if (!$district) {
        $candidates = array_merge(array_merge(...array_values(BD_DIVISIONS)), array_keys(BD_AREA_ALIASES));
        usort($candidates, fn($a, $b) => strlen($b) <=> strlen($a));
        foreach ($candidates as $c) {
            if (preg_match('/\b' . preg_quote(area_normalize($c), '/') . '\b/', $needle)) {
                $district = BD_AREA_ALIASES[area_normalize($c)] ?? $c;
                break;
            }
        }
    }
    if (!$district) return null;
    $division = area_division_of($district);
    return ['type' => 'district', 'name' => $district, 'division' => $division, 'districts' => [$district]];
}

function area_for_division(string $division): array {
    return ['type' => 'division', 'name' => $division, 'division' => $division, 'districts' => BD_DIVISIONS[$division]];
}

/**
 * Terms for an area query: `focus` is what the user asked for, `broad` is what the
 * query matches. A district is widened to its division (unless $exact) so a small
 * district is topped up with nearby items; callers sort `focus` matches first.
 */
function area_query_terms(array $area, bool $exact): array {
    $focus = area_search_terms($area);
    $broad = ($area['type'] === 'district' && !$exact && $area['division'])
        ? area_search_terms(area_for_division($area['division']))
        : $focus;
    return ['focus' => $focus, 'broad' => $broad];
}

/** Every spelling worth matching against free-text location columns for a resolved area. */
function area_search_terms(array $area): array {
    $terms = $area['districts'];
    if ($area['type'] === 'division') $terms[] = $area['division'];
    foreach (BD_AREA_ALIASES as $alias => $district) {
        if (in_array($district, $area['districts'], true) && strlen($alias) > 3) $terms[] = $alias;
    }
    return array_values(array_unique($terms));
}

function areas_index(PDO $pdo): void {
    $out = [];
    foreach (BD_DIVISIONS as $division => $districts) $out[] = ['division' => $division, 'districts' => $districts];
    json_ok($out);
}

function areas_resolve(PDO $pdo): void {
    json_ok(resolve_area((string)($_GET['q'] ?? ''), ($_GET['scope'] ?? '') === 'district'));
}
