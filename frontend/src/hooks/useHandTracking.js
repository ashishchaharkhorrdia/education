import { useEffect, useRef, useState, useCallback } from 'react';

const HANDS_URL   = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
const CAMERA_URL  = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js';
const DRAWING_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.js';

// ─── Landmark indices ─────────────────────────────────────────────────────────
const THUMB_TIP = 4;
const IDX_TIP   = 8,  IDX_PIP  = 6;
const MID_TIP   = 12, MID_PIP  = 10;
const RING_TIP  = 16, RING_PIP = 14;
const PINKY_TIP = 20, PINKY_PIP= 18;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const dist2D = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

// A finger is "up" if its tip is significantly above its PIP joint
const fingerUp = (tip, pip) => tip.y < pip.y - 0.025;

/**
 * Gesture detection
 * - pinch  : thumb tip close to index tip  → Click
 * - point  : only index up                 → Scroll Up
 * - peace  : index + middle up             → Scroll Down
 * - open   : all four fingers up           → Go Back
 * - fist   : no fingers up                 → (none)
 */
const detectGesture = (lm) => {
  if (!lm || lm.length < 21) return 'none';

  const indexUp  = fingerUp(lm[IDX_TIP],  lm[IDX_PIP]);
  const middleUp = fingerUp(lm[MID_TIP],  lm[MID_PIP]);
  const ringUp   = fingerUp(lm[RING_TIP], lm[RING_PIP]);
  const pinkyUp  = fingerUp(lm[PINKY_TIP],lm[PINKY_PIP]);

  // Pinch check (thumb + index close together)
  const pinchDist = dist2D(lm[THUMB_TIP], lm[IDX_TIP]);
  if (pinchDist < 0.075) return 'pinch';

  // All four fingers up → Back
  if (indexUp && middleUp && ringUp && pinkyUp) return 'open';

  // Index + middle → Scroll Down
  if (indexUp && middleUp && !ringUp && !pinkyUp) return 'peace';

  // Only index → Scroll Up
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return 'point';

  return 'none';
};

