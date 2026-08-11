-- =========================================================
-- UmrahQu — Seed itineraries realistis untuk semua paket
-- Format: jsonb array [{day, title, description}]
-- =========================================================

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Bandara Yogyakarta untuk briefing manasik, lalu penerbangan menuju Jeddah dengan Saudi Airlines."},
  {"day":2,"title":"Tiba di Jeddah & Menuju Makkah","description":"Tiba di Bandara King Abdulaziz Jeddah, transfer bus menuju Makkah (±2,5 jam), check-in hotel Retaj Makkah, beristirahat."},
  {"day":3,"title":"Umroh","description":"Mandi sunnah, berihram dari miqat, thawaf 7 putaran di Masjidil Haram, sa''i Shafa-Marwah, dan tahallul."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah di Masjidil Haram, ziarah Jabal Nur dan Gua Hira, serta menikmati suasana Ramadhan yang khidmat."},
  {"day":5,"title":"Ziarah & Ibadah Bebas","description":"Salat di Masjidil Haram, thawaf sunnah, dan ziarah Jabal Tsur serta Masjid Jin di sekitar Makkah."},
  {"day":6,"title":"Menuju Madinah","description":"Perjalanan darat Makkah–Madinah (±450 km, ±8 jam) dengan bus, tiba lalu check-in hotel Sama Madinah."},
  {"day":7,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Masjid Quba, Masjid Qiblatain, Bukit Uhud, dan pemakaman Baqi."},
  {"day":8,"title":"Ibadah & Belanja","description":"Salat berjamaah dan itikaf di Masjid Nabawi, ziarah terakhir, serta belanja oleh-oleh di pasar Madinah."},
  {"day":9,"title":"Kepulangan","description":"Thawaf wada'' bagi yang memungkinkan, transfer ke bandara, dan penerbangan pulang ke Yogyakarta."}
]'::jsonb WHERE slug = 'umroh-reguler-9-hari';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Bandara Bandung/Jakarta, briefing singkat, lalu penerbangan menuju Jeddah dengan Garuda Indonesia."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Al Ebaa Hotel, istirahat malam."},
  {"day":3,"title":"Umroh","description":"Berihram dari miqat, melaksanakan thawaf, sa''i, dan tahallul di Masjidil Haram."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah di Masjidil Haram serta materials kajian manasik dari pembimbing."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira, tempat Rasulullah SAW menerima wahyu pertama."},
  {"day":6,"title":"Ziarah & Ibadah Bebas","description":"Thawaf sunnah di Masjidil Haram dan ziarah Jabal Tsur serta situs bersejarah lainnya."},
  {"day":7,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah (±8 jam), check-in hotel Oasis Hotel Madinah."},
  {"day":8,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Masjid Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":9,"title":"Ibadah di Masjid Nabawi","description":"Salat berjamaah dan itikaf di Masjid Nabawi, serta ziarah Raudhah."},
  {"day":10,"title":"Kepulangan","description":"Transfer ke bandara Jeddah, penerbangan pulang menuju Bandung/Jakarta."}
]'::jsonb WHERE slug = 'umroh-hemat-10-hari';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Bandara Makassar, briefing manasik, lalu penerbangan menuju Jeddah dengan Garuda Indonesia."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Hyatt Regency Makkah, istirahat."},
  {"day":3,"title":"Umroh","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul di Masjidil Haram."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah, kajian manasik, dan menikmati suasana Masjidil Haram."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira, tempat turunnya wahyu pertama."},
  {"day":6,"title":"Thawaf Sunnah","description":"Thawaf sunnah dan salat malam di Masjidil Haram."},
  {"day":7,"title":"Ziarah Makkah","description":"Ziarah Jabal Tsur, rumah kelahiran Nabi, dan Masjid Jin."},
  {"day":8,"title":"Menuju Madinah","description":"Perjalanan darat Makkah–Madinah (±8 jam), check-in hotel Dar Al Taqwa Madinah."},
  {"day":9,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":10,"title":"Ibadah di Masjid Nabawi","description":"Salat berjamaah, itikaf, dan ziarah lanjutan di Masjid Nabawi."},
  {"day":11,"title":"Ziarah & Belanja","description":"Ziarah tempat-tempat bersejarah Madinah dan belanja oleh-oleh."},
  {"day":12,"title":"Ibadah Bebas","description":"Waktu bebas untuk ibadah dan thawaf di Masjid Nabawi."},
  {"day":13,"title":"Kembali ke Makkah","description":"Perjalanan menuju Makkah untuk thawaf wada'' (pilihan), kembali ke hotel Madinah."},
  {"day":14,"title":"Persiapan Pulang","description":"Packing dan persiapan kepulangan setelah ibadah yang khusyuk."},
  {"day":15,"title":"Kepulangan","description":"Transfer ke bandara Jeddah, penerbangan pulang menuju Makassar."}
]'::jsonb WHERE slug = 'umroh-reguler-15-hari';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Bandara Bandung untuk briefing, lalu penerbangan menuju Jeddah dengan Lion Air."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Al Mutmainnah."},
  {"day":3,"title":"Umroh","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul di Masjidil Haram."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah dan kajian manasik di Masjidil Haram."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira."},
  {"day":6,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah (±8 jam), check-in hotel Madinah Suites."},
  {"day":7,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":8,"title":"Ibadah & Belanja","description":"Salat berjamaah di Masjid Nabawi dan belanja oleh-oleh."},
  {"day":9,"title":"Kepulangan","description":"Transfer ke bandara, penerbangan pulang menuju Bandung."}
]'::jsonb WHERE slug = 'umroh-hemat-9h-mabrur';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Bandara Surabaya, briefing manasik, lalu penerbangan menuju Jeddah dengan Lion Air."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Al Ehsan Hotel."},
  {"day":3,"title":"Umroh","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul di Masjidil Haram."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah dan kajian manasik di Masjidil Haram."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira, tempat turunnya wahyu pertama."},
  {"day":6,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah (±8 jam), check-in hotel Madinah Grand."},
  {"day":7,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":8,"title":"Ibadah & Belanja","description":"Salat berjamaah di Masjid Nabawi dan belanja oleh-oleh."},
  {"day":9,"title":"Kepulangan","description":"Transfer ke bandara Jeddah, penerbangan pulang menuju Surabaya."}
]'::jsonb WHERE slug = 'umroh-reguler-9h-baitullah';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Bandara Medan untuk briefing manasik, lalu penerbangan menuju Jeddah dengan Garuda Indonesia."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Fajr Al Bader."},
  {"day":3,"title":"Umroh","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul di Masjidil Haram."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah dan kajian manasik di Masjidil Haram."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira, tempat turunnya wahyu pertama."},
  {"day":6,"title":"Ziarah & Ibadah Bebas","description":"Thawaf sunnah dan ziarah Jabal Tsur serta Masjid Jin."},
  {"day":7,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah (±8 jam), check-in hotel Madinah Hariyah."},
  {"day":8,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":9,"title":"Ibadah di Masjid Nabawi","description":"Salat berjamaah dan itikaf di Masjid Nabawi."},
  {"day":10,"title":"Belanja & Persiapan","description":"Belanja oleh-oleh di pasar Madinah dan persiapan kepulangan."},
  {"day":11,"title":"Kepulangan","description":"Transfer ke bandara Jeddah, penerbangan pulang menuju Medan."}
]'::jsonb WHERE slug = 'umroh-reguler-11h-zamzam';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Bandara Bandung/Jakarta, briefing manasik, lalu penerbangan menuju Jeddah dengan Garuda Indonesia."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Al Kiswah Towers."},
  {"day":3,"title":"Umroh","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul di Masjidil Haram."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah dan kajian manasik di Masjidil Haram."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira, tempat turunnya wahyu pertama."},
  {"day":6,"title":"Thawaf Sunnah","description":"Thawaf sunnah dan salat malam di Masjidil Haram."},
  {"day":7,"title":"Ziarah Makkah","description":"Ziarah Jabal Tsur, Masjid Jin, dan rumah kelahiran Nabi."},
  {"day":8,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah (±8 jam), check-in hotel Oberoi Madinah."},
  {"day":9,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":10,"title":"Ibadah di Masjid Nabawi","description":"Salat berjamaah, itikaf, dan ziarah lanjutan di Masjid Nabawi."},
  {"day":11,"title":"Belanja & Persiapan","description":"Belanja oleh-oleh di Madinah dan persiapan kepulangan."},
  {"day":12,"title":"Kepulangan","description":"Transfer ke bandara Jeddah, penerbangan pulang menuju Bandung/Jakarta."}
]'::jsonb WHERE slug = 'umroh-reguler-12h-mabrur';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Bandara Jakarta untuk briefing manasik, lalu penerbangan menuju Jeddah dengan Garuda Indonesia."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Al Kiswah Hotel."},
  {"day":3,"title":"Umroh","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul di Masjidil Haram."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah dan kajian manasik di Masjidil Haram."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira."},
  {"day":6,"title":"Ziarah & Ibadah Bebas","description":"Thawaf sunnah dan ziarah Jabal Tsur serta Masjid Jin."},
  {"day":7,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah (±8 jam), check-in hotel Royal Inn Madinah."},
  {"day":8,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":9,"title":"Ibadah di Masjid Nabawi","description":"Salat berjamaah, itikaf, dan ziarah lanjutan di Masjid Nabawi."},
  {"day":10,"title":"Ziarah & Belanja","description":"Ziarah tempat bersejarah Madinah dan belanja oleh-oleh."},
  {"day":11,"title":"Ibadah Bebas","description":"Waktu bebas untuk ibadah di Masjid Nabawi."},
  {"day":12,"title":"Kepulangan","description":"Transfer ke bandara Jeddah, penerbangan pulang menuju Jakarta."}
]'::jsonb WHERE slug = 'umroh-reguler-12-hari';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Jakarta untuk briefing manasik, lalu penerbangan menuju Jeddah dengan Emirates."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba dan check-in hotel Raffles Hotel Makkah di pusat kota, dekat Masjidil Haram."},
  {"day":3,"title":"Umroh","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul dengan privasi penuh."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah di Masjidil Haram dan kajian manasik bersama pembimbing khusus."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira dengan transportasi pribadi."},
  {"day":6,"title":"Ibadah Bebas","description":"Thawaf sunnah dan salat malam di Masjidil Haram dengan suasana tenang."},
  {"day":7,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah, check-in hotel The Oberoi Madinah."},
  {"day":8,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":9,"title":"Kepulangan","description":"Transfer ke bandara, penerbangan pulang menuju Jakarta."}
]'::jsonb WHERE slug = 'umroh-vip-9-hari';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Bandara Medan untuk briefing, lalu penerbangan menuju Jeddah dengan Saudi Airlines."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Conrad Makkah."},
  {"day":3,"title":"Umroh","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul di Masjidil Haram."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah dan kajian manasik di Masjidil Haram."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira dengan transportasi pribadi."},
  {"day":6,"title":"Ibadah Bebas","description":"Thawaf sunnah dan salat malam di Masjidil Haram."},
  {"day":7,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah, check-in hotel Madinah Marriott."},
  {"day":8,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":9,"title":"Ibadah di Masjid Nabawi","description":"Salat berjamaah dan itikaf di Masjid Nabawi."},
  {"day":10,"title":"Kepulangan","description":"Transfer ke bandara Jeddah, penerbangan pulang menuju Medan."}
]'::jsonb WHERE slug = 'umroh-vip-10h-zamzam';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Bandara Jakarta untuk briefing manasik, lalu penerbangan menuju Jeddah dengan Saudi Airlines."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Pullman Zamzam Makkah."},
  {"day":3,"title":"Umroh","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul di Masjidil Haram."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah dan kajian manasik di Masjidil Haram."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira dengan transportasi pribadi."},
  {"day":6,"title":"Ibadah Bebas","description":"Thawaf sunnah dan salat malam di Masjidil Haram."},
  {"day":7,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah, check-in hotel Madinah Hilton."},
  {"day":8,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":9,"title":"Ibadah di Masjid Nabawi","description":"Salat berjamaah dan itikaf di Masjid Nabawi."},
  {"day":10,"title":"Kepulangan","description":"Transfer ke bandara Jeddah, penerbangan pulang menuju Jakarta."}
]'::jsonb WHERE slug = 'umroh-vip-10-hari';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Jakarta untuk briefing manasik, lalu penerbangan menuju Jeddah dengan Emirates."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Fairmont Makkah."},
  {"day":3,"title":"Umroh","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul dengan privasi penuh."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah di Masjidil Haram dan kajian manasik bersama pembimbing khusus."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira dengan transportasi pribadi."},
  {"day":6,"title":"Ibadah Bebas","description":"Thawaf sunnah dan salat malam di Masjidil Haram."},
  {"day":7,"title":"Ziarah Makkah","description":"Ziarah Jabal Tsur, Masjid Jin, dan rumah kelahiran Nabi."},
  {"day":8,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah, check-in hotel Al Aqeeq Royal."},
  {"day":9,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":10,"title":"Ibadah di Masjid Nabawi","description":"Salat berjamaah dan itikaf di Masjid Nabawi."},
  {"day":11,"title":"Ziarah & Belanja","description":"Ziarah tempat bersejarah Madinah dan belanja oleh-oleh."},
  {"day":12,"title":"Ibadah Bebas","description":"Waktu bebas untuk ibadah di Masjid Nabawi."},
  {"day":13,"title":"Kepulangan","description":"Transfer ke bandara Jeddah, penerbangan pulang menuju Jakarta."}
]'::jsonb WHERE slug = 'umroh-vip-13-hari';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Jakarta untuk briefing manasik, lalu penerbangan menuju Jeddah dengan Singapore Airlines."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Conrad Makkah."},
  {"day":3,"title":"Umroh Furoda","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul dengan pendampingan khusus."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah di Masjidil Haram dan kajian manasik bersama pembimbing."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira, tempat turunnya wahyu pertama."},
  {"day":6,"title":"Ibadah Bebas","description":"Thawaf sunnah dan salat malam di Masjidil Haram."},
  {"day":7,"title":"Ziarah & Ibadah","description":"Ziarah Jabal Tsur dan Masjid Jin, dilanjutkan ibadah bebas."},
  {"day":8,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah, check-in hotel Millennium Al Aqeeq."},
  {"day":9,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":10,"title":"Ibadah di Masjid Nabawi","description":"Salat berjamaah dan itikaf di Masjid Nabawi."},
  {"day":11,"title":"Kepulangan","description":"Transfer ke bandara Jeddah, penerbangan pulang menuju Jakarta."}
]'::jsonb WHERE slug = 'umroh-furoda-11-hari';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Bandara Surabaya untuk briefing, lalu penerbangan menuju Jeddah dengan Batik Air."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Nasim Royal Hotel."},
  {"day":3,"title":"Umroh Furoda","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul dengan pendampingan khusus."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah di Masjidil Haram dan kajian manasik."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira."},
  {"day":6,"title":"Ibadah Bebas","description":"Thawaf sunnah dan salat malam di Masjidil Haram."},
  {"day":7,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah, check-in hotel Rawdah Munawwarah."},
  {"day":8,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":9,"title":"Ibadah di Masjid Nabawi","description":"Salat berjamaah dan itikaf di Masjid Nabawi."},
  {"day":10,"title":"Ziarah & Belanja","description":"Ziarah tempat bersejarah Madinah dan belanja oleh-oleh."},
  {"day":11,"title":"Ibadah Bebas","description":"Waktu bebas untuk ibadah di Masjid Nabawi."},
  {"day":12,"title":"Kepulangan","description":"Transfer ke bandara Jeddah, penerbangan pulang menuju Surabaya."}
]'::jsonb WHERE slug = 'umroh-furoda-12h-baitullah';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Bandara Surabaya/Yogyakarta untuk briefing, lalu penerbangan menuju Amman, Yordania via Doha dengan Qatar Airways."},
  {"day":2,"title":"Transit & Persiapan","description":"Tiba di Amman, istirahat sejenak sebelum perjalanan lanjutan menuju Yerusalem."},
  {"day":3,"title":"Masjid Al-Aqsa","description":"Safar menuju Yerusalem dan salat di Masjid Al-Aqsa, salah satu masjid suci umat Islam."},
  {"day":4,"title":"Ziarah Al-Aqsa","description":"Ziarah kawasan Masjid Al-Aqsa, Kubah Shakhrah (Dome of the Rock), dan situs bersejarah di sekitarnya."},
  {"day":5,"title":"Kembali & Terbang ke Jeddah","description":"Kembali ke Amman, lalu penerbangan menuju Jeddah untuk melanjutkan ibadah umroh."},
  {"day":6,"title":"Tiba di Jeddah & Menuju Makkah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Swissotel Makkah."},
  {"day":7,"title":"Umroh","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul di Masjidil Haram."},
  {"day":8,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah dan kajian manasik di Masjidil Haram."},
  {"day":9,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira, tempat turunnya wahyu pertama."},
  {"day":10,"title":"Ibadah Bebas","description":"Thawaf sunnah dan salat malam di Masjidil Haram."},
  {"day":11,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah, check-in hotel Anwar Al Madinah Movenpick."},
  {"day":12,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":13,"title":"Ibadah di Masjid Nabawi","description":"Salat berjamaah dan itikaf di Masjid Nabawi."},
  {"day":14,"title":"Kepulangan","description":"Transfer ke bandara Jeddah, penerbangan pulang menuju Surabaya/Yogyakarta."}
]'::jsonb WHERE slug = 'umroh-plus-aqsa-14-hari';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Jakarta/Surabaya untuk briefing, lalu penerbangan menuju Amman, Yordania dengan Royal Jordanian."},
  {"day":2,"title":"Transit & Persiapan","description":"Tiba di Amman, istirahat sebelum perjalanan menuju Yerusalem."},
  {"day":3,"title":"Masjid Al-Aqsa","description":"Safar menuju Yerusalem dan salat di Masjid Al-Aqsa serta Kubah Shakhrah."},
  {"day":4,"title":"Ziarah Al-Aqsa","description":"Ziarah kawasan Masjid Al-Aqsa dan situs-situs bersejarah di sekitarnya."},
  {"day":5,"title":"Kembali & Terbang ke Jeddah","description":"Kembali ke Amman, lalu penerbangan menuju Jeddah."},
  {"day":6,"title":"Menuju Makkah","description":"Tiba di Jeddah, transfer menuju Makkah, check-in hotel Al Safwah Royale di depan Masjidil Haram."},
  {"day":7,"title":"Umroh","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul di Masjidil Haram."},
  {"day":8,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah dan kajian manasik di Masjidil Haram."},
  {"day":9,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira, tempat turunnya wahyu pertama."},
  {"day":10,"title":"Ibadah Bebas","description":"Thawaf sunnah dan salat malam di Masjidil Haram."},
  {"day":11,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah, check-in hotel Madinah Plaza."},
  {"day":12,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":13,"title":"Ibadah di Masjid Nabawi","description":"Salat berjamaah dan itikaf di Masjid Nabawi."},
  {"day":14,"title":"Ziarah & Belanja","description":"Ziarah tempat bersejarah Madinah dan belanja oleh-oleh."},
  {"day":15,"title":"Kepulangan","description":"Transfer ke bandara Jeddah, penerbangan pulang menuju Jakarta/Surabaya."}
]'::jsonb WHERE slug = 'umroh-plus-aqsho';

UPDATE public.packages SET itinerary = '[
  {"day":1,"title":"Keberangkatan","description":"Berkumpul di Bandara Medan untuk briefing, lalu penerbangan menuju Jeddah dengan Turkish Airlines."},
  {"day":2,"title":"Tiba di Jeddah","description":"Tiba di Bandara King Abdulaziz, transfer menuju Makkah, check-in hotel Hilton Makkah."},
  {"day":3,"title":"Umroh","description":"Berihram dari miqat, thawaf, sa''i, dan tahallul di Masjidil Haram."},
  {"day":4,"title":"Ibadah di Masjidil Haram","description":"Salat berjamaah dan kajian manasik di Masjidil Haram."},
  {"day":5,"title":"Ziarah Makkah","description":"Ziarah Jabal Nur dan Gua Hira, tempat turunnya wahyu pertama."},
  {"day":6,"title":"Ibadah Bebas","description":"Thawaf sunnah dan salat malam di Masjidil Haram."},
  {"day":7,"title":"Menuju Madinah","description":"Perjalanan darat menuju Madinah, check-in hotel Anwar Al Madinah."},
  {"day":8,"title":"Ziarah Madinah","description":"Salat di Masjid Nabawi, ziarah Raudhah, Quba, Qiblatain, Uhud, dan Baqi."},
  {"day":9,"title":"Ibadah & Belanja","description":"Salat berjamaah di Masjid Nabawi dan belanja oleh-oleh."},
  {"day":10,"title":"Terbang ke Istanbul","description":"Transfer ke bandara dan penerbangan menuju Istanbul, Turki."},
  {"day":11,"title":"Tur Istanbul","description":"Tur Kota Istanbul: Hagia Sophia, Masjid Biru, dan Hippodrome."},
  {"day":12,"title":"Tur Bosphorus & Istana","description":"Wisata Kapal Bosphorus, Istana Topkapi, dan Grand Bazaar."},
  {"day":13,"title":"Masjid & Pasar","description":"Kunjungan Masjid Suleymaniye, Mısır Çarşısı (Pasar Rempah), dan belanja."},
  {"day":14,"title":"Tur Asia Istanbul","description":"Menyebrang ke sisi Asia Istanbul: Bukit Camlica dan kawasan Üsküdar."},
  {"day":15,"title":"Belanja & Persiapan","description":"Waktu bebas belanja di Istanbul dan persiapan kepulangan."},
  {"day":16,"title":"Kepulangan","description":"Transfer ke bandara, penerbangan pulang menuju Medan."}
]'::jsonb WHERE slug = 'umroh-plus-turki-16h-zamzam';

-- Verifikasi
SELECT slug, jsonb_array_length(itinerary) as days FROM public.packages WHERE deleted_at IS NULL AND itinerary IS NOT NULL ORDER BY type, slug;