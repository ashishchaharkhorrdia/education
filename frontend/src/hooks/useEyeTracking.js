import { useEffect, useRef, useState, useCallback } from 'react';

const FACE_MESH_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js';
const CAMERA_URL    = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js';
const DRAWING_URL   = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.js';

const LEFT_IRIS  = 473;
const RIGHT_IRIS = 468;

// ─── Script loader ────────────────────────────────────────────────────────────
const loadScript = (src, id) =>
  new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const s = document.createElement('script');
    s.id = id; s.src = src; s.crossOrigin = 'anonymous';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

// ─── Scroll zone visual flash ─────────────────────────────────────────────────
const flashScrollZone = (dir) => {
  const id = `gaze-scroll-${dir}`;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    Object.assign(el.style, {
      position: 'fixed',
      left: '50%', transform: 'translateX(-50%)',
      [dir === 'up' ? 'top' : 'bottom']: '0',
      width: '160px', height: '48px',
      background: dir === 'up' ? 'rgba(99,102,241,0.90)' : 'rgba(99,102,241,0.90)',
      color: '#fff', fontWeight: '700', fontSize: '20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: dir === 'up' ? '0 0 28px 28px' : '28px 28px 0 0',
      pointerEvents: 'none', zIndex: '9999999',
      transition: 'opacity 0.25s',
      opacity: '0',
    });
    el.textContent = dir === 'up' ? '▲ Scroll Up' : '▼ Scroll Down';
    document.body.appendChild(el);
  }
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 500);
};

// ─── Back navigation flash ────────────────────────────────────────────────────
const flashBackZone = () => {
  let el = document.getElementById('gaze-back-flash');
  if (!el) {
    el = document.createElement('div');
    el.id = 'gaze-back-flash';
    Object.assign(el.style, {
      position: 'fixed',
      left: '0', top: '50%', transform: 'translateY(-50%)',
      width: '80px', height: '80px',
      background: 'rgba(245,158,11,0.92)',
      color: '#fff', fontWeight: '700', fontSize: '14px',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      borderRadius: '0 28px 28px 0',
      pointerEvents: 'none', zIndex: '9999999',
      transition: 'opacity 0.25s',
      opacity: '0',
      gap: '4px',
    });
    el.innerHTML = '◀<br/>Back';
    document.body.appendChild(el);
  }
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 600);
};

// ─── Edge hint overlays ───────────────────────────────────────────────────────
const showScrollHints = () => {
  const hints = [
    { id: 'gaze-hint-up',   dir: 'up',   label: '▲ Look Up to Scroll' },
    { id: 'gaze-hint-down', dir: 'down', label: '▼ Look Down to Scroll' },
    { id: 'gaze-hint-left', dir: 'left', label: '◀ Look Left to Go Back' },
  ];
  hints.forEach(({ id, dir, label }) => {
    if (document.getElementById(id)) return;
    const el = document.createElement('div');
    el.id = id;
    const isVertical = dir === 'up' || dir === 'down';
    Object.assign(el.style, {
      position: 'fixed',
      pointerEvents: 'none', zIndex: '9999998',
      fontWeight: '700', fontSize: '11px',
      color: 'rgba(99,102,241,0.7)',
      background: 'rgba(99,102,241,0.10)',
      border: '1.5px solid rgba(99,102,241,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      letterSpacing: '0.5px',
      ...(isVertical ? {
        left: '50%', transform: 'translateX(-50%)',
        [dir === 'up' ? 'top' : 'bottom']: '0',
        width: '160px', height: '28px',
        borderRadius: dir === 'up' ? '0 0 14px 14px' : '14px 14px 0 0',
      } : {
        left: '0', top: '50%', transform: 'translateY(-50%)',
        width: '28px', height: '90px',
        borderRadius: '0 14px 14px 0',
        flexDirection: 'column',
        fontSize: '10px', letterSpacing: '0',
        textAlign: 'center',
      }),
    });
    el.textContent = isVertical ? label : '◀';
    document.body.appendChild(el);
  });
};

const removeScrollHints = () => {
  ['gaze-hint-up', 'gaze-hint-down', 'gaze-hint-left',
   'gaze-scroll-up', 'gaze-scroll-down', 'gaze-back-flash']
    .forEach(id => document.getElementById(id)?.remove());
};

