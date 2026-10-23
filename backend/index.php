<?php
/**
 * HeritageBD API - Front Controller
 * Every request is routed through here (see .htaccess).
 */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/auth.php';
require_once __DIR__ . '/helpers/throttle.php';
require_once __DIR__ . '/helpers/notify.php';
require_once __DIR__ . '/helpers/payments.php';
require_once __DIR__ . '/helpers/earnings.php';
require_once __DIR__ . '/helpers/areas.php';

foreach (glob(__DIR__ . '/controllers/*.php') as $file) {
    require_once $file;
}

$pdo = get_db();

// ---- Determine path (strip query string + base folder) --------------------
$uri  = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
if ($base !== '' && strpos($uri, $base) === 0) {
    $uri = substr($uri, strlen($base));
}
$uri    = '/' . trim($uri, '/');
$method = $_SERVER['REQUEST_METHOD'];

// ---- Route table -------------------------------------------------------
// Each entry: [METHOD, regex pattern, handler, param names in order]
$routes = [
    // Auth
    ['GET',  '#^/api/payment-terms$#',                'payment_terms_show'],
    ['GET',  '#^/api/earnings/me$#',                  'earnings_me'],
    ['GET',  '#^/api/admin/earnings$#',               'admin_earnings'],
    ['GET',  '#^/api/admin/commission-settings$#',    'commission_settings_index'],
    ['PUT',  '#^/api/admin/commission-settings$#',    'commission_settings_update'],
    ['GET',  '#^/api/site-content/homepage-images$#', 'site_homepage_images'],
    ['POST', '#^/api/auth/register$#',              'auth_register'],
    ['POST', '#^/api/auth/login$#',                  'auth_login'],
    ['POST', '#^/api/auth/logout$#',                 'auth_logout'],
    ['GET',  '#^/api/auth/me$#',                     'auth_me'],
    ['GET',  '#^/api/vendor/profile$#',              'vendor_profile_show'],
    ['PUT',  '#^/api/vendor/profile$#',              'vendor_profile_update'],
    ['POST', '#^/api/documents$#',                   'documents_upload'],
    ['GET',  '#^/api/documents$#',                   'documents_index'],
    ['POST', '#^/api/product-images$#',              'product_image_upload'],
    ['GET',  '#^/api/product-images/([a-f0-9]{32})$#', 'product_image_show'],
    ['POST', '#^/api/profile-images$#',              'profile_image_upload'],
    ['GET',  '#^/api/profile-images/([a-f0-9]{32})$#', 'profile_image_show'],
    ['GET',  '#^/api/admin/documents$#',             'admin_documents_index'],
    ['GET',  '#^/api/admin/documents/([\w-]+)/download$#', 'admin_document_download'],
    ['PUT',  '#^/api/auth/me$#',                     'auth_update_me'],
    ['PUT',  '#^/api/auth/password$#',               'auth_change_password'],
    ['POST', '#^/api/auth/forgot-password$#',        'auth_forgot_password'],
    ['POST', '#^/api/auth/reset-password$#',         'auth_reset_password'],

    // Heritage places
    ['GET',    '#^/api/places$#',                    'places_index'],
    ['POST',   '#^/api/places$#',                     'places_create'],
    ['GET',    '#^/api/places/saved$#',                'places_saved'],
    ['GET',    '#^/api/places/([\w-]+)$#',            'places_show'],
    ['PUT',    '#^/api/places/([\w-]+)$#',            'places_update'],
    ['DELETE', '#^/api/places/([\w-]+)$#',            'places_delete'],
    ['POST',   '#^/api/places/([\w-]+)/save$#',       'places_toggle_save'],
    ['GET',    '#^/api/places/([\w-]+)/reviews$#',    'reviews_for_place'],

    // Categories
    ['GET', '#^/api/categories$#', 'categories_index'],

    // Areas (divisions/districts) and traditional foods by area
    ['GET',    '#^/api/areas$#',                         'areas_index'],
    ['GET',    '#^/api/areas/resolve$#',                 'areas_resolve'],
    ['GET',    '#^/api/local-foods$#',                   'local_foods_index'],
    ['POST',   '#^/api/admin/local-foods$#',             'admin_local_food_create'],
    ['PUT',    '#^/api/admin/local-foods/([\w-]+)$#',    'admin_local_food_update'],
    ['DELETE', '#^/api/admin/local-foods/([\w-]+)$#',    'admin_local_food_delete'],

    // Guides
    ['GET',  '#^/api/guides$#',                       'guides_index'],
    ['GET',  '#^/api/guides/([\w-]+)$#',              'guides_show'],
    ['PUT',  '#^/api/guides/([\w-]+)$#',              'guides_update'],

    // Guide bookings
    ['POST', '#^/api/bookings$#',                     'bookings_create'],
    ['GET',  '#^/api/bookings$#',                     'bookings_index'],
    ['PUT',  '#^/api/bookings/([\w-]+)$#',            'bookings_update'],

    // Guide payments
    ['GET',  '#^/api/guide-payments$#',                'guide_payments_index'],
    ['POST', '#^/api/guide-payments$#',                'guide_payments_report'],
    ['PUT',  '#^/api/guide-payments/([\w-]+)/confirm$#', 'guide_payments_confirm'],

    // Admin guide management
    ['GET',  '#^/api/admin/guides$#',                 'admin_guides_index'],

    // Products / marketplace
    ['GET',    '#^/api/products$#',                   'products_index'],
    ['POST',   '#^/api/products$#',                   'products_create'],
    ['GET',    '#^/api/products/([\w-]+)$#',          'products_show'],
    ['PUT',    '#^/api/products/([\w-]+)$#',          'products_update'],
    ['DELETE', '#^/api/products/([\w-]+)$#',          'products_delete'],

    // Cart
    ['GET',    '#^/api/cart$#',                       'cart_index'],
    ['POST',   '#^/api/cart$#',                       'cart_add'],
    ['PUT',    '#^/api/cart/([\w-]+)$#',              'cart_update'],
    ['DELETE', '#^/api/cart/([\w-]+)$#',              'cart_remove'],
    ['DELETE', '#^/api/cart$#',                       'cart_clear'],

    // Orders
    ['POST', '#^/api/orders$#',                       'orders_create'],
    ['GET',  '#^/api/orders$#',                       'orders_index'],
    ['GET',  '#^/api/orders/([\w-]+)$#',              'orders_show'],
    ['PUT',  '#^/api/orders/([\w-]+)$#',              'orders_update'],

    // Pre-orders
    ['GET',  '#^/api/preorders/settings$#',           'preorders_settings'],
    ['PUT',  '#^/api/preorders/settings$#',           'preorders_settings_update'],
    ['POST', '#^/api/preorders$#',                    'preorders_create'],
    ['GET',  '#^/api/preorders$#',                    'preorders_index'],
    ['GET',  '#^/api/preorders/([\w-]+)$#',           'preorders_show'],
    ['PUT',  '#^/api/preorders/([\w-]+)$#',           'preorders_update'],

    // Events
    ['GET', '#^/api/events$#',                        'events_index'],
    ['GET', '#^/api/events/([\w-]+)$#',               'events_show'],

    // Stories
    ['GET', '#^/api/stories$#',                       'stories_index'],
    ['GET', '#^/api/stories/([\w-]+)$#',              'stories_show'],

    // Reviews
    ['GET',  '#^/api/reviews$#',                      'reviews_index'],
    ['POST', '#^/api/reviews$#',                      'reviews_create'],

    // Trip planner
    ['GET',    '#^/api/trips$#',                      'trips_index'],
    ['POST',   '#^/api/trips$#',                      'trips_create'],
    ['GET',    '#^/api/trips/([\w-]+)$#',             'trips_show'],
    ['PUT',    '#^/api/trips/([\w-]+)$#',             'trips_update'],
    ['DELETE', '#^/api/trips/([\w-]+)$#',             'trips_delete'],

    // Notifications
    ['GET', '#^/api/notifications$#',                 'notifications_index'],
    ['PUT', '#^/api/notifications/read-all$#',        'notifications_read_all'],
    ['PUT', '#^/api/notifications/([\w-]+)/read$#',   'notifications_read_one'],

    // Chat
    ['GET',  '#^/api/conversations$#',                'conversations_index'],
    ['POST', '#^/api/conversations$#',                'conversations_create'],
    ['GET',  '#^/api/conversations/([\w-]+)/messages$#', 'messages_index'],
    ['POST', '#^/api/conversations/([\w-]+)/messages$#', 'messages_create'],

    // Admin
    ['GET', '#^/api/admin/stats$#',                   'admin_stats'],
    ['GET', '#^/api/admin/users$#',                   'admin_users'],
    ['PUT', '#^/api/admin/users/([\w-]+)/status$#',  'admin_user_status'],
    ['GET', '#^/api/admin/reviews$#',                 'admin_reviews'],
    ['DELETE', '#^/api/admin/reviews/([\w-]+)$#',    'admin_review_delete'],
    ['POST',   '#^/api/admin/events$#',               'admin_event_create'],
    ['PUT',    '#^/api/admin/events/([\w-]+)$#',      'admin_event_update'],
    ['DELETE', '#^/api/admin/events/([\w-]+)$#',     'admin_event_delete'],
    ['POST',   '#^/api/admin/stories$#',              'admin_story_create'],
    ['PUT',    '#^/api/admin/stories/([\w-]+)$#',     'admin_story_update'],
    ['DELETE', '#^/api/admin/stories/([\w-]+)$#',    'admin_story_delete'],
    ['PUT',    '#^/api/admin/homepage-images$#',      'admin_homepage_images_update'],
    ['GET', '#^/api/admin/guides/pending$#',          'admin_guides_pending'],
    ['PUT', '#^/api/admin/guides/([\w-]+)/verify$#',  'admin_guide_verify'],
    ['GET', '#^/api/admin/vendors$#',                 'admin_vendors_all'],
    ['GET', '#^/api/admin/vendors/pending$#',         'admin_vendors_pending'],
    ['PUT', '#^/api/admin/vendors/([\w-]+)/verify$#', 'admin_vendor_verify'],
];

foreach ($routes as [$m, $pattern, $handler]) {
    if ($m !== $method) continue;
    if (preg_match($pattern, $uri, $matches)) {
        array_shift($matches);
        try {
            call_user_func($handler, $pdo, ...$matches);
        } catch (Throwable $e) {
            // Log the real error server-side; never expose SQL/PHP details to the client.
            error_log('[HeritageBD] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
            json_error('Something went wrong on our side. Please try again.', 500);
        }
        exit;
    }
}

json_error("Not found: $method $uri", 404);
