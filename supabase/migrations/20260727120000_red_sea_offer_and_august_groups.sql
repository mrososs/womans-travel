-- ============================================================
-- Durrah — Red Sea group offer + the two August economy groups
--
-- 1. Per-option discounts. The offer model added in 20260722120000 discounts
--    a single price point on the trip/package row, which only ever reaches
--    the option mirroring that base price. The Red Sea group discounts BOTH
--    room types by different amounts, so options now carry their own optional
--    `discount_price_amount`. It stays gated by the parent offer: clearing the
--    package's `discount_price_amount` (or exhausting its seat cap, when one
--    is set) switches every option back to its regular price.
--
-- 2. Per-package "what's included". Until now the detail page rendered one
--    hardcoded list (flights, luxury stay, …) for every package — wrong for a
--    80 SAR day trip. `includes_ar`/`includes_en` are newline-separated, same
--    shape as package_days.items_*, and fall back to the static list when null.
--
-- 3. Red Sea group offer: shared room 4,950 instead of 5,550, single room
--    8,000 instead of 8,950. Uncapped — no seat limit was requested.
--
-- 4. Two new bookable economy groups: Taif (7 Aug, 80 SAR per adult) and
--    Madinah (13 Aug, 1,250 SAR).
-- (Applied to the durrah project via MCP apply_migration.)
-- ============================================================

alter table public.item_options
  add column if not exists discount_price_amount numeric(10,2);

alter table public.packages
  add column if not exists includes_ar text,
  add column if not exists includes_en text;

-- ---------- Red Sea group offer ----------

-- The package-level offer drives the ribbon + the card price (the cheapest
-- room), while each option below carries its own discounted price.
update public.packages
set
  discount_price_amount = 4950,
  discount_price_ar     = '٤٬٩٥٠',
  discount_price_en     = '4,950',
  discount_label_ar     = 'عرض خاص',
  discount_label_en     = 'Special offer',
  discount_seats_limit  = null
where id = 'red-sea';

update public.item_options set discount_price_amount = 4950
where item_type = 'package' and item_id = 'red-sea' and label_en = 'Shared room';

update public.item_options set discount_price_amount = 8000
where item_type = 'package' and item_id = 'red-sea' and label_en = 'Single room';

-- Keep the matching destination card in step with the group price.
update public.trips
set
  discount_price_amount = 4950,
  discount_price_ar     = '٤٬٩٥٠',
  discount_price_en     = '4,950',
  discount_label_ar     = 'عرض خاص',
  discount_label_en     = 'Special offer'
where id = 'red-sea';

-- Existing packages keep the list the detail page used to hardcode.
update public.packages
set
  includes_ar = 'تذاكر الطيران ذهابًا وإيابًا' || chr(10) ||
                'الإقامة الفاخرة' || chr(10) ||
                'وجبة الإفطار' || chr(10) ||
                'مشرفة على القروب طوال الرحلة' || chr(10) ||
                'جميع التنقلات الداخلية' || chr(10) ||
                'الأنشطة والجولات المذكورة',
  includes_en = 'Round-trip flights' || chr(10) ||
                'Luxury accommodation' || chr(10) ||
                'Breakfast' || chr(10) ||
                'A group supervisor throughout' || chr(10) ||
                'All internal transfers' || chr(10) ||
                'Listed activities & tours'
where id in ('red-sea', 'turkey-north') and includes_ar is null;

-- ---------- August economy groups ----------

insert into public.packages (
  id, kind, icon, grad,
  title_ar, title_en, desc_ar, desc_en,
  price_ar, price_en, price_amount, sort,
  includes_ar, includes_en
) values
(
  'taif-economy', 'local', 'mountain', 'linear-gradient(155deg,#4E7A5B,#C6A15B)',
  'رحلة الطائف الاقتصادية',
  'Taif economy trip',
  'رحلة يوم واحد إلى الطائف يوم ٧ أغسطس، مع زيارة الشفا من ٧:٣٠ صباحًا حتى ٨ مساءً. شاملة النقل بالباص ومرافقة مشرفة وضيافة الطريق. للكبار فقط.',
  'A one-day trip to Taif on 7 August, visiting Al-Shafa from 7:30 AM to 8 PM. Includes bus transport, a group escort and refreshments along the way. Adults only.',
  '٨٠', '80', 80, 2,
  'النقل بالباص ذهابًا وإيابًا' || chr(10) ||
  'مرافقة مشرفة طوال الرحلة' || chr(10) ||
  'ضيافة الطريق' || chr(10) ||
  'زيارة الشفا من ٧:٣٠ ص إلى ٨ م',
  'Round-trip bus transport' || chr(10) ||
  'A group escort throughout' || chr(10) ||
  'Refreshments along the way' || chr(10) ||
  'Al-Shafa visit, 7:30 AM to 8 PM'
),
(
  'madinah-economy', 'local', 'moon-star', 'linear-gradient(155deg,#24314B,#B76E79)',
  'رحلة المدينة المنورة الاقتصادية',
  'Madinah economy trip',
  'رحلة إلى المدينة المنورة يوم ١٣ أغسطس، شاملة الفندق وتذاكر القطار والمواصلات ومشرفة للرحلة داخل المدينة.',
  'A trip to Madinah on 13 August. Includes the hotel, train tickets, transport and a group escort inside the city.',
  '١٬٢٥٠', '1,250', 1250, 3,
  'الإقامة في الفندق' || chr(10) ||
  'تذاكر القطار' || chr(10) ||
  'المواصلات داخل المدينة' || chr(10) ||
  'مشرفة للرحلة داخل المدينة',
  'Hotel accommodation' || chr(10) ||
  'Train tickets' || chr(10) ||
  'Transport inside the city' || chr(10) ||
  'A group escort inside the city'
)
on conflict (id) do nothing;
