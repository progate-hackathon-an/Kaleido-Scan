import { renderHook, act } from '@testing-library/react';
import { useSwipeHorizontal } from './useSwipeHorizontal';

const makeTouchStartEvent = (clientX: number) =>
  ({ touches: [{ clientX }] }) as unknown as React.TouchEvent;

const makeTouchEndEvent = (clientX: number) =>
  ({ touches: [], changedTouches: [{ clientX }] }) as unknown as React.TouchEvent;

describe('useSwipeHorizontal', () => {
  it('TestUseSwipeHorizontal_SwipeLeft: 左スワイプで onSwipeLeft が呼ばれること', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipeHorizontal({ onSwipeLeft, onSwipeRight }));

    act(() => result.current.onTouchStart(makeTouchStartEvent(300)));
    act(() => result.current.onTouchEnd(makeTouchEndEvent(200)));

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('TestUseSwipeHorizontal_SwipeRight: 右スワイプで onSwipeRight が呼ばれること', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipeHorizontal({ onSwipeLeft, onSwipeRight }));

    act(() => result.current.onTouchStart(makeTouchStartEvent(200)));
    act(() => result.current.onTouchEnd(makeTouchEndEvent(300)));

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('TestUseSwipeHorizontal_BelowThreshold: 閾値未満のスワイプでは何も呼ばれないこと', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() =>
      useSwipeHorizontal({ onSwipeLeft, onSwipeRight, threshold: 50 })
    );

    act(() => result.current.onTouchStart(makeTouchStartEvent(300)));
    act(() => result.current.onTouchEnd(makeTouchEndEvent(270)));

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('TestUseSwipeHorizontal_NoStartEvent: touchstart なしで touchend しても何も呼ばれないこと', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipeHorizontal({ onSwipeLeft, onSwipeRight }));

    act(() => result.current.onTouchEnd(makeTouchEndEvent(100)));

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});
