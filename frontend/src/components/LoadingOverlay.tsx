import { useState, useEffect, useRef } from 'react';

const RETICLE_SIZE = 112; // w-28 = 7rem = 112px

type Position = { x: number; y: number };

/** 現在位置から対角線の半分以上離れた次の位置をランダムに返す */
function getNextPosition(current: Position): Position {
  const w = window.innerWidth || 375;
  const h = window.innerHeight || 667;
  const maxX = Math.max(0, w - RETICLE_SIZE);
  const maxY = Math.max(0, h - RETICLE_SIZE);
  const minDist = Math.min(w, h);

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    const dx = x - current.x;
    const dy = y - current.y;
    if (Math.sqrt(dx * dx + dy * dy) >= minDist) return { x, y };
  }

  // フォールバック: 4隅のうち最も遠い頂点
  const corners: Position[] = [
    { x: 0, y: 0 },
    { x: maxX, y: 0 },
    { x: 0, y: maxY },
    { x: maxX, y: maxY },
  ];
  return corners.reduce((best, c) => {
    const d = (c.x - current.x) ** 2 + (c.y - current.y) ** 2;
    const bd = (best.x - current.x) ** 2 + (best.y - current.y) ** 2;
    return d > bd ? c : best;
  });
}

/** 外枠: ゲームHUD風の4コーナーブラケット（画面全体をカバー） */
function OuterFrame() {
  return (
    <div className="absolute inset-0 z-10" aria-hidden="true">
      <span className="absolute top-0 left-0 w-12 h-12 border-t-[3px] border-l-[3px] border-sw-orange" />
      <span className="absolute top-0 right-0 w-12 h-12 border-t-[3px] border-r-[3px] border-sw-orange" />
      <span className="absolute bottom-0 left-0 w-12 h-12 border-b-[3px] border-l-[3px] border-sw-orange" />
      <span className="absolute bottom-0 right-0 w-12 h-12 border-b-[3px] border-r-[3px] border-sw-orange" />
    </div>
  );
}

/** ランダムな2点間をイージングで移動する丸いレティクル照準 */
function MovingReticle() {
  const [pos, setPos] = useState<Position>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPos((cur) => getNextPosition(cur)));
    return () => cancelAnimationFrame(frame);
  }, []);

  // CSS transition中の実際の描画位置をrAFで直接DOM更新（Reactレンダリングを回避）
  useEffect(() => {
    let rafId: number;
    const track = () => {
      if (containerRef.current && coordRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = String(Math.round(rect.left)).padStart(4, '0');
        const y = String(Math.round(rect.top)).padStart(4, '0');
        coordRef.current.textContent = `(${x}, ${y})`;
      }
      rafId = requestAnimationFrame(track);
    };
    rafId = requestAnimationFrame(track);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'left') return;
    setPos((cur) => getNextPosition(cur));
  };

  return (
    <div
      ref={containerRef}
      className="absolute z-10"
      style={{
        left: pos.x,
        top: pos.y,
        transition:
          'left 1.8s cubic-bezier(0.45, 0, 0.55, 1), top 1.8s cubic-bezier(0.45, 0, 0.55, 1)',
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* HUD座標表示（演出用・目立たせない） */}
      <div
        className="absolute bottom-0 left-full ml-2 font-display text-[7px] text-sw-orange tracking-widest leading-snug whitespace-nowrap"
        aria-hidden="true"
        ref={coordRef}
      >
        (0000, 0000)
      </div>

      <div className="relative w-28 h-28 animate-spin" style={{ animationDuration: '2s' }}>
        {/* 円リング */}
        <svg className="absolute inset-0" viewBox="0 0 112 112" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="moving-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff9100" />
              <stop offset="100%" stopColor="#ff9100" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="56" cy="56" r="50" stroke="#2a1500" strokeWidth="3" />
          <circle
            cx="56"
            cy="56"
            r="50"
            stroke="url(#moving-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="110 205"
          />
        </svg>

        {/* クロスヘア（太め） */}
        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-1 bg-sw-orange/80" />
        <span className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-1 bg-sw-orange/80" />
        <span className="absolute top-1 left-1/2 -translate-x-1/2 h-9 w-1 bg-sw-orange/80" />
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-9 w-1 bg-sw-orange/80" />

        {/* 中央サークル */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-3 h-3">
            <span className="absolute inset-0 rounded-full bg-sw-orange/40 animate-ping" />
            <span className="absolute inset-0 rounded-full border-2 border-sw-orange" />
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  isLoading: boolean;
  capturedUrl?: string | null;
};

export function LoadingOverlay({ isLoading, capturedUrl }: Props) {
  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={
        capturedUrl
          ? undefined
          : { background: 'radial-gradient(circle at center, #0f0800 0%, #080808 70%)' }
      }
      role="status"
      aria-label="解析中"
    >
      {capturedUrl && (
        <>
          <img
            src={capturedUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at center, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.92) 70%)',
            }}
            aria-hidden="true"
          />
        </>
      )}

      <OuterFrame />
      <MovingReticle />

      <div className="absolute bottom-16 left-0 right-0 z-10 flex flex-col items-center gap-3">
        <h1
          className="font-display text-2xl font-bold tracking-widest"
          style={{
            background: 'linear-gradient(135deg, #ffb347 0%, #ff9100 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Kaleido Scan
        </h1>
        <p className="font-body text-slate-200 text-sm leading-relaxed">
          商品の「オーラ」を可視化しています...
        </p>
      </div>
    </div>
  );
}
