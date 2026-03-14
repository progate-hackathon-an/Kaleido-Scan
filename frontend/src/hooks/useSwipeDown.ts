import { useRef } from 'react';

const SWIPE_THRESHOLD_PX = 80;

export function useSwipeDown(onSwipe: () => void) {
  const startYRef = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const delta = e.changedTouches[0].clientY - startYRef.current;
    if (delta > SWIPE_THRESHOLD_PX) onSwipe();
    startYRef.current = null;
  };

  return { onTouchStart, onTouchEnd };
}
