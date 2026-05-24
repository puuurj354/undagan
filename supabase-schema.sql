-- ============================================================
-- UNDANGAN PERNIKAHAN — Supabase SQL Schema
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Tabel utama pernikahan
CREATE TABLE IF NOT EXISTS public.weddings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  groom_nickname     text NOT NULL DEFAULT 'Rahman',
  bride_nickname     text NOT NULL DEFAULT 'Winda',
  groom_full_name    text NOT NULL DEFAULT 'Rahman Al Hawarsy, S.H',
  bride_full_name    text NOT NULL DEFAULT 'Winda Rahma, S.Ds',
  groom_child_order  text NOT NULL DEFAULT 'Putra kedua dari',
  groom_father       text NOT NULL DEFAULT 'Bapak Widoka',
  groom_mother       text NOT NULL DEFAULT 'Ibu Wina Dahlia',
  bride_child_order  text NOT NULL DEFAULT 'Putri pertama dari',
  bride_father       text NOT NULL DEFAULT 'Bapak Ridooka',
  bride_mother       text NOT NULL DEFAULT 'Ibu Narimah',
  event_date         timestamptz NOT NULL DEFAULT '2026-05-24T13:00:00+07:00',
  event_day_name     text NOT NULL DEFAULT 'Minggu',
  akad_time          text NOT NULL DEFAULT '13.00 WIB',
  resepsi_time       text NOT NULL DEFAULT '13.00 – 14.30 WIB',
  venue_name         text NOT NULL DEFAULT 'Layana Farmstay',
  venue_address      text NOT NULL DEFAULT 'Jl. KH. Ahmad Asyari, Dusun Krajan, Pakistaji, Kecamatan Kabat, Kabupaten Banyuwangi, Jawa Timur',
  venue_maps_url     text NOT NULL DEFAULT 'https://www.google.com/maps/search/Layana+Farmstay+Banyuwangi/@-8.2166,114.3634,15z',
  music_url          text NOT NULL DEFAULT '/music.mp3',
  created_at         timestamptz DEFAULT now()
);

-- 2. Tabel RSVP
CREATE TABLE IF NOT EXISTS public.rsvp (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  guest_name  text NOT NULL,
  attendance  text NOT NULL CHECK (attendance IN ('hadir', 'tidak_hadir', 'belum_pasti')),
  message     text,
  created_at  timestamptz DEFAULT now()
);

-- 3. Tabel Guestbook
CREATE TABLE IF NOT EXISTS public.guestbook (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id  uuid NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  guest_name  text NOT NULL,
  message     text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guestbook ENABLE ROW LEVEL SECURITY;

-- weddings: semua orang bisa baca, hanya service_role yg bisa write
CREATE POLICY "weddings_public_read" ON public.weddings
  FOR SELECT USING (true);

CREATE POLICY "weddings_service_write" ON public.weddings
  FOR ALL USING (auth.role() = 'service_role');

-- rsvp: semua bisa baca & insert, tidak bisa update/delete
CREATE POLICY "rsvp_public_read" ON public.rsvp
  FOR SELECT USING (true);

CREATE POLICY "rsvp_public_insert" ON public.rsvp
  FOR INSERT WITH CHECK (true);

-- guestbook: semua bisa baca & insert
CREATE POLICY "guestbook_public_read" ON public.guestbook
  FOR SELECT USING (true);

CREATE POLICY "guestbook_public_insert" ON public.guestbook
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- SEED DATA — Data awal Rahman & Winda
-- Jalankan setelah CREATE TABLE
-- ============================================================

INSERT INTO public.weddings (
  groom_nickname, bride_nickname,
  groom_full_name, bride_full_name,
  groom_child_order, groom_father, groom_mother,
  bride_child_order, bride_father, bride_mother,
  event_date, event_day_name,
  akad_time, resepsi_time,
  venue_name, venue_address, venue_maps_url,
  music_url
) VALUES (
  'Rahman', 'Winda',
  'Rahman Al Hawarsy, S.H', 'Winda Rahma, S.Ds',
  'Putra kedua dari', 'Bapak Widoka', 'Ibu Wina Dahlia',
  'Putri pertama dari', 'Bapak Ridooka', 'Ibu Narimah',
  '2026-05-24T13:00:00+07:00', 'Minggu',
  '13.00 WIB', '13.00 – 14.30 WIB',
  'Layana Farmstay',
  'Jl. KH. Ahmad Asyari, Dusun Krajan, Pakistaji, Kecamatan Kabat, Kabupaten Banyuwangi, Jawa Timur',
  'https://www.google.com/maps/search/Layana+Farmstay+Banyuwangi/@-8.2166,114.3634,15z',
  '/music.mp3'
)
ON CONFLICT DO NOTHING;
