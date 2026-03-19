import { render } from '@testing-library/react';
import { TapHints } from './TapHints';
import type { DetectedItem } from '../types/scan';

const makeItem = (
  id: string,
  name: string,
  x_min: number,
  x_max: number,
  y_max: number
): DetectedItem => ({
  product_id: id,
  name,
  description: '',
  category: '',
  aura_level: 3,
  bounding_box: { x_min, y_min: 0, x_max, y_max },
  rank: 1,
  total_quantity: 10,
});

describe('TapHints', () => {
  it('TestTapHints_RenderIconsForEachItem: 商品数分の虫眼鏡アイコンが描画されること', () => {
    const items = [
      makeItem('a', 'しゃけおにぎり', 0.1, 0.5, 0.6),
      makeItem('b', 'ツナマヨおにぎり', 0.5, 0.9, 0.7),
    ];
    const { container } = render(<TapHints items={items} />);

    const icons = container.querySelectorAll('svg');
    expect(icons).toHaveLength(2);
  });

  it('TestTapHints_NoLabelsWhenEmpty: 商品が0件のとき何も描画されないこと', () => {
    const { container } = render(<TapHints items={[]} />);

    expect(container.querySelector('[aria-hidden]')).not.toBeInTheDocument();
  });

  it('TestTapHints_PositionedAtBottomCenter: アイコンがbounding_boxの下部中央に配置されること', () => {
    const items = [makeItem('a', 'テスト', 0.2, 0.6, 0.8)];
    const { container } = render(<TapHints items={items} />);

    const el = container.querySelector('[style]') as HTMLElement;
    expect(el.style.left).toBe('40%'); // (x_min + x_max) / 2 = (0.2 + 0.6) / 2 = 0.4
    expect(el.style.top).toBe('80%'); // y_max = 0.8
  });
});
