import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { AuraCanvas } from './AuraCanvas';
import type { DetectedItem } from '../types/scan';

const ITEM: DetectedItem = {
  product_id: 'p1',
  name: 'テスト商品',
  description: '',
  category: 'test',
  rank: 1,
  aura_level: 3,
  bounding_box: { x_min: 0.1, y_min: 0.1, x_max: 0.5, y_max: 0.5 },
};

describe('AuraCanvas', () => {
  it('TestAuraCanvas_Render: <canvas>要素が描画されること', () => {
    render(<AuraCanvas items={[]} onItemSelect={vi.fn()} />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('TestAuraCanvas_DebugBoundingBoxes: showBoundingBoxes=true のとき Canvas に描画が呼ばれること', () => {
    const strokeRectSpy = vi.fn();
    const fillRectSpy = vi.fn();
    const fillTextSpy = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      strokeRect: strokeRectSpy,
      fillRect: fillRectSpy,
      fillText: fillTextSpy,
      measureText: vi.fn().mockReturnValue({ width: 80 }),
    } as unknown as CanvasRenderingContext2D);

    render(
      <AuraCanvas
        items={[ITEM]}
        onItemSelect={vi.fn()}
        width={400}
        height={600}
        showBoundingBoxes={true}
      />
    );

    expect(strokeRectSpy).toHaveBeenCalledTimes(1);
    expect(fillRectSpy).toHaveBeenCalledTimes(2); // 塗りつぶし + ラベル背景
    expect(fillTextSpy).toHaveBeenCalledWith(
      'テスト商品 (Lv.3)',
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('TestAuraCanvas_NoBoundingBoxes: showBoundingBoxes=false（デフォルト）のとき描画が呼ばれないこと', () => {
    const strokeRectSpy = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      strokeRect: strokeRectSpy,
      fillRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 80 }),
    } as unknown as CanvasRenderingContext2D);

    render(<AuraCanvas items={[ITEM]} onItemSelect={vi.fn()} width={400} height={600} />);

    expect(strokeRectSpy).not.toHaveBeenCalled();
  });
});
