import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';

// ── Public types ──
export interface GuestMessage {
  id: string;
  name: string;
  message: string;
  attendance: 'hadir' | 'tidak_hadir' | 'belum_pasti';
  timestamp: number;
}

// ── Local storage key for RSVP state (per-browser) ──
const STORAGE_KEY_RSVP = 'undangan_rsvp_submitted';

// ── Helpers ──
function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSetJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('[storage] Failed to save:', err);
  }
}

// ────────────────────────────────────────────────────────────
//  RSVP Hook — saves to Supabase, falls back to localStorage
// ────────────────────────────────────────────────────────────
export function useRSVP(weddingId: string | null) {
  const [submitted, setSubmitted] = useState(() =>
    safeGetJSON<boolean>(STORAGE_KEY_RSVP, false),
  );

  const submit = useCallback(
    async (data: { name: string; attendance: string; message: string }) => {
      // Optimistic UI
      safeSetJSON(STORAGE_KEY_RSVP, true);
      setSubmitted(true);

      if (!weddingId) return;

      // Save to Supabase
      const { error } = await supabase.from('rsvp').insert({
        wedding_id: weddingId,
        guest_name: data.name.trim(),
        attendance: data.attendance as 'hadir' | 'tidak_hadir' | 'belum_pasti',
        message: data.message.trim() || null,
      });

      if (error) {
        console.error('[rsvp] Failed to save to Supabase:', error.message);
      }
    },
    [weddingId],
  );

  return { submitted, submit };
}

// ────────────────────────────────────────────────────────────
//  Guestbook Hook — real-time from Supabase
// ────────────────────────────────────────────────────────────
export function useGuestbook(weddingId: string | null) {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Initial fetch
  useEffect(() => {
    if (!weddingId) return;

    supabase
      .from('guestbook')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('[guestbook] Fetch error:', error.message);
        } else if (data) {
          setMessages(
            data.map(row => ({
              id: row.id,
              name: row.guest_name,
              message: row.message,
              attendance: 'belum_pasti',
              timestamp: new Date(row.created_at).getTime(),
            })),
          );
        }
        setLoadingMessages(false);
      });

    // Realtime subscription
    const channel = supabase
      .channel(`guestbook-${weddingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guestbook', filter: `wedding_id=eq.${weddingId}` },
        payload => {
          const newRow = payload.new as { id: string; guest_name: string; message: string; created_at: string };
          setMessages(prev => [{
            id: newRow.id,
            name: newRow.guest_name,
            message: newRow.message,
            attendance: 'belum_pasti',
            timestamp: new Date(newRow.created_at).getTime(),
          }, ...prev]);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [weddingId]);

  const addMessage = useCallback(async (name: string, text: string) => {
    if (!name.trim() || !text.trim() || !weddingId) return false;

    const { error } = await supabase.from('guestbook').insert({
      wedding_id: weddingId,
      guest_name: name.trim(),
      message: text.trim(),
    });

    if (error) {
      console.error('[guestbook] Insert error:', error.message);
      return false;
    }

    return true;
  }, [weddingId]);

  return { messages, addMessage, loadingMessages };
}

// ────────────────────────────────────────────────────────────
//  Countdown Hook
// ────────────────────────────────────────────────────────────
export function useCountdown(targetDate: Date) {
  const calculate = useCallback(() => {
    const now = Date.now();
    const diff = targetDate.getTime() - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const totalSeconds = Math.floor(diff / 1000);
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      expired: false,
    };
  }, [targetDate]);

  const [time, setTime] = useState(calculate);

  useEffect(() => {
    const interval = setInterval(() => setTime(calculate()), 1000);
    return () => clearInterval(interval);
  }, [calculate]);

  return time;
}

// ────────────────────────────────────────────────────────────
//  Music Hook
// ────────────────────────────────────────────────────────────
export function useMusic(src: string) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0.4;
      audioRef.current = audio;
    }
    return audioRef.current;
  }, [src]);

  const toggle = useCallback(async () => {
    const audio = getAudio();
    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        await audio.play();
        setPlaying(true);
      }
    } catch (err) {
      console.warn('[music] Playback error:', err);
    }
  }, [playing, getAudio]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) { audio.pause(); audio.src = ''; }
    };
  }, []);

  return { playing, toggle };
}

// ────────────────────────────────────────────────────────────
//  Guest Name from URL
// ────────────────────────────────────────────────────────────
export function useGuestName(): string {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('nama') ?? params.get('to') ?? params.get('guest') ?? '';
  return decodeURIComponent(name);
}
