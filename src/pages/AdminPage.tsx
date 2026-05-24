import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { WeddingData, RSVPRow, GuestbookRow } from '../types';
import { DEFAULT_WEDDING } from '../types';

// ── Types ──
type AdminTab = 'tamu' | 'pasangan' | 'acara' | 'rsvp' | 'ucapan';

interface GuestRow {
  id: string;
  name: string;
  created_at: string;
}

// ── Helpers ──
function safeLines(text: string) {
  return text.split('\n').map((line, i) => (
    <span key={i}>{line}{i < text.split('\n').length - 1 && <br />}</span>
  ));
}

function buildInviteLink(name: string): string {
  const base = window.location.origin;
  return `${base}/?nama=${encodeURIComponent(name)}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
}

// ────────────────────────────────────────────────────────────
//  LOGIN FORM
// ────────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => Promise<string | null> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    const err = await onLogin(email.trim(), password.trim());
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <p className="admin-login-badge">Admin Panel</p>
        <h1 className="admin-login-title">Masuk ke CRM</h1>
        <p className="admin-login-sub">Undangan Pernikahan Digital</p>
        <form onSubmit={handleSubmit} className="admin-form" noValidate>
          <div className="admin-field">
            <label htmlFor="admin-email">Email</label>
            <input id="admin-email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com"
              required autoComplete="email" />
          </div>
          <div className="admin-field">
            <label htmlFor="admin-password">Password</label>
            <input id="admin-password" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              required autoComplete="current-password" />
          </div>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? 'Memproses...' : '🔐 Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  ATTENDANCE BADGE
// ────────────────────────────────────────────────────────────
function AttendanceBadge({ value }: { value: RSVPRow['attendance'] }) {
  const map: Record<RSVPRow['attendance'], { label: string; cls: string }> = {
    hadir: { label: '✅ Hadir', cls: 'badge-hadir' },
    tidak_hadir: { label: '❌ Tidak Hadir', cls: 'badge-tidak' },
    belum_pasti: { label: '🤔 Belum Pasti', cls: 'badge-belum' },
  };
  const { label, cls } = map[value] ?? map['belum_pasti'];
  return <span className={`admin-badge ${cls}`}>{label}</span>;
}

// ────────────────────────────────────────────────────────────
//  TAB TAMU — Kelola daftar tamu & generate link personal
// ────────────────────────────────────────────────────────────
function TabTamu({ weddingId }: { weddingId: string | null }) {
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [newName, setNewName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch guests
  useEffect(() => {
    if (!weddingId) return;
    supabase
      .from('guests')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setGuests(data as GuestRow[]);
      });
  }, [weddingId]);

  // Add single guest
  const addGuest = useCallback(async () => {
    if (!newName.trim() || !weddingId) return;
    setAdding(true);
    const { data, error } = await supabase
      .from('guests')
      .insert({ wedding_id: weddingId, name: newName.trim() })
      .select()
      .single();
    if (!error && data) {
      setGuests(prev => [...prev, data as GuestRow]);
      setNewName('');
    }
    setAdding(false);
  }, [newName, weddingId]);

  // Add bulk guests (one name per line)
  const addBulk = useCallback(async () => {
    if (!bulkText.trim() || !weddingId) return;
    setAdding(true);
    const names = bulkText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    const rows = names.map(name => ({ wedding_id: weddingId, name }));
    const { data, error } = await supabase.from('guests').insert(rows).select();
    if (!error && data) {
      setGuests(prev => [...prev, ...(data as GuestRow[])]);
      setBulkText('');
      setShowBulk(false);
    }
    setAdding(false);
  }, [bulkText, weddingId]);

  // Delete guest
  const deleteGuest = useCallback(async (id: string) => {
    const { error } = await supabase.from('guests').delete().eq('id', id);
    if (!error) setGuests(prev => prev.filter(g => g.id !== id));
  }, []);

  // Copy link
  const handleCopy = useCallback(async (guest: GuestRow) => {
    const link = buildInviteLink(guest.name);
    const ok = await copyToClipboard(link);
    if (ok) {
      setCopiedId(guest.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  // Share via WhatsApp
  const handleWhatsApp = useCallback((guest: GuestRow) => {
    const link = buildInviteLink(guest.name);
    const msg = encodeURIComponent(
      `Assalamu'alaikum ${guest.name},\n\nKami mengundang Anda untuk hadir di pernikahan kami 💌\n\n${link}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }, []);

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Tamu Undangan</h2>

      {/* How it works */}
      <div className="guest-info-box">
        <p className="guest-info-title">💡 Cara Kerja Link Personal</p>
        <p className="guest-info-text">
          Setiap tamu mendapat link unik yang menampilkan nama mereka di sampul undangan.
          Contoh: <code className="guest-code">{window.location.origin}/?nama=Budi+Santoso</code>
        </p>
      </div>

      {/* Add form */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <h3 className="admin-card-title">➕ Tambah Tamu</h3>

        {/* Single */}
        {!showBulk && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div className="admin-field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Nama Tamu</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addGuest()}
                placeholder="contoh: Bapak & Ibu Budi Santoso"
                maxLength={100}
              />
            </div>
            <button
              onClick={addGuest}
              disabled={adding || !newName.trim()}
              className="admin-btn-primary"
              style={{ flexShrink: 0, height: 42 }}
            >
              {adding ? '...' : 'Tambah'}
            </button>
          </div>
        )}

        {/* Bulk */}
        {showBulk && (
          <div className="admin-field">
            <label>Banyak Nama Sekaligus (satu nama per baris)</label>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={'Bapak Budi Santoso\nIbu Sari Dewi\nKeluarga Ahmad'}
              rows={6}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={addBulk} disabled={adding || !bulkText.trim()} className="admin-btn-primary">
                {adding ? 'Menambahkan...' : `✅ Tambah ${bulkText.split('\n').filter(n => n.trim()).length} Tamu`}
              </button>
              <button onClick={() => setShowBulk(false)} className="admin-btn-logout">Batal</button>
            </div>
          </div>
        )}

        {/* Toggle single/bulk */}
        {!showBulk && (
          <button onClick={() => setShowBulk(true)} className="admin-btn-logout" style={{ marginTop: 12 }}>
            📋 Tambah Banyak Sekaligus
          </button>
        )}
      </div>

      {/* Guest count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p className="guest-count">{guests.length} tamu terdaftar</p>
      </div>

      {/* Guest list */}
      {guests.length === 0 ? (
        <p className="admin-empty">Belum ada tamu. Tambahkan nama tamu di atas.</p>
      ) : (
        <div className="guest-list">
          {guests.map(guest => {
            const link = buildInviteLink(guest.name);
            const isCopied = copiedId === guest.id;
            return (
              <div key={guest.id} className="guest-row">
                <div className="guest-row-info">
                  <p className="guest-row-name">👤 {guest.name}</p>
                  <p className="guest-row-link">{link}</p>
                </div>
                <div className="guest-row-actions">
                  {/* Copy link */}
                  <button
                    className={`guest-btn guest-btn-copy ${isCopied ? 'copied' : ''}`}
                    onClick={() => handleCopy(guest)}
                    title="Salin link"
                    aria-label={`Salin link untuk ${guest.name}`}
                  >
                    {isCopied ? '✅' : '📋'}
                  </button>
                  {/* WhatsApp */}
                  <button
                    className="guest-btn guest-btn-wa"
                    onClick={() => handleWhatsApp(guest)}
                    title="Kirim via WhatsApp"
                    aria-label={`Kirim via WhatsApp untuk ${guest.name}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                  {/* Delete */}
                  <button
                    className="guest-btn guest-btn-del"
                    onClick={() => deleteGuest(guest.id)}
                    title="Hapus tamu"
                    aria-label={`Hapus ${guest.name}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  MAIN ADMIN PAGE
// ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [session, setSession] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<AdminTab>('tamu');
  const [wedding, setWedding] = useState<WeddingData>(DEFAULT_WEDDING);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [rsvpList, setRsvpList] = useState<RSVPRow[]>([]);
  const [guestbookList, setGuestbookList] = useState<GuestbookRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchAll();
  }, [session]);

  const fetchAll = useCallback(async () => {
    const [weddingRes, rsvpRes, guestbookRes] = await Promise.all([
      supabase.from('weddings').select('*').limit(1).single(),
      supabase.from('rsvp').select('*').order('created_at', { ascending: false }),
      supabase.from('guestbook').select('*').order('created_at', { ascending: false }),
    ]);
    if (weddingRes.data) { setWedding(weddingRes.data); setWeddingId(weddingRes.data.id); }
    if (rsvpRes.data) setRsvpList(rsvpRes.data);
    if (guestbookRes.data) setGuestbookList(guestbookRes.data);
  }, []);

  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(false);
  };

  const handleSave = async () => {
    if (!weddingId) {
      setSaveMsg('❌ Gagal: wedding ID tidak ditemukan. Coba refresh halaman.');
      setTimeout(() => setSaveMsg(null), 5000);
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    const { error, data } = await supabase.from('weddings').update({
      groom_nickname: wedding.groom_nickname,
      bride_nickname: wedding.bride_nickname,
      groom_full_name: wedding.groom_full_name,
      bride_full_name: wedding.bride_full_name,
      groom_child_order: wedding.groom_child_order,
      groom_father: wedding.groom_father,
      groom_mother: wedding.groom_mother,
      bride_child_order: wedding.bride_child_order,
      bride_father: wedding.bride_father,
      bride_mother: wedding.bride_mother,
      event_date: wedding.event_date,
      event_day_name: wedding.event_day_name,
      akad_time: wedding.akad_time,
      resepsi_time: wedding.resepsi_time,
      venue_name: wedding.venue_name,
      venue_address: wedding.venue_address,
      venue_maps_url: wedding.venue_maps_url,
      venue_city: wedding.venue_city,
    }).eq('id', weddingId).select();

    setSaving(false);

    if (error) {
      console.error('[admin] Save failed:', error);
      setSaveMsg(`❌ Gagal simpan: ${error.message} (code: ${error.code})`);
    } else {
      console.log('[admin] Saved successfully:', data);
      setSaveMsg('✅ Data berhasil disimpan! Undangan akan update otomatis.');
    }
    setTimeout(() => setSaveMsg(null), 5000);
  };


  const deleteGuestbook = async (id: string) => {
    const { error } = await supabase.from('guestbook').delete().eq('id', id);
    if (!error) setGuestbookList(prev => prev.filter(g => g.id !== id));
  };

  const field = (key: keyof WeddingData) => ({
    value: wedding[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setWedding(prev => ({ ...prev, [key]: e.target.value })),
  });

  if (loading) return <div className="admin-loading">Memuat...</div>;
  if (!session) return <LoginForm onLogin={handleLogin} />;

  const rsvpHadir = rsvpList.filter(r => r.attendance === 'hadir').length;
  const rsvpTidak = rsvpList.filter(r => r.attendance === 'tidak_hadir').length;
  const rsvpBelum = rsvpList.filter(r => r.attendance === 'belum_pasti').length;

  return (
    <div className="admin-root">
      <header className="admin-header">
        <div>
          <span className="admin-header-badge">CRM Admin</span>
          <h1 className="admin-header-title">{wedding.groom_nickname} & {wedding.bride_nickname}</h1>
        </div>
        <button onClick={handleLogout} className="admin-btn-logout">Keluar</button>
      </header>

      {saveMsg && (
        <div className={`admin-save-toast ${saveMsg.startsWith('✅') ? 'toast-success' : 'toast-error'}`}>
          {saveMsg}
        </div>
      )}

      {/* ── TABS ── */}
      <nav className="admin-tabs" aria-label="Menu admin">
        {([
          { key: 'tamu',    label: `👥 Tamu (${rsvpList.length})` },
          { key: 'pasangan', label: '💑 Pasangan' },
          { key: 'acara',   label: '📅 Acara & Lokasi' },
          { key: 'rsvp',   label: `✉️ RSVP (${rsvpList.length})` },
          { key: 'ucapan', label: `💬 Ucapan (${guestbookList.length})` },
        ] as { key: AdminTab; label: string }[]).map(({ key, label }) => (
          <button key={key} className={`admin-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      <main className="admin-content">

        {/* ── TAB: TAMU UNDANGAN ── */}
        {tab === 'tamu' && <TabTamu weddingId={weddingId} />}

        {/* ── TAB: PASANGAN ── */}
        {tab === 'pasangan' && (
          <div className="admin-section">
            <h2 className="admin-section-title">Data Pasangan</h2>
            <div className="admin-grid-2">
              <div className="admin-card">
                <h3 className="admin-card-title">🤵 Mempelai Pria</h3>
                <div className="admin-field"><label>Nama Panggilan</label><input type="text" {...field('groom_nickname')} placeholder="Rahman" /></div>
                <div className="admin-field"><label>Nama Lengkap + Gelar</label><input type="text" {...field('groom_full_name')} placeholder="Rahman Al Hawarsy, S.H" /></div>
                <div className="admin-field"><label>Urutan Anak</label><input type="text" {...field('groom_child_order')} placeholder="Putra kedua dari" /></div>
                <div className="admin-field"><label>Nama Ayah</label><input type="text" {...field('groom_father')} placeholder="Bapak Widoka" /></div>
                <div className="admin-field"><label>Nama Ibu</label><input type="text" {...field('groom_mother')} placeholder="Ibu Wina Dahlia" /></div>
              </div>
              <div className="admin-card">
                <h3 className="admin-card-title">👰 Mempelai Wanita</h3>
                <div className="admin-field"><label>Nama Panggilan</label><input type="text" {...field('bride_nickname')} placeholder="Winda" /></div>
                <div className="admin-field"><label>Nama Lengkap + Gelar</label><input type="text" {...field('bride_full_name')} placeholder="Winda Rahma, S.Ds" /></div>
                <div className="admin-field"><label>Urutan Anak</label><input type="text" {...field('bride_child_order')} placeholder="Putri pertama dari" /></div>
                <div className="admin-field"><label>Nama Ayah</label><input type="text" {...field('bride_father')} placeholder="Bapak Ridooka" /></div>
                <div className="admin-field"><label>Nama Ibu</label><input type="text" {...field('bride_mother')} placeholder="Ibu Narimah" /></div>
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="admin-btn-primary admin-save-btn">
              {saving ? 'Menyimpan...' : '💾 Simpan Data Pasangan'}
            </button>
          </div>
        )}

        {/* ── TAB: ACARA & LOKASI ── */}
        {tab === 'acara' && (
          <div className="admin-section">
            <h2 className="admin-section-title">Acara & Lokasi</h2>
            <div className="admin-grid-2">
              <div className="admin-card">
                <h3 className="admin-card-title">📅 Waktu Acara</h3>
                <div className="admin-field"><label>Nama Hari</label><input type="text" {...field('event_day_name')} placeholder="Minggu" /></div>
                <div className="admin-field">
                  <label>Tanggal & Jam</label>
                  <input type="datetime-local" value={wedding.event_date.slice(0, 16)}
                    onChange={e => setWedding(prev => ({ ...prev, event_date: e.target.value + ':00+07:00' }))} />
                  <span className="admin-hint">Timezone otomatis WIB (+07:00)</span>
                </div>
                <div className="admin-field"><label>Waktu Akad</label><input type="text" {...field('akad_time')} placeholder="13.00 WIB" /></div>
                <div className="admin-field"><label>Waktu Resepsi</label><input type="text" {...field('resepsi_time')} placeholder="13.00 – 14.30 WIB" /></div>
              </div>
              <div className="admin-card">
                <h3 className="admin-card-title">📍 Lokasi</h3>
                <div className="admin-field"><label>Nama Venue</label><input type="text" {...field('venue_name')} placeholder="Layana Farmstay" /></div>
                <div className="admin-field">
                  <label>Kota / Kabupaten</label>
                  <input type="text" {...field('venue_city')} placeholder="Banyuwangi" />
                  <span className="admin-hint">Muncul di halaman depan undangan dan pesan WhatsApp</span>
                </div>
                <div className="admin-field">
                  <label>Alamat Lengkap</label>
                  <textarea value={wedding.venue_address}
                    onChange={e => setWedding(prev => ({ ...prev, venue_address: e.target.value }))}
                    placeholder="Jl. ..." rows={3} />
                </div>
                <div className="admin-field">
                  <label>Link Google Maps</label>
                  <input type="url" {...field('venue_maps_url')} placeholder="https://maps.app.goo.gl/..." />
                  <span className="admin-hint">Buka Google Maps → Share → Copy link</span>
                </div>
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="admin-btn-primary admin-save-btn">
              {saving ? 'Menyimpan...' : '💾 Simpan Data Acara'}
            </button>
          </div>
        )}

        {/* ── TAB: RSVP ── */}
        {tab === 'rsvp' && (
          <div className="admin-section">
            <h2 className="admin-section-title">Konfirmasi Kehadiran</h2>
            <div className="admin-stats">
              <div className="admin-stat-card stat-hadir"><span className="stat-num">{rsvpHadir}</span><span className="stat-label">✅ Hadir</span></div>
              <div className="admin-stat-card stat-tidak"><span className="stat-num">{rsvpTidak}</span><span className="stat-label">❌ Tidak Hadir</span></div>
              <div className="admin-stat-card stat-belum"><span className="stat-num">{rsvpBelum}</span><span className="stat-label">🤔 Belum Pasti</span></div>
              <div className="admin-stat-card stat-total"><span className="stat-num">{rsvpList.length}</span><span className="stat-label">Total RSVP</span></div>
            </div>
            {rsvpList.length === 0 ? <p className="admin-empty">Belum ada konfirmasi kehadiran.</p> : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Nama Tamu</th><th>Kehadiran</th><th>Pesan</th><th>Tanggal</th></tr></thead>
                  <tbody>
                    {rsvpList.map(row => (
                      <tr key={row.id}>
                        <td className="td-name">{row.guest_name}</td>
                        <td><AttendanceBadge value={row.attendance} /></td>
                        <td className="td-msg">{row.message ?? <span className="td-empty">—</span>}</td>
                        <td className="td-date">{new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: UCAPAN ── */}
        {tab === 'ucapan' && (
          <div className="admin-section">
            <h2 className="admin-section-title">Doa & Ucapan Tamu</h2>
            {guestbookList.length === 0 ? <p className="admin-empty">Belum ada ucapan yang masuk.</p> : (
              <div className="admin-ucapan-list">
                {guestbookList.map(row => (
                  <div key={row.id} className="admin-ucapan-card">
                    <div className="ucapan-header">
                      <p className="ucapan-name">💬 {row.guest_name}</p>
                      <div className="ucapan-meta">
                        <span className="ucapan-date">{new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        <button className="ucapan-delete" onClick={() => deleteGuestbook(row.id)} title="Hapus" aria-label="Hapus ucapan">🗑️</button>
                      </div>
                    </div>
                    <p className="ucapan-text">{safeLines(row.message)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
