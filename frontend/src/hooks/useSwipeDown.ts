import { useRef, useState, useCallback } from 'react';

type UseSwipeDownReturn = {
  dragY: number;
  isDragging: boolean;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
};

/**
 * @param onSwipe - 閾値を超えたときに呼ばれるコールバック
 * @param getThreshold - 閾値をピクセルで返す関数。呼び出しタイミングは onTouchEnd 時。
 *                       省略した場合は 120px 固定。
 */
export function useSwipeDown(
  onSwipe: () => void,
  getThreshold: () => number = () => 120
): UseSwipeDownReturn {
  const startYRef = useRef<number | null>(null);
  // Use a ref to read latest dragY in onTouchEnd without stale closure
  const dragYRef = useRef(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const delta = Math.max(0, e.touches[0].clientY - startYRef.current);
    dragYRef.current = delta;
    setDragY(delta);
  }, []);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragYRef.current > getThreshold()) {
      onSwipe();
    }
    dragYRef.current = 0;
    setDragY(0);
    startYRef.current = null;
  }, [onSwipe, getThreshold]);

  return { dragY, isDragging, onTouchStart, onTouchMove, onTouchEnd };
}