// ─── Script loader ────────────────────────────────────────────────────────────
const loadScript = (src, id) =>
  new Promise((resolve, reject) => {
    if (document.getElementById(id)) { resolve(); return; }
    const s = document.createElement('script');
    s.id = id; s.src = src; s.crossOrigin = 'anonymous';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

// ─── Get the best scrollable container ───────────────────────────────────────
const getScrollTarget = () => {
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
  return window;
};

const doScroll = (amount) => {
  const target = getScrollTarget();
  if (target === window) {
    window.scrollBy({ top: amount, behavior: 'smooth' });
  } else {
    target.scrollBy({ top: amount, behavior: 'smooth' });
  }
};

// ─── Toast badge ──────────────────────────────────────────────────────────────
const showBadge = (text, color) => {
  let badge = document.getElementById('hand-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'hand-badge';
    Object.assign(badge.style, {
      position: 'fixed', bottom: '280px', left: '24px',
      padding: '8px 18px', borderRadius: '99px',
      fontSize: '14px', fontWeight: '700', color: '#fff',
      pointerEvents: 'none', zIndex: '999999',
      transition: 'opacity 0.3s',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      opacity: '0',
    });
    document.body.appendChild(badge);
  }
  badge.textContent = text;
  badge.style.background = color;
  badge.style.opacity = '1';
  clearTimeout(badge._t);
  badge._t = setTimeout(() => { badge.style.opacity = '0'; }, 1200);
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useHandTracking = (enabled) => {
  const [status, setStatus] = useState('idle');

  const cameraRef    = useRef(null);
  const handsRef     = useRef(null);
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const pinchLatch   = useRef(false);
  const lastGesture  = useRef('none');
  const scrollCD     = useRef(false);
  const backCD       = useRef(false);
  const watchdogRef  = useRef(null);
  const lastFrameTs  = useRef(0);
  const activeRef    = useRef(false);

  // ── Cursor ────────────────────────────────────────────────────────────────
  const moveCursor = (x, y) => {
    let cursor = document.getElementById('hand-cursor');
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = 'hand-cursor';
      Object.assign(cursor.style, {
        position: 'fixed', width: '28px', height: '28px',
        borderRadius: '50%', border: '3px solid rgba(99,102,241,0.9)',
        background: 'rgba(99,102,241,0.2)', pointerEvents: 'none',
        zIndex: '999999', transform: 'translate(-50%,-50%)',
        transition: 'left 0.05s, top 0.05s',
        boxShadow: '0 0 18px rgba(99,102,241,0.5)',
      });
      document.body.appendChild(cursor);
    }
    cursor.style.left = `${x}px`;
    cursor.style.top  = `${y}px`;
  };

  // ── Skeleton drawer ───────────────────────────────────────────────────────
  const drawSkeleton = (lm, canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (window.drawConnectors && window.HAND_CONNECTIONS) {
      window.drawConnectors(ctx, lm, window.HAND_CONNECTIONS, {
        color: 'rgba(99,102,241,0.75)', lineWidth: 2,
      });
      window.drawLandmarks && window.drawLandmarks(ctx, lm, {
        color: 'rgba(99,102,241,0.9)', fillColor: 'rgba(99,102,241,0.5)',
        lineWidth: 1, radius: 4,
      });
    } else {
      // Fallback manual drawing when MediaPipe drawing utils unavailable
      const connections = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [0,9],[9,10],[10,11],[11,12],
        [0,13],[13,14],[14,15],[15,16],
        [0,17],[17,18],[18,19],[19,20],
        [5,9],[9,13],[13,17],
      ];
      ctx.strokeStyle = 'rgba(99,102,241,0.75)';
      ctx.lineWidth = 2;
      connections.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
        ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
        ctx.stroke();
      });
      lm.forEach((pt, i) => {
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, i === IDX_TIP ? 8 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = i === IDX_TIP ? 'rgba(239,68,68,0.95)' : 'rgba(99,102,241,0.9)';
        ctx.fill();
      });
    }
  };

  // ── Camera preview panel ──────────────────────────────────────────────────
  const createPreview = () => {
    if (document.getElementById('hand-cam-container')) {
      return {
        video:  document.getElementById('hand-video'),
        canvas: document.getElementById('hand-canvas'),
      };
    }
    const container = document.createElement('div');
    container.id = 'hand-cam-container';
    Object.assign(container.style, {
      position: 'fixed', bottom: '24px', left: '24px', zIndex: '999998',
      width: '240px', height: '180px', borderRadius: '16px', overflow: 'hidden',
      border: '2.5px solid rgba(99,102,241,0.9)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)', background: '#000',
    });

    const video = document.createElement('video');
    video.id = 'hand-video'; video.playsInline = true; video.muted = true;
    Object.assign(video.style, {
      width: '100%', height: '100%', objectFit: 'cover',
      transform: 'scaleX(-1)', display: 'block',
    });

    const canvas = document.createElement('canvas');
    canvas.id = 'hand-canvas'; canvas.width = 320; canvas.height = 240;
    Object.assign(canvas.style, {
      position: 'absolute', top: 0, left: 0,
      width: '100%', height: '100%', transform: 'scaleX(-1)',
    });

    const label = document.createElement('div');
    Object.assign(label.style, {
      position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '11px', fontWeight: '600',
      padding: '2px 12px', borderRadius: '99px', whiteSpace: 'nowrap',
      pointerEvents: 'none', zIndex: '1',
    });
    label.textContent = '✋ Hand Control';

    const closeBtn = document.createElement('button');
    Object.assign(closeBtn.style, {
      position: 'absolute', top: '6px', right: '6px',
      width: '24px', height: '24px', borderRadius: '50%',
      background: 'rgba(99,102,241,0.85)',
      border: 'none', color: '#fff',
      fontSize: '14px', fontWeight: '700', lineHeight: '1',
      cursor: 'pointer', zIndex: '3',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    });
    closeBtn.textContent = '✕';
    closeBtn.title = 'Close Hand Control';
    closeBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('equaled:hand-close'));
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
    // Heartbeat — tell watchdog we're alive
    lastFrameTs.current = performance.now();

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      lastGesture.current = 'none';
      return;
    }

    const lm = results.multiHandLandmarks[0];

    if (canvas) drawSkeleton(lm, canvas);

    // Map index finger tip to screen coords (mirror X because video is mirrored)
    const screenX = (1 - lm[IDX_TIP].x) * window.innerWidth;
    const screenY = lm[IDX_TIP].y * window.innerHeight;
    moveCursor(screenX, screenY);

    const gesture = detectGesture(lm);

    // ── Pinch → Click ────────────────────────────────────────────────────
    if (gesture === 'pinch') {
      if (!pinchLatch.current) {
        pinchLatch.current = true;
        showBadge('👌 Click', '#10b981');
        const el = document.elementFromPoint(screenX, screenY);
        if (el && el.id !== 'hand-cursor') {
          // Walk up to nearest clickable
          let target = el;
          while (target && target !== document.body) {
            const tag = target.tagName.toLowerCase();
            if (tag === 'a' || tag === 'button' || tag === 'input' ||
                tag === 'select' || tag === 'textarea' ||
                target.getAttribute('role') === 'button' ||
                target.onclick) {
              break;
            }
            target = target.parentElement;
          }
          (target || el).click();
          // Visual feedback on cursor
          const cursor = document.getElementById('hand-cursor');
          if (cursor) {
            cursor.style.background = 'rgba(16,185,129,0.8)';
            cursor.style.borderColor = 'rgba(16,185,129,1)';
            setTimeout(() => {
              if (cursor) {
                cursor.style.background = 'rgba(99,102,241,0.2)';
                cursor.style.borderColor = 'rgba(99,102,241,0.9)';
              }
            }, 300);
          }
        }
      }
    } else {
      pinchLatch.current = false;
    }

    // ── Point (☝️) → Scroll Up ───────────────────────────────────────────
    if (gesture === 'point' && !scrollCD.current) {
      doScroll(-120);
      scrollCD.current = true;
      showBadge('☝️ Scroll Up', '#6366f1');
      setTimeout(() => { scrollCD.current = false; }, 350);
    }

    // ── Peace (✌️) → Scroll Down ─────────────────────────────────────────
    if (gesture === 'peace' && !scrollCD.current) {
      doScroll(120);
      scrollCD.current = true;
      showBadge('✌️ Scroll Down', '#8b5cf6');
      setTimeout(() => { scrollCD.current = false; }, 350);
    }

    // ── Open Palm (🖐️) → Go Back ─────────────────────────────────────────
    // Only trigger on the rising edge (was not open, now open)
    if (gesture === 'open' && lastGesture.current !== 'open' && !backCD.current) {
      backCD.current = true;
      showBadge('🖐️ Going Back…', '#f59e0b');
      setTimeout(() => {
        window.history.back();
        backCD.current = false;
      }, 700);
    }

    lastGesture.current = gesture;
  }, []); // No deps — all state read via refs

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    activeRef.current = false;

    if (watchdogRef.current) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }

    try { cameraRef.current?.stop(); } catch (_) {}
    try { handsRef.current?.close(); } catch (_) {}
    cameraRef.current = null;
    handsRef.current  = null;

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    videoRef.current = null;

    ['hand-cam-container', 'hand-cursor', 'hand-badge'].forEach(id =>
      document.getElementById(id)?.remove()
    );

    pinchLatch.current  = false;
    lastGesture.current = 'none';
    scrollCD.current    = false;
    backCD.current      = false;
    lastFrameTs.current = 0;

    setStatus('idle');
  }, []);

  // ── Init ──────────────────────────────────────────────────────────────────
  const init = useCallback(async () => {
    if (!activeRef.current) return;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 },
      });
    } catch (err) {
      console.error('[HandTracking] Camera denied:', err);
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
      console.error('[HandTracking] Video play failed:', err);
      setStatus('error');
      return;
    }

    const hands = new window.Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,            // Use lighter model (0 vs 1) — less GPU pressure
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.55,
    });
    hands.onResults(onResults);
    handsRef.current = hands;

    const camera = new window.Camera(video, {
      onFrame: async () => {
        if (handsRef.current && activeRef.current) {
          try {
            await handsRef.current.send({ image: video });
          } catch (err) {
            // Silent frame errors — watchdog will restart if needed
          }
        }
      },
      width: 320, height: 240,
    });
    cameraRef.current = camera;
    camera.start();

    lastFrameTs.current = performance.now();

    // ── Watchdog: restart if no frames received for 5s ────────────────────
    clearInterval(watchdogRef.current);
    watchdogRef.current = setInterval(() => {
      if (!activeRef.current) return;
      const stale = performance.now() - lastFrameTs.current;
      if (stale > 5000) {
        console.warn('[HandTracking] Watchdog: no frames for 5s, restarting...');
        clearInterval(watchdogRef.current);
        watchdogRef.current = null;

        // Tear down old instances
        try { cameraRef.current?.stop(); } catch (_) {}
        try { handsRef.current?.close(); } catch (_) {}
        cameraRef.current = null;
        handsRef.current  = null;

        if (videoRef.current?.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(t => t.stop());
          videoRef.current.srcObject = null;
        }

        lastFrameTs.current = performance.now(); // prevent tight-loop restart
        setTimeout(() => { if (activeRef.current) init(); }, 1500);
      }
    }, 3000);

    setStatus('active');
    console.log('[HandTracking] Started with watchdog (modelComplexity=0).');
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
      loadScript(DRAWING_URL, 'mp-drawing'),
      loadScript(HANDS_URL,   'mp-hands'),
      loadScript(CAMERA_URL,  'mp-camera'),
    ])
      .then(() => setTimeout(() => {
        if (window.Hands && window.Camera && activeRef.current) {
          init();
        } else if (activeRef.current) {
          setStatus('error');
        }
      }, 400))
      .catch(() => { if (activeRef.current) setStatus('error'); });

    return () => {
      // Signal shutdown and clear watchdog immediately
      // Full cleanup happens via enabled=false → cleanup()
      activeRef.current = false;
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    };
  }, [enabled]);

  return { status };
};
