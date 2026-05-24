import { useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';

// ── Particle colours matching the wedding theme ──
const PARTICLE_COLORS = [
  0xc9a84c, // gold
  0xe07a9e, // pink
  0xf4b8cc, // pink light
  0xe8c97a, // gold light
  0xfdf5e8, // cream
  0x8bc34a, // soft green leaf
  0xd4688a, // pink frame
];

function createPetalShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.3, 0.3, 0.6, 0.8, 0, 1.2);
  shape.bezierCurveTo(-0.6, 0.8, -0.3, 0.3, 0, 0);
  return shape;
}

function createStarShape(): THREE.Shape {
  const shape = new THREE.Shape();
  const outerR = 1;
  const innerR = 0.35;
  const points = 4;
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function createDiamondShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0, 1);
  shape.lineTo(0.55, 0);
  shape.lineTo(0, -1);
  shape.lineTo(-0.55, 0);
  shape.closePath();
  return shape;
}

interface Particle {
  mesh: THREE.Mesh;
  baseVelocity: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  phase: number;
  amplitude: number;
  baseOpacity: number;
  type: 'star' | 'petal' | 'diamond' | 'circle';
}

/**
 * Starts a Three.js particle system on the given canvas element.
 * Returns a cleanup function.
 */
function startParticles(canvas: HTMLCanvasElement): () => void {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.z = 10;

  const starGeo    = new THREE.ShapeGeometry(createStarShape());
  const petalGeo   = new THREE.ShapeGeometry(createPetalShape());
  const diamondGeo = new THREE.ShapeGeometry(createDiamondShape());
  const circleGeo  = new THREE.CircleGeometry(0.5, 8);

  const geometries = [
    { geo: starGeo,    type: 'star'    as const },
    { geo: petalGeo,   type: 'petal'   as const },
    { geo: diamondGeo, type: 'diamond' as const },
    { geo: circleGeo,  type: 'circle'  as const },
  ];

  const particles: Particle[] = [];
  const MAX_PARTICLES = 90;

  let scrollSpeed = 0;
  let lastScrollY = 0;
  const handleScroll = () => {
    const y = window.scrollY;
    scrollSpeed = Math.abs(y - lastScrollY);
    lastScrollY = y;
  };
  window.addEventListener('scroll', handleScroll, { passive: true });

  function spawnParticle(scattered = false): Particle {
    const geoInfo = geometries[Math.floor(Math.random() * geometries.length)];
    const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

    const layer = Math.floor(Math.random() * 3);
    const sizes = [0.008, 0.018, 0.035];
    const baseOpacity = [0.25, 0.55, 0.8][layer];
    const baseSize = sizes[layer] * (0.6 + Math.random() * 0.8);

    const mat  = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: baseOpacity, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geoInfo.geo, mat);

    mesh.scale.setScalar(baseSize);

    const startY = scattered ? (Math.random() - 0.5) * 2.4 : -1.2 - Math.random() * 0.3;
    mesh.position.set(
      (Math.random() - 0.5) * 2.2,
      startY,
      (Math.random() - 0.5) * 0.5,
    );
    mesh.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    );
    scene.add(mesh);

    return {
      mesh,
      baseVelocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.0004,
        0.0006 + layer * 0.0012 + Math.random() * 0.0008,
        0,
      ),
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.06,
      ),
      phase: Math.random() * Math.PI * 2,
      amplitude: 0.0002 + Math.random() * 0.0005,
      baseOpacity,
      type: geoInfo.type,
    };
  }

  for (let i = 0; i < MAX_PARTICLES; i++) {
    particles.push(spawnParticle(true));
  }

  let time = 0;
  let frameId = 0;

  function resize() {
    const w = canvas.clientWidth  || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
  }
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  function animate() {
    frameId = requestAnimationFrame(animate);
    time += 0.016;

    const scrollBoost = 1 + Math.min(scrollSpeed * 0.02, 3);
    scrollSpeed *= 0.92;

    for (const p of particles) {
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      const vy  = p.baseVelocity.y * scrollBoost;

      p.mesh.position.x += p.baseVelocity.x + Math.sin(time * 0.7 + p.phase) * p.amplitude;
      p.mesh.position.y += vy;

      if (p.type === 'petal') {
        p.mesh.position.x += Math.cos(time * 0.4 + p.phase * 2) * 0.0004;
      }

      p.mesh.rotation.x += p.rotSpeed.x;
      p.mesh.rotation.y += p.rotSpeed.y;
      p.mesh.rotation.z += p.rotSpeed.z;

      const y = p.mesh.position.y;
      let opacity = p.baseOpacity;
      if (y < -0.8) opacity = p.baseOpacity * Math.max(0, (y + 1.2) / 0.4);
      else if (y > 0.8) opacity = p.baseOpacity * Math.max(0, (1.3 - y) / 0.5);

      if (p.type === 'star' || p.type === 'diamond') {
        opacity *= 0.7 + 0.3 * Math.sin(time * 1.5 + p.phase);
      }

      mat.opacity = opacity;

      if (p.mesh.position.y > 1.35) {
        p.mesh.position.x = (Math.random() - 0.5) * 2.2;
        p.mesh.position.y = -1.2;
        p.phase = Math.random() * Math.PI * 2;
        mat.opacity = 0;
      }

      if (p.mesh.position.x > 1.2)  p.mesh.position.x = -1.2;
      if (p.mesh.position.x < -1.2) p.mesh.position.x =  1.2;
    }

    renderer.render(scene, camera);
  }

  animate();

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('scroll', handleScroll);
    resizeObserver.disconnect();
    renderer.dispose();
    for (const p of particles) {
      (p.mesh.material as THREE.MeshBasicMaterial).dispose();
      scene.remove(p.mesh);
    }
    starGeo.dispose();
    petalGeo.dispose();
    diamondGeo.dispose();
    circleGeo.dispose();
  };
}

/**
 * Attach Three.js particles to a canvas via a callback ref.
 * Usage: <canvas ref={particleRef} />
 *
 * This solves the problem where useRef + useEffect misses the moment
 * the canvas mounts (e.g. when it's inside a conditional render).
 */
export function useParticleSystem() {
  const cleanupRef = useRef<(() => void) | null>(null);

  const particleRef = useCallback((canvas: HTMLCanvasElement | null) => {
    // Cleanup previous instance if canvas was swapped or unmounted
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (!canvas) return;
    // Canvas is in the DOM — start immediately
    cleanupRef.current = startParticles(canvas);
  }, []);

  // Safety cleanup on component unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  return particleRef;
}
