import { render, screen } from '@testing-library/react';
import { LoadingOverlay } from './LoadingOverlay';
import { getNextPosition } from './loadingOverlayUtils';

describe('LoadingOverlay', () => {
  it('TestLoadingOverlay_ShowWhileLoading: isLoading=trueでローディング要素が表示されること', () => {
    render(<LoadingOverlay isLoading={true} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('isLoading=falseで非表示になること', () => {
    render(<LoadingOverlay isLoading={false} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('getNextPosition', () => {
  const RETICLE_SIZE = 112;
  const viewport = { w: 390, h: 844 };
  const maxX = viewport.w - RETICLE_SIZE;
  const maxY = viewport.h - RETICLE_SIZE;

  it('返却座標が可動範囲内に収まること', () => {
    const current = { x: 0, y: 0 };
    for (let i = 0; i < 20; i++) {
      const next = getNextPosition(current, viewport);
      expect(next.x).toBeGreaterThanOrEqual(0);
      expect(next.x).toBeLessThanOrEqual(maxX);
      expect(next.y).toBeGreaterThanOrEqual(0);
      expect(next.y).toBeLessThanOrEqual(maxY);
    }
  });

  it('移動距離が min(縦幅, 横幅) 以上であること', () => {
    const minDist = Math.min(Math.min(viewport.w, viewport.h), Math.hypot(maxX, maxY));
    const current = { x: maxX / 2, y: maxY / 2 };
    for (let i = 0; i < 20; i++) {
      const next = getNextPosition(current, viewport);
      const dist = Math.hypot(next.x - current.x, next.y - current.y);
      expect(dist).toBeGreaterThanOrEqual(minDist);
    }
  });

  it('画面がレティクルより小さい(maxX=maxY=0)でもクラッシュせず(0,0)を返すこと', () => {
    const tinyViewport = { w: RETICLE_SIZE, h: RETICLE_SIZE };
    const next = getNextPosition({ x: 0, y: 0 }, tinyViewport);
    expect(next).toEqual({ x: 0, y: 0 });
  });
});
