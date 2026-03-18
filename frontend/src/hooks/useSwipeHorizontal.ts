import { useRef, useCallback } from 'react';

const DEFAULT_THRESHOLD = 50;

type Options = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
};

type UseSwipeHorizontalReturn = {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
};

export function useSwipeHorizontal({
  onSwipeLeft,
  onSwipeRight,
  threshold = DEFAULT_THRESHOLD,
}: Options): UseSwipeHorizontalReturn {
  const startXRef = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (startXRef.current === null) return;
      const delta = e.changedTouches[0].clientX - startXRef.current;
      startXRef.current = null;

      if (Math.abs(delta) < threshold) return;
      if (delta < 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    },
    [onSwipeLeft, onSwipeRight, threshold]
  );

  return { onTouchStart, onTouchEnd };
}
