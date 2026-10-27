# ডিপ্লয় গাইড (বাংলা): Vercel + Render + Supabase

English version: [deploy-vercel.md](deploy-vercel.md)

| অংশ | সার্ভিস | কী চলে |
|---|---|---|
| ফ্রন্টএন্ড (ওয়েবসাইট) | **Vercel** | React বিল্ড (`dist/`) |
| ব্যাকএন্ড (API) | **Render** | PHP API, Docker কন্টেইনারে |
| ডাটাবেস | **Supabase** | PostgreSQL 17 |

**ক্রম মেনে চলুন: Supabase → Render → Vercel।** কারণ প্রতিটি ধাপে আগের ধাপের ঠিকানা (URL) লাগে।

---

## ধাপ ১: Supabase (ডাটাবেস)

`heritagebd` নামের প্রজেক্ট (সিঙ্গাপুর রিজিয়ন) আগেই তৈরি করা আছে, আর তাতে আপনার সব ডাটা লোড করা আছে (৫০টি টেবিল, ৭২৭টি রো)। আপনাকে শুধু দুটি কাজ করতে হবে:

1. [supabase.com](https://supabase.com) এ লগইন করুন → **heritagebd** প্রজেক্ট খুলুন।
2. **Project Settings → Database → Reset database password** এ যান। একটি শক্ত পাসওয়ার্ড দিন এবং কোথাও লিখে রাখুন।
3. উপরের **Connect** বাটনে ক্লিক করুন → **Session pooler** বেছে নিন → লিংকটি কপি করুন। দেখতে এমন হবে:
   ```
   postgresql://postgres.sbhnmsrbvampinpgggvl:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
   `[YOUR-PASSWORD]` এর জায়গায় আপনার নতুন পাসওয়ার্ড বসান।

> ⚠️ **অবশ্যই "Session pooler" নিন।**
> - "Direct connection" কাজ করবে না, কারণ Render IPv6 সাপোর্ট করে না।
> - "Transaction pooler" (পোর্ট 6543) PHP-এর prepared statement ভেঙে দেয়।
>
> পাসওয়ার্ডে `@`, `:` বা `/` থাকলে লিংকে সেগুলো বদলে দিতে হবে (যেমন `@` → `%40`)। সহজ উপায়: পাসওয়ার্ডে শুধু অক্ষর আর সংখ্যা রাখুন।

## ধাপ ২: Render (PHP API)

1. [render.com](https://render.com) এ লগইন করুন (GitHub দিয়ে লগইন করা সবচেয়ে সহজ)।
2. **New → Blueprint** এ ক্লিক করুন → GitHub রিপো **`Monika-Akter47/heritagebd`** বেছে নিন।
   Render নিজেই [`render.yaml`](../render.yaml) পড়ে সব সেটিং করে নেবে (Docker, সিঙ্গাপুর রিজিয়ন, ফ্রি প্ল্যান)।
3. Environment variables চাইলে এগুলো দিন:

   | নাম | মান |
   |---|---|
   | `DATABASE_URL` | ধাপ ১ এর Session pooler লিংক, **পাসওয়ার্ড ছাড়া** (যেমন `postgresql://postgres.sbhnmsrbvampinpgggvl@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`) |
   | `DB_PASS` | আপনার Supabase ডাটাবেস পাসওয়ার্ড, হুবহু যেমন আছে। আলাদা রাখলে `@ # / :` এর মতো চিহ্ন বদলাতে হয় না |
   | `CORS_ORIGIN` | আপনার Vercel ঠিকানা, যেমন `https://heritagebd-flax.vercel.app` (না জানলে পরে দিলেও চলবে) |
   | `APP_TIMEZONE` | `Asia/Dhaka` (আগে থেকেই দেওয়া থাকে) |

4. **Apply / Deploy** চাপুন। প্রথম বিল্ডে ৫–১০ মিনিট লাগতে পারে।
5. ডিপ্লয় শেষ হলে ব্রাউজারে এগুলো খুলে পরীক্ষা করুন:
   - `https://heritagebd-api.onrender.com/api/places` খুললে ১২টি জায়গার JSON দেখাবে।
   - `https://heritagebd-api.onrender.com/api/local-foods?area=Sylhet` খুললে ৪টি খাবারের তালিকা দেখাবে।
   - `https://heritagebd-api.onrender.com/api/product-images/835d69733226b8c1632d5527003e3f35` খুললে লালবাগ কেল্লার ছবি দেখাবে।

   Render যদি অন্য নাম দেয় (যেমন `heritagebd-api-x1y2`), তাহলে সেই ঠিকানাটি লিখে রাখুন। ধাপ ৩ এ লাগবে।

> **Manual পদ্ধতি (Blueprint না চাইলে):** New → Web Service → Docker।
> - Dockerfile Path: `backend/Dockerfile`
> - Docker Build Context Directory: **`.`** (শুধু একটা ডট, `backend` নয়!)

## ধাপ ৩: Vercel (ওয়েবসাইট)

1. Render-এর ঠিকানা `heritagebd-api.onrender.com` না হলে আগে [`vercel.json`](../vercel.json) ফাইলে `destination` লাইনে আপনার Render ঠিকানা বসিয়ে GitHub এ push করুন।
2. [vercel.com](https://vercel.com) এ লগইন করুন (GitHub দিয়ে)।
3. **Add New → Project** → `Monika-Akter47/heritagebd` বেছে নিন → **Import**।
4. কোনো সেটিং বদলাতে হবে না, কারণ `vercel.json` সব ঠিক করে রেখেছে। **`VITE_API_URL` দেবেন না।**
5. **Deploy** চাপুন। ২–৩ মিনিট লাগবে।

**কেন `VITE_API_URL` লাগবে না:** Vercel সব `/api/...` রিকোয়েস্ট নিজেই Render এ পাঠিয়ে দেয়। তাই ব্রাউজার শুধু Vercel ঠিকানাই দেখে। এতে CORS সমস্যা হয় না, আর ছবিও ঠিকমতো লোড হয়।

## ধাপ ৪: ডিপ্লয়ের পরে (খুবই জরুরি!)

- [ ] **ডেমো পাসওয়ার্ড বদলান।** নিচের অ্যাকাউন্টগুলোর পাসওয়ার্ড `password123`, যা সবাই জানে।
      প্রতিটিতে লগইন করে **Account Settings → Change password** থেকে বদলান। দরকার না থাকলে **Admin → Users** থেকে suspend করে দিন।
  - **সবার আগে:** `admin@heritagebd.com` (অ্যাডমিন)
  - `tourist@heritagebd.com`, `monika@heritagebd.com`
  - গাইড: `arif@guide.com` এবং অন্য সব `@guide.com` অ্যাকাউন্ট
  - ভেন্ডর: `rahima@muslinhouse.com`, `fatema@example.com`, `rina@example.com`, `karim@example.com`, `spice@example.com`, `muslin@example.com`, `sundarbans@example.com`
  - রিভিউয়ার: `sarah/tanvir/emily/rafiq.reviewer@example.com`, `nusrat@example.com`
- [ ] ওয়েবসাইট খুলে দেখুন:
  - ছবি লোড হচ্ছে।
  - `/shop?area=Sylhet` এ খাবার দেখাচ্ছে।
  - চেকআউটে ২০% অ্যাডভান্স দেখাচ্ছে।
  - Admin → Earnings খুলছে।

## জেনে রাখুন (Render ফ্রি প্ল্যানের সীমাবদ্ধতা)

- **আপলোড এখন ডাটাবেসে থাকে।** ফ্রি প্ল্যানে প্রতিবার রিস্টার্ট বা রিডিপ্লয়ে সার্ভারের ডিস্ক মুছে যায়, তাই প্রতিটি আপলোড (ডকুমেন্ট, ছবি) Supabase এর `stored_files` টেবিলেও রাখা হয়। ২০২৬-১০-২৭ এর আগে আপলোড করা ফাইল হারিয়ে গেছে, সেগুলো আবার আপলোড করতে হবে।
- **ঘুমিয়ে পড়ে।** ১৫ মিনিট কেউ না এলে সার্ভার বন্ধ হয়ে যায়। তারপর প্রথম রিকোয়েস্টে ৩০–৬০ সেকেন্ড লাগে।
- **পুরনো ভেরিফিকেশন ডকুমেন্ট** শুধু আপনার কম্পিউটারে আছে (`heritagebd-data/uploads/private`), নিরাপত্তার জন্য GitHub এ রাখা হয়নি। ডাটাবেসে তুলতে `backend/tools/restore_documents.php` চালান (`DATABASE_URL` দিয়ে)।
- **পেমেন্ট এখনো ডেমো।** bKash/Nagad/কার্ড আসলে সংযুক্ত নয়, কোনো টাকা লেনদেন হয় না।

## সমস্যা হলে

| সমস্যা | সমাধান |
|---|---|
| `Database connection failed` | `DATABASE_URL` এর পাসওয়ার্ড ভুল, অথবা Session pooler এর বদলে Direct connection লিংক দেওয়া হয়েছে। Render এর **Logs** দেখুন। |
| `prepared statement ... does not exist` | Transaction pooler (6543) ব্যবহার করা হয়েছে। Session pooler (5432) দিন। |
| API কাজ করছে কিন্তু ছবি আসছে না | Render এ Build Context `backend` দেওয়া হয়েছে। সেটা **`.`** করুন। |
| `/api/...` খুললে ওয়েবসাইটের পেজ আসছে | `vercel.json` এ `/api` লাইনটি SPA লাইনের **আগে** থাকতে হবে (এখন তাই আছে)। |
| ব্রাউজার কনসোলে CORS error | Render এ সরাসরি কল হচ্ছে। `VITE_API_URL` মুছে দিন, অথবা `CORS_ORIGIN` ঠিক করুন। |
| প্রথমবার খুলতে অনেক দেরি | Render ফ্রি প্ল্যান ঘুম থেকে উঠছে, স্বাভাবিক। |
| পাসওয়ার্ড রিসেট ইমেইল যাচ্ছে না | সার্ভারে ইমেইল (SMTP) সেটআপ করা নেই। আগে সেটা কনফিগার করতে হবে। |
