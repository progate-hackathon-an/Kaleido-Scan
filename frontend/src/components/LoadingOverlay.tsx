/** ビューファインダーアイコン (四隅のブラケット) */
function ViewfinderIcon() {
  return (
    <div className="relative w-9 h-9">
      <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400" />
      <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-400" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-400" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400" />
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
      className="fixed inset-0 bg-sw-black flex flex-col items-center justify-center gap-10 z-50"
      role="status"
      aria-label="解析中"
    >
      {/* SVG スピナー + ビューファインダー */}
      <div className="relative flex items-center justify-center w-36 h-36">
        <svg
          className="absolute inset-0 animate-spin"
          viewBox="0 0 144 144"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="60%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* ベースリング */}
          <circle cx="72" cy="72" r="62" stroke="#1e293b" strokeWidth="5" />
          {/* グラデーション弧 */}
          <circle
            cx="72"
            cy="72"
            r="62"
            stroke="url(#spinner-grad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="240 150"
          />
        </svg>
        <ViewfinderIcon />
      </div>

      {/* テキスト */}
      <div className="flex flex-col items-center gap-3">
        <h1
          className="font-display text-2xl font-bold tracking-widest"
          style={{
            background: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)',
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
