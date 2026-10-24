-- ============================================================================
-- HeritageBD - Demo Seed Data (generated from src/data/mockData.ts)
-- All demo accounts use the password: password123
-- Demo image URLs are public HTTPS URLs; uploaded images use portable /api/... paths.
-- ============================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
USE heritagebd;

-- Categories
INSERT INTO categories (id, name, icon) VALUES ('mosque', 'Mosques', 'landmark');
INSERT INTO categories (id, name, icon) VALUES ('fort', 'Forts', 'castle');
INSERT INTO categories (id, name, icon) VALUES ('palace', 'Palaces', 'building');
INSERT INTO categories (id, name, icon) VALUES ('temple', 'Temples', 'landmark');
INSERT INTO categories (id, name, icon) VALUES ('monument', 'Monuments', 'monument');
INSERT INTO categories (id, name, icon) VALUES ('archaeological', 'Archaeological Sites', 'pickaxe');
INSERT INTO categories (id, name, icon) VALUES ('natural', 'Natural Wonders', 'mountain');
INSERT INTO categories (id, name, icon) VALUES ('museum', 'Museums', 'museum');

-- Core demo accounts
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES
('admin1', 'Admin User', 'admin@heritagebd.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', '+880 1700-000000', NULL, 'admin', 1, 'active');
INSERT INTO admins (user_id, permissions) VALUES ('admin1', '["all"]');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES
('tourist1', 'Monika Rahman', 'tourist@heritagebd.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', '+880 171-234-5678', '/api/product-images/b75245057d1f66a6e1f28959493bb669', 'tourist', 1, 'active');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES
('tourist-1', 'Monika Rahman', 'monika@heritagebd.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', '+880 171-234-5678', '/api/product-images/b75245057d1f66a6e1f28959493bb669', 'tourist', 1, 'active');

