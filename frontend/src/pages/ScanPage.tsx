import { useState, lazy, Suspense, useEffect } from 'react';

// AuraEffect は Canvas ベースのため重くはないが、スキャン成功後にのみ必要。遅延読み込みで初回起動を守る
const AuraEffect = lazy(() =>
  import('../components/AuraEffect').then((m) => ({ default: m.AuraEffect }))
);
import { Overlay } from '../components/Overlay';
import { CameraView } from '../components/CameraView';
import { AuraCanvas } from '../components/AuraCanvas';
import { TapHints } from '../components/TapHints';
import { ProductBottomSheet } from '../components/ProductBottomSheet';
import { ErrorModal } from '../components/ErrorModal';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useScan } from '../hooks/useScan';
import { cropImage } from '../utils/cropImage';
import { MOCK_SCAN_RESULT } from '../fixtures/mockScanResult';
import type { DetectedItem, ScanMode } from '../types/scan';

// ?demo=1 が付いていれば全5レベルのモックデータで起動する（デザイン確認用）
const IS_DEMO = new URLSearchParams(window.location.search).get('demo') === '1';
// ?fixture=1 → /fixture.jpeg, ?fixture=2 → /fixture2.jpeg を実際のAPIに送信する（開発・動作確認用）
const _FIXTURE_MAP: Record<string, string> = {
  '1': 'fixture.jpeg',
  '2': 'fixture2.jpeg',
  '3': 'fixture3.jpeg',
};
const FIXTURE_FILENAME =
  _FIXTURE_MAP[new URLSearchParams(window.location.search).get('fixture') ?? ''] ?? null;

export function ScanPage() {
  const { scan, result: scanResult, isLoading, error, reset } = useScan();
  const result = IS_DEMO ? MOCK_SCAN_RESULT : scanResult;
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<DetectedItem | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [scanMode, setScanMode] = useState<ScanMode>('ranking');
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [auraCanvas, setAuraCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isRetakeConfirmOpen, setIsRetakeConfirmOpen] = useState(false);

  const handleCapture = (file: File, mode: ScanMode) => {
    setScanMode(mode);
    setCapturedFile(file);
    setCapturedUrl(URL.createObjectURL(file));
    void scan(file, mode);
  };

  useEffect(() => {
    if (!FIXTURE_FILENAME) return;
    void (async () => {
      try {
        const res = await fetch(`/${FIXTURE_FILENAME}`);
        if (!res.ok) {
          // fixture 画像が取得できない場合はスキャンを実行しない
          // eslint-disable-next-line no-console
          console.error(
            `Failed to load /${FIXTURE_FILENAME} for fixture mode:`,
            res.status,
            res.statusText
          );
          return;
        }
        const blob = await res.blob();
        const file = new File([blob], FIXTURE_FILENAME, { type: 'image/jpeg' });
        handleCapture(file, 'ranking');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Error while loading /${FIXTURE_FILENAME} for fixture mode:`, e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleItemSelect = (item: DetectedItem) => {
    setSelectedItem(item);
    setCroppedImageUrl(null);
    setIsSheetOpen(true);
    if (capturedFile) {
      void cropImage(capturedFile, item.bounding_box).then(setCroppedImageUrl);
    }
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedItem(null);
    setCroppedImageUrl(null);
  };

  const handleBack = () => {
    reset();
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedFile(null);
    setCapturedUrl(null);
    setBackgroundImage(null);
  };

  const handleErrorClose = () => {
    handleBack();
  };

  const isNoItemDetected = result !== null && result.detected_items.length === 0;
  const errorMessage = error ?? (isNoItemDetected ? '商品が検出できませんでした' : null);

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {!result ? (
        <CameraView onCapture={handleCapture} isScanning={isLoading} />
      ) : (
        <div className="relative w-full h-full">
          {capturedUrl && (
            <img
              ref={setBackgroundImage}
              src={capturedUrl}
              alt="撮影画像"
              onLoad={(e) => {
                const img = e.currentTarget;
                setImageDimensions({ width: img.clientWidth, height: img.clientHeight });
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* Canvas オーラ（遅延読み込み / pointer-events: none） */}
          <Suspense fallback={null}>
            <AuraEffect items={result.detected_items} mode={scanMode} imageUrl={capturedUrl} />
          </Suspense>

          {/* クリック検知専用Canvas（視覚描画は AuraEffect が担当） */}
          <div className="absolute inset-0">
            <AuraCanvas
              ref={setAuraCanvas}
              items={result.detected_items}
              onItemSelect={handleItemSelect}
              width={imageDimensions.width}
              height={imageDimensions.height}
            />
          </div>

          {/* タップ誘導アイコン */}
          <TapHints items={result.detected_items} />

          {/* 撮り直しボタン */}
          <button
            onClick={() => setIsRetakeConfirmOpen(true)}
            aria-label="撮り直し確認を開く"
            aria-haspopup="dialog"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center w-12 h-12 rounded-full bg-sw-black/70 backdrop-blur-sm border border-sw-orange text-white shadow-[0_0_20px_rgba(255,145,0,0.35)] active:scale-95 transition-transform duration-100"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
            </svg>
          </button>
        </div>
      )}

      <LoadingOverlay isLoading={isLoading} capturedUrl={capturedUrl} />

      {errorMessage && (
        <ErrorModal isOpen={true} message={errorMessage} onClose={handleErrorClose} />
      )}

      {isRetakeConfirmOpen && (
        <Overlay>
          <div
            className="mx-6 w-full max-w-sm rounded-2xl bg-sw-steel p-6 flex flex-col gap-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="retake-confirm-title"
            aria-describedby="retake-confirm-description"
          >
            <div className="flex flex-col gap-2 text-center">
              <p id="retake-confirm-title" className="font-body text-white text-base font-medium">
                撮り直しますか？
              </p>
              <p id="retake-confirm-description" className="font-body text-slate-200 text-sm">
                現在の結果は失われます
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsRetakeConfirmOpen(false)}
                className="flex-1 h-11 rounded-full border border-white/40 text-slate-300 font-body text-sm active:scale-95 transition-transform duration-100"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  setIsRetakeConfirmOpen(false);
                  handleBack();
                }}
                className="flex-1 h-11 rounded-full bg-sw-orange text-sw-black font-body font-semibold text-sm shadow-[0_0_16px_rgba(255,145,0,0.4)] active:scale-95 transition-transform duration-100"
              >
                撮り直す
              </button>
            </div>
          </div>
        </Overlay>
      )}

      <ProductBottomSheet
        isOpen={isSheetOpen}
        item={selectedItem}
        croppedImageUrl={croppedImageUrl}
        onClose={handleSheetClose}
        canvas={auraCanvas}
        items={result?.detected_items ?? []}
        backgroundImage={backgroundImage}
        mode={scanMode}
      />
    </div>
  );
}
