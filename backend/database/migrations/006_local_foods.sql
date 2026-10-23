-- Traditional foods by area, shown in the trip planner, place pages and shop.
-- Safe to re-run: the table is created only if missing and rows use INSERT IGNORE.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS local_foods (
  id           VARCHAR(40)  NOT NULL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  name_local   VARCHAR(150) NULL,
  district     VARCHAR(100) NOT NULL,
  division     VARCHAR(100) NOT NULL,
  food_type    ENUM('dish','sweet','snack','drink','fruit','ingredient') NOT NULL DEFAULT 'dish',
  description  TEXT         NOT NULL,
  where_to_try VARCHAR(300) NULL,
  image        VARCHAR(500) NULL,
  featured     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_local_foods_division (division),
  INDEX idx_local_foods_district (district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT IGNORE INTO local_foods (id, name, name_local, district, division, food_type, description, where_to_try, featured) VALUES
-- Chattogram division
('lf-ctg-mezban', 'Mezbani Beef', 'মেজবানি মাংস', 'Chattogram', 'Chattogram', 'dish', 'Spicy beef curry slow-cooked for mezban, the community feasts of Chattogram, with a signature blend of roasted spices and mustard oil.', 'Mezban restaurants around GEC Circle and Chawkbazar, Chattogram', 1),
('lf-ctg-kalabhuna', 'Kala Bhuna', 'কালা ভুনা', 'Chattogram', 'Chattogram', 'dish', 'Beef dry-fried for hours until it turns almost black, rich with caramelised onion and whole spices.', 'Local restaurants across Chattogram city', 0),
('lf-cox-shutki', 'Shutki Bhorta', 'শুঁটকি ভর্তা', 'Cox''s Bazar', 'Chattogram', 'dish', 'Sun-dried sea fish mashed with chilli, garlic and onion, a coastal staple. Dried fish is also a popular thing to take home.', 'Dried-fish markets and beachside restaurants in Cox''s Bazar', 1),
('lf-cum-rosmalai', 'Cumilla Rosmalai', 'কুমিল্লার রসমালাই', 'Cumilla', 'Chattogram', 'sweet', 'Small flattened cheese dumplings soaked in thickened, cardamom-scented milk; Cumilla''s best-known sweet.', 'Sweet shops around Monohorpur, Cumilla', 1),
('lf-chd-ilish', 'Chandpur Ilish', 'চাঁদপুরের ইলিশ', 'Chandpur', 'Chattogram', 'dish', 'Hilsa from the Padma–Meghna confluence, prized across the country; served fried or as shorshe ilish in mustard gravy.', 'Chandpur fish ghat and riverside eateries', 0),
('lf-ban-bamboo', 'Bamboo Chicken', 'বাঁশ মুরগি', 'Bandarban', 'Chattogram', 'dish', 'Chicken marinated with hill spices and cooked inside a green bamboo tube over fire, a dish of the Chittagong Hill Tracts communities.', 'Restaurants in Bandarban and Rangamati towns', 0),
-- Sylhet division
('lf-syl-shatkora', 'Shatkora Beef', 'সাতকরা গরুর মাংস', 'Sylhet', 'Sylhet', 'dish', 'Beef curry cooked with shatkora, a fragrant Sylheti citrus whose thick rind gives a bitter-sour aroma.', 'Restaurants around Zindabazar, Sylhet', 1),
('lf-mou-7layer', 'Seven-Layer Tea', 'সাত রঙের চা', 'Moulvibazar', 'Sylhet', 'drink', 'Tea poured in distinct coloured layers, each with its own flavour, made famous in Sreemangal.', 'Tea stalls in Sreemangal', 1),
('lf-syl-akhni', 'Akhni Pulao', 'আখনি পোলাও', 'Sylhet', 'Sylhet', 'dish', 'Sylheti spiced rice cooked with meat in one pot, a festive dish at weddings and Eid.', 'Home-style restaurants in Sylhet city', 0),
('lf-syl-chunga', 'Chunga Pitha', 'চুঙ্গা পিঠা', 'Moulvibazar', 'Sylhet', 'snack', 'Sticky rice packed into thin bamboo and roasted over fire, a winter treat of greater Sylhet.', 'Winter pitha stalls in Moulvibazar and Sylhet', 0),
-- Dhaka division
('lf-dha-kacchi', 'Kacchi Biryani', 'কাচ্চি বিরিয়ানি', 'Dhaka', 'Dhaka', 'dish', 'Marinated mutton layered with fragrant rice and potato and slow-cooked in a sealed pot; the signature dish of Old Dhaka.', 'Restaurants around Nazira Bazar and Bangshal, Old Dhaka', 1),
('lf-dha-bakarkhani', 'Bakarkhani', 'বাকরখানি', 'Dhaka', 'Dhaka', 'snack', 'Flaky, crisp layered flatbread baked in clay ovens and eaten with tea in Old Dhaka since Mughal times.', 'Bakeries in Lalbagh and Chawkbazar, Old Dhaka', 0),
('lf-dha-morogpolao', 'Morog Polao', 'মোরগ পোলাও', 'Dhaka', 'Dhaka', 'dish', 'Chicken cooked with aromatic polao rice, ghee and whole spices; a celebration dish across Dhaka.', 'Old Dhaka restaurants', 0),
('lf-tan-chomchom', 'Porabarir Chomchom', 'পোড়াবাড়ির চমচম', 'Tangail', 'Dhaka', 'sweet', 'Dense, oval chhena sweet with a browned crust, associated with Porabari village in Tangail.', 'Sweet shops in Tangail town', 1),
-- Rajshahi division
('lf-bog-doi', 'Bogura Doi', 'বগুড়ার দই', 'Bogura', 'Rajshahi', 'sweet', 'Sweet yogurt set in clay pots, caramel-coloured and creamy; Bogura''s most famous food.', 'Sweet shops across Bogura town', 1),
('lf-raj-mango', 'Rajshahi Mango', 'রাজশাহীর আম', 'Rajshahi', 'Rajshahi', 'fruit', 'Fazli, Langra, Himsagar and other varieties from the Rajshahi–Chapainawabganj belt, in season roughly June to August.', 'Mango markets in Rajshahi and Kansat, Chapainawabganj', 1),
('lf-raj-kalai', 'Kalai Ruti', 'কালাই রুটি', 'Chapainawabganj', 'Rajshahi', 'dish', 'Flatbread of black gram and rice flour cooked on a clay griddle, served with chilli-onion bhorta or beef.', 'Roadside kalai ruti stalls in Chapainawabganj and Rajshahi', 0),
('lf-nat-kachagolla', 'Natore Kachagolla', 'নাটোরের কাঁচাগোল্লা', 'Natore', 'Rajshahi', 'sweet', 'Soft, fresh chhena sweet with a light cardamom aroma, a speciality of Natore.', 'Sweet shops in Natore town', 0),
-- Khulna division
('lf-khu-chuijhal', 'Chuijhal Mutton', 'চুইঝাল মাংস', 'Khulna', 'Khulna', 'dish', 'Meat curry cooked with chui jhal, a pungent local vine stem; a southwestern speciality.', 'Restaurants in Khulna city', 1),
('lf-jas-gur', 'Jashore Khejur Gur', 'যশোরের খেজুর গুড়', 'Jashore', 'Khulna', 'ingredient', 'Date-palm jaggery made from winter sap and used in payesh and pitha; fresh nolen gur is the prized variety.', 'Winter markets in Jashore', 1),
('lf-kus-tilkhaja', 'Kushtia Tilkhaja', 'কুষ্টিয়ার তিলের খাজা', 'Kushtia', 'Khulna', 'sweet', 'Crisp sesame and sugar candy, a well-known take-home sweet from Kushtia.', 'Shops near Kushtia railway station', 0),
('lf-bag-golda', 'Golda Chingri Malaikari', 'গলদা চিংড়ির মালাইকারি', 'Bagerhat', 'Khulna', 'dish', 'Giant freshwater prawn cooked in coconut-milk gravy; Bagerhat and Khulna are major prawn-farming areas.', 'Restaurants in Bagerhat and Khulna', 0),
-- Barishal division
('lf-bho-mohishdoi', 'Buffalo Curd', 'মহিষের দই', 'Bhola', 'Barishal', 'sweet', 'Thick, tangy curd from buffalo milk, set in clay pots on Bhola island.', 'Markets in Bhola', 1),
('lf-jha-peyara', 'Floating-Market Guava', 'ভাসমান বাজারের পেয়ারা', 'Jhalokati', 'Barishal', 'fruit', 'Guavas sold straight from boats at the Bhimruli floating market, in season around July to September.', 'Bhimruli floating market, Jhalokati', 1),
('lf-bar-ilish', 'Barishal Ilish', 'বরিশালের ইলিশ', 'Barishal', 'Barishal', 'dish', 'River hilsa from the Kirtankhola and surrounding rivers, fried, cooked in mustard or steamed as ilish paturi.', 'Riverside restaurants in Barishal', 0),
-- Rangpur division
('lf-rng-haribhanga', 'Haribhanga Mango', 'হাঁড়িভাঙ্গা আম', 'Rangpur', 'Rangpur', 'fruit', 'Fibreless, sweet mango variety from Rangpur, in season in late June and July.', 'Mango markets in Mithapukur, Rangpur', 1),
('lf-din-litchi', 'Dinajpur Litchi', 'দিনাজপুরের লিচু', 'Dinajpur', 'Rangpur', 'fruit', 'Juicy litchis from Dinajpur orchards, available in May and June.', 'Litchi markets in Dinajpur', 0),
('lf-din-kataribhog', 'Kataribhog Rice', 'কাটারিভোগ চাল', 'Dinajpur', 'Rangpur', 'ingredient', 'Aromatic fine rice used for polao and payesh; Dinajpur''s best-known grain.', 'Rice markets in Dinajpur', 0),
('lf-rng-shidol', 'Shidol Bhorta', 'সিদল ভর্তা', 'Rangpur', 'Rangpur', 'dish', 'Fermented dried-fish paste mashed with chilli and garlic, a northern Bengal favourite.', 'Home-style eateries in Rangpur', 0),
-- Mymensingh division
('lf-mym-monda', 'Muktagachar Monda', 'মুক্তাগাছার মণ্ডা', 'Mymensingh', 'Mymensingh', 'sweet', 'Soft, flat chhena-and-sugar sweet made in Muktagacha since the 19th century.', 'Sweet shops in Muktagacha, Mymensingh', 1),
('lf-net-balish', 'Balish Mishti', 'বালিশ মিষ্টি', 'Netrokona', 'Mymensingh', 'sweet', 'Large pillow-shaped chhena sweet soaked in syrup and topped with thickened milk.', 'Sweet shops in Netrokona town', 0),
('lf-she-tulshimala', 'Tulshimala Rice', 'তুলসীমালা চাল', 'Sherpur', 'Mymensingh', 'ingredient', 'Small-grained aromatic rice from Sherpur, used for polao and payesh.', 'Rice markets in Sherpur', 0);
