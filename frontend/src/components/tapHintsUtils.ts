import type { DetectedItem } from '../types/scan';

const LABEL_W_PX = 160; // max-w-40 = 10rem
// 撮り直しボタン: bottom-8(32px) + h-12(48px) + gap(8px) = 88px ≒ 画面高さの約10%
const RETAKE_BTN_ZONE_THRESHOLD = 0.88;
// ラベル2行分の推定高さ: text-xs(12px) + py-1.5(12px) × 2行 ≒ 48px → 10%程度 (480pxスクリーン基準)
// break-words で複数行になり得るため、多めに見積もる
const LABEL_H_FRACTION = 0.1;
// 水平方向の重複判定幅: LABEL_W_PX / 典型的なスクリーン幅(390px) ≒ 0.41
const LABEL_X_OVERLAP_THRESHOLD = 0.42;

export type LabelAnchor = {
  left: string;
  top: string;
  transform: string;
};

/**
 * 全アイテムのラベル配置を計算する。
 * - 画面端クランプ: CSS clamp() でラベル中心を [LABEL_W_PX/2, 100% - LABEL_W_PX/2] に収め、
 *   translateX(-50%) と組み合わせてラベル幅によらず画面外に出ないよう制御する
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

    // 密集時に連続してずらした結果、画面外(0未満)に出ないようガード
    topFraction = Math.max(0, topFraction);

    placed.push({ cx, topFraction });
    anchors.push({
      idx,
      // ラベル中心を clamp でクランプ + translateX(-50%) でセンタリング
      // → ラベル実幅によらず画面端に収まる（幅 max 160px なら端マージン = 80px）
      left: `clamp(${LABEL_W_PX / 2}px, ${cx * 100}%, calc(100% - ${LABEL_W_PX / 2}px))`,
      top: `${topFraction * 100}%`,
      transform: `translateX(-50%) ${translateY}`,
    });
  }

  // 元の順序に戻す
  anchors.sort((a, b) => a.idx - b.idx);
  return anchors;
}
