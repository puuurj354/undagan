import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll & entrance animations for all wedding invitation assets.
 * Triggered once when `isOpen` flips to true AND data has loaded.
 */
export function useScrollAnimations(isOpen: boolean) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!isOpen || initialized.current) return;

    // Small delay so React has time to commit all DOM nodes
    // (especially after async Supabase data load)
    const timer = setTimeout(() => {
      initialized.current = true;

      // ─────────────────────────────────────────────────────
      //  COVER HERO — rahman_winda.png entrance + parallax
      // ─────────────────────────────────────────────────────
      const heroImg = document.querySelector('.cover-hero-img') as HTMLElement | null;
      if (heroImg) {
        gsap.fromTo(heroImg,
          { scale: 0.3, opacity: 0, rotateZ: -8, y: 100,
            filter: 'blur(12px) drop-shadow(0 8px 24px rgba(0,0,0,0.4))' },
          { scale: 1, opacity: 1, rotateZ: 0, y: 0,
            filter: 'blur(0px) drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
            duration: 1.6, ease: 'elastic.out(1, 0.5)', delay: 0.2 }
        );

        gsap.to(heroImg, {
          y: -60, scale: 0.92, rotateZ: 3,
          scrollTrigger: {
            trigger: '#section-cover',
            start: 'top top', end: 'bottom top', scrub: 1.5,
          },
        });
      }

      // Cover text entrance
      const coverTitle = document.querySelector('#section-cover .cover-title-small');
      const coverNames = document.querySelector('#section-cover .cover-names');
      const coverSub   = document.querySelector('#section-cover .subtitle');
      if (coverTitle) {
        gsap.fromTo(coverTitle,
          { opacity: 0, y: -30, letterSpacing: '0.4em' },
          { opacity: 1, y: 0, letterSpacing: '0.08em', duration: 1.2, ease: 'power3.out', delay: 0.1 }
        );
      }
      if (coverNames) {
        gsap.fromTo(coverNames,
          { opacity: 0, scale: 0.5, filter: 'blur(8px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'back.out(1.2)', delay: 0.4 }
        );
      }
      if (coverSub) {
        gsap.fromTo(coverSub,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, delay: 1.2 }
        );
      }

      // Cover decorative stars
      document.querySelectorAll('.cover-deco').forEach((star, i) => {
        gsap.fromTo(star,
          { opacity: 0, scale: 0, rotateZ: -90 },
          { opacity: parseFloat((star as HTMLElement).style.opacity) || 0.8,
            scale: 1, rotateZ: 0,
            duration: 0.8, delay: 0.5 + i * 0.2, ease: 'back.out(2)' }
        );
      });

      // ─────────────────────────────────────────────────────
      //  SAVE THE DATE — date-card-wrap (new DateCard component)
      // ─────────────────────────────────────────────────────
      const savedateLabel = document.querySelector('.savedate-label');
      if (savedateLabel) {
        gsap.fromTo(savedateLabel,
          { opacity: 0, y: -20, letterSpacing: '0.6em' },
          { opacity: 0.85, y: 0, letterSpacing: '0.25em', duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: savedateLabel, start: 'top 90%' } }
        );
      }

      // date.png bingkai — class name sekarang: .date-card-wrap / .date-card-frame
      const dateCardWrap  = document.querySelector('.date-card-wrap') as HTMLElement | null;
      const dateCardFrame = document.querySelector('.date-card-frame') as HTMLElement | null;
      if (dateCardWrap) {
        // 3D flip entrance dari bawah
        gsap.fromTo(dateCardWrap,
          { opacity: 0, rotateY: -28, scale: 0.7, y: 70, transformPerspective: 900 },
          { opacity: 1, rotateY: 0, scale: 1, y: 0,
            duration: 1.5, ease: 'power3.out',
            scrollTrigger: { trigger: dateCardWrap, start: 'top 90%' } }
        );
        // Parallax
        if (dateCardFrame) {
          gsap.to(dateCardFrame, {
            y: -28, scale: 1.03,
            scrollTrigger: {
              trigger: '#section-savedate',
              start: 'top 50%', end: 'bottom 20%', scrub: 2,
            }
          });
        }
      }

      // Overlay teks di dalam DateCard (dc-day, dc-number, dll)
      document.querySelectorAll('.dc-day, .dc-number, .dc-month, .dc-time').forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 14, scale: i === 1 ? 0.4 : 0.85 },
          { opacity: 1, y: 0, scale: 1,
            duration: i === 1 ? 0.9 : 0.6,
            delay: 0.3 + i * 0.12,
            ease: i === 1 ? 'elastic.out(1.2, 0.5)' : 'power2.out',
            scrollTrigger: { trigger: '.date-card-wrap', start: 'top 88%' } }
        );
      });

      // Save the date dekorasi
      document.querySelectorAll('.savedate-deco').forEach((deco, i) => {
        gsap.fromTo(deco,
          { opacity: 0, scale: 0, rotateZ: i % 2 === 0 ? 60 : -60 },
          { opacity: parseFloat((deco as HTMLElement).style.opacity) || 0.8,
            scale: 1, rotateZ: 0,
            duration: 0.7, delay: 0.3 + i * 0.15, ease: 'back.out(2)',
            scrollTrigger: { trigger: '#section-savedate', start: 'top 90%' } }
        );
      });

      // Countdown boxes stagger
      document.querySelectorAll('.countdown-item').forEach((item, i) => {
        gsap.fromTo(item,
          { opacity: 0, y: 40, scale: 0.6 },
          { opacity: 1, y: 0, scale: 1,
            duration: 0.6, delay: i * 0.12, ease: 'back.out(1.8)',
            scrollTrigger: { trigger: '.countdown', start: 'top 90%' } }
        );
      });

      // ─────────────────────────────────────────────────────
      //  QS. AR-RUM — oval card zoom from below with blur
      // ─────────────────────────────────────────────────────
      const arrumLabel = document.querySelector('.arrum-label');
      if (arrumLabel) {
        gsap.fromTo(arrumLabel,
          { opacity: 0, y: -15, letterSpacing: '0.5em' },
          { opacity: 0.9, y: 0, letterSpacing: '0.2em', duration: 0.8,
            scrollTrigger: { trigger: arrumLabel, start: 'top 90%' } }
        );
      }

      const arrumImg  = document.querySelector('.arrum-img') as HTMLElement | null;
      const arrumWrap = document.querySelector('.arrum-card-wrap') as HTMLElement | null;
      if (arrumImg && arrumWrap) {
        gsap.fromTo(arrumWrap,
          { opacity: 0, scale: 0.15, y: 80, rotateZ: -5,
            filter: 'blur(20px)', transformPerspective: 700 },
          { opacity: 1, scale: 1, y: 0, rotateZ: 0, filter: 'blur(0px)',
            duration: 1.8, ease: 'power3.out',
            scrollTrigger: { trigger: arrumWrap, start: 'top 92%' } }
        );
        gsap.to(arrumImg, {
          y: -35, rotateZ: 1,
          scrollTrigger: {
            trigger: '#section-arrum',
            start: 'top 50%', end: 'bottom 20%', scrub: 1.8,
          }
        });
      }

      document.querySelectorAll('.arrum-deco').forEach((deco, i) => {
        gsap.fromTo(deco,
          { opacity: 0, scale: 0, rotateZ: i % 2 === 0 ? 90 : -90 },
          { opacity: parseFloat((deco as HTMLElement).style.opacity) || 0.8,
            scale: 1, rotateZ: 0,
            duration: 0.8, delay: 0.4 + i * 0.12, ease: 'back.out(1.8)',
            scrollTrigger: { trigger: '#section-arrum', start: 'top 90%' } }
        );
      });

      // ─────────────────────────────────────────────────────
      //  MEMPELAI — flower + photo reveals
      // ─────────────────────────────────────────────────────
      document.querySelectorAll('.mempelai-flower').forEach((flower, i) => {
        gsap.fromTo(flower,
          { opacity: 0, scale: 0, rotateZ: i === 0 ? 120 : -120 },
          { opacity: i === 0 ? 0.8 : 0.75, scale: 1, rotateZ: i === 0 ? 20 : -10,
            duration: 0.9, delay: 0.2 + i * 0.3, ease: 'back.out(2)',
            scrollTrigger: { trigger: '#section-mempelai', start: 'top 90%' } }
        );
      });

      const bismillah    = document.querySelector('#section-mempelai .bismillah');
      const salamText    = document.querySelector('.salam-text');
      const mempelaiIntro = document.querySelector('.mempelai-intro');

      if (bismillah) {
        gsap.fromTo(bismillah,
          { opacity: 0, scale: 0.5 },
          { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out',
            scrollTrigger: { trigger: bismillah, start: 'top 88%' } }
        );
      }
      if (salamText) {
        gsap.fromTo(salamText, { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8,
            scrollTrigger: { trigger: salamText, start: 'top 90%' } }
        );
      }
      if (mempelaiIntro) {
        gsap.fromTo(mempelaiIntro, { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.9,
            scrollTrigger: { trigger: mempelaiIntro, start: 'top 90%' } }
        );
      }

      // Groom — slide from left
      const groomCard = document.querySelector('.mempelai-card:not(.reverse)') as HTMLElement | null;
      if (groomCard) {
        const groomPhoto = groomCard.querySelector('.mempelai-photo') as HTMLElement | null;
        const groomInfo  = groomCard.querySelector('.mempelai-info') as HTMLElement | null;
        const groomTl = gsap.timeline({ scrollTrigger: { trigger: groomCard, start: 'top 88%' } });
        if (groomPhoto) {
          groomTl.fromTo(groomPhoto,
            { opacity: 0, x: -120, rotateZ: -20, scale: 0.5,
              filter: 'blur(8px) drop-shadow(0 4px 12px rgba(0,0,0,0.3))' },
            { opacity: 1, x: 0, rotateZ: 0, scale: 1,
              filter: 'blur(0px) drop-shadow(0 4px 20px rgba(212,104,138,0.5))',
              duration: 1.2, ease: 'power3.out' }, 0
          );
          groomTl.to(groomPhoto, { y: -6, duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true }, '>');
          gsap.to(groomPhoto, {
            y: -25, rotateZ: 2,
            scrollTrigger: { trigger: groomCard, start: 'top 60%', end: 'bottom 30%', scrub: 2 },
          });
        }
        if (groomInfo) {
          groomTl.fromTo(groomInfo, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }, 0.3);
        }
      }

      // Ampersand
      const ampersand = document.querySelector('.ampersand');
      if (ampersand) {
        gsap.fromTo(ampersand,
          { opacity: 0, scale: 0, rotateZ: -180 },
          { opacity: 1, scale: 1, rotateZ: 0, duration: 1, ease: 'elastic.out(1.2, 0.3)',
            scrollTrigger: { trigger: ampersand, start: 'top 90%' } }
        );
      }

      // Bride — slide from right
      const brideCard = document.querySelector('.mempelai-card.reverse') as HTMLElement | null;
      if (brideCard) {
        const bridePhoto = brideCard.querySelector('.mempelai-photo') as HTMLElement | null;
        const brideInfo  = brideCard.querySelector('.mempelai-info') as HTMLElement | null;
        const brideTl = gsap.timeline({ scrollTrigger: { trigger: brideCard, start: 'top 88%' } });
        if (bridePhoto) {
          brideTl.fromTo(bridePhoto,
            { opacity: 0, x: 120, rotateZ: 20, scale: 0.5,
              filter: 'blur(8px) drop-shadow(0 4px 12px rgba(0,0,0,0.3))' },
            { opacity: 1, x: 0, rotateZ: 0, scale: 1,
              filter: 'blur(0px) drop-shadow(0 4px 20px rgba(212,104,138,0.5))',
              duration: 1.2, ease: 'power3.out' }, 0
          );
          brideTl.to(bridePhoto, { y: -6, duration: 2.2, ease: 'sine.inOut', repeat: -1, yoyo: true }, '>');
          gsap.to(bridePhoto, {
            y: -25, rotateZ: -2,
            scrollTrigger: { trigger: brideCard, start: 'top 60%', end: 'bottom 30%', scrub: 2 },
          });
        }
        if (brideInfo) {
          brideTl.fromTo(brideInfo, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }, 0.3);
        }
      }

      // ─────────────────────────────────────────────────────
      //  LOKASI — rumah.png perspective zoom
      // ─────────────────────────────────────────────────────
      const lokasiSubtitle = document.querySelector('.lokasi-subtitle');
      const lokasiTitle    = document.querySelector('.lokasi-title');
      if (lokasiSubtitle) {
        gsap.fromTo(lokasiSubtitle,
          { opacity: 0, y: -15, letterSpacing: '0.35em' },
          { opacity: 1, y: 0, letterSpacing: '0.15em', duration: 0.8,
            scrollTrigger: { trigger: lokasiSubtitle, start: 'top 90%' } }
        );
      }
      if (lokasiTitle) {
        gsap.fromTo(lokasiTitle,
          { opacity: 0, y: 30, scale: 0.7 },
          { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'back.out(1.4)',
            scrollTrigger: { trigger: lokasiTitle, start: 'top 90%' } }
        );
      }

      const lokasiImg = document.querySelector('.lokasi-img') as HTMLElement | null;
      if (lokasiImg) {
        gsap.fromTo(lokasiImg,
          { opacity: 0, scale: 0.2, y: 100, rotateX: 25, transformPerspective: 600,
            filter: 'blur(15px) drop-shadow(0 8px 24px rgba(0,0,0,0.4))' },
          { opacity: 1, scale: 1, y: 0, rotateX: 0,
            filter: 'blur(0px) drop-shadow(0 8px 30px rgba(0,0,0,0.5))',
            duration: 1.6, ease: 'power3.out',
            scrollTrigger: { trigger: lokasiImg, start: 'top 92%' } }
        );
        gsap.to(lokasiImg, {
          y: -40, scale: 1.05,
          scrollTrigger: { trigger: '#section-lokasi', start: 'top 50%', end: 'bottom 30%', scrub: 2 },
        });
      }

      const lokasiAddr = document.querySelector('.lokasi-address');
      if (lokasiAddr) {
        gsap.fromTo(lokasiAddr, { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: lokasiAddr, start: 'top 90%' } }
        );
      }
      const lokasiBtn = document.querySelector('.lokasi-btn');
      if (lokasiBtn) {
        gsap.fromTo(lokasiBtn,
          { opacity: 0, y: 20, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.5)',
            scrollTrigger: { trigger: lokasiBtn, start: 'top 92%' } }
        );
      }
      document.querySelectorAll('.schedule-card').forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, x: i % 2 === 0 ? -60 : 60, rotateZ: i % 2 === 0 ? -5 : 5 },
          { opacity: 1, x: 0, rotateZ: 0, duration: 0.8, delay: i * 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: '.schedule-cards', start: 'top 88%' } }
        );
      });

      // ─────────────────────────────────────────────────────
      //  RSVP
      // ─────────────────────────────────────────────────────
      const rsvpTitle = document.querySelector('.rsvp-title');
      if (rsvpTitle) {
        gsap.fromTo(rsvpTitle,
          { opacity: 0, y: 30, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.3)',
            scrollTrigger: { trigger: rsvpTitle, start: 'top 90%' } }
        );
      }
      const rsvpDesc = document.querySelector('.rsvp-desc');
      if (rsvpDesc) {
        gsap.fromTo(rsvpDesc, { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, scrollTrigger: { trigger: rsvpDesc, start: 'top 90%' } }
        );
      }
      document.querySelectorAll('.rsvp-form > *').forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 30, x: i % 2 === 0 ? -20 : 20 },
          { opacity: 1, y: 0, x: 0, duration: 0.6, delay: i * 0.1, ease: 'power2.out',
            scrollTrigger: { trigger: '.rsvp-form', start: 'top 88%' } }
        );
      });

      // ─────────────────────────────────────────────────────
      //  GUESTBOOK
      // ─────────────────────────────────────────────────────
      const gbTitle = document.querySelector('.guestbook-title');
      if (gbTitle) {
        gsap.fromTo(gbTitle,
          { opacity: 0, y: 30, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.3)',
            scrollTrigger: { trigger: gbTitle, start: 'top 90%' } }
        );
      }
      document.querySelectorAll('.guestbook-form > *').forEach((el, i) => {
        gsap.fromTo(el, { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.6, delay: i * 0.1,
            scrollTrigger: { trigger: '.guestbook-form', start: 'top 90%' } }
        );
      });

      // ─────────────────────────────────────────────────────
      //  CLOSING — wedding.png grand finale
      // ─────────────────────────────────────────────────────
      const closingMsg   = document.querySelector('.closing-message');
      const closingSalam = document.querySelector('.closing-salam');
      const closingFrom  = document.querySelector('.closing-from');
      const closingNames = document.querySelector('.closing-names');

      if (closingMsg) {
        gsap.fromTo(closingMsg, { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: closingMsg, start: 'top 90%' } }
        );
      }
      if (closingSalam) {
        gsap.fromTo(closingSalam, { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, scrollTrigger: { trigger: closingSalam, start: 'top 90%' } }
        );
      }
      if (closingFrom) {
        gsap.fromTo(closingFrom, { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, scrollTrigger: { trigger: closingFrom, start: 'top 92%' } }
        );
      }
      if (closingNames) {
        gsap.fromTo(closingNames,
          { opacity: 0, scale: 0.3, rotateZ: -10, filter: 'blur(8px)' },
          { opacity: 1, scale: 1, rotateZ: 0, filter: 'blur(0px)',
            duration: 1.4, ease: 'elastic.out(1, 0.4)',
            scrollTrigger: { trigger: closingNames, start: 'top 90%' } }
        );
      }

      const weddingImg = document.querySelector('.closing-img') as HTMLElement | null;
      if (weddingImg) {
        gsap.fromTo(weddingImg,
          { opacity: 0, y: 150, scale: 0.3, rotateZ: 8,
            filter: 'blur(20px) drop-shadow(0 8px 24px rgba(0,0,0,0.4))' },
          { opacity: 1, y: 0, scale: 1, rotateZ: 0,
            filter: 'blur(0px) drop-shadow(0 12px 40px rgba(212,104,138,0.4))',
            duration: 1.8, ease: 'power3.out',
            scrollTrigger: { trigger: weddingImg, start: 'top 95%' } }
        );
        gsap.to(weddingImg, {
          y: -30, scale: 1.04,
          scrollTrigger: {
            trigger: '#section-closing',
            start: 'top 60%', end: 'bottom bottom', scrub: 2,
          },
        });
      }

      const waBtn = document.querySelector('.whatsapp-btn');
      if (waBtn) {
        gsap.fromTo(waBtn,
          { opacity: 0, y: 30, scale: 0.7 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.6)',
            scrollTrigger: { trigger: waBtn, start: 'top 94%' } }
        );
      }

      // Dividers
      document.querySelectorAll('.divider').forEach((div) => {
        gsap.fromTo(div,
          { opacity: 0, scaleX: 0 },
          { opacity: 1, scaleX: 1, duration: 0.8, ease: 'power2.inOut',
            scrollTrigger: { trigger: div, start: 'top 92%' } }
        );
      });

      // Force ScrollTrigger to recalculate all positions
      ScrollTrigger.refresh();

    }, 400); // Longer delay — allows Supabase data to render first

    return () => clearTimeout(timer);
  }, [isOpen]);
}
