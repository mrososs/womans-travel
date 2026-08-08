-- ============================================================
-- Durrah — Istanbul group package (قروب إسطنبول)
--
-- New bookable group, 23–28 September, mirroring the Moscow group added in
-- 20260803140000: two room-type options (shared 4,850 / single 7,300) via
-- item_options, with the package's own price tracking the cheaper room so the
-- card and listing show "from 4,850".
--
-- A `trips.istanbul` destination card already existed advertising the earlier
-- 3–9 August programme at 6,800. It is re-synced here to the new dates and
-- price so the marketing card can't contradict the bookable group — the same
-- sync the Red Sea (20260727120000) and Moscow migrations do. It deliberately
-- stays `coming_soon = true`: destination cards have been marketing-only since
-- 20260713140000, and the package is the bookable entity.
--
-- No deposit_amount is set — none was specified for this group — so it is not
-- eligible for the deposit-only bank-transfer flow. Add one here (or from the
-- dashboard) to enable it.
-- (Applied to the durrah project via MCP apply_migration.)
-- ============================================================

insert into public.packages (
  id, kind, icon, grad, image_url,
  title_ar, title_en, desc_ar, desc_en,
  price_ar, price_en, price_amount, sort,
  includes_ar, includes_en
) values (
  -- Reuses the existing Istanbul photo, as the Red Sea and North Turkey
  -- packages do — without it the card would render as a bare gradient.
  'istanbul', 'intl', 'building-2', 'linear-gradient(155deg,#B76E79,#7C444E)', '/trips/istanbul.webp',
  'قروب إسطنبول',
  'Istanbul group',
  'قروب نسائي إلى إسطنبول من ٢٣ إلى ٢٨ سبتمبر، شامل التذاكر وحجز الفندق مع وجبة الإفطار والتنقلات داخل إسطنبول.',
  'A women-only group trip to Istanbul from 23 to 28 September, including tickets, hotel accommodation with breakfast, and transfers within Istanbul.',
  '٤٬٨٥٠', '4,850', 4850, -2,
  'تذاكر الطيران' || chr(10) ||
  'حجز الفندق' || chr(10) ||
  'وجبة الإفطار بالفندق' || chr(10) ||
  'التنقلات داخل إسطنبول',
  'Flight tickets' || chr(10) ||
  'Hotel accommodation' || chr(10) ||
  'Breakfast at the hotel' || chr(10) ||
  'Transfers within Istanbul'
)
on conflict (id) do update set
  kind = excluded.kind,
  icon = excluded.icon,
  grad = excluded.grad,
  image_url = excluded.image_url,
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  desc_ar = excluded.desc_ar,
  desc_en = excluded.desc_en,
  price_ar = excluded.price_ar,
  price_en = excluded.price_en,
  price_amount = excluded.price_amount,
  sort = excluded.sort,
  includes_ar = excluded.includes_ar,
  includes_en = excluded.includes_en;

-- Room types. The shared room matches the package's base price, so the detail
-- page opens on it; the single room is the paid upgrade.
insert into public.item_options (item_type, item_id, label_ar, label_en, price_amount, sort)
values
  ('package', 'istanbul', 'الغرفة المشتركة', 'Shared room', 4850, 0),
  ('package', 'istanbul', 'الغرفة المفردة', 'Single room', 7300, 1);

-- Keep the destination card in step with the group's dates + cheaper room.
update public.trips
set
  dates_ar     = '٢٣–٢٨ سبتمبر',
  dates_en     = '23–28 September',
  duration_ar  = '٦ أيام',
  duration_en  = '6 days',
  price_ar     = '٤٬٨٥٠',
  price_en     = '4,850',
  price_amount = 4850
where id = 'istanbul';
