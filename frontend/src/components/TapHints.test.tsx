import { render } from '@testing-library/react';
import { TapHints } from './TapHints';
import { computeLabelAnchors } from './tapHintsUtils';
import type { DetectedItem } from '../types/scan';

const makeItem = (
  id: string,
  name: string,
  x_min: number,
  x_max: number,
  y_min: number,
  y_max: number
): DetectedItem => ({
  product_id: id,
  name,
  description: '',
  category: '',
  aura_level: 3,
  bounding_box: { x_min, y_min, x_max, y_max },
  rank: 1,
});

describe('TapHints', () => {
  it('TestTapHints_RenderIconsForEachItem: 商品数分の虫眼鏡アイコンが描画されること', () => {
    const items = [
      makeItem('a', 'しゃけおにぎり', 0.1, 0.5, 0.3, 0.6),
      makeItem('b', 'ツナマヨおにぎり', 0.5, 0.9, 0.4, 0.7),
    ];
    const { container } = render(<TapHints items={items} />);

    const icons = container.querySelectorAll('svg');
    expect(icons).toHaveLength(2);
  });

  it('TestTapHints_NoLabelsWhenEmpty: 商品が0件のとき何も描画されないこと', () => {
    const { container } = render(<TapHints items={[]} />);

    expect(container.querySelector('[aria-hidden]')).not.toBeInTheDocument();
  });

  it('TestTapHints_LongNameNotTruncated: 長い商品名が省略されずに表示されること', () => {
    const longName = 'とても長い商品名のテスト商品テスト商品';
    const items = [makeItem('a', longName, 0.1, 0.5, 0.2, 0.6)];
    const { getByText } = render(<TapHints items={items} />);

    expect(getByText(longName)).toBeInTheDocument();
  });
});

describe('computeLabelAnchors', () => {
  it('TestComputeLabelAnchors_BottomCenter: bounding_box下部中央のクランプ付き left と top が計算されること', () => {
    // centerX = (0.2 + 0.6) / 2 = 0.4, y_max = 0.8 < 0.88
    const items = [makeItem('a', 'テスト', 0.2, 0.6, 0.3, 0.8)];
    const [anchor] = computeLabelAnchors(items);

    expect(anchor.left).toBe('clamp(8px, calc(40% - 80px), calc(100% - 168px))');
    expect(anchor.top).toBe('80%');
    expect(anchor.transform).toBe('translateY(-90%)');
  });

  it('TestComputeLabelAnchors_NearBottom_AboveBBox: y_maxが0.88超のときy_minを起点に配置されること', () => {
    const items = [makeItem('a', 'テスト商品', 0.2, 0.6, 0.7, 0.95)];
    const [anchor] = computeLabelAnchors(items);

    expect(anchor.top).toBe('70%'); // y_min = 0.7
    expect(anchor.transform).toBe('translateY(-10%)');
  });

  it('TestComputeLabelAnchors_RightEdge_ClampedLeft: 右端に近いアイテムの left がクランプされること', () => {
    // centerX = (0.8 + 1.0) / 2 = 0.9 → preferred = calc(90% - 80px) → max clamp へ
    const items = [makeItem('a', 'テスト', 0.8, 1.0, 0.3, 0.6)];
    const [anchor] = computeLabelAnchors(items);

    expect(anchor.left).toBe('clamp(8px, calc(90% - 80px), calc(100% - 168px))');
  });

  it('TestComputeLabelAnchors_OverlappingLabels_StaggeredVertically: 水平方向が近いラベルは垂直にずれること', () => {
    // x中心がほぼ同じ (cx=0.5) で y_max が近い2アイテム
    const items = [
      makeItem('a', 'アイテムA', 0.2, 0.8, 0.5, 0.7),
      makeItem('b', 'アイテムB', 0.2, 0.8, 0.6, 0.75),
    ];
    const anchors = computeLabelAnchors(items);

    expect(anchors[0].top).not.toBe(anchors[1].top);
  });
});
