import { render, screen, fireEvent } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { CameraView } from './CameraView';

vi.mock('../hooks/useCamera', () => ({
  useCamera: () => ({
    videoRef: { current: null },
    isReady: false,
    startCamera: vi.fn().mockResolvedValue(undefined),
    capturePhoto: vi.fn().mockReturnValue(null),
  }),
}));

// touchmove 内で rAF が使われるため同期実行にする
beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// タッチイベント用ヘルパー
const touch = (clientX: number) => ({ clientX });
const touchStart = (el: HTMLElement, x: number) =>
  fireEvent.touchStart(el, { touches: [touch(x)], changedTouches: [touch(x)] });
const touchMove = (el: HTMLElement, x: number) =>
  fireEvent.touchMove(el, { touches: [touch(x)], changedTouches: [touch(x)] });
const touchEnd = (el: HTMLElement, x: number) =>
  fireEvent.touchEnd(el, { touches: [], changedTouches: [touch(x)] });
const touchCancel = (el: HTMLElement) =>
  fireEvent.touchCancel(el, { touches: [], changedTouches: [] });

// アクティブなタブボタンかどうかを確認するヘルパー
const isActiveTab = (label: string) =>
  screen.getByText(label).closest('button')?.classList.contains('text-sw-black') ?? false;

describe('CameraView', () => {
  it('TestCameraView_RenderShutterButton: シャッターボタンが描画されること', () => {
    render(<CameraView onCapture={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'オーラを診断する' })).toBeInTheDocument();
  });

  it('TestCameraView_RenderTabs: 3つのモードタブが描画されること', () => {
    render(<CameraView onCapture={vi.fn()} />);
    expect(screen.getByText('掘り出しもの')).toBeInTheDocument();
    expect(screen.getByText('売り上げ')).toBeInTheDocument();
    expect(screen.getByText('急上昇')).toBeInTheDocument();
  });

  describe('ドラッグによるタブ切替', () => {
    it('TestCameraView_DragBelowThreshold_ModeUnchanged: 閾値(50px)未満のドラッグではモードが変わらないこと', () => {
      const { container } = render(<CameraView onCapture={vi.fn()} />);
      const view = container.firstChild as HTMLElement;

      touchStart(view, 200);
      touchMove(view, 240); // delta = +40px < 50
      touchEnd(view, 240);

      expect(isActiveTab('売り上げ')).toBe(true);
    });

    it('TestCameraView_DragRight_MovesToNextTab: 右ドラッグで次のタブに移動すること', () => {
      const { container } = render(<CameraView onCapture={vi.fn()} />);
      const view = container.firstChild as HTMLElement;

      touchStart(view, 200);
      touchMove(view, 260); // delta = +60px > 50
      touchEnd(view, 260);

      // ranking(1) → trending(2)
      expect(isActiveTab('急上昇')).toBe(true);
    });

    it('TestCameraView_DragLeft_MovesToPrevTab: 左ドラッグで前のタブに移動すること', () => {
      const { container } = render(<CameraView onCapture={vi.fn()} />);
      const view = container.firstChild as HTMLElement;

      touchStart(view, 200);
      touchMove(view, 140); // delta = -60px
      touchEnd(view, 140);

      // ranking(1) → hidden-gems(0)
      expect(isActiveTab('掘り出しもの')).toBe(true);
    });

    it('TestCameraView_LargeDrag_Moves2Steps: 大きなドラッグで2ステップ移動すること', () => {
      const { container } = render(<CameraView onCapture={vi.fn()} />);
      const view = container.firstChild as HTMLElement;

      // hidden-gems に移動してから右に大きくスワイプ
      fireEvent.click(screen.getByText('掘り出しもの'));

      touchStart(view, 100);
      touchMove(view, 280); // delta = +180px → round(180/100) = 2 steps
      touchEnd(view, 280);

      // hidden-gems(0) → trending(2)
      expect(isActiveTab('急上昇')).toBe(true);
    });

    it('TestCameraView_DragAtRightEdge_Clamped: 右端タブから右ドラッグしてもそのまま', () => {
      const { container } = render(<CameraView onCapture={vi.fn()} />);
      const view = container.firstChild as HTMLElement;

      fireEvent.click(screen.getByText('急上昇'));

      touchStart(view, 200);
      touchMove(view, 270);
      touchEnd(view, 270);

      expect(isActiveTab('急上昇')).toBe(true);
    });

    it('TestCameraView_TouchCancel_ModeUnchanged: touchcancel でモードが変わらないこと', () => {
      const { container } = render(<CameraView onCapture={vi.fn()} />);
      const view = container.firstChild as HTMLElement;

      touchStart(view, 200);
      touchMove(view, 270);
      touchCancel(view);

      expect(isActiveTab('売り上げ')).toBe(true);
    });
  });
});