// ─── Get the best scrollable container ───────────────────────────────────────
const getScrollTarget = () => {
  // Try to find scrollable main content first
  const candidates = [
    document.querySelector('main'),
    document.querySelector('[class*="overflow"]'),
    document.documentElement,
    document.body,
  ];
  for (const el of candidates) {
    if (!el) continue;
    const style = window.getComputedStyle(el);
    const overflow = style.overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight) {
      return el;
    }
  }
  return window; // fallback: scroll global window
};

const doScroll = (amount) => {
  const target = getScrollTarget();
  if (target === window) {
    window.scrollBy({ top: amount, behavior: 'smooth' });
  } else {
    target.scrollBy({ top: amount, behavior: 'smooth' });
  }
};

// ─── IDs of overlay elements to skip during dwell click ──────────────────────
const OVERLAY_IDS = new Set([
  'gaze-cursor', 'eye-cam-container', 'eye-cam-video', 'eye-cam-canvas',
  'gaze-hint-up', 'gaze-hint-down', 'gaze-hint-left',
  'gaze-scroll-up', 'gaze-scroll-down', 'gaze-back-flash',
]);

const isOverlayElement = (el) => {
  if (!el) return true;
  let node = el;
  while (node && node !== document.body) {
    if (OVERLAY_IDS.has(node.id)) return true;
    node = node.parentElement;
  }
  return false;
};

const CLICKABLE_SELECTOR = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'label',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const isDisabledElement = (el) =>
  !!(
    el?.hasAttribute?.('disabled') ||
    el?.getAttribute?.('aria-disabled') === 'true'
  );

const getClickableTarget = (el) => {
  if (!el || isOverlayElement(el)) return null;

  const directMatch = el.closest?.(CLICKABLE_SELECTOR);
  if (directMatch && !isDisabledElement(directMatch) && !isOverlayElement(directMatch)) {
    return directMatch;
  }

  let node = el;
  while (node && node !== document.body) {
    if (!isDisabledElement(node) && (
      typeof node.onclick === 'function' ||
      node.getAttribute?.('role') === 'button' ||
      node.getAttribute?.('role') === 'link'
    )) {
      return node;
    }
    node = node.parentElement;
  }

  return null;
};

const fireSyntheticClick = (target) => {
  if (!target || isDisabledElement(target)) return;

  target.focus?.({ preventScroll: true });

  if (window.PointerEvent) {
    target.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      view: window,
    }));
  }

  ['mousedown', 'mouseup'].forEach((type) => {
    target.dispatchEvent(new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
    }));
  });

  if (typeof target.click === 'function') target.click();
  else {
    target.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    }));
  }
};

