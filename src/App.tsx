import { useState, useCallback, useEffect } from 'react';
import './index.css';
import { useParticleSystem } from './useParticleSystem';
import { useScrollAnimations } from './useScrollAnimations';
import {
  useCountdown,
  useRSVP,
  useGuestbook,
  useMusic,
  useGuestName,
  type GuestMessage,
} from './hooks';
import { supabase } from './supabase';
import { DEFAULT_WEDDING } from './types';
import type { WeddingData } from './types';

// ── Helpers ──
function formatTime(ts: number): string {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// ────────────────────────────────────────────────────────────
//  DATE CARD — bingkai date.png + overlay teks dari DB
// ────────────────────────────────────────────────────────────
function DateCard({ w }: { w: WeddingData }) {
  const date = new Date(w.event_date);
  const tanggal = date.getDate();
  const bulan = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="date-card-wrap" role="group" aria-label={`Tanggal pernikahan: ${w.event_day_name} ${tanggal} ${bulan}`}>
      {/* Bingkai dekoratif dari PNG */}
      <img
        src="/date.png"
        className="date-card-frame"
        alt=""
        aria-hidden="true"
      />
      {/* Teks overlay — sepenuhnya dari database */}
      <div className="date-card-overlay">
        <p className="dc-day">{w.event_day_name},</p>
        <div className="dc-number">{tanggal}</div>
        <p className="dc-month">{bulan}</p>
        <p className="dc-time">Pukul {w.resepsi_time}</p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div className="divider">
      <span className="divider-icon">✿</span>
    </div>
  );
}

function MusicToggle({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <button
      id="music-toggle"
      className={`music-toggle ${playing ? 'playing' : ''}`}
      onClick={onToggle}
      aria-label={playing ? 'Matikan musik' : 'Putar musik'}
      title={playing ? 'Matikan musik' : 'Putar musik'}
    >
      {playing ? '🎵' : '🎶'}
    </button>
  );
}