-- Vendors
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('v1', 'Rahima Khatun', 'rahima@muslinhouse.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/a267387730a3ad03cde593ca8f5762c1', 'vendor', 1, 'active');
INSERT INTO vendors (user_id, shop_name, shop_description, shop_image, location, rating, total_sales, verification_status) VALUES ('v1', 'Dhaka Muslin House', 'Premium Jamdani and Muslin textiles from Dhaka', NULL, 'Mirpur, Dhaka', 4.8, 1240, 'verified');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('v2', 'Karim Ullah', 'karim@rajshahicraft.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/6a1fd8b387fb84eaafdb777895c3c64c', 'vendor', 1, 'active');
INSERT INTO vendors (user_id, shop_name, shop_description, shop_image, location, rating, total_sales, verification_status) VALUES ('v2', 'Rajshahi Silk Emporium', 'Authentic Rajshahi silk products and handicrafts', NULL, 'Rajshahi City', 4.6, 890, 'rejected');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('v3', 'Fatema Begum', 'fatema@nokshikatha.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/80ea735e9138eb83b035c76fe03f499c', 'vendor', 1, 'active');
INSERT INTO vendors (user_id, shop_name, shop_description, shop_image, location, rating, total_sales, verification_status) VALUES ('v3', 'Nokshi Katha Studio', 'Traditional Nokshi Katha quilts and embroidery from Jamalpur', NULL, 'Jamalpur', 4.9, 560, 'pending');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('v4', 'Mohammad Hossain', 'hossain@sylhetitea.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/0cdb2d602989bf6c81e30a45c9cfbb44', 'vendor', 1, 'active');
INSERT INTO vendors (user_id, shop_name, shop_description, shop_image, location, rating, total_sales, verification_status) VALUES ('v4', 'Sylheti Tea Garden', 'Premium tea from the lush gardens of Sylhet', NULL, 'Sylhet', 4.7, 2100, 'pending');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('v-1', 'Fatema Begum', 'fatema@example.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, NULL, 'vendor', 1, 'active');
INSERT INTO vendors (user_id, shop_name, shop_description, shop_image, location, rating, total_sales, verification_status) VALUES ('v-1', 'Sonargaon Food Corner', 'Authentic traditional Bangladeshi food made with love.', NULL, 'Sonargaon, Narayanganj', 4.8, 320, 'verified');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('v-2', 'Rina Akter', 'rina@example.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, NULL, 'vendor', 1, 'active');
INSERT INTO vendors (user_id, shop_name, shop_description, shop_image, location, rating, total_sales, verification_status) VALUES ('v-2', 'Kantha Craft Collective', 'Preserving the ancient art of Nakshi Kantha embroidery.', NULL, 'Sonargaon, Narayanganj', 4.9, 180, 'verified');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('v-3', 'Karim Pottery', 'karim@example.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, NULL, 'vendor', 1, 'active');
INSERT INTO vendors (user_id, shop_name, shop_description, shop_image, location, rating, total_sales, verification_status) VALUES ('v-3', 'Mritkala Pottery Studio', 'Traditional clay pottery from the heart of Rajshahi.', NULL, 'Rajshahi Sadar', 4.7, 210, 'verified');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('v-4', 'Sylhet Spice House', 'spice@example.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, NULL, 'vendor', 1, 'active');
INSERT INTO vendors (user_id, shop_name, shop_description, shop_image, location, rating, total_sales, verification_status) VALUES ('v-4', 'Sylhet Spice House', 'Authentic Sylheti spices and pickles since 1998.', NULL, 'Sylhet Sadar', 4.6, 450, 'verified');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('v-5', 'Muslin Heritage Workshop', 'muslin@example.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, NULL, 'vendor', 1, 'active');
INSERT INTO vendors (user_id, shop_name, shop_description, shop_image, location, rating, total_sales, verification_status) VALUES ('v-5', 'Dhakai Muslin House', 'Reviving the legendary Muslin weaving tradition of Dhaka.', NULL, 'Old Dhaka, Dhaka', 5, 95, 'verified');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('v-6', 'Sundarbans Natural Co.', 'sundarbans@example.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, NULL, 'vendor', 1, 'active');
INSERT INTO vendors (user_id, shop_name, shop_description, shop_image, location, rating, total_sales, verification_status) VALUES ('v-6', 'Sundarbans Natural Products', 'Direct from the world\'s largest mangrove forest.', NULL, 'Khulna', 4.9, 380, 'verified');

-- Guides
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('g1', 'Arif Hassan', 'arif@guide.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/7aac16cfe0787c52e1ab6da0d4d4ecd1', 'guide', 1, 'active');
INSERT INTO guides (user_id, bio, location, lat, lng, price_per_day, rating, review_count, tours_completed, years_experience, is_available, is_location_sharing, profile_image, verification_status) VALUES ('g1', 'Passionate heritage enthusiast with 12 years of experience guiding tourists through Bangladesh\'s rich historical sites. Specializing in Mughal architecture and Buddhist heritage.', 'Dhaka', 23.7104, 90.4074, 2500, 4.9, 128, 340, 12, 1, 1, '/api/product-images/7aac16cfe0787c52e1ab6da0d4d4ecd1', 'verified');
INSERT INTO guide_languages (guide_id, language) VALUES ('g1', 'Bengali');
INSERT INTO guide_languages (guide_id, language) VALUES ('g1', 'English');
INSERT INTO guide_languages (guide_id, language) VALUES ('g1', 'Hindi');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g1', 'Mughal History');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g1', 'Buddhist Heritage');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g1', 'Archaeological Sites');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g1', 'Old Dhaka');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g1', 'National Tourism Board Certified');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g1', 'UNESCO Heritage Guide');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g1', 'Dhaka');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g1', 'Narayanganj');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g1', 'Munshiganj');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g1', 'Old Dhaka Heritage Walk', '1 day', 2500, 'Explore Lalbagh Fort, Ahsan Manzil, Star Mosque and more');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g1', 'Mughal Bangladesh Tour', '3 days', 7000, 'Comprehensive tour of Mughal era monuments');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('g2', 'Nazmul Huda', 'nazmul@guide.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/f9334c22ad1f93059d123513c225eca9', 'guide', 1, 'active');
INSERT INTO guides (user_id, bio, location, lat, lng, price_per_day, rating, review_count, tours_completed, years_experience, is_available, is_location_sharing, profile_image, verification_status) VALUES ('g2', 'Wildlife and eco-tourism specialist with extensive knowledge of the Sundarbans. Certified wildlife guide and nature photographer.', 'Khulna', 22.8456, 89.5403, 3000, 4.8, 94, 210, 8, 1, 0, '/api/product-images/f9334c22ad1f93059d123513c225eca9', 'verified');
INSERT INTO guide_languages (guide_id, language) VALUES ('g2', 'Bengali');
INSERT INTO guide_languages (guide_id, language) VALUES ('g2', 'English');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g2', 'Sundarbans');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g2', 'Wildlife');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g2', 'Eco-Tourism');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g2', 'Bird Watching');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g2', 'Wildlife Guide Certification');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g2', 'Forest Department Approved');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g2', 'Khulna');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g2', 'Satkhira');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g2', 'Bagerhat');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g2', 'Sundarbans');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g2', 'Sundarbans Day Tour', '1 day', 3500, 'Day trip into the Sundarbans mangrove forest');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g2', 'Royal Bengal Tiger Safari', '3 days', 12000, 'In-depth Sundarbans expedition');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('g3', 'Sultana Razia', 'sultana@guide.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/f7bafbb48194b4f868b7bd0604244eee', 'guide', 1, 'active');
INSERT INTO guides (user_id, bio, location, lat, lng, price_per_day, rating, review_count, tours_completed, years_experience, is_available, is_location_sharing, profile_image, verification_status) VALUES ('g3', 'Expert in culinary tourism and handicraft heritage. Takes visitors on immersive food tours and artisan workshops across Bangladesh.', 'Rajshahi', 24.3745, 88.6042, 2000, 4.7, 76, 155, 6, 1, 1, '/api/product-images/f7bafbb48194b4f868b7bd0604244eee', 'rejected');
INSERT INTO guide_languages (guide_id, language) VALUES ('g3', 'Bengali');
INSERT INTO guide_languages (guide_id, language) VALUES ('g3', 'English');
INSERT INTO guide_languages (guide_id, language) VALUES ('g3', 'Arabic');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g3', 'Culinary Tourism');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g3', 'Handicrafts');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g3', 'Textile Heritage');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g3', 'Cultural Experiences');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g3', 'Cultural Tourism Specialist');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g3', 'Handicraft Heritage Guide');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g3', 'Rajshahi');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g3', 'Chapai Nawabganj');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g3', 'Naogaon');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g3', 'Silk & Spice Trail', '2 days', 4500, 'Rajshahi silk heritage and local cuisine');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g3', 'Artisan Village Tour', '1 day', 2000, 'Visit weaving villages and pottery workshops');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('g4', 'Kabir Ahmed', 'kabir@guide.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/3850f26da16aad475972965d7b9681aa', 'guide', 1, 'active');
INSERT INTO guides (user_id, bio, location, lat, lng, price_per_day, rating, review_count, tours_completed, years_experience, is_available, is_location_sharing, profile_image, verification_status) VALUES ('g4', 'Adventure and tea garden specialist based in Sylhet. Leads treks through rolling tea gardens and into the hill tracts.', 'Sylhet', 24.8949, 91.8687, 2200, 4.6, 62, 120, 5, 0, 0, '/api/product-images/3850f26da16aad475972965d7b9681aa', 'verified');
INSERT INTO guide_languages (guide_id, language) VALUES ('g4', 'Bengali');
INSERT INTO guide_languages (guide_id, language) VALUES ('g4', 'English');
INSERT INTO guide_languages (guide_id, language) VALUES ('g4', 'Sylheti');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g4', 'Tea Gardens');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g4', 'Hill Treks');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g4', 'Eco-Tourism');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g4', 'Adventure Travel');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g4', 'Adventure Tourism Guide');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g4', 'First Aid Certified');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g4', 'Sylhet');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g4', 'Moulvibazar');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g4', 'Srimangal');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g4', 'Jaflong');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g4', 'Sylhet Tea Country Tour', '2 days', 4800, 'Immersive tea garden experience with village visits');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g4', 'Haor Wetland Expedition', '1 day', 2500, 'Boat tour of the Haor ecosystem');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('g5', 'Priya Chakraborty', 'priya@guide.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/51672df25f43080792e5dde1768ecf88', 'guide', 1, 'active');
INSERT INTO guides (user_id, bio, location, lat, lng, price_per_day, rating, review_count, tours_completed, years_experience, is_available, is_location_sharing, profile_image, verification_status) VALUES ('g5', 'Hindu temple expert and cultural guide specializing in religious heritage sites of northern Bangladesh.', 'Dinajpur', 25.6279, 88.6331, 1800, 4.8, 45, 90, 4, 1, 1, '/api/product-images/51672df25f43080792e5dde1768ecf88', 'verified');
INSERT INTO guide_languages (guide_id, language) VALUES ('g5', 'Bengali');
INSERT INTO guide_languages (guide_id, language) VALUES ('g5', 'English');
INSERT INTO guide_languages (guide_id, language) VALUES ('g5', 'Hindi');
INSERT INTO guide_languages (guide_id, language) VALUES ('g5', 'Sanskrit basics');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g5', 'Hindu Temples');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g5', 'Religious Heritage');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g5', 'Cultural Tours');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g5', 'Northern Bangladesh');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g5', 'Religious Heritage Guide');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g5', 'Cultural Tourism Specialist');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g5', 'Dinajpur');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g5', 'Rangpur');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g5', 'Nilphamari');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g5', 'Panchagarh');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g5', 'Temple Trail of North Bengal', '3 days', 5500, 'Explore terracotta temples and Zamindari estates');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g5', 'Kantajew Temple Day Tour', '1 day', 1800, 'Visit the magnificent Kantajew terracotta temple');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('g6', 'Rahim Uddin', 'rahim@guide.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/177bd980a2723fa5de65efa88d4eef91', 'guide', 1, 'active');
INSERT INTO guides (user_id, bio, location, lat, lng, price_per_day, rating, review_count, tours_completed, years_experience, is_available, is_location_sharing, profile_image, verification_status) VALUES ('g6', 'Beach and marine tourism expert based in Cox\'s Bazar. Specializes in coastal heritage and island hopping.', 'Cox\'s Bazar', 21.4272, 92.0058, 2800, 4.5, 88, 190, 9, 1, 1, '/api/product-images/177bd980a2723fa5de65efa88d4eef91', 'pending');
INSERT INTO guide_languages (guide_id, language) VALUES ('g6', 'Bengali');
INSERT INTO guide_languages (guide_id, language) VALUES ('g6', 'English');
INSERT INTO guide_languages (guide_id, language) VALUES ('g6', 'Chittagonian');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g6', 'Beach Tourism');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g6', 'Island Tours');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g6', 'Marine Life');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g6', 'Cox\'s Bazar');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g6', 'Marine Tourism Guide');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g6', 'Boat License');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g6', 'Cox\'s Bazar');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g6', 'Teknaf');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g6', 'Saint Martin Island');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g6', 'Maheshkhali');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g6', 'Cox\'s Bazar Complete Tour', '3 days', 8500, 'Beach, islands, and Buddhist monasteries');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g6', 'Saint Martin Island Day Trip', '1 day', 3500, 'Boat tour to the coral island');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('g7', 'Monira Islam', 'monira@guide.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/495ec3cca5f570021acc9f3235ac0440', 'guide', 1, 'active');
INSERT INTO guides (user_id, bio, location, lat, lng, price_per_day, rating, review_count, tours_completed, years_experience, is_available, is_location_sharing, profile_image, verification_status) VALUES ('g7', 'Specialist in Dhaka cultural experiences, street food tours, and art scene. Makes visitors fall in love with Old Dhaka.', 'Dhaka', 23.7104, 90.4074, 1500, 4.9, 156, 420, 7, 1, 1, '/api/product-images/495ec3cca5f570021acc9f3235ac0440', 'verified');
INSERT INTO guide_languages (guide_id, language) VALUES ('g7', 'Bengali');
INSERT INTO guide_languages (guide_id, language) VALUES ('g7', 'English');
INSERT INTO guide_languages (guide_id, language) VALUES ('g7', 'Japanese');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g7', 'Street Food');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g7', 'Urban Culture');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g7', 'Art Scene');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g7', 'Old Dhaka');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g7', 'Culinary Tourism Guide');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g7', 'National Tourism Board Certified');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g7', 'Dhaka City');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g7', 'Old Dhaka');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g7', 'Narayanganj');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g7', 'Old Dhaka Food Safari', '1 day', 1500, 'Street food exploration through Old Dhaka');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g7', 'Dhaka Art & Culture Tour', '1 day', 2000, 'Visit galleries, artisan workshops, and cultural centers');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('g8', 'Farhan Tanvir', 'farhan@guide.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/2bf1ba93d3bbdc7116c1a73831771da9', 'guide', 1, 'active');
INSERT INTO guides (user_id, bio, location, lat, lng, price_per_day, rating, review_count, tours_completed, years_experience, is_available, is_location_sharing, profile_image, verification_status) VALUES ('g8', 'Archaeological heritage specialist with a PhD in Bengali history. Expert in Paharpur, Mainamati, and Wari-Bateshwar sites.', 'Rajshahi', 24.3745, 88.6042, 3500, 5, 38, 75, 10, 1, 0, '/api/product-images/2bf1ba93d3bbdc7116c1a73831771da9', 'verified');
INSERT INTO guide_languages (guide_id, language) VALUES ('g8', 'Bengali');
INSERT INTO guide_languages (guide_id, language) VALUES ('g8', 'English');
INSERT INTO guide_languages (guide_id, language) VALUES ('g8', 'French');
INSERT INTO guide_languages (guide_id, language) VALUES ('g8', 'German');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g8', 'Archaeological Sites');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g8', 'Buddhist Heritage');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g8', 'Ancient History');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g8', 'Academic Tours');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g8', 'PhD Bengali History');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g8', 'UNESCO Heritage Specialist');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g8', 'ICOMOS Member');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g8', 'Rajshahi');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g8', 'Naogaon');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g8', 'Chapai Nawabganj');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g8', 'Bogura');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g8', 'Paharpur & Mahasthangarh Tour', '2 days', 7000, 'Deep dive into ancient Bengali civilization');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g8', 'Academic Heritage Tour', '5 days', 18000, 'Comprehensive scholarly tour of all major sites');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('g9', 'Nasrin Akter', 'nasrin@guide.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/1ec8bcdb617f531630c35c5b10006eed', 'guide', 1, 'active');
INSERT INTO guides (user_id, bio, location, lat, lng, price_per_day, rating, review_count, tours_completed, years_experience, is_available, is_location_sharing, profile_image, verification_status) VALUES ('g9', 'Family and accessible tourism specialist. Creates comfortable heritage experiences for families and travelers with special needs.', 'Dhaka', 23.75, 90.375, 1800, 4.7, 72, 180, 5, 1, 1, '/api/product-images/1ec8bcdb617f531630c35c5b10006eed', 'pending');
INSERT INTO guide_languages (guide_id, language) VALUES ('g9', 'Bengali');
INSERT INTO guide_languages (guide_id, language) VALUES ('g9', 'English');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g9', 'Family Tours');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g9', 'Accessible Tourism');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g9', 'School Trips');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g9', 'Cultural Heritage');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g9', 'Family Tourism Guide');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g9', 'Special Needs Tourism Certified');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g9', 'Dhaka');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g9', 'Gazipur');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g9', 'Narayanganj');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g9', 'Family Heritage Day', '1 day', 2200, 'Kid-friendly heritage tour with interactive activities');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g9', 'School Heritage Program', '1 day', 1500, 'Educational tour for school groups');
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('g10', 'Jahangir Alam', 'jahangir@guide.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/e8b871ebe1f26f31f922cee8243f3d94', 'guide', 1, 'active');
INSERT INTO guides (user_id, bio, location, lat, lng, price_per_day, rating, review_count, tours_completed, years_experience, is_available, is_location_sharing, profile_image, verification_status) VALUES ('g10', 'Chittagong Hill Tracts specialist offering authentic tribal cultural experiences and trekking adventures.', 'Rangamati', 22.6306, 92.2001, 3200, 4.8, 55, 110, 8, 1, 0, '/api/product-images/e8b871ebe1f26f31f922cee8243f3d94', 'verified');
INSERT INTO guide_languages (guide_id, language) VALUES ('g10', 'Bengali');
INSERT INTO guide_languages (guide_id, language) VALUES ('g10', 'English');
INSERT INTO guide_languages (guide_id, language) VALUES ('g10', 'Chakma');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g10', 'Tribal Culture');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g10', 'Hill Treks');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g10', 'CHT Heritage');
INSERT INTO guide_specializations (guide_id, specialization) VALUES ('g10', 'Photography Tours');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g10', 'CHT Tourism Permit');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g10', 'Trekking Guide Certified');
INSERT INTO guide_certifications (guide_id, certification) VALUES ('g10', 'Cultural Ambassador');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g10', 'Rangamati');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g10', 'Bandarban');
INSERT INTO guide_cover_areas (guide_id, area) VALUES ('g10', 'Khagrachhari');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g10', 'Rangamati Lake Tour', '2 days', 7500, 'Kaptai Lake boat tour and tribal village visits');
INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES ('g10', 'Bandarban Mountain Trek', '4 days', 14000, 'Trek to Keokradong and tribal homesteads');

