import { useState, useRef } from 'react';
import { CameraView } from '../components/CameraView';
import { AuraCanvas } from '../components/AuraCanvas';
import { ProductBottomSheet } from '../components/ProductBottomSheet';
import { ErrorModal } from '../components/ErrorModal';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useScan } from '../hooks/useScan';
import { cropImage } from '../utils/cropImage';
import type { DetectedItem } from '../types/scan';

export function ScanPage() {
  const { scan, result, isLoading, error, reset } = useScan();
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<DetectedItem | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const handleCapture = (file: File) => {
    setCapturedFile(file);
    setCapturedUrl(URL.createObjectURL(file));
    void scan(file);
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

  const handleErrorClose = () => {
    reset();
    setCapturedFile(null);
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
  };

  const isNoItemDetected = result !== null && result.detected_items.length === 0;
  const errorMessage = error ?? (isNoItemDetected ? '商品が検出できませんでした' : null);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden' }}>
      {!result ? (
        <CameraView onCapture={handleCapture} />
      ) : (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          <div style={{ position: 'absolute', inset: 0 }}>
            <AuraCanvas
              items={result.detected_items}
              onItemSelect={(item) => {
                void handleItemSelect(item);
              }}
              width={imageDimensions.width}
              height={imageDimensions.height}
            />
          </div>
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