function Countdown({ targetDate }: { targetDate: Date }) {
  const { days, hours, minutes, seconds, expired } = useCountdown(targetDate);

  if (expired) {
    return (
      <div className="countdown">
        <p className="subtitle" style={{ color: 'var(--gold-light)', textTransform: 'none', letterSpacing: 0 }}>
          🎉 Hari yang ditunggu telah tiba!
        </p>
      </div>
    );
  }

  return (
    <div className="countdown" aria-label="Hitung mundur menuju hari pernikahan">
      {[
        { label: 'Hari', value: days },
        { label: 'Jam', value: hours },
        { label: 'Menit', value: minutes },
        { label: 'Detik', value: seconds },
      ].map(({ label, value }) => (
        <div className="countdown-item" key={label}>
          <span className="countdown-num">{pad(value)}</span>
          <span className="countdown-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

function RSVPForm({ weddingId }: { weddingId: string | null }) {
  const { submitted, submit } = useRSVP(weddingId);
  const [name, setName] = useState('');
  const [attendance, setAttendance] = useState('hadir');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      setLoading(true);
      await submit({ name, attendance, message });
      setLoading(false);
    },
    [name, attendance, message, submit],
  );

  if (submitted) {
    return (
      <div className="rsvp-success" role="status" aria-live="polite">
        <span className="rsvp-success-icon">💌</span>
        <p className="rsvp-success-text">
          Terima kasih! Konfirmasi kehadiran Anda sudah kami terima.
        </p>
        <p className="body-text" style={{ marginTop: 4 }}>
          Semoga bertemu di hari bahagia kami 🌿
        </p>
      </div>
    );
  }

  return (
    <form className="rsvp-form" onSubmit={handleSubmit} noValidate>
      <input
        id="rsvp-name"
        className="rsvp-input"
        type="text"
        placeholder="Nama lengkap Anda"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={80}
        aria-label="Nama lengkap"
      />
      <select
        id="rsvp-attendance"
        className="rsvp-input rsvp-select"
        value={attendance}
        onChange={(e) => setAttendance(e.target.value)}
        aria-label="Konfirmasi kehadiran"
      >
        <option value="hadir">✅ Insya Allah Hadir</option>
        <option value="tidak_hadir">❌ Tidak Dapat Hadir</option>
        <option value="belum_pasti">🤔 Belum Pasti</option>
      </select>
      <input
        id="rsvp-message"
        className="rsvp-input"
        type="text"
        placeholder="Pesan singkat (opsional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={200}
        aria-label="Pesan singkat"
      />
      <button
        id="rsvp-submit"
        type="submit"
        className="rsvp-submit"
        disabled={loading || !name.trim()}
        aria-busy={loading}
      >
        {loading ? 'Mengirim...' : 'Kirim Konfirmasi 💌'}
      </button>
    </form>
  );
}

function GuestbookSection({ weddingId }: { weddingId: string | null }) {
  const { messages, addMessage } = useGuestbook(weddingId);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !text.trim()) return;

      if (!weddingId) {
        console.error('[guestbook] weddingId is null — data not loaded yet');
        setSubmitStatus('error');
        setTimeout(() => setSubmitStatus('idle'), 4000);
        return;
      }

      setLoading(true);
      setSubmitStatus('idle');
      const ok = await addMessage(name, text);
      setLoading(false);

      if (ok) {
        setName('');
        setText('');
        setSubmitStatus('success');
        setTimeout(() => setSubmitStatus('idle'), 4000);
      } else {
        setSubmitStatus('error');
        setTimeout(() => setSubmitStatus('idle'), 5000);
      }
    },
    [name, text, addMessage, weddingId],
  );

  return (
    <>
      <form className="guestbook-form" onSubmit={handleSubmit} noValidate>
        <input
          id="guestbook-name"
          className="rsvp-input"
          type="text"
          placeholder="Nama Anda"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          aria-label="Nama untuk ucapan"
        />
        <textarea
          id="guestbook-message"
          className="guestbook-textarea"
          placeholder="Tulis doa & ucapan selamat untuk pengantin... 🌸"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          maxLength={400}
          aria-label="Ucapan dan doa"
        />

        {/* Status feedback */}
        {submitStatus === 'success' && (
          <p className="guestbook-feedback success" role="status">
            ✅ Ucapan berhasil dikirim! Terima kasih 🌸
          </p>
        )}
        {submitStatus === 'error' && (
          <p className="guestbook-feedback error" role="alert">
            ❌ Gagal mengirim ucapan. Coba beberapa saat lagi.
          </p>
        )}

        <button
          id="guestbook-submit"
          type="submit"
          className="guestbook-submit"
          disabled={loading || !name.trim() || !text.trim()}
          aria-busy={loading}
        >
          {loading ? 'Mengirim...' : '✨ Kirim Ucapan'}
        </button>
      </form>

      {messages.length > 0 && (
        <div className="messages-list" role="list" aria-label="Daftar ucapan tamu">
          {messages.map((msg: GuestMessage) => (
            <article className="message-card" key={msg.id} role="listitem">
              <p className="message-author">💬 {msg.name}</p>
              <p className="message-text">{msg.message}</p>
              <p className="message-time">{formatTime(msg.timestamp)}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function CoverLock({
  guestName,
  w,
  onOpen,
}: {
  guestName: string;
  w: WeddingData;
  onOpen: () => void;
}) {
  return (
    <div className="cover-lock" id="cover-lock" role="dialog" aria-modal="true" aria-label="Sampul undangan">
      <img src="/big star.png" className="lock-deco" style={{ top: '6%', right: '8%', width: 44, opacity: 0.9 }} alt="" aria-hidden="true" />
      <img src="/star 2.png" className="lock-deco" style={{ top: '18%', left: '5%', width: 20, opacity: 0.7 }} alt="" aria-hidden="true" />
      <img src="/star 3.png" className="lock-deco" style={{ bottom: '22%', right: '6%', width: 22, opacity: 0.8 }} alt="" aria-hidden="true" />
      <img src="/star 5.png" className="lock-deco" style={{ bottom: '30%', left: '5%', width: 36, opacity: 0.75 }} alt="" aria-hidden="true" />
      <img src="/star.png" className="lock-deco" style={{ top: '38%', right: '4%', width: 22, opacity: 0.6 }} alt="" aria-hidden="true" />

      <p className="cover-top-badge">Undangan Pernikahan</p>
      <p className="cover-title-small">The Wedding of</p>
      <h1 className="cover-names">{w.groom_nickname} &amp; {w.bride_nickname}</h1>

      <img
        src="/rahman_winda.png"
        className="cover-hero-img"
        alt={`Ilustrasi pasangan ${w.groom_nickname} dan ${w.bride_nickname}`}
        width={340}
        height={280}
        style={{ zIndex: 1, position: 'relative' }}
      />

      <div className="cover-recipient" style={{ zIndex: 1, position: 'relative' }}>
        <p>Kepada Yth.</p>
        <p className="cover-guest-name">{guestName || 'Tamu Undangan'}</p>
      </div>

      <button
        id="open-invitation-btn"
        className="cover-open-btn"
        onClick={onOpen}
        style={{ zIndex: 1, position: 'relative' }}
        aria-label="Buka undangan pernikahan"
      >
        💌 Buka Undangan
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  LOADING SKELETON
// ────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="cover-lock" style={{ gap: 16 }}>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-subtitle" />
      <div className="skeleton skeleton-img" />
      <div className="skeleton skeleton-btn" />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  MAIN APP
// ────────────────────────────────────────────────────────────
export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [wedding, setWedding] = useState<WeddingData>(DEFAULT_WEDDING);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const particleRef = useParticleSystem();
  const { playing, toggle: toggleMusic } = useMusic(wedding.music_url);
  const guestName = useGuestName();

  // ── Fetch wedding data + realtime subscription ──
  useEffect(() => {
    // Initial fetch
    supabase
      .from('weddings')
      .select('*')
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.warn('[wedding] Supabase fetch failed, using defaults:', error.message);
        } else if (data) {
          setWedding(data);
          setWeddingId(data.id);
        }
        setDataLoading(false);
      });

    // Realtime: auto-update when admin saves changes
    const channel = supabase
      .channel('wedding-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'weddings' },
        (payload) => {
          if (payload.new) {
            setWedding(payload.new as WeddingData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  // particleRef already handles this via callback ref
  useScrollAnimations(isOpen);

  const handleOpen = useCallback(async () => {
    const lock = document.getElementById('cover-lock');
    if (lock) {
      lock.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      lock.style.opacity = '0';
      lock.style.transform = 'scale(1.03)';
      await new Promise((r) => setTimeout(r, 800));
      lock.classList.add('hidden');
    }
    setIsOpen(true);
  }, []);

  const weddingDate = new Date(wedding.event_date);
  const coupleNames = `${wedding.groom_nickname} & ${wedding.bride_nickname}`;

  const waText = encodeURIComponent(
    `Assalamu'alaikum! 🌿 Kami mengundang Bapak/Ibu/Saudara/i untuk hadir di pernikahan kami:\n\n*${coupleNames}*\n📅 ${wedding.event_day_name}, ${weddingDate.getDate()} ${weddingDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}\n🕐 ${wedding.resepsi_time}\n📍 ${wedding.venue_name}, ${wedding.venue_city}\n\nInfo lengkap: ${window.location.href}`,
  );

  if (dataLoading) return <LoadingSkeleton />;

  return (
    <>
      {/* Three.js Canvas */}
      <canvas ref={particleRef} id="particle-canvas" aria-hidden="true" />

      {/* Cover / Opening Screen */}
      <CoverLock guestName={guestName} w={wedding} onOpen={handleOpen} />

      {/* ── Main Invitation Content ── */}
      <main id="invitation-content" aria-label="Isi undangan pernikahan">

        {/* ═══ SECTION 1 — HERO ═══ */}
        <section id="section-cover" className="section" aria-labelledby="hero-title">
          <img src="/big star.png" className="cover-deco cover-star-1" alt="" aria-hidden="true" />
          <img src="/star 2.png" className="cover-deco cover-star-2" alt="" aria-hidden="true" />
          <img src="/star 3.png" className="cover-deco cover-star-3" alt="" aria-hidden="true" />
          <img src="/star.png" className="cover-deco cover-star-4" alt="" aria-hidden="true" />

          <p className="cover-title-small">The Wedding of</p>
          <h1 id="hero-title" className="cover-names">{coupleNames}</h1>
          <img
            src="/rahman_winda.png"
            className="cover-hero-img"
            alt={`Ilustrasi pasangan ${coupleNames}`}
            width={340}
            height={280}
          />
          <p className="subtitle" style={{ marginTop: 20 }}>
            {weddingDate.getDate()} {weddingDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} · {wedding.venue_city}
          </p>
        </section>

        <Divider />

        {/* ═══ SECTION 2 — SAVE THE DATE ═══ */}
        <section id="section-savedate" className="section" aria-labelledby="savedate-heading">
          <img src="/big star.png" className="savedate-deco sd-deco-1" alt="" aria-hidden="true" />
          <img src="/flowwer2.png" className="savedate-deco sd-deco-2" alt="" aria-hidden="true" />
          <img src="/star 5.png" className="savedate-deco sd-deco-3" alt="" aria-hidden="true" />
          <img src="/flowwer2.png" className="savedate-deco sd-deco-4" alt="" aria-hidden="true" />

          <p className="savedate-label" id="savedate-heading">Save The Date</p>
          <DateCard w={wedding} />
          <Countdown targetDate={weddingDate} />
        </section>

        <Divider />

        {/* ═══ SECTION 3 — QS. AR-RUM AYAT 21 ═══ */}
        <section id="section-arrum" className="section" aria-labelledby="arrum-heading">
          <img src="/flowwer2.png" className="arrum-deco ar-deco-1" alt="" aria-hidden="true" />
          <img src="/big star.png" className="arrum-deco ar-deco-2" alt="" aria-hidden="true" />
          <img src="/star 5.png" className="arrum-deco ar-deco-3" alt="" aria-hidden="true" />
          <img src="/flowwer2.png" className="arrum-deco ar-deco-4" alt="" aria-hidden="true" />
          <img src="/star 2.png" className="arrum-deco ar-deco-5" alt="" aria-hidden="true" />
          <img src="/star 3.png" className="arrum-deco ar-deco-6" alt="" aria-hidden="true" />

          <p className="arrum-label" id="arrum-heading">QS. Ar-Rum Ayat 21</p>
          <div className="arrum-card-wrap">
            <img
              src="/ar-rum.png"
              className="arrum-img"
              alt="QS. Ar-Rum Ayat 21 — Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu"
            />
          </div>
        </section>

        <Divider />

        {/* ═══ SECTION 4 — MEMPELAI ═══ */}
        <section id="section-mempelai" className="section" aria-labelledby="mempelai-heading">
          <img src="/flowwer2.png" className="mempelai-flower mp-flower-1" alt="" aria-hidden="true" />
          <img src="/flowwer2.png" className="mempelai-flower mp-flower-2" alt="" aria-hidden="true" />

          <p className="bismillah" aria-label="Bismillahirrahmanirrahim" style={{
            fontFamily: "'Lora', serif",
            fontSize: '1.8rem',
            color: 'var(--gold-light)',
            marginBottom: 12,
            direction: 'rtl',
          }}>
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </p>

          <p className="salam-text">Assalamu'alaikum Warahmatullahi Wabarakatuh</p>
          <Divider />

          <p className="mempelai-intro" id="mempelai-heading">
            Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan acara pernikahan kami,
          </p>

          {/* Groom */}
          <div className="mempelai-card">
            <img src="/male.png" className="mempelai-photo" alt={`Foto mempelai pria ${wedding.groom_full_name}`} width={110} height={130} />
            <div className="mempelai-info">
              <h2 className="mempelai-name">{wedding.groom_full_name.replace(', ', ',\n')}</h2>
              <p className="mempelai-parents">
                {wedding.groom_child_order}<br />
                {wedding.groom_father} &amp;<br />
                {wedding.groom_mother}
              </p>
            </div>
          </div>

          <p className="ampersand" aria-hidden="true">&amp;</p>

          {/* Bride */}
          <div className="mempelai-card reverse">
            <img src="/female.png" className="mempelai-photo" alt={`Foto mempelai wanita ${wedding.bride_full_name}`} width={110} height={130} />
            <div className="mempelai-info">
              <h2 className="mempelai-name">{wedding.bride_full_name.replace(', ', ',\n')}</h2>
              <p className="mempelai-parents">
                {wedding.bride_child_order}<br />
                {wedding.bride_father} &amp;<br />
                {wedding.bride_mother}
              </p>
            </div>
          </div>
        </section>

        <Divider />

        {/* ═══ SECTION 5 — LOKASI ═══ */}
        <section id="section-lokasi" className="section" aria-labelledby="lokasi-heading">
          <p className="lokasi-subtitle">Lokasi Akad &amp; Resepsi</p>
          <h2 id="lokasi-heading" className="lokasi-title">{wedding.venue_name}</h2>

          <img src="/rumah.png" className="lokasi-img" alt={`Ilustrasi ${wedding.venue_name}`} width={320} height={240} />

          <address className="lokasi-address" style={{ fontStyle: 'normal' }}>
            {wedding.venue_address.split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </address>

          <a
            id="maps-link"
            className="lokasi-btn"
            href={wedding.venue_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buka petunjuk arah di Google Maps"
          >
            <span aria-hidden="true">📍</span>
            Petunjuk Lokasi
          </a>

          <div className="schedule-cards" role="list" aria-label="Jadwal acara">
            <div className="schedule-card" role="listitem">
              <span className="schedule-icon" aria-hidden="true">🕌</span>
              <div>
                <p className="schedule-type">Akad Nikah</p>
                <p className="schedule-time">{wedding.event_day_name}, {weddingDate.getDate()} {weddingDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} · {wedding.akad_time}</p>
              </div>
            </div>
            <div className="schedule-card" role="listitem">
              <span className="schedule-icon" aria-hidden="true">🎊</span>
              <div>
                <p className="schedule-type">Resepsi</p>
                <p className="schedule-time">{wedding.event_day_name}, {weddingDate.getDate()} {weddingDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} · {wedding.resepsi_time}</p>
              </div>
            </div>
          </div>
        </section>

        <Divider />

        {/* ═══ SECTION 6 — RSVP ═══ */}
        <section id="section-rsvp" className="section" aria-labelledby="rsvp-heading">
          <h2 id="rsvp-heading" className="rsvp-title">Konfirmasi Kehadiran</h2>
          <p className="rsvp-desc">
            Merupakan sebuah kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.
          </p>
          <RSVPForm weddingId={weddingId} />
        </section>

        <Divider />

        {/* ═══ SECTION 7 — GUESTBOOK ═══ */}
        <section id="section-guestbook" className="section" aria-labelledby="guestbook-heading">
          <h2 id="guestbook-heading" className="guestbook-title">Doa &amp; Ucapan</h2>
          <p className="body-text" style={{ marginBottom: 20, maxWidth: 270 }}>
            Sampaikan doa dan ucapan selamat Anda untuk pasangan bahagia ini 🌸
          </p>
          <GuestbookSection weddingId={weddingId} />
        </section>

        <Divider />

        {/* ═══ SECTION 8 — CLOSING ═══ */}
        <section id="section-closing" className="section" aria-labelledby="closing-heading">
          <p className="closing-message">
            Merupakan sebuah kehormatan dan kebahagiaan bagi kami, apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan do'a restu kepada kami.
          </p>
          <p className="closing-salam">Wassalamu'alaikum Warahmatullahi Wabarakatuh</p>
          <Divider />
          <p className="closing-from">Kami yang berbahagia,</p>
          <h2 id="closing-heading" className="closing-names">{coupleNames}</h2>

          <img
            src="/wedding.png"
            className="closing-img"
            alt={`Ilustrasi pasangan pengantin ${coupleNames}`}
            width={280}
            height={340}
          />

          <a
            id="whatsapp-share"
            className="whatsapp-btn"
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Bagikan undangan ini via WhatsApp"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Bagikan Undangan
          </a>
        </section>

      </main>

      <MusicToggle playing={playing} onToggle={toggleMusic} />
    </>
  );
}
