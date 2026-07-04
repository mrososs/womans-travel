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
   price_ar, price_en, price_amount, featured)
values
  ('moscow','city','intl','landmark','linear-gradient(155deg,#24314B,#9E5863)',4.8,112,4,'luxury','solid',
   'روسيا','Russia','موسكو الساحرة','Enchanting Moscow','٦ أيام','6 days','١٠–١٥ سبتمبر','10–15 Sep','١٠٬٩٠٠','10,900',10900,true),
  ('istanbul','city','intl','building-2','linear-gradient(155deg,#B76E79,#7C444E)',4.7,138,6,'popular','gold',
   'تركيا','Turkey','إسطنبول بين القارتين','Istanbul across two continents','٥ أيام','5 days','٣–٧ أكتوبر','3–7 Oct','٦٬٨٠٠','6,800',6800,true),
  ('london','city','intl','ferris-wheel','linear-gradient(155deg,#4E6A8A,#9E5863)',4.9,92,3,'exclusive','navy',
   'بريطانيا','Britain','لندن العريقة','Timeless London','٧ أيام','7 days','١٢–١٨ نوفمبر','12–18 Nov','١٣٬٥٠٠','13,500',13500,true),
  ('baha','mountain','local','mountain','linear-gradient(155deg,#4E7A5B,#24314B)',4.6,74,8,'domestic','brand',
   'السعودية · الباحة','Saudi Arabia · Al-Baha','الباحة والمرتفعات الخضراء','Al-Baha & the green highlands','٣ أيام','3 days','٥–٧ مايو','5–7 May','٣٬٢٠٠','3,200',3200,true),
  ('red-sea','beach','local','palmtree','linear-gradient(155deg,#C6A15B,#B76E79)',4.8,105,5,'domestic','brand',
   'السعودية · البحر الأحمر','Saudi Arabia · Red Sea','منتجعات البحر الأحمر','Red Sea resorts','٤ أيام','4 days','٢٠–٢٣ يونيو','20–23 Jun','٧٬٢٠٠','7,200',7200,false)
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
   'تشمل الباقة الطيران والإقامة الفاخرة والوجبات الرئيسية والمرافِقة والتنقلات والأنشطة المذكورة.','The package includes flights, luxury accommodation, main meals, the escort, transfers, and the listed activities.',2),
  ('ما سياسة الإلغاء؟','What is the cancellation policy?',
   'الإلغاء مجاني حتى ٧ أيام قبل موعد الرحلة.','Cancellation is free up to 7 days before the trip date.',3),
  ('كيف أحجز؟','How do I book?',
   'اختاري الرحلة، حدّدي التاريخ وعدد المسافرات ونوع الغرفة، ثم اضغطي «احجزي الآن» وسيتواصل معكِ فريقنا.','Choose a trip, set the date, number of travellers and room type, then tap "Book now" and our team will contact you.',4)
on conflict do nothing;

insert into public.packages (id, kind, icon, grad, title_ar, title_en, desc_ar, desc_en, price_ar, price_en, sort) values
  ('moscow-group','intl','landmark','linear-gradient(155deg,#24314B,#9E5863)','قروب موسكو','Moscow group','٦ أيام في موسكو بين الميادين الحمراء والقصور التاريخية بإقامة فاخرة ومرافِقة مختصّة.','6 days in Moscow across Red Square and historic palaces with luxury stays and a dedicated escort.','١٢٬٩٠٠','12,900',1),
  ('istanbul-group','intl','building-2','linear-gradient(155deg,#B76E79,#7C444E)','قروب إسطنبول','Istanbul group','٥ أيام بين إسطنبول والبوسفور بضيافة راقية وتسوّق فاخر.','5 days across Istanbul and the Bosphorus with refined hospitality and fine shopping.','٨٬٤٠٠','8,400',2),
  ('london-group','intl','ferris-wheel','linear-gradient(155deg,#4E6A8A,#9E5863)','قروب لندن','London group','٧ أيام في لندن بين المعالم العريقة وأرقى المتاجر.','7 days in London across timeless landmarks and the finest stores.','١٦٬٥٠٠','16,500',3),
  ('baha-group','local','mountain','linear-gradient(155deg,#4E7A5B,#24314B)','قروب الباحة','Al-Baha group','٣ أيام بين مرتفعات الباحة الخضراء وقراها التراثية.','3 days across Al-Baha''s green highlands and heritage villages.','٣٬٩٠٠','3,900',4),
  ('red-sea','local','palmtree','linear-gradient(155deg,#C6A15B,#B76E79)','باقة البحر الأحمر','Red Sea package','عطلة شاطئية خاصّة على منتجعات ساحل البحر الأحمر السعودي.','A private beach getaway at Saudi Arabia''s Red Sea coast resorts.','٧٬٢٠٠','7,200',5)
on conflict (id) do nothing;

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