// ─── Hook ────────────────────────────────────────────────────────────────────
export const useEyeTracking = (enabled) => {
  const [status, setStatus]  = useState('idle');
  const cameraRef   = useRef(null);
  const meshRef     = useRef(null);
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const gazeHist    = useRef([]);
  const scrollCD    = useRef(false);
  const backCD      = useRef(false);
  const edgeActionRef = useRef({ type: null, startTime: 0 });
  const dwellRef    = useRef({ x: 0, y: 0, startTime: 0, active: false });
  const watchdogRef = useRef(null);
  const lastFrameTs = useRef(0);
  const activeRef   = useRef(false); // track if we're supposed to be running

  // ── Gaze smoothing (weighted average, last 8 frames) ──────────────────────
  const smoothGaze = (x, y) => {
    gazeHist.current.push({ x, y });
    if (gazeHist.current.length > 8) gazeHist.current.shift();
    const n = gazeHist.current.length;
    const s = gazeHist.current.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
    return { x: s.x / n, y: s.y / n };
  };

  // ── Camera preview panel ──────────────────────────────────────────────────
  const createPreview = () => {
    if (document.getElementById('eye-cam-container')) {
      return {
        video:  document.getElementById('eye-cam-video'),
        canvas: document.getElementById('eye-cam-canvas'),
      };
    }
    const container = document.createElement('div');
    container.id = 'eye-cam-container';
    Object.assign(container.style, {
      position: 'fixed', bottom: '24px', right: '24px',
      width: '240px', height: '180px', zIndex: '999998',
      borderRadius: '16px', overflow: 'hidden',
      border: '2.5px solid rgba(239,68,68,0.9)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      background: '#000',
    });

    const video = document.createElement('video');
    video.id = 'eye-cam-video'; video.playsInline = true; video.muted = true;
    Object.assign(video.style, {
      position: 'absolute', top: 0, left: 0,
      width: '100%', height: '100%', objectFit: 'cover',
      transform: 'scaleX(-1)',
    });

    const canvas = document.createElement('canvas');
    canvas.id = 'eye-cam-canvas'; canvas.width = 320; canvas.height = 240;
    Object.assign(canvas.style, {
      position: 'absolute', top: 0, left: 0,
      width: '100%', height: '100%',
      transform: 'scaleX(-1)',
    });

    const label = document.createElement('div');
    Object.assign(label.style, {
      position: 'absolute', bottom: '6px', left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.7)', color: '#fff',
      fontSize: '11px', fontWeight: '600',
      padding: '2px 12px', borderRadius: '99px',
      whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: '2',
    });
    label.textContent = '👁️ Eye Tracker';

    const closeBtn = document.createElement('button');
    Object.assign(closeBtn.style, {
      position: 'absolute', top: '6px', right: '6px',
      width: '24px', height: '24px', borderRadius: '50%',
      background: 'rgba(239,68,68,0.85)',
      border: 'none', color: '#fff',
      fontSize: '14px', fontWeight: '700', lineHeight: '1',
      cursor: 'pointer', zIndex: '3',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    });
    closeBtn.textContent = '✕';
    closeBtn.title = 'Close Eye Tracker';
    closeBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('equaled:eye-close'));
    });

    container.appendChild(video);
    container.appendChild(canvas);
    container.appendChild(label);
    container.appendChild(closeBtn);
    document.body.appendChild(container);
    return { video, canvas };
  };

  // ── Per-frame result handler ───────────────────────────────────────────────
  const onResults = useCallback((results) => {
    // Update heartbeat timestamp
    lastFrameTs.current = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
    const lm = results.multiFaceLandmarks[0];

    // Draw mesh overlays
    if (window.drawConnectors && window.FACEMESH_TESSELATION) {
      window.drawConnectors(ctx, lm, window.FACEMESH_TESSELATION, {
        color: 'rgba(255,255,255,0.08)', lineWidth: 1,
      });
      window.drawConnectors(ctx, lm, window.FACEMESH_FACE_OVAL, {
        color: 'rgba(255,255,255,0.45)', lineWidth: 1.5,
      });
      window.drawConnectors(ctx, lm, window.FACEMESH_RIGHT_EYE, {
        color: 'rgba(239,68,68,0.8)', lineWidth: 2,
      });
      window.drawConnectors(ctx, lm, window.FACEMESH_LEFT_EYE, {
        color: 'rgba(239,68,68,0.8)', lineWidth: 2,
      });
    }

    if (window.drawConnectors && window.FACEMESH_RIGHT_IRIS && window.FACEMESH_LEFT_IRIS) {
      window.drawConnectors(ctx, lm, window.FACEMESH_RIGHT_IRIS, {
        color: 'rgba(59,130,246,0.95)', lineWidth: 2,
      });
      window.drawConnectors(ctx, lm, window.FACEMESH_LEFT_IRIS, {
        color: 'rgba(59,130,246,0.95)', lineWidth: 2,
      });
    }

    [LEFT_IRIS, RIGHT_IRIS].forEach(idx => {
      if (!lm[idx]) return;
      ctx.beginPath();
      ctx.arc(lm[idx].x * canvas.width, lm[idx].y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(59,130,246,1)';
      ctx.fill();
    });

    if (!lm[LEFT_IRIS] || !lm[RIGHT_IRIS]) return;

    // ── Map iris position → screen coordinates ─────────────────────────────
    const irisX = (lm[LEFT_IRIS].x + lm[RIGHT_IRIS].x) / 2;
    const irisY = (lm[LEFT_IRIS].y + lm[RIGHT_IRIS].y) / 2;

    // Mirror X (video is mirrored), expand Y range
    const rawX = (1 - irisX) * window.innerWidth;
    const rawY = ((irisY - 0.25) / 0.5) * window.innerHeight;
    const { x, y } = smoothGaze(rawX, Math.max(0, Math.min(window.innerHeight, rawY)));

    // ── Publish smoothed gaze for GazeRemote panel ────────────────────────
    window.__gazePos = { x, y };

    // ── Move gaze cursor ───────────────────────────────────────────────────
    let cursor = document.getElementById('gaze-cursor');
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = 'gaze-cursor';
      Object.assign(cursor.style, {
        position: 'fixed', width: '28px', height: '28px',
        borderRadius: '50%',
        border: '3px solid rgba(239,68,68,0.9)',
        background: 'rgba(239,68,68,0.2)',
        pointerEvents: 'none', zIndex: '999999',
        transform: 'translate(-50%,-50%)',
        transition: 'left 0.08s ease, top 0.08s ease',
        boxShadow: '0 0 20px rgba(239,68,68,0.5)',
      });
      document.body.appendChild(cursor);
    }
    cursor.style.left = `${x}px`;
    cursor.style.top  = `${y}px`;

    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const EDGE_DWELL_MS = 900;
    const EDGE_ZONE_TOP = vh * 0.12;
    const EDGE_ZONE_BOTTOM = vh * 0.88;
    const EDGE_ZONE_LEFT = vw * 0.08;

    // ── Scroll Up / Down zones (top/bottom 12% of screen) ─────────────────
    let edgeAction = null;
    if (y < EDGE_ZONE_TOP && !scrollCD.current) edgeAction = 'scroll-up';
    else if (y > EDGE_ZONE_BOTTOM && !scrollCD.current) edgeAction = 'scroll-down';
    else if (x < EDGE_ZONE_LEFT && !backCD.current) edgeAction = 'back';

    if (edgeAction) {
      const now = performance.now();
      if (edgeActionRef.current.type !== edgeAction) {
        edgeActionRef.current = { type: edgeAction, startTime: now };
      }

      const elapsed = now - edgeActionRef.current.startTime;
      const pct = Math.min(elapsed / EDGE_DWELL_MS, 1);
      const deg = Math.round(pct * 360);

      cursor.style.background = `conic-gradient(rgba(245,158,11,0.85) ${deg}deg, rgba(239,68,68,0.12) ${deg}deg)`;
      cursor.style.border = '3px solid rgba(245,158,11,1)';
      cursor.style.boxShadow = `0 0 ${20 + pct * 20}px rgba(245,158,11,0.8)`;
      cursor.style.transform = `translate(-50%,-50%) scale(${1 + pct * 0.15})`;

      if (elapsed >= EDGE_DWELL_MS) {
        if (edgeAction === 'scroll-up') {
          doScroll(-320);
          flashScrollZone('up');
          scrollCD.current = true;
          setTimeout(() => { scrollCD.current = false; }, 650);
        } else if (edgeAction === 'scroll-down') {
          doScroll(320);
          flashScrollZone('down');
          scrollCD.current = true;
          setTimeout(() => { scrollCD.current = false; }, 650);
        } else if (edgeAction === 'back') {
          flashBackZone();
          backCD.current = true;
          setTimeout(() => {
            window.history.back();
            backCD.current = false;
          }, 150);
        }

        edgeActionRef.current = { type: null, startTime: 0 };
        dwellRef.current = { x, y, startTime: performance.now(), active: false };
      }
      return;
    }

    edgeActionRef.current = { type: null, startTime: 0 };

    // ── Back navigation zone (left 6% of screen) ─────────────────────────
    // ── Dwell-to-click logic ───────────────────────────────────────────────
    const DWELL_MS     = 1800; // 1.8s dwell
    const DWELL_RADIUS = 80;   // px movement tolerance
    const dwell = dwellRef.current;
    const dist = Math.hypot(x - dwell.x, y - dwell.y);

    if (dist > DWELL_RADIUS) {
      // Moved — reset dwell
      dwell.x = x; dwell.y = y;
      dwell.startTime = performance.now();
      dwell.active = false;
      cursor.style.background = 'rgba(239,68,68,0.2)';
      cursor.style.border = '3px solid rgba(239,68,68,0.9)';
      cursor.style.boxShadow = '0 0 20px rgba(239,68,68,0.5)';
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      cursor.style.transition = 'left 0.08s ease, top 0.08s ease';
    } else if (!dwell.active) {
      // Filling up dwell progress
      const elapsed = performance.now() - dwell.startTime;
      const pct = Math.min(elapsed / DWELL_MS, 1);
      const deg = Math.round(pct * 360);

      cursor.style.background = `conic-gradient(rgba(99,102,241,0.85) ${deg}deg, rgba(239,68,68,0.1) ${deg}deg)`;
      cursor.style.border = '3px solid rgba(99,102,241,1)';
      cursor.style.boxShadow = `0 0 ${20 + pct * 20}px rgba(99,102,241,0.7)`;
      cursor.style.transform = `translate(-50%,-50%) scale(${1 + pct * 0.25})`;
      cursor.style.transition = 'border 0.1s, box-shadow 0.1s';

      if (elapsed >= DWELL_MS) {
        // ── FIRE CLICK ────────────────────────────────────────────────────
        dwell.active = true;
        cursor.style.background = 'rgba(99,102,241,0.9)';
        cursor.style.transform = 'translate(-50%,-50%) scale(0.85)';
        cursor.style.boxShadow = '0 0 50px rgba(99,102,241,1)';

        const el = document.elementFromPoint(x, y);
        const target = getClickableTarget(el);
        if (target) fireSyntheticClick(target);

        // Reset after click visual
        setTimeout(() => {
          dwell.x = -9999; dwell.y = -9999;
          dwell.startTime = performance.now();
          dwell.active = false;
          if (cursor) {
            cursor.style.background = 'rgba(239,68,68,0.2)';
            cursor.style.border = '3px solid rgba(239,68,68,0.9)';
            cursor.style.transform = 'translate(-50%,-50%) scale(1)';
            cursor.style.boxShadow = '0 0 20px rgba(239,68,68,0.5)';
          }
        }, 900);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentional: reads all state via refs — no stale closure risk

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    activeRef.current = false;

    // Stop watchdog
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }

    try { cameraRef.current?.stop(); } catch (_) {}
    try { meshRef.current?.close(); } catch (_) {}
    cameraRef.current = null;
    meshRef.current   = null;

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    videoRef.current = null;

    ['eye-cam-container', 'gaze-cursor'].forEach(id =>
      document.getElementById(id)?.remove()
    );
    removeScrollHints();

    gazeHist.current   = [];
    scrollCD.current   = false;
    backCD.current     = false;
    edgeActionRef.current = { type: null, startTime: 0 };
    dwellRef.current   = { x: 0, y: 0, startTime: 0, active: false };
    lastFrameTs.current = 0;

    setStatus('idle');
  }, []);

  // ── Init ──────────────────────────────────────────────────────────────────
  const init = useCallback(async () => {
    if (!activeRef.current) return; // Aborted before init finished

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 },
      });
    } catch (err) {
      console.error('[EyeTracking] Camera denied:', err);
      setStatus('error');
      return;
    }

    if (!activeRef.current) {
      stream.getTracks().forEach(t => t.stop());
      return;
    }

    const { video, canvas } = createPreview();
    videoRef.current  = video;
    canvasRef.current = canvas;
    video.srcObject   = stream;

    try {
      await video.play();
    } catch (err) {
      console.error('[EyeTracking] Video play failed:', err);
      setStatus('error');
      return;
    }

    const faceMesh = new window.FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMesh.onResults(onResults);
    meshRef.current = faceMesh;

    const camera = new window.Camera(video, {
      onFrame: async () => {
        if (meshRef.current && activeRef.current) {
          try {
            await meshRef.current.send({ image: video });
          } catch (err) {
            // Silent — watchdog will catch if frames stop
          }
        }
      },
      width: 320, height: 240,
    });
    cameraRef.current = camera;
    camera.start();

    lastFrameTs.current = performance.now();

    // ── Watchdog: restart if no frames for 5 seconds ──────────────────────
    clearInterval(watchdogRef.current);
    watchdogRef.current = setInterval(() => {
      if (!activeRef.current) return;
      const stale = performance.now() - lastFrameTs.current;
      if (stale > 5000) {
        console.warn('[EyeTracking] Watchdog: no frames for 5s, restarting...');
        clearInterval(watchdogRef.current);
        watchdogRef.current = null;
        // Restart
        try { cameraRef.current?.stop(); } catch (_) {}
        try { meshRef.current?.close(); } catch (_) {}
        cameraRef.current = null;
        meshRef.current   = null;
        if (videoRef.current?.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(t => t.stop());
          videoRef.current.srcObject = null;
        }
        lastFrameTs.current = performance.now(); // prevent tight loop
        setTimeout(() => { if (activeRef.current) init(); }, 1000);
      }
    }, 3000);

    showScrollHints();
    setStatus('active');
    console.log('[EyeTracking] FaceMesh started with iris tracking + watchdog.');
  }, [onResults]);

  // ── Main effect ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      return;
    }

    activeRef.current = true;
    setStatus('loading');

    Promise.all([
      loadScript(DRAWING_URL,   'mp-drawing'),
      loadScript(FACE_MESH_URL, 'mp-facemesh'),
      loadScript(CAMERA_URL,    'mp-camera'),
    ])
      .then(() => setTimeout(() => {
        if (window.FaceMesh && window.Camera && activeRef.current) {
          init();
        } else if (activeRef.current) {
          setStatus('error');
        }
      }, 400))
      .catch(() => { if (activeRef.current) setStatus('error'); });

    return () => {
      // Only cleanup refs & timers here — we rely on the enabled=false path for full cleanup
      activeRef.current = false;
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    };
  }, [enabled]);

  return { status };
};
