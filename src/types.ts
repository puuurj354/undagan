// ── TypeScript types matching Supabase schema ──

export interface WeddingData {
  id: string;
  groom_nickname: string;
  bride_nickname: string;
  groom_full_name: string;
  bride_full_name: string;
  groom_child_order: string;
  groom_father: string;
  groom_mother: string;
  bride_child_order: string;
  bride_father: string;
  bride_mother: string;
  event_date: string; // ISO string
  event_day_name: string;
  akad_time: string;
  resepsi_time: string;
  venue_name: string;
  venue_address: string;
  venue_maps_url: string;
  venue_city: string;
  music_url: string;
  created_at: string;
}

export interface RSVPRow {
  id: string;
  wedding_id: string;
  guest_name: string;
  attendance: 'hadir' | 'tidak_hadir' | 'belum_pasti';
  message: string | null;
  created_at: string;
}

export interface GuestbookRow {
  id: string;
  wedding_id: string;
  guest_name: string;
  message: string;
  created_at: string;
}

// ── Supabase generated Database type (simplified) ──
export interface Database {
  public: {
    Tables: {
      weddings: {
        Row: WeddingData;
        Insert: Omit<WeddingData, 'id' | 'created_at'>;
        Update: Partial<Omit<WeddingData, 'id' | 'created_at'>>;
      };
      rsvp: {
        Row: RSVPRow;
        Insert: Omit<RSVPRow, 'id' | 'created_at'>;
        Update: never;
      };
      guestbook: {
        Row: GuestbookRow;
        Insert: Omit<GuestbookRow, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
}

// ── Default fallback data (saat DB belum tersedia) ──
export const DEFAULT_WEDDING: WeddingData = {
  id: 'default',
  groom_nickname: 'Rahman',
  bride_nickname: 'Winda',
  groom_full_name: 'Rahman Al Hawarsy, S.H',
  bride_full_name: 'Winda Rahma, S.Ds',
  groom_child_order: 'Putra kedua dari',
  groom_father: 'Bapak Widoka',
  groom_mother: 'Ibu Wina Dahlia',
  bride_child_order: 'Putri pertama dari',
  bride_father: 'Bapak Ridooka',
  bride_mother: 'Ibu Narimah',
  event_date: '2026-05-24T13:00:00+07:00',
  event_day_name: 'Minggu',
  akad_time: '13.00 WIB',
  resepsi_time: '13.00 – 14.30 WIB',
  venue_name: 'Layana Farmstay',
  venue_address: 'Jl. KH. Ahmad Asyari, Dusun Krajan,\nPakistaji, Kecamatan Kabat,\nKabupaten Banyuwangi, Jawa Timur',
  venue_maps_url: 'https://www.google.com/maps/search/Layana+Farmstay+Banyuwangi/@-8.2166,114.3634,15z',
  venue_city: 'Banyuwangi',
  music_url: '/music.mp3',
  created_at: new Date().toISOString(),
};
