import { useState, useRef } from 'react';
import { CameraView } from '../components/CameraView';
import { AuraCanvas } from '../components/AuraCanvas';
import { ProductBottomSheet } from '../components/ProductBottomSheet';
import { ErrorModal } from '../components/ErrorModal';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useScan } from '../hooks/useScan';
import { cropImage } from '../utils/cropImage';
import type { DetectedItem, ScanMode } from '../types/scan';

export function ScanPage() {
  const { scan, result, isLoading, error, reset } = useScan();
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<DetectedItem | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [scanMode, setScanMode] = useState<ScanMode>('ranking');
  const imageRef = useRef<HTMLImageElement>(null);

  const handleCapture = (file: File, mode: ScanMode) => {
    setScanMode(mode);
    setCapturedFile(file);
    setCapturedUrl(URL.createObjectURL(file));
    void scan(file, mode);
  };

  const handleItemSelect = async (item: DetectedItem) => {
    setSelectedItem(item);
    setIsSheetOpen(true);
    if (capturedFile) {
      const url = await cropImage(capturedFile, item.bounding_box);
      setCroppedImageUrl(url);
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
              ref={imageRef}
              src={capturedUrl}
              alt="撮影画像"
              onLoad={() => {
                if (imageRef.current) {
                  setImageDimensions({
                    width: imageRef.current.clientWidth,
                    height: imageRef.current.clientHeight,
                  });
                }
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0">
            <AuraCanvas
              items={result.detected_items}
              onItemSelect={(item) => {
                void handleItemSelect(item);
              }}
              width={imageDimensions.width}
              height={imageDimensions.height}
              mode={scanMode}
            />
          </div>

          {/* 戻るボタン */}
          <button
            onClick={handleBack}
            aria-label="もう一度撮る"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 px-6 min-h-13 rounded-full bg-sw-black/70 backdrop-blur-sm border border-sw-orange text-white font-body font-medium text-sm shadow-[0_0_20px_rgba(255,145,0,0.35)] active:scale-95 transition-transform duration-100 whitespace-nowrap"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            もう一度撮る
          </button>
        </div>
      )}

      <LoadingOverlay isLoading={isLoading} />

      {errorMessage && (
        <ErrorModal isOpen={true} message={errorMessage} onClose={handleErrorClose} />
      )}

      <ProductBottomSheet
        isOpen={isSheetOpen}
        item={selectedItem}
        croppedImageUrl={croppedImageUrl}
        onClose={handleSheetClose}
      />
    </div>
  );
}
