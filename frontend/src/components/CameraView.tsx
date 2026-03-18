import { useEffect, useState } from 'react';
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

type Props = {
  onCapture: (file: File, mode: ScanMode) => void;
  isScanning?: boolean;
};

export function CameraView({ onCapture, isScanning = false }: Props) {
  const { videoRef, isReady, startCamera, capturePhoto } = useCamera();
  const [activeMode, setActiveMode] = useState<ScanMode>('ranking');

  useEffect(() => {
    void startCamera();
    // startCamera はマウント時の一度だけ呼べばよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShutter = () => {
    const file = capturePhoto();
    if (file) onCapture(file, activeMode);
  };

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-sw-black">
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
          <div className="flex items-center bg-sw-steel/80 backdrop-blur-sm rounded-full p-1 gap-1">
            {TABS.map(({ label, mode }) => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={clsx(
                  'w-28 py-2 rounded-full font-body font-medium text-sm text-center transition-all duration-200 min-h-11',
                  activeMode === mode
                    ? 'bg-white text-sw-black'
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