-- Heritage Places
INSERT INTO heritage_places (id, name, name_local, description, historical_background, significance, location, district, division, lat, lng, category, rating, review_count, open_time, close_time, entry_fee, best_time, featured, established) VALUES ('p1', 'Lalbagh Fort', 'লালবাগ কেল্লা', 'An incomplete 17th-century Mughal fort complex in Dhaka, one of the most visited historical sites in Bangladesh.', 'Construction began in 1678 AD under Prince Muhammad Azam, son of Emperor Aurangzeb. The fort was left incomplete after the death of Pari Bibi, whose mausoleum lies within the complex.', 'A masterpiece of Mughal architecture representing the cultural and historical heritage of Dhaka. The fort contains the tomb of Bibi Pari (Pari Bibi), a mosque, and the Diwan-i-Aam.', 'Lalbagh, Dhaka', 'Dhaka', 'Dhaka', 23.7194, 90.3876, 'fort', 4.5, 1240, '10:00 AM', '6:00 PM', '20 BDT (locals), 200 BDT (foreigners)', 'October to March', 1, '1678 AD');
INSERT INTO place_images (place_id, url, sort_order) VALUES ('p1', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 0);
INSERT INTO place_tags (place_id, tag) VALUES ('p1', 'Mughal');
INSERT INTO place_tags (place_id, tag) VALUES ('p1', 'Fort');
INSERT INTO place_tags (place_id, tag) VALUES ('p1', 'Historical');
INSERT INTO place_tags (place_id, tag) VALUES ('p1', 'Architecture');
INSERT INTO place_tags (place_id, tag) VALUES ('p1', 'Dhaka');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p1', 'Ahsan Manzil');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p1', 'Star Mosque');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p1', 'Dhakeswari Temple');
INSERT INTO heritage_places (id, name, name_local, description, historical_background, significance, location, district, division, lat, lng, category, rating, review_count, open_time, close_time, entry_fee, best_time, featured, established) VALUES ('p2', 'Ahsan Manzil', 'আহসান মঞ্জিল', 'The Pink Palace — former residential palace of the Nawabs of Dhaka, now a museum housing Mughal and British-era artifacts.', 'Built in 1872 by Nawab Abdul Ghani, Ahsan Manzil served as the official residential palace and seat of the Dhaka Nawab estate. It was reconstructed after an explosion destroyed part of the building in 1888.', 'One of the finest examples of Indo-Saracenic architecture in Bangladesh, this pink-hued palace symbolizes the grandeur of the Nawab era.', 'Kumartuli, Old Dhaka', 'Dhaka', 'Dhaka', 23.7078, 90.3977, 'palace', 4.7, 980, '10:30 AM', '5:30 PM', '15 BDT (locals), 150 BDT (foreigners)', 'November to February', 1, '1872');
INSERT INTO place_images (place_id, url, sort_order) VALUES ('p2', '/api/product-images/f2a3847b9c37fd965a0be5e0d3e938f2', 0);
INSERT INTO place_tags (place_id, tag) VALUES ('p2', 'Palace');
INSERT INTO place_tags (place_id, tag) VALUES ('p2', 'Museum');
INSERT INTO place_tags (place_id, tag) VALUES ('p2', 'Nawab');
INSERT INTO place_tags (place_id, tag) VALUES ('p2', 'British Era');
INSERT INTO place_tags (place_id, tag) VALUES ('p2', 'Architecture');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p2', 'Lalbagh Fort');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p2', 'Dhaka University');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p2', 'Sadarghat Launch Terminal');
INSERT INTO heritage_places (id, name, name_local, description, historical_background, significance, location, district, division, lat, lng, category, rating, review_count, open_time, close_time, entry_fee, best_time, featured, established) VALUES ('p3', 'Paharpur Buddhist Monastery', 'পাহাড়পুর বৌদ্ধ বিহার', 'A UNESCO World Heritage Site — ruins of the largest Buddhist monastery south of the Himalayas, dating back to the 8th century.', 'Founded in the 8th century by the Pala dynasty king Dharmapala, Somapura Mahavihara was the greatest Buddhist monastery in the Indian subcontinent. It remained an important center of Buddhism for about 400 years.', 'UNESCO World Heritage Site since 1985. The monastery represents a unique artistic achievement and had a profound influence on Buddhist architecture in Southeast Asia.', 'Paharpur, Naogaon', 'Naogaon', 'Rajshahi', 25.0305, 88.9734, 'archaeological', 4.8, 720, '9:00 AM', '5:00 PM', '20 BDT (locals), 200 BDT (foreigners)', 'October to March', 1, '8th Century AD');
INSERT INTO place_images (place_id, url, sort_order) VALUES ('p3', '/api/product-images/8e062215d1b62952822a5613b40250d8', 0);
INSERT INTO place_tags (place_id, tag) VALUES ('p3', 'UNESCO');
INSERT INTO place_tags (place_id, tag) VALUES ('p3', 'Buddhist');
INSERT INTO place_tags (place_id, tag) VALUES ('p3', 'Archaeological');
INSERT INTO place_tags (place_id, tag) VALUES ('p3', 'Pala Dynasty');
INSERT INTO place_tags (place_id, tag) VALUES ('p3', 'Ancient');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p3', 'Kusumba Mosque');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p3', 'Rajshahi City');
INSERT INTO heritage_places (id, name, name_local, description, historical_background, significance, location, district, division, lat, lng, category, rating, review_count, open_time, close_time, entry_fee, best_time, featured, established) VALUES ('p4', 'Shat Gambuj Mosque', 'ষাট গম্বুজ মসজিদ', 'The largest mosque of the Sultanate period in Bangladesh, a UNESCO World Heritage Site in Bagerhat.', 'Built in the 15th century by Khan Jahan Ali, the mosque gets its name from its 60 pillars that support 77 domes. It is one of the finest examples of Islamic architecture in Asia.', 'UNESCO World Heritage Site. The mosque showcases the ingenuity of medieval Islamic architecture and represents the Sultanate period of Bangladesh.', 'Bagerhat', 'Bagerhat', 'Khulna', 22.6601, 89.7298, 'mosque', 4.9, 850, 'Open daily', 'Until sunset', 'Free (museum: 20 BDT)', 'October to March', 1, '15th Century AD');
INSERT INTO place_images (place_id, url, sort_order) VALUES ('p4', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 0);
INSERT INTO place_tags (place_id, tag) VALUES ('p4', 'UNESCO');
INSERT INTO place_tags (place_id, tag) VALUES ('p4', 'Mosque');
INSERT INTO place_tags (place_id, tag) VALUES ('p4', 'Sultanate');
INSERT INTO place_tags (place_id, tag) VALUES ('p4', 'Medieval');
INSERT INTO place_tags (place_id, tag) VALUES ('p4', 'Architecture');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p4', 'Tomb of Khan Jahan Ali');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p4', 'Sundarban');
INSERT INTO heritage_places (id, name, name_local, description, historical_background, significance, location, district, division, lat, lng, category, rating, review_count, open_time, close_time, entry_fee, best_time, featured, established) VALUES ('p5', 'Kantajew Temple', 'কান্তজীর মন্দির', 'A magnificent 18th-century terracotta temple dedicated to Lord Krishna in Dinajpur — famous for its intricate clay carvings.', 'Built by Maharaja Pran Nath in 1722, the temple is considered one of the finest examples of terracotta architecture in the subcontinent. Originally nine-spired, it lost its spires in an 1897 earthquake.', 'The temple walls are covered with thousands of terracotta plaques depicting scenes from Hindu epics, making it a unique artistic treasure of Bangladesh.', 'Kantanagar, Dinajpur', 'Dinajpur', 'Rangpur', 25.8529, 88.6337, 'temple', 4.7, 540, '8:00 AM', '6:00 PM', '20 BDT (locals), 200 BDT (foreigners)', 'October to March', 0, '1722 AD');
INSERT INTO place_images (place_id, url, sort_order) VALUES ('p5', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 0);
INSERT INTO place_tags (place_id, tag) VALUES ('p5', 'Temple');
INSERT INTO place_tags (place_id, tag) VALUES ('p5', 'Terracotta');
INSERT INTO place_tags (place_id, tag) VALUES ('p5', 'Hindu');
INSERT INTO place_tags (place_id, tag) VALUES ('p5', 'Architecture');
INSERT INTO place_tags (place_id, tag) VALUES ('p5', 'Artisan');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p5', 'Dinajpur Rajbari');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p5', 'Ramna Dighi');
INSERT INTO heritage_places (id, name, name_local, description, historical_background, significance, location, district, division, lat, lng, category, rating, review_count, open_time, close_time, entry_fee, best_time, featured, established) VALUES ('p6', 'Sonargaon', 'সোনারগাঁও', 'The ancient capital of Bengal — a living heritage town with Mughal palaces, folk art museum, and traditional weaving villages.', 'Sonargaon served as the capital of Bengal from the 13th to 17th centuries. During the Mughal period, it was a major center for muslin production and trade.', 'Known as the "City of Gold", Sonargaon houses the Bangladesh Folk Art and Craft Foundation and the Panam City ruins, offering a glimpse into Bengal\'s golden era.', 'Sonargaon, Narayanganj', 'Narayanganj', 'Dhaka', 23.6618, 90.5985, 'monument', 4.4, 620, '9:00 AM', '5:00 PM', '10 BDT (locals), 100 BDT (foreigners)', 'November to February', 1, '13th Century AD');
INSERT INTO place_images (place_id, url, sort_order) VALUES ('p6', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 0);
INSERT INTO place_tags (place_id, tag) VALUES ('p6', 'Ancient Capital');
INSERT INTO place_tags (place_id, tag) VALUES ('p6', 'Mughal');
INSERT INTO place_tags (place_id, tag) VALUES ('p6', 'Folk Art');
INSERT INTO place_tags (place_id, tag) VALUES ('p6', 'History');
INSERT INTO place_tags (place_id, tag) VALUES ('p6', 'Culture');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p6', 'Panam City');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p6', 'Goaldi Mosque');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p6', 'Folk Art Museum');
INSERT INTO heritage_places (id, name, name_local, description, historical_background, significance, location, district, division, lat, lng, category, rating, review_count, open_time, close_time, entry_fee, best_time, featured, established) VALUES ('p7', 'Sundarbans Mangrove Forest', 'সুন্দরবন', 'The world\'s largest mangrove forest — UNESCO World Heritage Site and home to the Bengal Tiger.', 'The Sundarbans, meaning "beautiful forest," spans Bangladesh and India. It has been inhabited for centuries by fishing communities and was declared a UNESCO World Heritage Site in 1997.', 'Home to the Royal Bengal Tiger and Irrawaddy Dolphin, the Sundarbans is a biodiversity hotspot and natural wonder of immense ecological importance.', 'Khulna Division', 'Khulna / Satkhira / Bagerhat', 'Khulna', 22.1666, 89.5338, 'natural', 4.9, 1560, 'With guided tour', 'Before sunset', 'Varies by tour package', 'November to March', 1, 'Natural');
INSERT INTO place_images (place_id, url, sort_order) VALUES ('p7', '/api/product-images/3a09797c636ad5a4c6753f91effa8c14', 0);
INSERT INTO place_tags (place_id, tag) VALUES ('p7', 'UNESCO');
INSERT INTO place_tags (place_id, tag) VALUES ('p7', 'Tiger');
INSERT INTO place_tags (place_id, tag) VALUES ('p7', 'Mangrove');
INSERT INTO place_tags (place_id, tag) VALUES ('p7', 'Wildlife');
INSERT INTO place_tags (place_id, tag) VALUES ('p7', 'Nature');
INSERT INTO place_tags (place_id, tag) VALUES ('p7', 'Eco-Tourism');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p7', 'Shat Gambuj Mosque');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p7', 'Bagerhat Museum');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p7', 'Kuakata Beach');
INSERT INTO heritage_places (id, name, name_local, description, historical_background, significance, location, district, division, lat, lng, category, rating, review_count, open_time, close_time, entry_fee, best_time, featured, established) VALUES ('p8', 'Mainamati Ruins', 'ময়নামতি', 'Buddhist archaeological ruins and monastery complex in Comilla, dating back to the 7th century.', 'Mainamati contains the ruins of Buddhist monasteries, stupas, and viharas dating from the 7th to 12th centuries, associated with the Deva and Chandra dynasties.', 'The site has yielded numerous Buddhist artifacts including gold and silver coins, bronze statues, terracotta plaques, and ornamental bricks.', 'Mainamati, Comilla', 'Cumilla', 'Chattogram', 23.4557, 91.1734, 'archaeological', 4.3, 380, '9:00 AM', '5:00 PM', '20 BDT (locals), 200 BDT (foreigners)', 'October to March', 0, '7th Century AD');
INSERT INTO place_images (place_id, url, sort_order) VALUES ('p8', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 0);
INSERT INTO place_tags (place_id, tag) VALUES ('p8', 'Buddhist');
INSERT INTO place_tags (place_id, tag) VALUES ('p8', 'Archaeological');
INSERT INTO place_tags (place_id, tag) VALUES ('p8', 'Ancient');
INSERT INTO place_tags (place_id, tag) VALUES ('p8', 'Museum');
INSERT INTO place_tags (place_id, tag) VALUES ('p8', 'History');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p8', 'Shah Suja Mosque');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p8', 'War Cemetery');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p8', 'Comilla City');
INSERT INTO heritage_places (id, name, name_local, description, historical_background, significance, location, district, division, lat, lng, category, rating, review_count, open_time, close_time, entry_fee, best_time, featured, established) VALUES ('p9', 'Cox\'s Bazar Beach', 'কক্সবাজার সমুদ্র সৈকত', 'The world\'s longest natural sea beach stretching 120 km — a premier destination for beach tourism in South Asia.', 'Named after Captain Hiram Cox, a British officer, Cox\'s Bazar has been a trading hub since the Mughal era. The beach became a tourism destination in the British colonial period.', 'The longest natural sandy sea beach in the world, offering breathtaking sunsets, fresh seafood, and access to the nearby Buddhist temples of Ramu and Teknaf.', 'Cox\'s Bazar', 'Cox\'s Bazar', 'Chattogram', 21.4272, 92.0058, 'natural', 4.6, 3200, 'Open 24 hours', 'Open 24 hours', 'Free', 'November to March', 1, 'Natural');
INSERT INTO place_images (place_id, url, sort_order) VALUES ('p9', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 0);
INSERT INTO place_tags (place_id, tag) VALUES ('p9', 'Beach');
INSERT INTO place_tags (place_id, tag) VALUES ('p9', 'Ocean');
INSERT INTO place_tags (place_id, tag) VALUES ('p9', 'Sunset');
INSERT INTO place_tags (place_id, tag) VALUES ('p9', 'Seafood');
INSERT INTO place_tags (place_id, tag) VALUES ('p9', 'Tourism');
INSERT INTO place_tags (place_id, tag) VALUES ('p9', 'Natural');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p9', 'Himchari');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p9', 'Inani Beach');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p9', 'Ramu Buddhist Monasteries');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p9', 'Saint Martin Island');
INSERT INTO heritage_places (id, name, name_local, description, historical_background, significance, location, district, division, lat, lng, category, rating, review_count, open_time, close_time, entry_fee, best_time, featured, established) VALUES ('p10', 'Shaheed Minar', 'শহীদ মিনার', 'The national martyrs monument commemorating those killed in the Bengali Language Movement of 1952.', 'The original Shaheed Minar was built on February 22, 1952, following the killing of Bangladeshi students who demonstrated for the recognition of Bengali as an official language. The current structure was built after independence.', 'A symbol of Bengali cultural identity and the Language Movement that inspired Bangladeshis in their struggle for independence. February 21 is now celebrated as International Mother Language Day.', 'Dhaka Medical College, Dhaka', 'Dhaka', 'Dhaka', 23.7255, 90.3927, 'monument', 4.8, 890, 'Open 24 hours', 'Open 24 hours', 'Free', 'February 21 (special)', 0, '1952');
INSERT INTO place_images (place_id, url, sort_order) VALUES ('p10', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 0);
INSERT INTO place_tags (place_id, tag) VALUES ('p10', 'Monument');
INSERT INTO place_tags (place_id, tag) VALUES ('p10', 'Language Movement');
INSERT INTO place_tags (place_id, tag) VALUES ('p10', 'Independence');
INSERT INTO place_tags (place_id, tag) VALUES ('p10', 'National Heritage');
INSERT INTO place_tags (place_id, tag) VALUES ('p10', 'History');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p10', 'Dhaka University');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p10', 'Curzon Hall');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p10', 'Ramna Park');
INSERT INTO heritage_places (id, name, name_local, description, historical_background, significance, location, district, division, lat, lng, category, rating, review_count, open_time, close_time, entry_fee, best_time, featured, established) VALUES ('p11', 'Sylhet Tea Gardens', 'সিলেট চা বাগান', 'Rolling green hills covered in tea plantations — the scenic tea gardens of Sylhet offer a serene natural retreat.', 'Tea cultivation in Sylhet began in the 1850s under British colonialism. Today, Bangladesh has over 150 tea estates, primarily in the Sylhet and Chittagong hill regions.', 'The tea gardens represent Bangladesh\'s colonial agricultural heritage and provide livelihoods for millions of tea workers. Srimangal, the "tea capital," is a must-visit destination.', 'Srimangal, Sylhet', 'Moulvibazar', 'Sylhet', 24.3085, 91.7305, 'natural', 4.8, 1100, '7:00 AM', '6:00 PM', 'Varies by estate', 'October to March', 1, '1854');
INSERT INTO place_images (place_id, url, sort_order) VALUES ('p11', '/api/product-images/f2a3847b9c37fd965a0be5e0d3e938f2', 0);
INSERT INTO place_tags (place_id, tag) VALUES ('p11', 'Tea Gardens');
INSERT INTO place_tags (place_id, tag) VALUES ('p11', 'Nature');
INSERT INTO place_tags (place_id, tag) VALUES ('p11', 'Green Hills');
INSERT INTO place_tags (place_id, tag) VALUES ('p11', 'Eco-Tourism');
INSERT INTO place_tags (place_id, tag) VALUES ('p11', 'Sylhet');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p11', 'Lawachara National Park');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p11', 'Hail Haor');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p11', 'Madhabkunda Waterfall');
INSERT INTO heritage_places (id, name, name_local, description, historical_background, significance, location, district, division, lat, lng, category, rating, review_count, open_time, close_time, entry_fee, best_time, featured, established) VALUES ('p12', 'National Martyrs\' Memorial', 'জাতীয় স্মৃতিসৌধ', 'The national monument of Bangladesh commemorating the heroes of the 1971 Liberation War, located in Savar.', 'Designed by architect Syed Mainul Hossain, the monument was built between 1978 and 1982. It stands on the site where thousands of freedom fighters were buried during the 1971 Liberation War.', 'A solemn reminder of Bangladesh\'s hard-won independence, the seven triangular towers represent the seven phases of the independence movement.', 'Savar, Dhaka', 'Dhaka', 'Dhaka', 23.8735, 90.2668, 'monument', 4.9, 1450, '6:00 AM', '6:00 PM', 'Free', 'March 26 and December 16 (special)', 0, '1982');
INSERT INTO place_images (place_id, url, sort_order) VALUES ('p12', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 0);
INSERT INTO place_tags (place_id, tag) VALUES ('p12', 'Liberation War');
INSERT INTO place_tags (place_id, tag) VALUES ('p12', 'Monument');
INSERT INTO place_tags (place_id, tag) VALUES ('p12', 'National Heritage');
INSERT INTO place_tags (place_id, tag) VALUES ('p12', 'Memorial');
INSERT INTO place_tags (place_id, tag) VALUES ('p12', 'Independence');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p12', 'Bangladesh War Museum');
INSERT INTO place_nearby (place_id, nearby_name) VALUES ('p12', 'Dhaka Export Processing Zone');

