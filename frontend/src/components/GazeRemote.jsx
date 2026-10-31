/**
 * GazeRemote — Floating gaze-controlled navigation panel
 * Reads live gaze coordinates from window.__gazePos (published by useEyeTracking)
 * Supports: dwell-to-activate (2s), mouse click, drag to reposition
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useNavigate } from 'react-router-dom';

// ─── Constants ────────────────────────────────────────────────────────────────
const DWELL_MS     = 2000;   // 2-second gaze dwell to activate
const POLL_MS      = 40;     // gaze polling interval (25 fps)
const HIT_PADDING  = 20;     // extra hit padding around each button (px)

// ─── SVG Progress Ring ────────────────────────────────────────────────────────
const ProgressRing = ({ progress, color, size = 52 }) => {
  const r     = (size - 6) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = circ * progress;

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 pointer-events-none"
      style={{ transform: 'rotate(-90deg)' }}
    >
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={4}
      />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.05s linear' }}
      />
    </svg>
  );
};

// ─── Button config ────────────────────────────────────────────────────────────
const BUTTONS = [
  {
    id: 'up',
    label: '▲',
    title: 'Scroll Up',
    color: '#6366f1',
    gridArea: 'up',
  },
  {
    id: 'left',
    label: '◀',
    title: 'Go Back',
    color: '#f59e0b',
    gridArea: 'left',
  },
  {
    id: 'center',
    label: '●',
    title: 'Click / Select',
    color: '#10b981',
    gridArea: 'center',
  },
  {
    id: 'right',
    label: '▶',
    title: 'Go Forward',
    color: '#3b82f6',
    gridArea: 'right',
  },
  {
    id: 'down',
    label: '▼',
    title: 'Scroll Down',
    color: '#6366f1',
    gridArea: 'down',
  },
];

// ─── Helper: scroll ───────────────────────────────────────────────────────────
const doScroll = (px) => {
  const candidates = [
    document.querySelector('main'),
    document.querySelector('[class*="overflow"]'),
    document.documentElement,
  ];
  for (const el of candidates) {
    if (!el) continue;
    const s = window.getComputedStyle(el).overflowY;
    if ((s === 'auto' || s === 'scroll') && el.scrollHeight > el.clientHeight) {
      el.scrollBy({ top: px, behavior: 'smooth' });
      return;
    }
  }
  window.scrollBy({ top: px, behavior: 'smooth' });
};

// ─── Main component ───────────────────────────────────────────────────────────
const GazeRemote = () => {
  const { eyeTrackingEnabled } = useAccessibility();
  const navigate = useNavigate();

  // Panel position (draggable)
  const [pos, setPos]       = useState({ x: 24, y: window.innerHeight / 2 - 120 });
  const [dragging, setDragging] = useState(false);
  const dragOffset  = useRef({ x: 0, y: 0 });
  const panelRef    = useRef(null);

  // Per-button dwell progress [0..1]
  const [dwellMap, setDwellMap] = useState({});
  // Which button is currently gazed at
  const [gazedBtn, setGazedBtn] = useState(null);

  // Internal refs for the polling loop
  const buttonRects  = useRef({});  // { id: DOMRect }
  const dwellStart   = useRef({});   // { id: timestamp }
  const firedRef     = useRef({});   // { id: boolean } — prevent double-fire
  const pollRef      = useRef(null);
  const enabledRef   = useRef(eyeTrackingEnabled);

  useEffect(() => { enabledRef.current = eyeTrackingEnabled; }, [eyeTrackingEnabled]);

  // ── Action dispatcher ─────────────────────────────────────────────────────
  const executeAction = useCallback((id) => {
    switch (id) {
      case 'up':
        doScroll(-350);
        break;
      case 'down':
        doScroll(350);
        break;
      case 'left':
        navigate(-1);
        break;
      case 'right':
        navigate(1);
        break;
      case 'center': {
        // Click the element currently under the real gaze cursor (not the panel)
        const pos = window.__gazePos;
        if (pos) {
          // Temporarily hide the panel so elementFromPoint hits the page content
          if (panelRef.current) panelRef.current.style.visibility = 'hidden';
          const el = document.elementFromPoint(pos.x, pos.y);
          if (panelRef.current) panelRef.current.style.visibility = 'visible';
          if (el && el.closest) {
            const target = el.closest('a, button, [role="button"], input, select, textarea, [tabindex]');
            if (target && !target.disabled) {
              target.focus?.({ preventScroll: true });
              target.click?.();
            }
          }
        }
        break;
      }
      default: break;
    }
  }, [navigate]);

  // ── Measure button rects every frame (in case of drag) ────────────────────
  const measureRects = useCallback(() => {
    const newRects = {};
    BUTTONS.forEach(({ id }) => {
      const el = document.getElementById(`gaze-remote-btn-${id}`);
      if (el) newRects[id] = el.getBoundingClientRect();
    });
    buttonRects.current = newRects;
  }, []);

  // ── Gaze polling loop ─────────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollRef.current) return;

    pollRef.current = setInterval(() => {
      if (!enabledRef.current) return;

      const gaze = window.__gazePos;
      if (!gaze) return;

      measureRects();

      const now    = performance.now();
      let hit      = null;
      const newProgress = {};

      BUTTONS.forEach(({ id }) => {
        const rect = buttonRects.current[id];
        if (!rect) return;

        const inside =
          gaze.x >= rect.left - HIT_PADDING &&
          gaze.x <= rect.right + HIT_PADDING &&
          gaze.y >= rect.top  - HIT_PADDING &&
          gaze.y <= rect.bottom + HIT_PADDING;

        if (inside) {
          hit = id;
          if (!dwellStart.current[id]) {
            dwellStart.current[id] = now;
            firedRef.current[id] = false;
          }
          const elapsed = now - dwellStart.current[id];
          newProgress[id] = Math.min(elapsed / DWELL_MS, 1);

          if (elapsed >= DWELL_MS && !firedRef.current[id]) {
            firedRef.current[id] = true;
            executeAction(id);
            // Reset after fire
            setTimeout(() => {
              dwellStart.current[id] = null;
              firedRef.current[id]   = false;
              setDwellMap(prev => ({ ...prev, [id]: 0 }));
            }, 800);
          }
        } else {
          // Not gazed — clear dwell
          dwellStart.current[id] = null;
          firedRef.current[id]   = false;
          newProgress[id]        = 0;
        }
      });

      setGazedBtn(hit);
      setDwellMap(newProgress);
    }, POLL_MS);
  }, [executeAction, measureRects]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setDwellMap({});
    setGazedBtn(null);
  }, []);

  useEffect(() => {
    if (eyeTrackingEnabled) startPolling();
    else stopPolling();
    return stopPolling;
  }, [eyeTrackingEnabled, startPolling, stopPolling]);

  // ── Drag-to-move ──────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    // Only drag on the panel background (not on buttons)
    if (e.target.closest('button')) return;
    e.preventDefault();
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      setPos({
        x: Math.max(0, Math.min(window.innerWidth  - 140, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 220, e.clientY - dragOffset.current.y)),
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  // ── Touch drag support ────────────────────────────────────────────────────
  const onTouchStart = useCallback((e) => {
    if (e.target.closest('button')) return;
    const t = e.touches[0];
    setDragging(true);
    dragOffset.current = { x: t.clientX - pos.x, y: t.clientY - pos.y };
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const t = e.touches[0];
      setPos({
        x: Math.max(0, Math.min(window.innerWidth  - 140, t.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 220, t.clientY - dragOffset.current.y)),
      });
    };
    const onEnd = () => setDragging(false);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [dragging]);

  if (!eyeTrackingEnabled) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={panelRef}
      id="gaze-remote-panel"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{
        position: 'fixed',
        left: pos.x,
        top:  pos.y,
        zIndex: 9999990,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Glass panel */}
      <div
        style={{
          width: 140,
          background: 'rgba(15, 15, 30, 0.55)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRadius: 24,
          border: '1.5px solid rgba(255,255,255,0.18)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
          padding: '14px 10px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {/* Drag handle label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
          color: 'rgba(255,255,255,0.5)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 12 }}>👁️</span>
          Gaze Remote
        </div>

        {/* D-pad grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '44px 44px 44px',
            gridTemplateRows:    '44px 44px 44px',
            gridTemplateAreas: `
              ". up ."
              "left center right"
              ". down ."
            `,
            gap: 4,
          }}
        >
          {BUTTONS.map(({ id, label, title, color, gridArea }) => {
            const progress = dwellMap[id] || 0;
            const isGazed  = gazedBtn === id;
            const btnSize  = 44;

            return (
              <div
                key={id}
                style={{ gridArea, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <button
                  id={`gaze-remote-btn-${id}`}
                  title={title}
                  onClick={() => executeAction(id)}
                  style={{
                    position: 'relative',
                    width:  btnSize,
                    height: btnSize,
                    borderRadius: id === 'center' ? '50%' : 12,
                    border: `2px solid ${isGazed ? color : 'rgba(255,255,255,0.18)'}`,
                    background: isGazed
                      ? `rgba(${hexToRgb(color)}, 0.28)`
                      : 'rgba(255,255,255,0.07)',
                    color: isGazed ? color : 'rgba(255,255,255,0.7)',
                    fontSize: id === 'center' ? 16 : 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: isGazed
                      ? `0 0 18px rgba(${hexToRgb(color)}, 0.55), inset 0 1px 0 rgba(255,255,255,0.15)`
                      : 'inset 0 1px 0 rgba(255,255,255,0.08)',
                    transform: progress > 0.1 ? `scale(${1 + progress * 0.12})` : 'scale(1)',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    flexShrink: 0,
                  }}
                >
                  {/* Progress ring */}
                  {progress > 0 && (
                    <ProgressRing
                      progress={progress}
                      color={color}
                      size={btnSize}
                    />
                  )}

                  {/* Icon label */}
                  <span style={{ position: 'relative', zIndex: 1, lineHeight: 1 }}>
                    {label}
                  </span>

                  {/* Gaze highlight pulse */}
                  {isGazed && progress === 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        inset: -4,
                        borderRadius: id === 'center' ? '50%' : 14,
                        border: `2px solid ${color}`,
                        opacity: 0.5,
                        animation: 'gaze-pulse 1s ease-in-out infinite',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Action label */}
        <div style={{
          marginTop: 10,
          minHeight: 16,
          fontSize: 10,
          fontWeight: 600,
          color: gazedBtn
            ? BUTTONS.find(b => b.id === gazedBtn)?.color ?? 'rgba(255,255,255,0.5)'
            : 'rgba(255,255,255,0.3)',
          letterSpacing: '0.05em',
          textAlign: 'center',
          transition: 'color 0.2s',
          pointerEvents: 'none',
        }}>
          {gazedBtn ? BUTTONS.find(b => b.id === gazedBtn)?.title : 'Look at a button'}
        </div>

        {/* Dwell progress bar */}
        {gazedBtn && (dwellMap[gazedBtn] ?? 0) > 0 && (
          <div style={{
            marginTop: 6,
            width: '90%',
            height: 3,
            borderRadius: 99,
            background: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              borderRadius: 99,
              width: `${(dwellMap[gazedBtn] ?? 0) * 100}%`,
              background: BUTTONS.find(b => b.id === gazedBtn)?.color ?? '#6366f1',
              transition: 'width 0.05s linear',
            }} />
          </div>
        )}
      </div>

      {/* Pulse animation style */}
      <style>{`
        @keyframes gaze-pulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          50%  { transform: scale(1.18); opacity: 0.2; }
          100% { transform: scale(1);   opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

// ─── Helper: hex → r,g,b string ──────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default GazeRemote;
