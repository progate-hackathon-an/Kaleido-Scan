import type { ScanResponse } from '../types/scan';

/**
 * 全5レベルのオーラを同時確認するためのデモ用フィクスチャ。
 * URL に ?demo=1 を付与すると ScanPage で使用される。
 * 5品が画面全体にバランスよく配置される座標になっている。
 */
export const MOCK_SCAN_RESULT: ScanResponse = {
  detected_items: [
    {
      product_id: 'demo-lv5',
      name: '黄金の商品（1位）',
      description: '売上ランキング1位の大人気商品。黄金のオーラを纏う。',
      category: 'デモ',
      rank: 1,
      aura_level: 5,
      bounding_box: { x_min: 0.05, y_min: 0.05, x_max: 0.45, y_max: 0.35 },
    },
    {
      product_id: 'demo-lv4',
      name: '蒼炎の商品（2位）',
      description: '売上ランキング2位。蒼い電撃のオーラを放つ。',
      category: 'デモ',
      rank: 2,
      aura_level: 4,
      bounding_box: { x_min: 0.55, y_min: 0.05, x_max: 0.95, y_max: 0.35 },
    },
    {
      product_id: 'demo-lv3',
      name: '自然の商品（3位）',
      description: '売上ランキング3位。大地の緑炎が宿る。',
      category: 'デモ',
      rank: 3,
      aura_level: 3,
      bounding_box: { x_min: 0.25, y_min: 0.38, x_max: 0.75, y_max: 0.62 },
    },
    {
      product_id: 'demo-lv2',
      name: '神秘の商品（4位）',
      description: '売上ランキング4位。紫の神秘オーラが揺らめく。',
      category: 'デモ',
      rank: 4,
      aura_level: 2,
      bounding_box: { x_min: 0.05, y_min: 0.65, x_max: 0.45, y_max: 0.95 },
    },
    {
      product_id: 'demo-lv1',
      name: '余燼の商品（5位）',
      description: '売上ランキング5位。灰色の煙がたなびく。',
      category: 'デモ',
      rank: 5,
      aura_level: 1,
      bounding_box: { x_min: 0.55, y_min: 0.65, x_max: 0.95, y_max: 0.95 },
    },
  ],
};
