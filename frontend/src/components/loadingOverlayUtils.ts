export const RETICLE_SIZE = 112; // w-28 = 7rem = 112px

export type Position = { x: number; y: number };

/** 現在位置から min(縦幅, 横幅) 以上離れた次の位置をランダムに返す（テスト用にviewportを注入可能） */
export function getNextPosition(
  current: Position,
  viewport = { w: window.innerWidth || 375, h: window.innerHeight || 667 }
): Position {
  const { w, h } = viewport;
  const maxX = Math.max(0, w - RETICLE_SIZE);
  const maxY = Math.max(0, h - RETICLE_SIZE);
  // 可動範囲の最大距離でクランプし、条件を満たせない状況を防ぐ
  const minDist = Math.min(Math.min(w, h), Math.hypot(maxX, maxY));

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    if (Math.hypot(x - current.x, y - current.y) >= minDist) return { x, y };
  }

  // フォールバック: 4隅のうち最も遠い頂点
  const corners: Position[] = [
    { x: 0, y: 0 },
    { x: maxX, y: 0 },
    { x: 0, y: maxY },
    { x: maxX, y: maxY },
  ];
  return corners.reduce((best, c) =>
    Math.hypot(c.x - current.x, c.y - current.y) >
    Math.hypot(best.x - current.x, best.y - current.y)
      ? c
      : best
  );
}
