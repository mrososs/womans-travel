-- ============================================================
-- Durrah — Moscow group package (قروب موسكو)
--
-- New bookable package, mirroring the Red Sea group: two room-type options
-- (shared / single) via item_options, a full "what's included" list, and a
-- deposit_amount so it stays eligible for the deposit-only bank-transfer flow.
-- The destination card (trips.moscow) price is synced to the group's cheaper
-- (shared-room) price, same as the Red Sea sync in 20260727120000.
-- (Applied to the durrah project via MCP apply_migration.)
-- ============================================================

insert into public.packages (
  id, kind, icon, grad,
  title_ar, title_en, desc_ar, desc_en,
  price_ar, price_en, price_amount, sort, deposit_amount,
  includes_ar, includes_en
) values (
  'moscow', 'intl', 'landmark', 'linear-gradient(155deg,#24314B,#9E5863)',
  'قروب موسكو',
  'Moscow group',
  'قروب نسائي إلى موسكو من ٢٠ إلى ٢٥ سبتمبر، شامل تذاكر الطيران والفنادق والإفطار، مع استقبال وتوديع من المطار والمواصلات وشريحة إنترنت، وزيارة متحف الكرملين والتلفريك، برفقة مشرفة على القروب طوال الرحلة.',
  'A women-only group trip to Moscow from 20 to 25 September, including flights, hotels and breakfast, airport pickup & drop-off, transportation and an internet SIM card, a Kremlin Museum visit and the cable car, with a group supervisor throughout.',
  '٧٬٤٠٠', '7,400', 7400, -1, 3000,
  'تذاكر الطيران ذهابًا وإيابًا' || chr(10) ||
  'الإقامة في الفندق' || chr(10) ||
  'وجبة الإفطار بالفندق' || chr(10) ||
  'استقبال وتوديع من المطار' || chr(10) ||
  'المواصلات' || chr(10) ||
  'شريحة إنترنت' || chr(10) ||
  'زيارة متحف الكرملين' || chr(10) ||
  'التلفريك' || chr(10) ||
  'مشرفة على القروب طوال الرحلة',
  'Round-trip flights' || chr(10) ||
  'Hotel accommodation' || chr(10) ||
  'Breakfast at the hotel' || chr(10) ||
  'Airport pickup & drop-off' || chr(10) ||
  'Transportation' || chr(10) ||
  'Internet SIM card' || chr(10) ||
  'Kremlin Museum visit' || chr(10) ||
  'Cable car' || chr(10) ||
  'A group supervisor throughout'
)
on conflict (id) do update set
  kind = excluded.kind,
  icon = excluded.icon,
  grad = excluded.grad,
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  desc_ar = excluded.desc_ar,
  desc_en = excluded.desc_en,
  price_ar = excluded.price_ar,
  price_en = excluded.price_en,
  price_amount = excluded.price_amount,
  sort = excluded.sort,
  deposit_amount = excluded.deposit_amount,
  includes_ar = excluded.includes_ar,
  includes_en = excluded.includes_en;

insert into public.item_options (item_type, item_id, label_ar, label_en, price_amount, sort)
values
  ('package', 'moscow', 'الغرفة المشتركة', 'Shared room', 7400, 0),
  ('package', 'moscow', 'الغرفة المفردة', 'Single room', 8200, 1);

-- Keep the destination card in step with the group's shared-room price.
update public.trips
set
  price_ar = '٧٬٤٠٠',
  price_en = '7,400',
  price_amount = 7400
where id = 'moscow';
