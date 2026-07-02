-- ============================================================
-- Durrah — seed data (mirrors app/data/site.ts)
-- Runs on `supabase db reset` (local) or apply manually to a remote project.
-- ============================================================

insert into public.categories (id, icon, name_ar, name_en, sort) values
  ('beach',    'palmtree',   'شواطئ', 'Beaches',   1),
  ('mountain', 'mountain',   'جبال',  'Mountains', 2),
  ('city',     'building-2', 'مدن',   'Cities',    3),
  ('desert',   'sun',        'صحراء', 'Desert',    4)
on conflict (id) do nothing;

insert into public.trips
  (id, category_id, kind, icon, grad, rating, reviews, seats, tier_key, tier_variant,
   region_ar, region_en, title_ar, title_en, duration_ar, duration_en, dates_ar, dates_en,
   price_ar, price_en, price_amount, featured)
values
  ('alps','mountain','intl','mountain-snow','linear-gradient(155deg,#24314B,#9E5863)',4.8,124,3,'luxury','solid',
   'النمسا','Austria','جبال الألب النمساوية','The Austrian Alps','٧ أيام','7 days','١٢–١٨ سبتمبر','12–18 Sep','٨٬٥٠٠','8,500',8500,true),
  ('maldives','beach','intl','palmtree','linear-gradient(155deg,#C6A15B,#B76E79)',4.9,86,null,'exclusive','navy',
   'المالديف','Maldives','منتجع خاص على الجزيرة','A private island resort','٥ أيام','5 days','٣–٧ أكتوبر','3–7 Oct','١٤٬٢٠٠','14,200',14200,true),
  ('alula','mountain','local','mountain','linear-gradient(155deg,#B76E79,#7C444E)',4.7,152,6,'domestic','brand',
   'السعودية · العُلا','Saudi Arabia · AlUla','العُلا الساحرة','Enchanting AlUla','٤ أيام','4 days','٢٠–٢٣ نوفمبر','20–23 Nov','٥٬٩٠٠','5,900',5900,true),
  ('kyoto','city','intl','flower-2','linear-gradient(155deg,#9E5863,#24314B)',4.9,64,4,'luxury','solid',
   'اليابان','Japan','كيوتو الكلاسيكية','Classic Kyoto','٨ أيام','8 days','١–٨ أبريل','1–8 Apr','١١٬٣٠٠','11,300',11300,true),
  ('santorini','beach','intl','sailboat','linear-gradient(155deg,#4E6A8A,#B76E79)',4.8,98,2,'popular','gold',
   'اليونان','Greece','سانتوريني البيضاء','White Santorini','٦ أيام','6 days','١٥–٢٠ يونيو','15–20 Jun','٩٬٧٠٠','9,700',9700,true),
  ('taif','city','local','flower','linear-gradient(155deg,#C88A82,#9E5863)',4.6,71,8,'domestic','brand',
   'السعودية · الطائف','Saudi Arabia · Taif','الطائف والورد','Taif & the roses','٣ أيام','3 days','٥–٧ مايو','5–7 May','٣٬٤٠٠','3,400',3400,false)
on conflict (id) do nothing;

insert into public.reviews (trip_id, icon, grad, rating, name_ar, name_en, trip_ar, trip_en, text_ar, text_en) values
  ('alps','mountain-snow','linear-gradient(135deg,#24314B,#9E5863)',5,'نورة السالم','Noura Al-Salem','رحلة النمسا','Austria trip',
   'تجربة تفوق الوصف — تنظيم راقٍ وخصوصية جعلتني أستمتع بكل لحظة بأمان تام.','An experience beyond words — refined organisation and privacy that let me enjoy every moment in complete safety.'),
  ('maldives','palmtree','linear-gradient(135deg,#C6A15B,#B76E79)',5,'ريم القحطاني','Reem Al-Qahtani','رحلة المالديف','Maldives trip',
   'كل التفاصيل مدروسة بعناية، والمرافِقة كانت لطيفة ومحترفة. سأكرّر التجربة حتمًا.','Every detail was thoughtfully considered, and the escort was kind and professional. I will absolutely do it again.'),
  ('alula','mountain','linear-gradient(135deg,#B76E79,#7C444E)',5,'الجوهرة العتيبي','Al-Jawhara Al-Otaibi','رحلة العُلا','AlUla trip',
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
  ('luxe-europe','intl','crown','linear-gradient(155deg,#24314B,#9E5863)','باقة أوروبا الفاخرة','Luxe Europe package','جولة راقية بين عواصم أوروبا بإقامة ٥ نجوم ومرافِقة مختصّة.','A refined tour across European capitals with 5-star stays and a dedicated escort.','١٨٬٩٠٠','18,900',1),
  ('red-sea','local','palmtree','linear-gradient(155deg,#C6A15B,#B76E79)','باقة البحر الأحمر','Red Sea package','عطلة شاطئية خاصّة على ساحل البحر الأحمر السعودي.','A private beach getaway on Saudi Arabia''s Red Sea coast.','٧٬٢٠٠','7,200',2),
  ('asia-discovery','intl','compass','linear-gradient(155deg,#9E5863,#24314B)','اكتشاف آسيا','Asia discovery','رحلة استكشافية بين ثقافات آسيا العريقة بصحبة نسائية.','An exploratory journey through Asia''s rich cultures in women''s company.','١٣٬٥٠٠','13,500',3)
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
