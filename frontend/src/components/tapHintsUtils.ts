import type { DetectedItem } from '../types/scan';

const LABEL_W_PX = 160; // max-w-40 = 10rem
const SCREEN_MARGIN_PX = 8;
// 撮り直しボタン: bottom-8(32px) + h-12(48px) + gap(8px) = 88px ≒ 画面高さの約10%
const RETAKE_BTN_ZONE_THRESHOLD = 0.88;
// ラベル1行の推定高さ: text-xs(12px) + py-1.5(12px) ≒ 24px → 5%程度 (812pxスクリーン基準)
const LABEL_H_FRACTION = 0.05;
// 水平方向の重複判定幅: LABEL_W_PX / 典型的なスクリーン幅(390px) ≒ 0.41
const LABEL_X_OVERLAP_THRESHOLD = 0.42;

export type LabelAnchor = {
  left: string;
  top: string;
  transform: string;
};

/**
 * 全アイテムのラベル配置を計算する。
 * - 画面端クランプ: CSS clamp() でラベルが画面外に出ないよう制御
 * - ボタン回避: y_max が撮り直しボタン領域に近い場合はバウンディングボックス上部に配置
 * - ラベル重複回避: y_max 昇順で配置し、近接ラベルを上方向にずらす
 */
export function computeLabelAnchors(items: DetectedItem[]): LabelAnchor[] {
  // y_max 昇順でインデックス付きソート（上のアイテムから先に配置）
  const indexed = items.map((item, idx) => ({ item, idx }));
  indexed.sort((a, b) => a.item.bounding_box.y_max - b.item.bounding_box.y_max);

  const placed: Array<{ cx: number; topFraction: number }> = [];
  const anchors: Array<LabelAnchor & { idx: number }> = [];

  for (const { item, idx } of indexed) {
    const cx = (item.bounding_box.x_min + item.bounding_box.x_max) / 2;
    const isNearBottom = item.bounding_box.y_max > RETAKE_BTN_ZONE_THRESHOLD;

    // アンカーY: 通常はバウンディングボックス下端、ボタン領域に近い場合は上端
    let topFraction = isNearBottom ? item.bounding_box.y_min : item.bounding_box.y_max;
    const translateY = isNearBottom ? 'translateY(-10%)' : 'translateY(-90%)';

    // 既配置ラベルとの重複チェック: 水平方向が近く かつ y が近い場合は上方向にずらす
    for (const p of placed) {
      const xOverlap = Math.abs(cx - p.cx) < LABEL_X_OVERLAP_THRESHOLD;
      const yOverlap = Math.abs(topFraction - p.topFraction) < LABEL_H_FRACTION;
      if (xOverlap && yOverlap) {
        topFraction = p.topFraction - LABEL_H_FRACTION;
      }
    }

    placed.push({ cx, topFraction });
    anchors.push({
      idx,
      // CSS clamp でラベルの左端を [margin, 100% - width - margin] にクランプ
      left: `clamp(${SCREEN_MARGIN_PX}px, calc(${cx * 100}% - ${LABEL_W_PX / 2}px), calc(100% - ${LABEL_W_PX + SCREEN_MARGIN_PX}px))`,
      top: `${topFraction * 100}%`,
      transform: translateY,
    });
  }

  // 元の順序に戻す
  anchors.sort((a, b) => a.idx - b.idx);
  return anchors;
}
