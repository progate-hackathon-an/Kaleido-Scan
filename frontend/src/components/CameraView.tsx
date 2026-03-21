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
// タブセレクターの padding (p-1 = 4px) と pill 間の gap (gap-1 = 4px)
const PILL_PADDING = 4;
const PILL_GAP = 4;
// コンテナ幅から pill 幅を算出する際に引く合計オフセット: 左右padding + (TAB_COUNT-1)個のgap
const PILL_TOTAL_INSET = PILL_PADDING * 2 + PILL_GAP * (TAB_COUNT - 1);
const PILL_SPRING_TRANSITION = 'transform 300ms cubic-bezier(0.34,1.56,0.64,1)';

type Props = {
  onCapture: (file: File, mode: ScanMode) => void;
  isScanning?: boolean;
};

export function CameraView({ onCapture, isScanning = false }: Props) {
  const { videoRef, isReady, startCamera, capturePhoto } = useCamera();
  const [activeMode, setActiveMode] = useState<ScanMode>('ranking');
  const [isDragging, setIsDragging] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  // ref でも保持しておき、touchend 時に stale closure を避ける
  const dragXRef = useRef(0);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  // ピル要素を ref で直接操作してドラッグ追従の再レンダーを回避する
  const pillRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

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

      // ピル要素の transform を rAF 経由で直接更新し、React の再レンダーをスキップする
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const pill = pillRef.current;
        if (pill) {
          pill.style.transform = `translateX(calc(${activeModeIndex} * (100% + ${PILL_GAP}px) + ${dragXRef.current}px))`;
        }
        rafRef.current = null;
      });
    },
    [activeModeIndex]
  );

  // activeModeIndex が変わらない場合 React は vdom 差分なしと判断し transform を更新しない。
  // rAF が動かした DOM 要素を直接元位置に戻すヘルパー。
  const resetPillPosition = useCallback((index: number) => {
    const pill = pillRef.current;
    if (!pill) return;
    pill.style.transition = PILL_SPRING_TRANSITION;
    pill.style.transform = `translateX(calc(${index} * (100% + ${PILL_GAP}px)))`;
  }, []);

  // touchend / touchcancel 共通のドラッグ状態リセット
  const resetDrag = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    dragXRef.current = 0;
    touchStartXRef.current = null;
    // isDragging を false にすると React が再レンダーし、JSX 側の transform と transition を復元する
    setIsDragging(false);
  }, []);

  const onTouchEnd = useCallback(() => {
    const delta = dragXRef.current;
    resetDrag();

    if (Math.abs(delta) < SWIPE_THRESHOLD) {
      resetPillPosition(activeModeIndex);
      return;
    }

    // コンテナ幅からピル1ステップ分のピクセル数を算出し、移動ステップ数を決定する
    const containerWidth = tabContainerRef.current?.offsetWidth ?? 0;
    const stepWidth =
      containerWidth > 0
        ? (containerWidth - PILL_TOTAL_INSET) / TAB_COUNT + PILL_GAP
        : SWIPE_THRESHOLD * 2;
    const steps = Math.min(Math.max(1, Math.round(Math.abs(delta) / stepWidth)), TAB_COUNT - 1);

    const newIndex =
      delta > 0
        ? Math.min(activeModeIndex + steps, TAB_COUNT - 1)
        : Math.max(activeModeIndex - steps, 0);
    const tab = TABS[newIndex];
    if (tab) setActiveMode(tab.mode);
  }, [activeModeIndex, resetDrag, resetPillPosition]);

  // OS によるジェスチャーキャンセル時もドラッグ状態をリセットする（タブ切替は行わない）
  const onTouchCancel = useCallback(() => {
    resetPillPosition(activeModeIndex);
    resetDrag();
  }, [activeModeIndex, resetDrag, resetPillPosition]);

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
      onTouchCancel={onTouchCancel}
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
              ref={pillRef}
              aria-hidden="true"
              className="absolute top-1 bottom-1 rounded-full bg-white"
              style={{
                left: `${PILL_PADDING}px`,
                width: `calc((100% - ${PILL_TOTAL_INSET}px) / ${TAB_COUNT})`,
                transform: `translateX(calc(${activeModeIndex} * (100% + ${PILL_GAP}px)))`,
                transition: isDragging ? 'none' : PILL_SPRING_TRANSITION,
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
