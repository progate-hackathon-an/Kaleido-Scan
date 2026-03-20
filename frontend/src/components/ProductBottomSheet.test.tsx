import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ProductBottomSheet } from './ProductBottomSheet';
import type { DetectedItem } from '../types/scan';

const mockItem: DetectedItem = {
  product_id: '11111111-1111-1111-1111-111111111111',
  name: '味付海苔　炭火焼紅しゃけ',
  description: '炭火で香ばしく焼き上げた紅しゃけを中の具にした手巻おにぎり。',
  category: 'food',
  rank: 1,
  total_quantity: 12500,
  aura_level: 5,
  bounding_box: { x_min: 0.1, y_min: 0.2, x_max: 0.4, y_max: 0.7 },
};

describe('ProductBottomSheet', () => {
  it('TestProductBottomSheet_ShowOnOpen: isOpen=trueで商品名・ランクバッジが表示されること', () => {
    render(
      <ProductBottomSheet isOpen={true} item={mockItem} croppedImageUrl={null} onClose={vi.fn()} />
    );

    // 全角スペースを含む商品名はデフォルトの正規化をオフにして照合する
    expect(
      screen.getByText('味付海苔　炭火焼紅しゃけ', { normalizer: (s) => s })
    ).toBeInTheDocument();
    // aria-label はスクリーンリーダー向けの自然な読み上げ
    expect(screen.getByLabelText('Rank 1')).toBeInTheDocument();
    // 序数表示がレンダーされていること（aria-hidden のため getByText で取得）
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('st')).toBeInTheDocument();
  });

  it('TestProductBottomSheet_HideOnClose: isOpen=falseで非表示になること', () => {
    render(
      <ProductBottomSheet isOpen={false} item={mockItem} croppedImageUrl={null} onClose={vi.fn()} />
    );

    expect(screen.queryByText('味付海苔　炭火焼紅しゃけ')).not.toBeInTheDocument();
  });

  it('TestProductBottomSheet_RankBadgeColor_HiddenGems: hidden-gemsモードではエメラルドカラーが適用されること', () => {
    render(
      <ProductBottomSheet
        isOpen={true}
        item={mockItem}
        croppedImageUrl={null}
        onClose={vi.fn()}
        mode="hidden-gems"
      />
    );

    const badge = screen.getByLabelText('Rank 1');
    // hidden-gems Lv5 のカラーは #00E676（エメラルド）
    expect(badge).toHaveStyle({ boxShadow: '0 0 12px #00E67633' });
  });
});
