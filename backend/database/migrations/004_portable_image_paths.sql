-- Image uploads are stored as API-relative paths so a copied project does not
-- retain the original machine's hostname or deployment URL.
UPDATE users
SET avatar = CONCAT('/api/', SUBSTRING_INDEX(avatar, '/api/', -1))
WHERE avatar LIKE '%/api/product-images/%' OR avatar LIKE '%/api/profile-images/%';

UPDATE vendors
SET shop_image = CASE
      WHEN shop_image LIKE '%/api/product-images/%' OR shop_image LIKE '%/api/profile-images/%'
        THEN CONCAT('/api/', SUBSTRING_INDEX(shop_image, '/api/', -1))
      ELSE shop_image
    END,
    shop_cover_image = CASE
      WHEN shop_cover_image LIKE '%/api/product-images/%' OR shop_cover_image LIKE '%/api/profile-images/%'
        THEN CONCAT('/api/', SUBSTRING_INDEX(shop_cover_image, '/api/', -1))
      ELSE shop_cover_image
    END;

UPDATE guides
SET profile_image = CONCAT('/api/', SUBSTRING_INDEX(profile_image, '/api/', -1))
WHERE profile_image LIKE '%/api/product-images/%' OR profile_image LIKE '%/api/profile-images/%';

UPDATE place_images
SET url = CONCAT('/api/', SUBSTRING_INDEX(url, '/api/', -1))
WHERE url LIKE '%/api/product-images/%' OR url LIKE '%/api/profile-images/%';

UPDATE product_images
SET url = CONCAT('/api/', SUBSTRING_INDEX(url, '/api/', -1))
WHERE url LIKE '%/api/product-images/%' OR url LIKE '%/api/profile-images/%';

UPDATE events
SET image = CONCAT('/api/', SUBSTRING_INDEX(image, '/api/', -1))
WHERE image LIKE '%/api/product-images/%' OR image LIKE '%/api/profile-images/%';

UPDATE event_images
SET url = CONCAT('/api/', SUBSTRING_INDEX(url, '/api/', -1))
WHERE url LIKE '%/api/product-images/%' OR url LIKE '%/api/profile-images/%';

UPDATE stories
SET image = CASE
      WHEN image LIKE '%/api/product-images/%' OR image LIKE '%/api/profile-images/%'
        THEN CONCAT('/api/', SUBSTRING_INDEX(image, '/api/', -1))
      ELSE image
    END,
    author_avatar = CASE
      WHEN author_avatar LIKE '%/api/product-images/%' OR author_avatar LIKE '%/api/profile-images/%'
        THEN CONCAT('/api/', SUBSTRING_INDEX(author_avatar, '/api/', -1))
      ELSE author_avatar
    END;

UPDATE review_photos
SET url = CONCAT('/api/', SUBSTRING_INDEX(url, '/api/', -1))
WHERE url LIKE '%/api/product-images/%' OR url LIKE '%/api/profile-images/%';

UPDATE trip_stops
SET place_image = CONCAT('/api/', SUBSTRING_INDEX(place_image, '/api/', -1))
WHERE place_image LIKE '%/api/product-images/%' OR place_image LIKE '%/api/profile-images/%';

UPDATE categories
SET image = CONCAT('/api/', SUBSTRING_INDEX(image, '/api/', -1))
WHERE image LIKE '%/api/product-images/%' OR image LIKE '%/api/profile-images/%';

UPDATE site_settings
SET setting_value = CONCAT('/api/', SUBSTRING_INDEX(setting_value, '/api/', -1))
WHERE setting_key LIKE '%image%'
  AND (setting_value LIKE '%/api/product-images/%' OR setting_value LIKE '%/api/profile-images/%');