-- Marketplace Products
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod1', 'v1', 'Jamdani Saree - Classic White & Gold', 'Authentic Jamdani saree from Rupganj, Narayanganj. This UNESCO-recognized muslin textile features intricate geometric patterns woven by master weavers using traditional handlooms.', 8500, 10000, 'clothing', 4.9, 234, 15, 1, 'Narayanganj', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod1', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod1', 'Jamdani');
INSERT INTO product_tags (product_id, tag) VALUES ('prod1', 'Saree');
INSERT INTO product_tags (product_id, tag) VALUES ('prod1', 'UNESCO');
INSERT INTO product_tags (product_id, tag) VALUES ('prod1', 'Handloom');
INSERT INTO product_tags (product_id, tag) VALUES ('prod1', 'Traditional');
INSERT INTO product_tags (product_id, tag) VALUES ('prod1', 'GI Product');
INSERT INTO product_specifications (product_id, spec_key, spec_value) VALUES ('prod1', 'Material', 'Cotton');
INSERT INTO product_specifications (product_id, spec_key, spec_value) VALUES ('prod1', 'Weight', '450g');
INSERT INTO product_specifications (product_id, spec_key, spec_value) VALUES ('prod1', 'Length', '6 meters');
INSERT INTO product_specifications (product_id, spec_key, spec_value) VALUES ('prod1', 'Weave', 'Jamdani');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod2', 'v2', 'Rajshahi Pure Silk Saree', 'Luxurious pure silk saree from the silk capital of Bangladesh — Rajshahi. Known for its soft texture and lustrous finish.', 12000, NULL, 'clothing', 4.8, 156, 8, 1, 'Rajshahi', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod2', '/api/product-images/bb8fc9518c115160ae3e5fb159678cda', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod2', 'Silk');
INSERT INTO product_tags (product_id, tag) VALUES ('prod2', 'Saree');
INSERT INTO product_tags (product_id, tag) VALUES ('prod2', 'Rajshahi');
INSERT INTO product_tags (product_id, tag) VALUES ('prod2', 'GI Product');
INSERT INTO product_tags (product_id, tag) VALUES ('prod2', 'Premium');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod3', 'v3', 'Nokshi Katha Embroidered Quilt', 'Traditional Bengali embroidered quilt from Jamalpur. Each Nokshi Katha tells a story through its hand-stitched patterns representing nature, folklore, and daily life.', 3500, 4200, 'handicraft', 4.7, 89, 20, 1, 'Jamalpur', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod3', '/api/product-images/b3cc91875803b3a895cb593584088a70', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod3', 'Nokshi Katha');
INSERT INTO product_tags (product_id, tag) VALUES ('prod3', 'Embroidery');
INSERT INTO product_tags (product_id, tag) VALUES ('prod3', 'Quilt');
INSERT INTO product_tags (product_id, tag) VALUES ('prod3', 'Handmade');
INSERT INTO product_tags (product_id, tag) VALUES ('prod3', 'GI Product');
INSERT INTO product_tags (product_id, tag) VALUES ('prod3', 'Jamalpur');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod4', 'v4', 'Sylheti Premium Tea - Estate Collection', 'First flush premium tea from the high-altitude gardens of Srimangal. Aromatic, full-bodied with a golden liquor — the finest tea Bangladesh produces.', 650, NULL, 'food', 4.9, 445, 100, 1, 'Moulvibazar', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod4', '/api/product-images/6657ba32184aa777178af8e9939c74b6', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod4', 'Tea');
INSERT INTO product_tags (product_id, tag) VALUES ('prod4', 'Sylhet');
INSERT INTO product_tags (product_id, tag) VALUES ('prod4', 'Premium');
INSERT INTO product_tags (product_id, tag) VALUES ('prod4', 'Organic');
INSERT INTO product_tags (product_id, tag) VALUES ('prod4', 'GI Product');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod5', 'v1', 'Musharraf Pottery — Hand-thrown Terracotta Set', 'Beautiful set of 4 hand-thrown terracotta cups inspired by ancient Bengali pottery traditions. Food-safe, eco-friendly, and uniquely crafted.', 1200, NULL, 'pottery', 4.6, 67, 30, 0, 'Dhaka', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod5', '/api/product-images/bb8fc9518c115160ae3e5fb159678cda', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod5', 'Pottery');
INSERT INTO product_tags (product_id, tag) VALUES ('prod5', 'Terracotta');
INSERT INTO product_tags (product_id, tag) VALUES ('prod5', 'Handmade');
INSERT INTO product_tags (product_id, tag) VALUES ('prod5', 'Eco-Friendly');
INSERT INTO product_tags (product_id, tag) VALUES ('prod5', 'Craft');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod6', 'v4', 'Shital Pati - Traditional Bamboo Mat', 'Intricate handwoven bamboo mat from Sylhet — a GI product of Bangladesh. Cool to touch, these mats are made from Murta cane using traditional weaving techniques.', 2800, NULL, 'handicraft', 4.5, 43, 12, 0, 'Sylhet', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod6', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod6', 'Shital Pati');
INSERT INTO product_tags (product_id, tag) VALUES ('prod6', 'Bamboo');
INSERT INTO product_tags (product_id, tag) VALUES ('prod6', 'Weaving');
INSERT INTO product_tags (product_id, tag) VALUES ('prod6', 'GI Product');
INSERT INTO product_tags (product_id, tag) VALUES ('prod6', 'Sylhet');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod7', 'v3', 'Barisali Naksha Kantha Cushion Covers (Set of 2)', 'Beautifully embroidered cushion covers in traditional Kantha stitch from Barisal. Vivid colors depicting local birds, flowers, and paisley motifs.', 850, NULL, 'handicraft', 4.7, 112, 45, 0, 'Barishal', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod7', '/api/product-images/b3cc91875803b3a895cb593584088a70', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod7', 'Kantha');
INSERT INTO product_tags (product_id, tag) VALUES ('prod7', 'Embroidery');
INSERT INTO product_tags (product_id, tag) VALUES ('prod7', 'Cushion');
INSERT INTO product_tags (product_id, tag) VALUES ('prod7', 'Handmade');
INSERT INTO product_tags (product_id, tag) VALUES ('prod7', 'Home Decor');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod8', 'v2', 'Hilsa Fish Pickle - Traditional Recipe', 'Authentic Padma Hilsa pickle prepared using a century-old family recipe. The king of Bengali fish, preserved in traditional spices — a taste of heritage.', 480, NULL, 'food', 4.4, 298, 60, 0, 'Rajshahi', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod8', '/api/product-images/6657ba32184aa777178af8e9939c74b6', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod8', 'Hilsa');
INSERT INTO product_tags (product_id, tag) VALUES ('prod8', 'Fish');
INSERT INTO product_tags (product_id, tag) VALUES ('prod8', 'Pickle');
INSERT INTO product_tags (product_id, tag) VALUES ('prod8', 'Traditional');
INSERT INTO product_tags (product_id, tag) VALUES ('prod8', 'Food');
INSERT INTO product_tags (product_id, tag) VALUES ('prod8', 'GI Product');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod9', 'v2', 'Chapai Nawabganj Leather Bag — Artisan Made', 'Handcrafted full-grain leather bag from the leather artisans of Chapai Nawabganj. Durable, stylish, and made with traditional tanning methods.', 4500, 5500, 'handicraft', 4.6, 55, 7, 0, 'Chapai Nawabganj', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod9', '/api/product-images/bb8fc9518c115160ae3e5fb159678cda', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod9', 'Leather');
INSERT INTO product_tags (product_id, tag) VALUES ('prod9', 'Bag');
INSERT INTO product_tags (product_id, tag) VALUES ('prod9', 'Artisan');
INSERT INTO product_tags (product_id, tag) VALUES ('prod9', 'Handmade');
INSERT INTO product_tags (product_id, tag) VALUES ('prod9', 'Fashion');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod10', 'v1', 'Gazipur Bronze Bell — Temple Craft', 'Traditional hand-cast bronze temple bell made by hereditary craftsmen of Gazipur. Produces a pure resonant tone used in Hindu and Buddhist rituals.', 2200, NULL, 'other', 4.8, 28, 10, 0, 'Gazipur', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod10', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod10', 'Bronze');
INSERT INTO product_tags (product_id, tag) VALUES ('prod10', 'Bell');
INSERT INTO product_tags (product_id, tag) VALUES ('prod10', 'Craft');
INSERT INTO product_tags (product_id, tag) VALUES ('prod10', 'Religious');
INSERT INTO product_tags (product_id, tag) VALUES ('prod10', 'Heritage');
INSERT INTO product_tags (product_id, tag) VALUES ('prod10', 'Handmade');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod11', 'v3', 'Khadi Cotton Kurta — Natural Dye', 'Handspun and handwoven Khadi cotton kurta, dyed with natural indigo and vegetable colors. Comfortable, breathable, and sustainably made.', 1800, NULL, 'clothing', 4.5, 134, 35, 1, 'Jamalpur', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod11', '/api/product-images/b3cc91875803b3a895cb593584088a70', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod11', 'Khadi');
INSERT INTO product_tags (product_id, tag) VALUES ('prod11', 'Kurta');
INSERT INTO product_tags (product_id, tag) VALUES ('prod11', 'Natural Dye');
INSERT INTO product_tags (product_id, tag) VALUES ('prod11', 'Sustainable');
INSERT INTO product_tags (product_id, tag) VALUES ('prod11', 'Handloom');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod12', 'v4', 'Rangpur Handmade Jute Basket Set', 'Set of 3 beautifully crafted jute baskets from Rangpur. Sustainable, eco-friendly storage solutions made from the "golden fiber" of Bangladesh.', 750, NULL, 'handicraft', 4.4, 78, 50, 0, 'Rangpur', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod12', '/api/product-images/6657ba32184aa777178af8e9939c74b6', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod12', 'Jute');
INSERT INTO product_tags (product_id, tag) VALUES ('prod12', 'Basket');
INSERT INTO product_tags (product_id, tag) VALUES ('prod12', 'Eco-Friendly');
INSERT INTO product_tags (product_id, tag) VALUES ('prod12', 'Sustainable');
INSERT INTO product_tags (product_id, tag) VALUES ('prod12', 'Home Decor');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod13', 'v1', 'Muslin Block Print Saree — Floral Motif', 'Fine muslin saree with traditional block printing in floral motifs. Each block is hand-carved from wood and stamped individually by skilled artisans.', 3200, NULL, 'clothing', 4.7, 189, 22, 1, 'Dhaka', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod13', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod13', 'Muslin');
INSERT INTO product_tags (product_id, tag) VALUES ('prod13', 'Block Print');
INSERT INTO product_tags (product_id, tag) VALUES ('prod13', 'Saree');
INSERT INTO product_tags (product_id, tag) VALUES ('prod13', 'Floral');
INSERT INTO product_tags (product_id, tag) VALUES ('prod13', 'Handmade');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod14', 'v2', 'Bogura Dahi (Yogurt) Gift Set', 'Famous Bogura dahi — a GI product prized for its unique taste. This gift set includes our special sweet and natural varieties in clay pots.', 380, NULL, 'food', 4.9, 567, 30, 0, 'Bogura', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod14', '/api/product-images/bb8fc9518c115160ae3e5fb159678cda', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod14', 'Dahi');
INSERT INTO product_tags (product_id, tag) VALUES ('prod14', 'Yogurt');
INSERT INTO product_tags (product_id, tag) VALUES ('prod14', 'Bogura');
INSERT INTO product_tags (product_id, tag) VALUES ('prod14', 'GI Product');
INSERT INTO product_tags (product_id, tag) VALUES ('prod14', 'Food');
INSERT INTO product_tags (product_id, tag) VALUES ('prod14', 'Traditional');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES ('prod15', 'v1', 'Savar Bone China Tableware Set', 'Premium bone china tableware set with Bengali floral motifs — perfect fusion of traditional design and modern craft.', 5800, NULL, 'pottery', 4.6, 42, 8, 0, 'Dhaka', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('prod15', '/api/product-images/6657ba32184aa777178af8e9939c74b6', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('prod15', 'Bone China');
INSERT INTO product_tags (product_id, tag) VALUES ('prod15', 'Tableware');
INSERT INTO product_tags (product_id, tag) VALUES ('prod15', 'Craft');
INSERT INTO product_tags (product_id, tag) VALUES ('prod15', 'Home Decor');
INSERT INTO product_tags (product_id, tag) VALUES ('prod15', 'Gift');

-- Pre-order Enabled Products ("Ready When You Arrive")
INSERT INTO products (id, vendor_id, name, description, price, category, rating, review_count, stock, featured, district, preorder_enabled, preparation_time, pickup_location, pickup_lat, pickup_lng, max_advance_days) VALUES ('po-1', 'v-1', 'Traditional Pitha Assortment', 'A handcrafted assortment of traditional Bangladeshi pithas including Chitoi, Bhapa, and Patishapta — made fresh to order by local artisans.', 350, 'food', 4.8, 94, 20, 1, 'Narayanganj', 1, '2 hours', 'Sonargaon Traditional Market, Gate 2', 23.6536, 90.5987, 7);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('po-1', '/api/product-images/bb8fc9518c115160ae3e5fb159678cda', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('po-1', 'pitha');
INSERT INTO product_tags (product_id, tag) VALUES ('po-1', 'traditional');
INSERT INTO product_tags (product_id, tag) VALUES ('po-1', 'sweet');
INSERT INTO product_tags (product_id, tag) VALUES ('po-1', 'handmade');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-1', '10:00 AM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-1', '12:00 PM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-1', '2:00 PM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-1', '4:00 PM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-1', '6:00 PM');
INSERT INTO products (id, vendor_id, name, description, price, category, rating, review_count, stock, featured, district, preorder_enabled, preparation_time, pickup_location, pickup_lat, pickup_lng, max_advance_days) VALUES ('po-2', 'v-2', 'Nakshi Kantha (Hand-Embroidered)', 'A beautiful hand-embroidered Nakshi Kantha quilt made by local artisans of Jamalpur, featuring traditional geometric patterns and folk motifs.', 2800, 'handicraft', 4.9, 56, 8, 1, 'Narayanganj', 1, '4 hours', 'Panam City Craft Village, Sonargaon', 23.6592, 90.5943, 14);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('po-2', '/api/product-images/b3cc91875803b3a895cb593584088a70', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('po-2', 'nakshi-kantha');
INSERT INTO product_tags (product_id, tag) VALUES ('po-2', 'embroidery');
INSERT INTO product_tags (product_id, tag) VALUES ('po-2', 'handmade');
INSERT INTO product_tags (product_id, tag) VALUES ('po-2', 'GI');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-2', '10:00 AM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-2', '1:00 PM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-2', '3:00 PM');
INSERT INTO products (id, vendor_id, name, description, price, category, rating, review_count, stock, featured, district, preorder_enabled, preparation_time, pickup_location, pickup_lat, pickup_lng, max_advance_days) VALUES ('po-3', 'v-3', 'Handmade Pottery Set', 'A set of 4 traditional terracotta pottery pieces handcrafted by Rajshahi artisans — includes two bowls, a pitcher, and a decorative plate.', 1200, 'handicraft', 4.7, 43, 15, 0, 'Rajshahi', 1, '3 hours', 'Rajshahi Artisan Market, Shaheb Bazar', 24.3745, 88.6042, 5);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('po-3', '/api/product-images/46e5eb97ac3085aa87ec58e79de5b494', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('po-3', 'pottery');
INSERT INTO product_tags (product_id, tag) VALUES ('po-3', 'terracotta');
INSERT INTO product_tags (product_id, tag) VALUES ('po-3', 'handmade');
INSERT INTO product_tags (product_id, tag) VALUES ('po-3', 'artisan');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-3', '9:00 AM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-3', '11:00 AM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-3', '2:00 PM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-3', '4:00 PM');
INSERT INTO products (id, vendor_id, name, description, price, category, rating, review_count, stock, featured, district, preorder_enabled, preparation_time, pickup_location, pickup_lat, pickup_lng, max_advance_days) VALUES ('po-4', 'v-4', 'Sylheti Shatkora Pickle', 'Traditional Shatkora (Citrus macroptera) pickle made with authentic Sylheti spices — a rare GI product from the hills of Sylhet.', 280, 'food', 4.6, 128, 30, 0, 'Sylhet', 1, '1 hour', 'Sylhet Keane Bridge Market', 24.8949, 91.8687, 3);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('po-4', '/api/product-images/6657ba32184aa777178af8e9939c74b6', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('po-4', 'shatkora');
INSERT INTO product_tags (product_id, tag) VALUES ('po-4', 'pickle');
INSERT INTO product_tags (product_id, tag) VALUES ('po-4', 'GI');
INSERT INTO product_tags (product_id, tag) VALUES ('po-4', 'sylhet');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-4', '9:00 AM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-4', '11:00 AM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-4', '1:00 PM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-4', '3:00 PM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-4', '5:00 PM');
INSERT INTO products (id, vendor_id, name, description, price, category, rating, review_count, stock, featured, district, preorder_enabled, preparation_time, pickup_location, pickup_lat, pickup_lng, max_advance_days) VALUES ('po-5', 'v-5', 'Muslin Fine Stole', 'A finely woven Dhakai Muslin stole — the legendary "woven air" fabric of Bangladesh, revived by master weavers of Dhaka.', 4500, 'clothing', 5, 32, 5, 1, 'Dhaka', 1, '6 hours', 'Lalbagh Craft Centre, Old Dhaka', 23.7194, 90.3878, 10);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('po-5', '/api/product-images/b3cc91875803b3a895cb593584088a70', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('po-5', 'muslin');
INSERT INTO product_tags (product_id, tag) VALUES ('po-5', 'GI');
INSERT INTO product_tags (product_id, tag) VALUES ('po-5', 'weaving');
INSERT INTO product_tags (product_id, tag) VALUES ('po-5', 'heritage');
INSERT INTO product_tags (product_id, tag) VALUES ('po-5', 'dhaka');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-5', '10:00 AM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-5', '12:00 PM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-5', '3:00 PM');
INSERT INTO products (id, vendor_id, name, description, price, category, rating, review_count, stock, featured, district, preorder_enabled, preparation_time, pickup_location, pickup_lat, pickup_lng, max_advance_days) VALUES ('po-6', 'v-6', 'Local Honey & Sundarbans Bee Products', 'Pure wild honey collected by Mawali honey hunters from the Sundarbans mangrove forest — one of the most unique GI products of Bangladesh.', 650, 'food', 4.9, 112, 40, 1, 'Khulna', 1, '30 minutes', 'Khulna Divisional Museum Entrance', 22.8456, 89.5403, 7);
INSERT INTO product_images (product_id, url, sort_order) VALUES ('po-6', '/api/product-images/5b8a8d140d168a431b8576b1d6d3f3c4', 0);
INSERT INTO product_tags (product_id, tag) VALUES ('po-6', 'honey');
INSERT INTO product_tags (product_id, tag) VALUES ('po-6', 'sundarbans');
INSERT INTO product_tags (product_id, tag) VALUES ('po-6', 'GI');
INSERT INTO product_tags (product_id, tag) VALUES ('po-6', 'organic');
INSERT INTO product_tags (product_id, tag) VALUES ('po-6', 'wild');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-6', '9:00 AM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-6', '11:00 AM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-6', '1:00 PM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-6', '3:00 PM');
INSERT INTO product_time_slots (product_id, slot_label) VALUES ('po-6', '5:00 PM');

-- Events
INSERT INTO events (id, name, description, category, location, district, lat, lng, start_date, end_date, image, featured, is_free, ticket_price, organizer) VALUES ('e1', 'Pohela Boishakh Grand Celebration', 'The biggest Bengali New Year celebration in Bangladesh with cultural performances, traditional food, and artisan markets.', 'cultural', 'Ramna Park, Dhaka', 'Dhaka', 23.7425, 90.3952, '2025-04-14', '2025-04-14', '/api/product-images/8e062215d1b62952822a5613b40250d8', 1, 1, NULL, 'Dhaka City Corporation');
INSERT INTO event_tags (event_id, tag) VALUES ('e1', 'Bengali New Year');
INSERT INTO event_tags (event_id, tag) VALUES ('e1', 'Cultural');
INSERT INTO event_tags (event_id, tag) VALUES ('e1', 'Festival');
INSERT INTO event_tags (event_id, tag) VALUES ('e1', 'Traditional');
INSERT INTO events (id, name, description, category, location, district, lat, lng, start_date, end_date, image, featured, is_free, ticket_price, organizer) VALUES ('e2', 'Dhaka International Folk Festival', 'Three-day folk music, dance, and craft festival celebrating the diverse cultural traditions of Bangladesh.', 'cultural', 'National Stadium, Dhaka', 'Dhaka', NULL, NULL, '2025-02-15', '2025-02-17', '/api/product-images/3a09797c636ad5a4c6753f91effa8c14', 1, 0, 200, 'Bangladesh Folk Arts Foundation');
INSERT INTO event_tags (event_id, tag) VALUES ('e2', 'Folk Music');
INSERT INTO event_tags (event_id, tag) VALUES ('e2', 'Dance');
INSERT INTO event_tags (event_id, tag) VALUES ('e2', 'Craft');
INSERT INTO event_tags (event_id, tag) VALUES ('e2', 'Festival');
INSERT INTO event_tags (event_id, tag) VALUES ('e2', 'Culture');
INSERT INTO events (id, name, description, category, location, district, lat, lng, start_date, end_date, image, featured, is_free, ticket_price, organizer) VALUES ('e3', 'Eid Mela — Heritage Handicraft Fair', 'A grand Eid fair showcasing the finest traditional crafts, GI products, and artisan goods from across Bangladesh.', 'market', 'Bangabandhu International Conference Center, Dhaka', 'Dhaka', NULL, NULL, '2025-03-31', '2025-04-10', '/api/product-images/f2a3847b9c37fd965a0be5e0d3e938f2', 1, 0, 50, 'Export Promotion Bureau');
INSERT INTO event_tags (event_id, tag) VALUES ('e3', 'Eid');
INSERT INTO event_tags (event_id, tag) VALUES ('e3', 'Market');
INSERT INTO event_tags (event_id, tag) VALUES ('e3', 'Handicraft');
INSERT INTO event_tags (event_id, tag) VALUES ('e3', 'Shopping');
INSERT INTO event_tags (event_id, tag) VALUES ('e3', 'Festival');
INSERT INTO events (id, name, description, category, location, district, lat, lng, start_date, end_date, image, featured, is_free, ticket_price, organizer) VALUES ('e4', 'Shat Gambuj Heritage Walk', 'Guided heritage walk through the UNESCO World Heritage mosques and monuments of Bagerhat.', 'heritage', 'Bagerhat', 'Bagerhat', NULL, NULL, '2025-01-25', '2025-01-25', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 0, 0, 500, 'Bangladesh Tourism Board');
INSERT INTO event_tags (event_id, tag) VALUES ('e4', 'Heritage Walk');
INSERT INTO event_tags (event_id, tag) VALUES ('e4', 'UNESCO');
INSERT INTO event_tags (event_id, tag) VALUES ('e4', 'Mosque');
INSERT INTO event_tags (event_id, tag) VALUES ('e4', 'History');
INSERT INTO event_tags (event_id, tag) VALUES ('e4', 'Bagerhat');
INSERT INTO events (id, name, description, category, location, district, lat, lng, start_date, end_date, image, featured, is_free, ticket_price, organizer) VALUES ('e5', 'Sylhet Tea Festival', 'Celebrate the tea harvest season with garden visits, tea tasting sessions, and cultural performances.', 'food', 'Srimangal, Sylhet', 'Moulvibazar', NULL, NULL, '2025-11-10', '2025-11-12', '/api/product-images/f2a3847b9c37fd965a0be5e0d3e938f2', 1, 0, 300, 'Tea Board Bangladesh');
INSERT INTO event_tags (event_id, tag) VALUES ('e5', 'Tea');
INSERT INTO event_tags (event_id, tag) VALUES ('e5', 'Festival');
INSERT INTO event_tags (event_id, tag) VALUES ('e5', 'Sylhet');
INSERT INTO event_tags (event_id, tag) VALUES ('e5', 'Food');
INSERT INTO event_tags (event_id, tag) VALUES ('e5', 'Culture');
INSERT INTO events (id, name, description, category, location, district, lat, lng, start_date, end_date, image, featured, is_free, ticket_price, organizer) VALUES ('e6', 'Sundarbans Eco-Tourism Expedition', 'Guided boat expedition into the Sundarbans with tiger tracking, bird watching, and sunset on the bay.', 'heritage', 'Khulna', 'Khulna', NULL, NULL, '2025-12-01', '2025-12-05', '/api/product-images/3a09797c636ad5a4c6753f91effa8c14', 0, 0, 8500, 'Sundarban Tourism');
INSERT INTO event_tags (event_id, tag) VALUES ('e6', 'Sundarbans');
INSERT INTO event_tags (event_id, tag) VALUES ('e6', 'Eco-Tourism');
INSERT INTO event_tags (event_id, tag) VALUES ('e6', 'Wildlife');
INSERT INTO event_tags (event_id, tag) VALUES ('e6', 'Nature');
INSERT INTO event_tags (event_id, tag) VALUES ('e6', 'Adventure');
INSERT INTO events (id, name, description, category, location, district, lat, lng, start_date, end_date, image, featured, is_free, ticket_price, organizer) VALUES ('e7', 'Old Dhaka Food Festival', 'A culinary journey through Old Dhaka featuring historic restaurants, street food stalls, and cooking demonstrations.', 'food', 'Chawkbazar, Old Dhaka', 'Dhaka', NULL, NULL, '2025-01-10', '2025-01-12', '/api/product-images/4ba540e96f08b150fb641d1cdc957f36', 1, 0, 150, 'Dhaka City Corporation');
INSERT INTO event_tags (event_id, tag) VALUES ('e7', 'Food');
INSERT INTO event_tags (event_id, tag) VALUES ('e7', 'Street Food');
INSERT INTO event_tags (event_id, tag) VALUES ('e7', 'Old Dhaka');
INSERT INTO event_tags (event_id, tag) VALUES ('e7', 'Culinary');
INSERT INTO event_tags (event_id, tag) VALUES ('e7', 'History');
INSERT INTO events (id, name, description, category, location, district, lat, lng, start_date, end_date, image, featured, is_free, ticket_price, organizer) VALUES ('e8', 'Rangpur Harvest Festival', 'Traditional harvest celebration with folk performances, agricultural exhibitions, and local food from North Bengal.', 'festival', 'Rangpur', 'Rangpur', NULL, NULL, '2025-11-25', '2025-11-27', '/api/product-images/8e062215d1b62952822a5613b40250d8', 0, 1, NULL, 'Rangpur District Administration');
INSERT INTO event_tags (event_id, tag) VALUES ('e8', 'Harvest');
INSERT INTO event_tags (event_id, tag) VALUES ('e8', 'Festival');
INSERT INTO event_tags (event_id, tag) VALUES ('e8', 'Rural');
INSERT INTO event_tags (event_id, tag) VALUES ('e8', 'Traditional');
INSERT INTO event_tags (event_id, tag) VALUES ('e8', 'North Bengal');

-- Stories
INSERT INTO stories (id, title, excerpt, content, author_name, author_avatar, author_bio, category, image, read_time, featured, published_at) VALUES ('s1', 'The Weavers of Rupganj: Keeping the Jamdani Dream Alive', 'In the narrow lanes of Rupganj, where the sound of handlooms fills the morning air, master weavers are carrying forward a 300-year-old tradition that UNESCO has recognized as an Intangible Cultural Heritage.', 'In the narrow lanes of Rupganj, Narayanganj, the rhythmic clatter of wooden handlooms begins before dawn. Here, in small workshops and family homes, master weavers are carrying forward a tradition that dates back over 300 years — the art of Jamdani weaving.

Jamdani, recognized by UNESCO as an Intangible Cultural Heritage of Humanity in 2013, is perhaps Bangladesh\'s most precious textile legacy. The fabric is woven from fine cotton or muslin, with supplementary weft techniques creating intricate geometric and floral patterns that seem to float on the transparent cloth.

Karim, a third-generation Jamdani weaver, shows us his work in progress — a white saree with gold-thread motifs of lotus flowers and peacocks. "My grandfather learned from his father," he says, adjusting the threads with practiced precision. "Each design takes weeks. Some master weavers spend months on a single piece."

The finest Jamdani can have up to 600 threads per centimeter — so fine that a folded saree can pass through a finger ring. Yet this ancient craft faces an existential crisis from machine-made imitations and younger generations choosing more lucrative careers.

Organizations like the Bangladesh Handloom Board and various NGOs are working to preserve this heritage, providing training, fair wages, and market access. But ultimately, it is the individual weavers who keep the dream alive — thread by thread, pattern by pattern, dawn by dawn.', 'Tahmina Rashid', '/api/product-images/a267387730a3ad03cde593ca8f5762c1', 'Heritage writer and textile researcher based in Dhaka', 'artisan', '/api/product-images/a2998d77660b2504af2ab639b4268df4', '8 min', 1, '2024-10-15');
INSERT INTO story_tags (story_id, tag) VALUES ('s1', 'Jamdani');
INSERT INTO story_tags (story_id, tag) VALUES ('s1', 'Textile');
INSERT INTO story_tags (story_id, tag) VALUES ('s1', 'Heritage');
INSERT INTO story_tags (story_id, tag) VALUES ('s1', 'Craft');
INSERT INTO story_tags (story_id, tag) VALUES ('s1', 'UNESCO');
INSERT INTO stories (id, title, excerpt, content, author_name, author_avatar, author_bio, category, image, read_time, featured, published_at) VALUES ('s2', 'Through the Gates of Lalbagh: A Mughal Evening', 'As the golden hour light spills over the red sandstone walls of Lalbagh Fort, time seems to dissolve. This is Dhaka as it was — majestic, melancholic, and mysterious.', 'Full article content about Lalbagh Fort...', 'Rafiqul Islam', '/api/product-images/6a1fd8b387fb84eaafdb777895c3c64c', 'Travel writer and historian', 'heritage', '/api/product-images/a2998d77660b2504af2ab639b4268df4', '6 min', 1, '2024-09-22');
INSERT INTO story_tags (story_id, tag) VALUES ('s2', 'Lalbagh');
INSERT INTO story_tags (story_id, tag) VALUES ('s2', 'Mughal');
INSERT INTO story_tags (story_id, tag) VALUES ('s2', 'Dhaka');
INSERT INTO story_tags (story_id, tag) VALUES ('s2', 'History');
INSERT INTO story_tags (story_id, tag) VALUES ('s2', 'Travel');
INSERT INTO stories (id, title, excerpt, content, author_name, author_avatar, author_bio, category, image, read_time, featured, published_at) VALUES ('s3', 'Srimangal: Where Every Cup Tells a Story', 'The seven-layer tea of Srimangal is not just a beverage — it is a poem. In the misty hills of Sylhet, we discover why tea tourism is Bangladesh\'s next big frontier.', 'Full article about Srimangal tea gardens...', 'Sharmin Akter', '/api/product-images/80ea735e9138eb83b035c76fe03f499c', 'Food and travel journalist', 'travel', '/api/product-images/f2a3847b9c37fd965a0be5e0d3e938f2', '7 min', 0, '2024-11-05');
INSERT INTO story_tags (story_id, tag) VALUES ('s3', 'Tea');
INSERT INTO story_tags (story_id, tag) VALUES ('s3', 'Srimangal');
INSERT INTO story_tags (story_id, tag) VALUES ('s3', 'Sylhet');
INSERT INTO story_tags (story_id, tag) VALUES ('s3', 'Travel');
INSERT INTO story_tags (story_id, tag) VALUES ('s3', 'Food');
INSERT INTO story_tags (story_id, tag) VALUES ('s3', 'Nature');
INSERT INTO stories (id, title, excerpt, content, author_name, author_avatar, author_bio, category, image, read_time, featured, published_at) VALUES ('s4', 'The Terracotta Temples of Dinajpur: Ancient Stories in Clay', 'Every inch of the Kantajew Temple is a scripture in terracotta — thousands of panels depicting the Mahabharata, Ramayana, and daily life in 18th-century Bengal.', 'Full article about Kantajew Temple...', 'Dr. Anisur Rahman', '/api/product-images/0cdb2d602989bf6c81e30a45c9cfbb44', 'Professor of Archaeology, Dhaka University', 'heritage', '/api/product-images/a2998d77660b2504af2ab639b4268df4', '10 min', 0, '2024-08-18');
INSERT INTO story_tags (story_id, tag) VALUES ('s4', 'Terracotta');
INSERT INTO story_tags (story_id, tag) VALUES ('s4', 'Temple');
INSERT INTO story_tags (story_id, tag) VALUES ('s4', 'Dinajpur');
INSERT INTO story_tags (story_id, tag) VALUES ('s4', 'Architecture');
INSERT INTO story_tags (story_id, tag) VALUES ('s4', 'History');
INSERT INTO stories (id, title, excerpt, content, author_name, author_avatar, author_bio, category, image, read_time, featured, published_at) VALUES ('s5', 'The Sundarbans at Dusk: A Symphony of Silence', 'When the sun sets over the Sundarbans, the world holds its breath. Between the mangrove roots and the tidal creeks, something ancient stirs — and you feel it in your bones.', 'Full article about Sundarbans...', 'Nasimul Haque', '/api/product-images/b2ba55c5dd66acb64917edd69d7f9639', 'Wildlife photographer and eco-tourism guide', 'travel', '/api/product-images/3a09797c636ad5a4c6753f91effa8c14', '9 min', 1, '2024-12-01');
INSERT INTO story_tags (story_id, tag) VALUES ('s5', 'Sundarbans');
INSERT INTO story_tags (story_id, tag) VALUES ('s5', 'Wildlife');
INSERT INTO story_tags (story_id, tag) VALUES ('s5', 'Nature');
INSERT INTO story_tags (story_id, tag) VALUES ('s5', 'Tiger');
INSERT INTO story_tags (story_id, tag) VALUES ('s5', 'Eco-Tourism');
INSERT INTO stories (id, title, excerpt, content, author_name, author_avatar, author_bio, category, image, read_time, featured, published_at) VALUES ('s6', 'Pohela Boishakh: When Bangladesh Wears Its Heart on Its Sleeve', 'On the first day of the Bengali New Year, Dhaka transforms. Millions pour onto the streets in white and red — the colors of joy, of defiance, of an identity that cannot be erased.', 'Full article about Pohela Boishakh...', 'Farhana Yasmin', '/api/product-images/5093bd01132ebdae9bce680d18cf8b86', 'Cultural journalist and festival curator', 'festival', '/api/product-images/8e062215d1b62952822a5613b40250d8', '5 min', 0, '2024-04-14');
INSERT INTO story_tags (story_id, tag) VALUES ('s6', 'Pohela Boishakh');
INSERT INTO story_tags (story_id, tag) VALUES ('s6', 'Festival');
INSERT INTO story_tags (story_id, tag) VALUES ('s6', 'Bengali New Year');
INSERT INTO story_tags (story_id, tag) VALUES ('s6', 'Culture');
INSERT INTO story_tags (story_id, tag) VALUES ('s6', 'Dhaka');

INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('u1', 'Sarah Mitchell', 'sarah.reviewer@example.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, '/api/product-images/fc0229a372c92801c1d05cf18340f696', 'tourist', 1, 'active') ON DUPLICATE KEY UPDATE name=name;
-- Review authors and a second pre-order customer referenced below (were missing, leaving orphan rows).
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('u2', 'Tanvir Rahman', 'tanvir.reviewer@example.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, NULL, 'tourist', 1, 'active') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('u3', 'Emily Carter', 'emily.reviewer@example.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, NULL, 'tourist', 1, 'active') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('u4', 'Rafiq Islam', 'rafiq.reviewer@example.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, NULL, 'tourist', 1, 'active') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('tourist-2', 'Nusrat Jahan', 'nusrat@example.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, NULL, 'tourist', 1, 'active') ON DUPLICATE KEY UPDATE name=name;
-- Reviews
INSERT INTO reviews (id, user_id, target_id, target_type, rating, title, content, helpful, created_at) VALUES ('r1', 'tourist1', 'p1', 'place', 5, 'An absolute must-see!', 'Lalbagh Fort exceeded all my expectations. The Mughal architecture is breathtaking, and the historical significance is profound. Hire a local guide — it makes a world of difference.', 34, '2024-11-15');
INSERT INTO reviews (id, user_id, target_id, target_type, rating, title, content, helpful, created_at) VALUES ('r2', 'u2', 'p1', 'place', 4, NULL, 'Beautiful historical site with incredible architecture. The gardens are well-maintained. Wish there were more information boards in English.', 18, '2024-10-22');
INSERT INTO reviews (id, user_id, target_id, target_type, rating, title, content, helpful, created_at) VALUES ('r3', 'u3', 'g1', 'guide', 5, 'Best guide in Dhaka!', 'Arif Hassan is an exceptional guide — incredibly knowledgeable, passionate, and fun. He brought Mughal history to life in ways I never imagined. Will definitely book again!', 56, '2024-12-01');
INSERT INTO reviews (id, user_id, target_id, target_type, rating, title, content, helpful, created_at) VALUES ('r4', 'u4', 'prod1', 'product', 5, 'Extraordinary quality', 'The Jamdani saree is absolutely stunning. The craftsmanship is incredible — you can see the individual threads. My wife was thrilled. Shipping was careful and fast.', 42, '2024-11-28');

-- Trip Plans
INSERT INTO trip_plans (id, user_id, name, description, start_date, end_date, status, created_at) VALUES ('trip1', 'tourist1', 'Dhaka Heritage Weekend', 'A 2-day exploration of Dhaka\'s finest historical sites', '2025-01-15', '2025-01-16', 'planned', '2024-12-10');
INSERT INTO trip_destinations (trip_id, destination) VALUES ('trip1', 'Dhaka');
INSERT INTO trip_destinations (trip_id, destination) VALUES ('trip1', 'Narayanganj');
INSERT INTO trip_days (id, trip_id, day_date, notes, sort_order) VALUES ('day1', 'trip1', '2025-01-15', NULL, 0);
INSERT INTO trip_stops (id, day_id, place_id, place_name, place_image, location, duration, notes, sort_order) VALUES ('stop1', 'day1', 'p1', 'Lalbagh Fort', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 'Old Dhaka', '3 hours', NULL, 1);
INSERT INTO trip_stops (id, day_id, place_id, place_name, place_image, location, duration, notes, sort_order) VALUES ('stop2', 'day1', 'p2', 'Ahsan Manzil', '/api/product-images/55c0096ea72dc7d73d641770cbd85423', 'Old Dhaka', '2 hours', NULL, 2);
INSERT INTO trip_days (id, trip_id, day_date, notes, sort_order) VALUES ('day2', 'trip1', '2025-01-16', NULL, 1);
INSERT INTO trip_stops (id, day_id, place_id, place_name, place_image, location, duration, notes, sort_order) VALUES ('stop3', 'day2', 'p6', 'Sonargaon', '/api/product-images/a2998d77660b2504af2ab639b4268df4', 'Narayanganj', '4 hours', NULL, 1);

-- Notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at) VALUES ('n1', 'tourist1', 'Booking Confirmed!', 'Your tour with Arif Hassan on Jan 15 has been confirmed. Meet at Lalbagh Fort main gate at 10:00 AM.', 'booking', 0, '/guide/g1', '2024-12-05 10:30:00');
INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at) VALUES ('n2', 'tourist1', 'Order Shipped', 'Your order ORD-2024-001 has been shipped. Expected delivery: December 7.', 'order', 0, '/order/ORD-2024-001', '2024-12-03 14:22:00');
INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at) VALUES ('n3', 'tourist1', 'New Event Near You', 'Old Dhaka Food Festival is happening Jan 10-12! Don\'t miss the historic culinary experience.', 'system', 1, '/events', '2024-12-01 09:00:00');

-- Conversations & Messages
INSERT INTO conversations (id, last_message, last_message_at) VALUES ('conv1', 'Perfect! I will meet you at Lalbagh Fort main gate at 10 AM.', '2024-12-05 10:30:00');
INSERT INTO conversation_participants (conversation_id, user_id, unread_count) VALUES ('conv1', 'tourist1', 1);
INSERT INTO conversation_participants (conversation_id, user_id, unread_count) VALUES ('conv1', 'g1', 0);
INSERT INTO conversations (id, last_message, last_message_at) VALUES ('conv2', 'I can arrange the Rajshahi silk tour for March. What dates work for you?', '2024-12-04 16:45:00');
INSERT INTO conversation_participants (conversation_id, user_id, unread_count) VALUES ('conv2', 'tourist1', 0);
INSERT INTO conversation_participants (conversation_id, user_id, unread_count) VALUES ('conv2', 'g3', 0);
INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES ('m1', 'conv1', 'tourist1', 'Hello! I am interested in your Old Dhaka Heritage Walk. Are you available on January 15?', 1, '2024-12-05 09:15:00');
INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES ('m2', 'conv1', 'g1', 'Assalamu Alaikum! Yes, January 15 works perfectly. The tour starts at Lalbagh Fort and includes Ahsan Manzil, Star Mosque, and Sadarghat.', 1, '2024-12-05 09:45:00');
INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES ('m3', 'conv1', 'tourist1', 'That sounds wonderful! What time should we start?', 1, '2024-12-05 10:00:00');
INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES ('m4', 'conv1', 'g1', 'Perfect! I will meet you at Lalbagh Fort main gate at 10 AM.', 0, '2024-12-05 10:30:00');

-- Pre-order Settings
INSERT INTO preorder_settings (id, advance_percent, payment_methods, cancellation_window_hours, advance_refund_percent, vendor_preparation_cutoff_minutes, max_pickup_time_slots, allow_cash_at_pickup) VALUES (1, 30, '["bkash","nagad","card","cash"]', 12, 80, 30, 5, 1);

-- Pre-orders
INSERT INTO preorders (id, order_number, tourist_id, vendor_id, product_id, destination_id, pickup_location, pickup_date, pickup_time, quantity, unit_price, total_amount, advance_percent, advance_paid, remaining_amount, advance_payment_method, status, qr_code, preparation_time, notes, created_at, updated_at) VALUES ('pre-1', 'HB1024', 'tourist-1', 'v-1', 'po-1', NULL, 'Sonargaon Traditional Market, Gate 2', '2026-08-16', '2:00 PM', 2, 350, 700, 30, 210, 490, 'bkash', 'ready_for_pickup', 'HB1024-SONARGAON-20260816-14:00', '2 hours', 'Please include extra date palm jaggery.', '2026-08-15 10:30:00', '2026-08-16 09:00:00');
INSERT INTO preorders (id, order_number, tourist_id, vendor_id, product_id, destination_id, pickup_location, pickup_date, pickup_time, quantity, unit_price, total_amount, advance_percent, advance_paid, remaining_amount, advance_payment_method, status, qr_code, preparation_time, notes, created_at, updated_at) VALUES ('pre-2', 'HB1025', 'tourist-1', 'v-2', 'po-2', NULL, 'Panam City Craft Village, Sonargaon', '2026-08-16', '3:00 PM', 1, 2800, 2800, 30, 840, 1960, 'nagad', 'preparing', 'HB1025-SONARGAON-20260816-15:00', '4 hours', NULL, '2026-08-15 11:00:00', '2026-08-15 14:00:00');
INSERT INTO preorders (id, order_number, tourist_id, vendor_id, product_id, destination_id, pickup_location, pickup_date, pickup_time, quantity, unit_price, total_amount, advance_percent, advance_paid, remaining_amount, advance_payment_method, status, qr_code, preparation_time, notes, created_at, updated_at) VALUES ('pre-3', 'HB1026', 'tourist-2', 'v-5', 'po-5', NULL, 'Lalbagh Craft Centre, Old Dhaka', '2026-08-17', '12:00 PM', 1, 4500, 4500, 30, 1350, 3150, 'card', 'vendor_accepted', 'HB1026-DHAKA-20260817-12:00', '6 hours', NULL, '2026-08-16 09:00:00', '2026-08-16 10:00:00');
INSERT INTO preorders (id, order_number, tourist_id, vendor_id, product_id, destination_id, pickup_location, pickup_date, pickup_time, quantity, unit_price, total_amount, advance_percent, advance_paid, remaining_amount, advance_payment_method, status, qr_code, preparation_time, notes, created_at, updated_at) VALUES ('pre-4', 'HB1020', 'tourist-1', 'v-6', 'po-6', NULL, 'Khulna Divisional Museum Entrance', '2026-08-10', '11:00 AM', 3, 650, 1950, 30, 585, 1365, 'bkash', 'completed', 'HB1020-KHULNA-20260810-11:00', '30 minutes', NULL, '2026-08-09 15:00:00', '2026-08-10 11:30:00');
UPDATE preorders SET commission_percent = 10, advance_status = CASE WHEN status = 'completed' THEN 'released' ELSE 'held' END;
UPDATE preorders SET advance_paid = ROUND(total_amount * advance_percent / 100, 2),
                     remaining_amount = total_amount - ROUND(total_amount * advance_percent / 100, 2);

-- Orders
INSERT INTO orders (id, user_id, status, total_amount, ship_name, ship_phone, ship_address, ship_city, ship_district, ship_division, ship_postal_code, payment_method, tracking_number, estimated_delivery, created_at) VALUES ('ORD-2024-001', 'tourist1', 'shipped', 9800, 'Sarah Ahmed', '01712345678', '25, Gulshan Avenue', 'Gulshan', 'Dhaka', 'Dhaka', '1212', 'bkash', 'SUNDARBAN-TRK-78901', '2024-12-07', '2024-12-01');
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ('ORD-2024-001', 'prod1', 1, 8500);
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ('ORD-2024-001', 'prod4', 2, 650);
UPDATE orders SET advance_percent = 20, commission_percent = 10,
                  advance_amount = ROUND(total_amount * advance_percent / 100, 2),
                  cod_amount = total_amount - ROUND(total_amount * advance_percent / 100, 2),
                  advance_status = 'held';
INSERT INTO settlements
  (flow, source_id, partner_id, partner_role, gross_amount, advance_amount, commission_amount,
   partner_released, partner_cash, partner_total, settled_at)
VALUES ('preorder', 'pre-4', 'v-6', 'vendor', 1950, 585, 195, 390, 1365, 1755, '2026-08-10 11:30:00');


-- ----------------------------------------------------------------------------
-- Chattogram division demo vendor + products (area-based local products)
-- ----------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('v-ctg', 'Nasrin Akter', 'ctg@example.com', '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe', NULL, NULL, 'vendor', 1, 'active');
INSERT INTO vendors (user_id, shop_name, shop_description, shop_image, location, rating, total_sales, verification_status) VALUES ('v-ctg', 'Karnaphuli Local Bazaar', 'Food and crafts from Chattogram, Cox''s Bazar, Cumilla and the Hill Tracts', NULL, 'Chawkbazar, Chattogram', 4.6, 310, 'verified');
INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES
('prod-ctg-1', 'v-ctg', 'Mezbani Masala - Chattogram Spice Mix (250g)', 'Roasted spice blend for cooking mezbani beef at home, ground in small batches in Chattogram.', 280, NULL, 'food', 4.7, 64, 80, 1, 'Chattogram', 0),
('prod-ctg-2', 'v-ctg', 'Bela Biscuit Tin (400g)', 'Twice-baked, crisp tea biscuits in the old Chattogram bakery tradition, best dipped in milk tea.', 220, NULL, 'food', 4.5, 41, 120, 0, 'Chattogram', 0),
('prod-ctg-3', 'v-ctg', 'Loitta Shutki - Dried Bombay Duck (500g)', 'Sun-dried loitta fish from Cox''s Bazar, cleaned and vacuum-packed for travel.', 650, NULL, 'food', 4.4, 58, 45, 0, 'Cox''s Bazar', 0),
('prod-ctg-4', 'v-ctg', 'Cumilla Khadi Panjabi', 'Hand-spun, hand-woven khadi cotton panjabi from Cumilla, breathable and naturally textured.', 1800, NULL, 'clothing', 4.6, 37, 25, 1, 'Cumilla', 0),
('prod-ctg-5', 'v-ctg', 'Hill Tracts Handwoven Shawl', 'Back-strap loom shawl woven by artisans in Rangamati with traditional geometric patterns.', 2200, NULL, 'clothing', 4.8, 22, 12, 0, 'Rangamati', 0);
INSERT INTO product_images (product_id, url, sort_order) VALUES
('prod-ctg-1', '/api/product-images/6657ba32184aa777178af8e9939c74b6', 0), ('prod-ctg-2', '/api/product-images/6657ba32184aa777178af8e9939c74b6', 0), ('prod-ctg-3', '/api/product-images/6657ba32184aa777178af8e9939c74b6', 0),
('prod-ctg-4', '/api/product-images/b3cc91875803b3a895cb593584088a70', 0), ('prod-ctg-5', '/api/product-images/b3cc91875803b3a895cb593584088a70', 0);
INSERT INTO product_tags (product_id, tag) VALUES
('prod-ctg-1', 'Mezban'), ('prod-ctg-2', 'Bakery'), ('prod-ctg-3', 'Dried Fish'), ('prod-ctg-4', 'Khadi'), ('prod-ctg-5', 'Handloom');

-- Link every product to the heritage places in its district so place pages and the
-- trip planner can find it.
INSERT IGNORE INTO product_near_destinations (product_id, place_id)
SELECT p.id, hp.id FROM products p JOIN heritage_places hp ON hp.district = p.district;
SET FOREIGN_KEY_CHECKS = 1;