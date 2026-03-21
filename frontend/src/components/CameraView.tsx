import { useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useCamera } from '../hooks/useCamera';
import { ShutterButton } from './ShutterButton';
import type { ScanMode } from '../types/scan';

type Tab = { label: string; mode: ScanMode };

const TABS: Tab[] = [
  { label: '掘り出しもの', mode: 'hidden-gems' },
  { label: '売り上げ', mode: 'ranking' },
  { label: '急上昇', mode: 'trending' },
];

const TAB_COUNT = TABS.length;
const SWIPE_THRESHOLD = 50;

type Props = {
  onCapture: (file: File, mode: ScanMode) => void;
  isScanning?: boolean;
};

export function CameraView({ onCapture, isScanning = false }: Props) {
  const { videoRef, isReady, startCamera, capturePhoto } = useCamera();
  const [activeMode, setActiveMode] = useState<ScanMode>('ranking');
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  // ref でも保持しておき、touchend 時に stale closure を避ける
  const dragXRef = useRef(0);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void startCamera();
    // startCamera はマウント時の一度だけ呼べばよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeModeIndex = TABS.findIndex((t) => t.mode === activeMode);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartXRef.current === null) return;
      let delta = e.touches[0].clientX - touchStartXRef.current;
      // 端のタブで引っ張ったときはゴムバンド効果（1/3に減衰）
      if (activeModeIndex === 0 && delta < 0) delta /= 3;
      if (activeModeIndex === TAB_COUNT - 1 && delta > 0) delta /= 3;
      dragXRef.current = delta;
      setDragX(delta);
    },
    [activeModeIndex]
  );

  const onTouchEnd = useCallback(() => {
    const delta = dragXRef.current;
    setIsDragging(false);
    setDragX(0);
    dragXRef.current = 0;
    touchStartXRef.current = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD) return;

    // コンテナ幅からピル1ステップ分のピクセル数を算出し、移動ステップ数を決定する
    // ピル幅 = (containerWidth - padding8 - gap8) / TAB_COUNT、ステップ = ピル幅 + gap4
    const containerWidth = tabContainerRef.current?.offsetWidth ?? 0;
    const stepWidth =
      containerWidth > 0 ? (containerWidth - 16) / TAB_COUNT + 4 : SWIPE_THRESHOLD * 2;
    const steps = Math.min(Math.max(1, Math.round(Math.abs(delta) / stepWidth)), TAB_COUNT - 1);

    const newIndex =
      delta > 0
        ? Math.min(activeModeIndex + steps, TAB_COUNT - 1)
        : Math.max(activeModeIndex - steps, 0);
    const tab = TABS[newIndex];
    if (tab) setActiveMode(tab.mode);
  }, [activeModeIndex]);

  const handleShutter = () => {
    const file = capturePhoto();
    if (file) onCapture(file, activeMode);
  };

  return (
    <div
      className="relative w-full h-dvh overflow-hidden bg-sw-black"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* カメラ映像 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 宇宙的な奥行き — 周辺を暗くするラジアルビネット */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(8,8,8,0.6) 100%)',
        }}
      />

      {/* 下部コントロールパネル */}
      <div
        className="absolute bottom-0 inset-x-0 flex flex-col items-center gap-6 pb-12 pt-6"
        style={{
          background: 'linear-gradient(to top, rgba(8,8,8,0.88) 0%, transparent 100%)',
        }}
      >
        {/* タブセレクター */}
        <div className="w-full flex justify-center">
          <div
            ref={tabContainerRef}
            className="relative flex items-center bg-sw-steel/80 backdrop-blur-sm rounded-full p-1 gap-1 w-[min(88vw,22rem)]"
          >
            {/* スライドするアクティブピル — ドラッグ中は指に追従し、離したらスナップ */}
            <div
              aria-hidden="true"
              className="absolute top-1 bottom-1 rounded-full bg-white"
              style={{
                left: '4px',
                width: `calc((100% - 16px) / ${TAB_COUNT})`,
                transform: `translateX(calc(${activeModeIndex} * (100% + 4px) + ${dragX}px))`,
                transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
            {TABS.map(({ label, mode }) => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={clsx(
                  'relative z-10 flex-1 py-2 rounded-full font-display font-medium text-base text-center min-h-11 transition-colors duration-200',
                  activeMode === mode
                    ? 'text-sw-black'
                    : 'text-slate-300 hover:text-white active:scale-95'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* シャッターボタン */}
        <ShutterButton onCapture={handleShutter} isReady={isReady} isScanning={isScanning} />
      </div>
    </div>
  );
}
