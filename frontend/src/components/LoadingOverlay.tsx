/** 外枠: ゲームHUD風の4コーナーブラケット */
function OuterFrame() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <span className="absolute top-0 left-0 w-12 h-12 border-t-[3px] border-l-[3px] border-sw-orange" />
      <span className="absolute top-0 right-0 w-12 h-12 border-t-[3px] border-r-[3px] border-sw-orange" />
      <span className="absolute bottom-0 left-0 w-12 h-12 border-b-[3px] border-l-[3px] border-sw-orange" />
      <span className="absolute bottom-0 right-0 w-12 h-12 border-b-[3px] border-r-[3px] border-sw-orange" />
    </div>
  );
}

/** Z軌道で動きながら回転する丸いレティクル照準 */
function MovingReticle() {
  return (
    <div className="absolute" style={{ animation: 'z-scan 3.5s ease-in-out infinite' }}>
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
};

export function LoadingOverlay({ isLoading }: Props) {
  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-10 z-50"
      style={{ background: 'radial-gradient(circle at center, #0f0800 0%, #080808 70%)' }}
      role="status"
      aria-label="解析中"
    >
      <div className="relative flex items-center justify-center w-72 h-72">
        <OuterFrame />
        <MovingReticle />
      </div>

      <div className="flex flex-col items-center gap-3">
        <h1
          className="font-display text-2xl font-bold tracking-widest"
          style={{
            background: 'linear-gradient(135deg, #ffb347 0%, #ff9100 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Kaleid Scan
        </h1>
        <p className="font-body text-slate-400 text-sm leading-relaxed">
          商品の「オーラ」を可視化しています...
        </p>
      </div>
    </div>
  );
}
