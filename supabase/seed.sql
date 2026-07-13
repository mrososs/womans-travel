-- ============================================================
-- Durrah — seed data (mirrors app/data/site.ts)
-- Runs on `supabase db reset` (local) or apply manually to a remote project.
-- ============================================================

insert into public.categories (id, icon, name_ar, name_en, sort) values
  ('beach',    'palmtree',   'شواطئ', 'Beaches',   1),
  ('mountain', 'mountain',   'جبال',  'Mountains', 2),
  ('city',     'building-2', 'مدن',   'Cities',    3)
on conflict (id) do nothing;

insert into public.trips
  (id, category_id, kind, icon, grad, rating, reviews, seats, tier_key, tier_variant,
   region_ar, region_en, title_ar, title_en, duration_ar, duration_en, dates_ar, dates_en,
   price_ar, price_en, price_amount, featured, coming_soon, image_url)
values
  ('moscow','city','intl','landmark','linear-gradient(155deg,#24314B,#9E5863)',4.8,112,4,'luxury','solid',
   'روسيا','Russia','موسكو الساحرة','Enchanting Moscow','٦ أيام','6 days','١٠–١٥ سبتمبر','10–15 Sep','١٠٬٩٠٠','10,900',10900,true,true,'/trips/moscow.webp'),
  ('istanbul','city','intl','building-2','linear-gradient(155deg,#B76E79,#7C444E)',4.7,138,6,'popular','gold',
   'تركيا','Turkey','إسطنبول بين القارتين','Istanbul across two continents','٥ أيام','5 days','٣–٧ أكتوبر','3–7 Oct','٦٬٨٠٠','6,800',6800,true,true,'/trips/istanbul.webp'),
  ('london','city','intl','ferris-wheel','linear-gradient(155deg,#4E6A8A,#9E5863)',4.9,92,3,'exclusive','navy',
   'بريطانيا','Britain','لندن العريقة','Timeless London','٧ أيام','7 days','١٢–١٨ نوفمبر','12–18 Nov','١٣٬٥٠٠','13,500',13500,true,true,'/trips/london.webp'),
  ('baha','mountain','local','mountain','linear-gradient(155deg,#4E7A5B,#24314B)',4.6,74,8,'domestic','brand',
   'السعودية · الباحة','Saudi Arabia · Al-Baha','الباحة والمرتفعات الخضراء','Al-Baha & the green highlands','٣ أيام','3 days','٥–٧ مايو','5–7 May','٣٬٢٠٠','3,200',3200,true,true,'/trips/baha.webp'),
  ('red-sea','beach','local','palmtree','linear-gradient(155deg,#C6A15B,#B76E79)',4.8,105,5,'domestic','brand',
   'السعودية · البحر الأحمر','Saudi Arabia · Red Sea','منتجعات البحر الأحمر','Red Sea resorts','٤ أيام','4 days','٢٠–٢٣ يونيو','20–23 Jun','٧٬٢٠٠','7,200',7200,false,true,'/trips/red-sea.webp')
on conflict (id) do nothing;

insert into public.reviews (trip_id, icon, grad, rating, name_ar, name_en, trip_ar, trip_en, text_ar, text_en) values
  ('moscow','landmark','linear-gradient(135deg,#24314B,#9E5863)',5,'نورة السالم','Noura Al-Salem','رحلة موسكو','Moscow trip',
   'تجربة تفوق الوصف — تنظيم راقٍ وخصوصية جعلتني أستمتع بكل لحظة بأمان تام.','An experience beyond words — refined organisation and privacy that let me enjoy every moment in complete safety.'),
  ('istanbul','building-2','linear-gradient(135deg,#B76E79,#7C444E)',5,'ريم القحطاني','Reem Al-Qahtani','رحلة إسطنبول','Istanbul trip',
   'كل التفاصيل مدروسة بعناية، والمرافِقة كانت لطيفة ومحترفة. سأكرّر التجربة حتمًا.','Every detail was thoughtfully considered, and the escort was kind and professional. I will absolutely do it again.'),
  ('baha','mountain','linear-gradient(135deg,#4E7A5B,#24314B)',5,'الجوهرة العتيبي','Al-Jawhara Al-Otaibi','رحلة الباحة','Al-Baha trip',
   'أجمل ما في التجربة هو الإحساس بالطمأنينة والصحبة الجميلة. فخامة بمعناها الحقيقي.','The best part was the sense of reassurance and the lovely company. Luxury in its truest sense.')
on conflict do nothing;

