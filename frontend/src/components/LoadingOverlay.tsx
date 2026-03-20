import { useState, useEffect, useRef } from 'react';
import { getNextPosition, type Position } from './loadingOverlayUtils';

/** 外周ダッシュリング（ゆっくり逆回転）＋8方向ティック */
function OuterDashRing() {
  const ticks = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      deg,
      x1: 56 + 47 * Math.cos(rad),
      y1: 56 + 47 * Math.sin(rad),
      x2: 56 + 52 * Math.cos(rad),
      y2: 56 + 52 * Math.sin(rad),
    };
  });

  return (
    <svg
      className="absolute inset-0 animate-spin"
      viewBox="0 0 112 112"
      fill="none"
      aria-hidden="true"
      style={{ animationDuration: '12s', animationDirection: 'reverse' }}
    >
      <circle
        cx="56"
        cy="56"
        r="52"
        stroke="#ff9100"
        strokeOpacity="0.18"
        strokeWidth="1"
        strokeDasharray="3 9"
      />
      {ticks.map(({ deg, x1, y1, x2, y2 }) => (
        <line
          key={deg}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#ff9100"
          strokeOpacity="0.45"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/** メインアーク（時計回り、速い） */
function MainArc() {
  return (
    <svg
      className="absolute inset-0 animate-spin"
      viewBox="0 0 112 112"
      fill="none"
      aria-hidden="true"
      style={{ animationDuration: '2s' }}
    >
      <defs>
        <linearGradient id="reticle-main-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff9100" />
          <stop offset="100%" stopColor="#ff9100" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="56" cy="56" r="44" stroke="#1a0800" strokeWidth="2" />
      <circle
        cx="56"
        cy="56"
        r="44"
        stroke="url(#reticle-main-grad)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="100 176"
      />
    </svg>
  );
}

/** 短アーク（逆回転、中速） */
function SecondaryArc() {
  return (
    <svg
      className="absolute inset-0 animate-spin"
      viewBox="0 0 112 112"
      fill="none"
      aria-hidden="true"
      style={{ animationDuration: '1.4s', animationDirection: 'reverse' }}
    >
      <circle
        cx="56"
        cy="56"
        r="44"
        stroke="#ff9100"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.65"
        strokeDasharray="22 256"
      />
    </svg>
  );
}

/** 静的装飾: 内部Lブラケット・クロスヘア（中央gap付き）・中央ダイヤ */
function StaticDecor() {
  return (
    <svg className="absolute inset-0" viewBox="0 0 112 112" fill="none" aria-hidden="true">
      {/* 4隅のLブラケット（ターゲットロック風） */}
      <polyline
        points="36,46 36,36 46,36"
        stroke="#ff9100"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <polyline
        points="66,36 76,36 76,46"
        stroke="#ff9100"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <polyline
        points="36,66 36,76 46,76"
        stroke="#ff9100"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <polyline
        points="66,76 76,76 76,66"
        stroke="#ff9100"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      {/* クロスヘア（中央12px gap） */}
      <line x1="4" y1="56" x2="44" y2="56" stroke="#ff9100" strokeOpacity="0.55" strokeWidth="1" />
      <line
        x1="68"
        y1="56"
        x2="108"
        y2="56"
        stroke="#ff9100"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
      <line x1="56" y1="4" x2="56" y2="44" stroke="#ff9100" strokeOpacity="0.55" strokeWidth="1" />
      <line
        x1="56"
        y1="68"
        x2="56"
        y2="108"
        stroke="#ff9100"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
      {/* 中央ダイヤモンド */}
      <rect
        x="52"
        y="52"
        width="8"
        height="8"
        transform="rotate(45 56 56)"
        stroke="#ff9100"
        strokeWidth="1.5"
        fill="#ff9100"
        fillOpacity="0.15"
      />
    </svg>
  );
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

  // transform 1本でトランジションすることで transitionend が1回だけ発火し、片軸変化でも停止しない
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'transform') return;
    setPos((cur) => getNextPosition(cur));
  };

  return (
    <div
      ref={containerRef}
      className="absolute z-10"
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: 'transform 1.8s cubic-bezier(0.45, 0, 0.55, 1)',
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

      <div
        className="relative w-28 h-28"
        style={{ filter: 'drop-shadow(0 0 8px rgba(255,145,0,0.55))' }}
      >
        <OuterDashRing />
        <MainArc />
        <SecondaryArc />
        <StaticDecor />
        {/* 中央ピング */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-2.5 h-2.5">
            <span className="absolute inset-0 rounded-full bg-sw-orange/50 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-sw-orange" />
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
