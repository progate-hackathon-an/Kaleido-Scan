import { useEffect, useRef, useState } from 'react';
import type { DetectedItem } from '../types/scan';
import { useSwipeDown } from '../hooks/useSwipeDown';

type Props = {
  isOpen: boolean;
  item: DetectedItem | null;
  croppedImageUrl: string | null;
  onClose: () => void;
};

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function ProductBottomSheet({ isOpen, item, croppedImageUrl, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // シートの高さを state で管理し、レンダー中に ref を直接読まないようにする
  const [sheetHeight, setSheetHeight] = useState(200);
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSheetHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen]); // isOpen が変わるたびに再測定

  const dismissThreshold = () => sheetHeight / 2;

  const { dragY, isDragging, onTouchStart, onTouchMove, onTouchEnd } = useSwipeDown(
    onClose,
    dismissThreshold
  );

  // Entry animation: start below viewport, slide up on mount
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setIsMounted(isOpen));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  if (!isOpen || !item) return null;

  // Sheet transform: enter from bottom (100%), rest at 0, follow finger during drag
  const sheetTranslateY = isMounted ? `${Math.max(0, dragY)}px` : '100%';
  const sheetTransition = isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';

  // Backdrop fades out proportionally as user drags (relative to sheet height)
  const backdropOpacity = Math.max(0, 0.6 * (1 - dragY / sheetHeight));

  const handleShare = () => {
    if (navigator.share) {
      void navigator.share({ title: item.name, text: item.description });
    }
  };

  return (
    <>
      {/* Dimmed backdrop — taps to close, fades as sheet drags down */}
      <div
        className="fixed inset-0 z-30 bg-sw-black"
        style={{ opacity: backdropOpacity, transition: isDragging ? 'none' : 'opacity 0.35s ease' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-40"
        style={{
          transform: `translateY(${sheetTranslateY})`,
          transition: sheetTransition,
          touchAction: 'none',
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onTouchStart(e);
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
          onTouchMove(e);
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          onTouchEnd();
        }}
      >
        <div
          ref={sheetRef}
          className="bg-sw-steel rounded-t-3xl px-6 pt-5 pb-12 flex flex-col gap-6"
        >
          {/* Drag handle + close button */}
          <div className="relative flex justify-center items-center py-2">
            {/* Handle bar — indicates swipe-to-dismiss */}
            <div
              className="w-10 h-1.5 rounded-full bg-slate-500"
              aria-label="下にスワイプして閉じる"
            />
            <button
              onClick={onClose}
              aria-label="閉じる"
              className="absolute right-0 w-11 h-11 mt-0.5 flex items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white active:scale-95 transition-all duration-100"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Header: product name + rank badge */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl text-white font-bold leading-tight">{item.name}</h2>
            <span className="shrink-0 font-body text-xs text-slate-300 bg-sw-black/70 px-3 py-1.5 rounded-full border border-slate-600">
              Rank {item.rank}
            </span>
          </div>

          {/* Product image */}
          {croppedImageUrl && (
            <div className="bg-sw-black rounded-2xl overflow-hidden">
              <img src={croppedImageUrl} alt={item.name} className="w-full object-cover max-h-52" />
            </div>
          )}

          {/* Product description */}
          <div className="bg-sw-black/50 rounded-2xl p-4">
            <p className="font-body text-slate-300 text-sm leading-relaxed">{item.description}</p>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            aria-label="商品を共有する"
            className="w-full bg-white text-sw-black font-body font-medium rounded-full py-4 min-h-14 flex items-center justify-center gap-2 active:scale-95 transition-transform duration-100"
          >
            <XIcon />
            共有する
          </button>
        </div>
      </div>
    </>
  );
}