insert into public.faqs (question_ar, question_en, answer_ar, answer_en, sort) values
  ('هل الرحلات نسائية بالكامل؟','Are the trips fully women-only?',
   'نعم، جميع رحلاتنا نسائية بالكامل بمرافِقات وطاقم من السيدات لضمان الخصوصية التامّة.','Yes, all our trips are fully women-only with female escorts and staff to ensure complete privacy.',1),
  ('ما الذي تشمله الباقة؟','What does the package include?',
   'تشمل الباقة الطيران والإقامة الفاخرة ووجبة الإفطار ومشرفة القروب والتنقلات والأنشطة المذكورة.','The package includes flights, luxury accommodation, breakfast, the group supervisor, transfers, and the listed activities.',2),
  ('ما سياسة الإلغاء والاسترجاع؟','What is the cancellation and refund policy?',
   'جميع الحجوزات نهائية. بعد إتمام الدفع، يُعدّ المبلغ غير قابل للاسترجاع ولا يمكن إلغاء الحجز.','All bookings are final. Once payment is completed, the amount is non-refundable and the booking cannot be cancelled.',3),
  ('كيف أحجز؟','How do I book?',
   'اختاري الرحلة، حدّدي التاريخ وعدد المسافرات ونوع الغرفة، ثم اضغطي «احجزي الآن» وسيتواصل معكِ فريقنا.','Choose a trip, set the date, number of travellers and room type, then tap "Book now" and our team will contact you.',4)
on conflict do nothing;

insert into public.packages (id, kind, icon, grad, title_ar, title_en, desc_ar, desc_en, price_ar, price_en, price_amount, sort, image_url) values
  ('turkey-north','intl','mountain-snow','linear-gradient(155deg,#24314B,#4E7A5B)','الشمال التركي','North Turkey','٧ أيام (٦–١٣ أغسطس) بين طرابزون ودير سوميلا وأوزنجول وريزا وآيدر، بإقامة في فندق ٥ نجوم ومشرفة للقروب. شامل تذاكر السفر والمواصلات والإفطار.','7 days (6–13 Aug) across Trabzon, Sumela Monastery, Uzungol, Rize and Ayder, with a 5-star hotel stay and a group escort. Includes travel tickets, transport and breakfast.','٦٬٥٥٠','6,550',6550,0,'/trips/turkey-north.jpg'),
  ('red-sea','local','palmtree','linear-gradient(155deg,#C6A15B,#B76E79)','باقة البحر الأحمر','Red Sea package','٣ أيام (١٩–٢٢ أغسطس) على منتجع فاخر ٥ نجوم بساحل البحر الأحمر، شامل تذاكر الطيران والمواصلات والإفطار ومشرفة للقروب.','3 days (19–22 Aug) at a luxury 5-star Red Sea coast resort. Includes flight tickets, transport, breakfast and a group escort.','٥٬٥٥٠','5,550',5550,1,'/trips/red-sea.webp')
on conflict (id) do nothing;

-- Room-type options for the client packages (single / shared room). Idempotent:
-- only insert a label once per package. item_options has a uuid PK, so we guard
-- on (item_type, item_id, label_en) instead of relying on ON CONFLICT.
insert into public.item_options (item_type, item_id, label_ar, label_en, price_amount, available, sort)
select v.item_type, v.item_id, v.label_ar, v.label_en, v.price_amount, true, v.sort
from (values
  ('package','turkey-north','غرفة مشتركة (حجز مبكر)','Shared room (early booking)',6550::numeric,0),
  ('package','turkey-north','غرفة مفردة (حجز مبكر)','Single room (early booking)',8650::numeric,1),
  ('package','red-sea','غرفة مشتركة','Shared room',5550::numeric,0),
  ('package','red-sea','غرفة مفردة','Single room',8950::numeric,1)
) as v(item_type, item_id, label_ar, label_en, price_amount, sort)
where not exists (
  select 1 from public.item_options o
  where o.item_type = v.item_type and o.item_id = v.item_id and o.label_en = v.label_en
);

