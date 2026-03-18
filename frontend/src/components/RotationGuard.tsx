import { useEffect, useState } from 'react';

type LandscapeType = 'landscape-primary' | 'landscape-secondary';

function supportsOrientationAPI(): boolean {
  return typeof screen !== 'undefined' && !!screen.orientation;
}

function getLandscapeType(): LandscapeType | null {
  // タッチデバイス以外（PC等）は対象外
  if (!window.matchMedia?.('(pointer: coarse)').matches) return null;

  // Screen Orientation API 対応環境
  if (supportsOrientationAPI()) {
    const type = screen.orientation.type;
    if (type === 'landscape-primary' || type === 'landscape-secondary') return type;
    return null;
  }
  // フォールバック: matchMedia で横向きかのみ判定（方向不明のため primary 扱い）
  return window.matchMedia('(orientation: landscape)').matches ? 'landscape-primary' : null;
}

function useLandscapeType(): LandscapeType | null {
  const [landscapeType, setLandscapeType] = useState<LandscapeType | null>(getLandscapeType);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // デスクトップなどではリスナーを登録しない
    if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const orientation = window.screen?.orientation;
    if (!orientation || !orientation.addEventListener) {
      return;
    }

    const handler = () => setLandscapeType(getLandscapeType());
    orientation.addEventListener('change', handler);

    return () => {
      orientation.removeEventListener('change', handler);
    };
  }, []);

  return landscapeType;
}

// landscape-primary  → スマホ上部が左 → 右回転（時計回り）で縦に戻る
// landscape-secondary → スマホ上部が右 → 左回転（反時計回り）で縦に戻る
function RotateIcon({ type }: { type: LandscapeType }) {
  const isClockwise = type === 'landscape-primary';

  return (
    <div className="flex flex-col items-center">
      {/* arrow-curved-svgrepo-com.svg をインライン化（反時計回りは左右反転） */}
      <svg
        viewBox="0 50 400 200"
        className="w-16 text-sw-orange"
        fill="none"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={isClockwise ? undefined : { transform: 'scaleX(-1)' }}
      >
        <path d="M35 262C160.529 140.938 328.006 207.285 361 215.518" />
        <path d="M343.69 143C355.23 190.289 361 214.681 361 216.177C361 218.421 327.488 234.13 312 258" />
      </svg>

      {/* smartphone.svg のパスをインライン化（fill → currentColor） */}
      <svg
        viewBox="0 0 512 512"
        className="h-16 w-16 text-sw-orange"
        fill="currentColor"
        aria-hidden="true"
        style={{ transform: isClockwise ? 'rotate(-90deg)' : 'rotate(90deg)' }}
      >
        <path
          d="M358.938,0H153.078c-19.734,0-35.875,16.141-35.875,35.859v440.266c0,19.734,16.141,35.875,35.875,35.875
          h205.859c19.719,0,35.859-16.141,35.859-35.875V35.859C394.797,16.141,378.656,0,358.938,0z M229.844,22.156h52.297
          c1.656,0,2.984,1.344,2.984,3s-1.328,2.969-2.984,2.984h-52.297c-1.656,0-3-1.313-3-2.969S228.188,22.156,229.844,22.156z
          M256.016,490.328c-8.922,0-16.203-7.25-16.203-16.188s7.281-16.156,16.203-16.156s16.141,7.219,16.141,16.156
          S264.938,490.328,256.016,490.328z M358.938,429.75H153.078V56.547h205.859V429.75z"
        />
      </svg>
    </div>
  );
}

export function RotationGuard() {
  const landscapeType = useLandscapeType();

  if (!landscapeType) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="画面を縦向きにしてください"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-8 bg-sw-black"
    >
      <div className="animate-pulse">
        <RotateIcon type={landscapeType} />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-display text-lg tracking-widest text-sw-orange">ROTATE DEVICE</p>
        <p className="font-body text-sm text-slate-400">縦向きでご利用ください</p>
      </div>
    </div>
  );
}