-- Day-by-day itinerary for the client packages. Idempotent on (package_id, day_number).
insert into public.package_days (package_id, day_number, title_ar, title_en, items_ar, items_en, sort)
select v.package_id, v.day_number, v.title_ar, v.title_en, v.items_ar, v.items_en, v.day_number - 1
from (values
  ('turkey-north',1,'الوصول إلى طرابزون','Arrival in Trabzon',
   E'تسجيل الدخول للفندق\nاستلام الغرف',
   E'Hotel check-in\nRoom allocation'),
  ('turkey-north',2,'دير سوميلا','Sumela Monastery',
   E'الإفطار في الفندق\nزيارة دير سوميلا\nمتنزه ألتين ديره الوطني\nقرية همسي كوي وتذوق الأرز بالحليب الشهير\nالعودة إلى طرابزون',
   E'Breakfast at the hotel\nVisit Sumela Monastery\nAltindere National Park\nHamsikoy village and its famous rice pudding\nReturn to Trabzon'),
  ('turkey-north',3,'أوزنجول','Uzungol',
   E'الإفطار في الفندق\nالتوجه إلى أوزنجول\nالتجول حول البحيرة\nزيارة شلالات أوزنجول\nالصعود إلى مرتفعات السلطان مراد',
   E'Breakfast at the hotel\nHead to Uzungol\nStroll around the lake\nVisit the Uzungol waterfalls\nClimb to the Sultan Murat highlands'),
  ('turkey-north',4,'ريزا وآيدر','Rize and Ayder',
   E'الإفطار في الفندق والانطلاق إلى ريزا\nزيارة مزارع الشاي في ريزا\nركوب التلفريك في ريزا (اختياري)\nالوصول إلى آيدر\nزيارة شلال جيلين تولو',
   E'Breakfast, then set off to Rize\nVisit the tea plantations of Rize\nRize cable car (optional)\nArrive in Ayder\nVisit the Gelin Tulu waterfall'),
  ('turkey-north',5,'آيدر','Ayder',
   E'الإفطار بالفندق\nنهر فرتينا\nالزيب لاين أو التجديف (اختياري)\nجسر الحجر التاريخي\nالاستمتاع بالمقاهي المطلة على النهر',
   E'Breakfast at the hotel\nFirtina River\nZipline or rafting (optional)\nThe historic stone bridge\nRelax at the riverside cafés'),
  ('turkey-north',6,'طرابزون','Trabzon',
   E'الإفطار بالفندق\nزيارة بحيرة سيرا\nمول فوروم طرابزون أو جواهر أوتلت\nقصر أتاتورك\nالتسوق من الأسواق المحلية',
   E'Breakfast at the hotel\nVisit Sera Lake\nForum Trabzon mall or Cevahir Outlet\nAtaturk Mansion\nShopping in the local markets'),
  ('turkey-north',7,'قبل المغادرة','Departure day',
   E'التوجه إلى المطار',
   E'Transfer to the airport'),
  ('red-sea',1,'الوصول والاستقبال','Arrival & welcome',
   E'الاستقبال والانتقال إلى المنتجع\nتسجيل الدخول واستلام الغرف\nأمسية حرة على الشاطئ',
   E'Meet & greet and transfer to the resort\nCheck-in and room allocation\nFree evening by the beach'),
  ('red-sea',2,'يوم الشاطئ','Beach day',
   E'الإفطار في المنتجع\nيوم استجمام على الشاطئ والمسبح\nأنشطة مائية (اختياري)\nالاستمتاع بغروب البحر الأحمر',
   E'Breakfast at the resort\nA relaxing day at the beach and pool\nWater activities (optional)\nEnjoy the Red Sea sunset'),
  ('red-sea',3,'المغادرة','Departure',
   E'الإفطار في المنتجع\nوقت حر للتسوق\nالانتقال إلى المطار',
   E'Breakfast at the resort\nFree time for shopping\nTransfer to the airport')
) as v(package_id, day_number, title_ar, title_en, items_ar, items_en)
where not exists (
  select 1 from public.package_days d
  where d.package_id = v.package_id and d.day_number = v.day_number
);

insert into public.services (id, icon, title_ar, title_en, desc_ar, desc_en, sort) values
  ('visa','stamp','استخراج التأشيرات','Visa assistance','مساعدة كاملة في تجهيز وتقديم طلبات التأشيرة.','Full assistance preparing and submitting visa applications.',1),
  ('hotels','bed-double','حجوزات الفنادق','Hotel bookings','أفضل الفنادق المختارة بأسعار خاصّة.','Hand-picked top hotels at special rates.',2),
  ('flights','plane','تذاكر الطيران','Flight tickets','حجز رحلات الطيران بأنسب المواعيد والأسعار.','Flight booking at the best times and prices.',3),
  ('transport','car-front','النقل الخاص','Private transport','تنقلات خاصّة مريحة وآمنة طوال الرحلة.','Comfortable, safe private transfers throughout.',4),
  ('concierge','concierge-bell','خدمة الكونسيرج','Concierge','ترتيبات خاصّة وطلبات مخصّصة على مدار الرحلة.','Bespoke arrangements and custom requests throughout.',5),
  ('insurance','shield-check','تأمين السفر','Travel insurance','تغطية تأمينية شاملة لراحة بالكِ.','Comprehensive insurance coverage for your peace of mind.',6)
on conflict (id) do nothing;

insert into public.products (id, icon, grad, title_ar, title_en, desc_ar, desc_en, price_ar, price_en, sort) values
  ('cabin-luggage','luggage','linear-gradient(135deg,#B76E79,#7C444E)','حقيبة سفر فاخرة','Luxury cabin luggage','حقيبة أنيقة خفيفة الوزن بتصميم عصري.','An elegant, lightweight bag with a modern design.','٦٥٠','650',1),
  ('travel-kit','sparkles','linear-gradient(135deg,#C6A15B,#B76E79)','طقم العناية للسفر','Travel care kit','مستلزمات العناية الأساسية بتغليف راقٍ.','Essential care items in refined packaging.','٢٢٠','220',2),
  ('neck-pillow','moon','linear-gradient(135deg,#4E6A8A,#9E5863)','وسادة الرقبة','Travel neck pillow','وسادة مريحة لرحلات طيران هادئة.','A comfy pillow for restful flights.','١٤٠','140',3),
  ('scarf','wind','linear-gradient(135deg,#C88A82,#9E5863)','وشاح دُرّة','Durrah scarf','وشاح حريري بألوان العلامة.','A silk scarf in the brand colours.','٣١٠','310',4)
on conflict (id) do nothing;
