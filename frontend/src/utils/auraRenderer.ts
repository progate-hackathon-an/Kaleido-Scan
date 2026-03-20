import type { DetectedItem, ScanMode } from '../types/scan';

export type AuraConfig = {
  color: string;
  /** 炎の外縁グラデーション色: レベルごとの炎テーマカラー */
  flameColor: string;
  radius: number;
  opacity: number;
  /** 炎形状の回転速度 [rad/s]: 高順位ほど大きい値を設定する */
  rotationSpeed: number;
};

// ── fBm noise: ハッシュベースのValue Noise を4オクターブ重ねた有機的なノイズ ──
// Perlin/Simplex Noiseと同等の揺らぎをゼロ依存で実現する
function fract(x: number): number {
  return x - Math.floor(x);
}

function hash(n: number): number {
  return fract(Math.sin(n) * 43758.5453123);
}

// smoothstep補間された1Dバリューノイズ: 戻り値は [0, 1]
function valueNoise(t: number): number {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3.0 - 2.0 * f);
  return hash(i) + (hash(i + 1) - hash(i)) * u;
}

// 4オクターブのfBm: 戻り値は概ね [-1, 1]
function fbm(t: number): number {
  let value = 0.0;
  let amplitude = 0.5;
  let frequency = 1.0;
  for (let o = 0; o < 4; o++) {
    value += valueNoise(t * frequency) * amplitude;
    frequency *= 2.1;
    amplitude *= 0.5;
  }
  return value * 2.0 - 1.0;
}

// ── Catmull-Rom スプライン → 三次ベジェ変換でなめらかな炎の輪郭を描画 ──
function drawFlameOutline(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  cx: number,
  cy: number,
  scale: number
): void {
  const n = pts.length;
  const p = (i: number): [number, number] => {
    const [px, py] = pts[((i % n) + n) % n];
    return [cx + (px - cx) * scale, cy + (py - cy) * scale];
  };

  ctx.beginPath();
  ctx.moveTo(...p(0));
  for (let i = 0; i < n; i++) {
    const [p0x, p0y] = p(i - 1);
    const [p1x, p1y] = p(i);
    const [p2x, p2y] = p(i + 1);
    const [p3x, p3y] = p(i + 2);
    ctx.bezierCurveTo(
      p1x + (p2x - p0x) / 6,
      p1y + (p2y - p0y) / 6,
      p2x - (p3x - p1x) / 6,
      p2y - (p3y - p1y) / 6,
      p2x,
      p2y
    );
  }
  ctx.closePath();
}

/**
 * ノイズ変形した炎状オーラを描画する（モバイル最適化版）。
 *
 * ctx.filter (blur) はモバイルCanvasでCPUソフトウェア処理になり極めて重いため使用しない。
 * 代わりに2パス描画でグロー感を再現する:
 *   Pass 1: 大きな半透明の放射グラデーション円（外側のぼんやりした光）
 *   Pass 2: ノイズ変形した炎形状パス（内側の発光コア）
 *
 * canvas 要素側に CSS `mixBlendMode: screen` を設定することで
 * GPU アクセラレートのブレンドを活用する。
 *
 * ノイズ計算は ~12fps に間引き、透明度アニメは 60fps を維持する。
 *
 * @param time アニメーション経過時間（秒）
 */
export function renderFlameAura(
  ctx: CanvasRenderingContext2D,
  item: DetectedItem,
  canvasWidth: number,
  canvasHeight: number,
  mode: ScanMode,
  time: number
): void {
  const config = getAuraConfig(item.aura_level, mode);
  if (!config) return;

  const { x_min, y_min, x_max, y_max } = item.bounding_box;
  const cx = ((x_min + x_max) / 2) * canvasWidth;
  const cy = ((y_min + y_max) / 2) * canvasHeight;
  const bboxR = ((x_max - x_min) * canvasWidth + (y_max - y_min) * canvasHeight) / 4;

  const baseRadius = bboxR * (0.7 + config.radius * 0.2);
  const noiseAmp = baseRadius * 0.3;
  const upwardBias = baseRadius * 0.2;

  const flicker = 1.0;

  // ── 炎の輪郭点: ノイズ計算を ~12fps に間引いてCPU負荷を削減 ──
  // 形状更新は低頻度でも透明度アニメで十分なめらかに見える
  const quantizedTime = Math.round(time * 12) / 12;
  const seed = item.aura_level * 7.391;
  const SEGMENTS = 32; // 64 → 32: ベジェ計算コストを半減
  // 回転オフセット: rank が高いほど rotationSpeed が大きく炎が速く回転する
  const rotationOffset = time * config.rotationSpeed;
  const pts: [number, number][] = Array.from({ length: SEGMENTS }, (_, i) => {
    const baseAngle = (i / SEGMENTS) * Math.PI * 2;
    // ノイズは baseAngle でサンプリング（固定形状）し、点の配置は回転後の angle で行う
    const angle = baseAngle + rotationOffset;
    const noise = fbm(((baseAngle * 1.5) / (Math.PI * 2)) * 8 + quantizedTime * 0.7 + seed);
    const upward = Math.max(0, -Math.sin(angle)) * upwardBias;
    const r = baseRadius + noise * noiseAmp + upward;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });

  // ── Pass 1: ハロー光（中心透明 → 商品輪郭付近でピーク → 外側へフェード）──
  // 商品中心を透明に保ち、輪郭の外側に向けて光が広がる後光表現
  ctx.save();
  ctx.globalAlpha = 0.4 * flicker * config.opacity;
  const outerGrad = ctx.createRadialGradient(cx, cy, bboxR * 0.2, cx, cy, baseRadius * 1.4);
  outerGrad.addColorStop(0.0, hexToRgba(config.color, 0));
  outerGrad.addColorStop(0.2, hexToRgba(config.color, 0.6));
  outerGrad.addColorStop(0.6, hexToRgba(config.flameColor, 0.3));
  outerGrad.addColorStop(1.0, hexToRgba(config.flameColor, 0));
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, baseRadius * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Pass 2: 炎の輪郭パス（中心透明 → 輪郭リングで発光）──
  ctx.save();
  ctx.globalAlpha = flicker * config.opacity;
  drawFlameOutline(ctx, pts, cx, cy, 1.0);
  const flameGrad = ctx.createRadialGradient(cx, cy, bboxR * 0.2, cx, cy, baseRadius * 1.4);
  flameGrad.addColorStop(0.0, hexToRgba(config.color, 0));
  flameGrad.addColorStop(0.15, hexToRgba(config.color, 1.0));
  flameGrad.addColorStop(0.55, hexToRgba(config.flameColor, 0.75));
  flameGrad.addColorStop(1.0, hexToRgba(config.flameColor, 0));
  ctx.fillStyle = flameGrad;
  ctx.fill();
  ctx.restore();
}

/** 売り上げランキングモード: 順位に応じた王道カラー */
export const AURA_LEVEL_CONFIG: Record<number, AuraConfig> = {
  // color: オーラコア色 / flameColor: 炎外縁色 / rotationSpeed: 回転速度 [rad/s]（1位が最速）
  5: { color: '#FFD700', flameColor: '#FF6D00', radius: 1.0, opacity: 1.0, rotationSpeed: 1.5 }, // Lv5（1位）
  4: { color: '#00E5FF', flameColor: '#0091EA', radius: 0.8, opacity: 1.0, rotationSpeed: 1.0 }, // Lv4（2位）
  3: { color: '#76FF03', flameColor: '#00C853', radius: 0.6, opacity: 1.0, rotationSpeed: 0.6 }, // Lv3（3位）
  2: { color: '#FF4081', flameColor: '#AA00FF', radius: 0.4, opacity: 1.0, rotationSpeed: 0.3 }, // Lv2（4位）
  1: { color: '#CFD8DC', flameColor: '#607D8B', radius: 0.2, opacity: 1.0, rotationSpeed: 0.1 }, // Lv1（5位）
};

/** 掘り出し物モード: 宝石・レアリティ感のカラースキーム */
export const HIDDEN_GEMS_AURA_CONFIG: Record<number, AuraConfig> = {
  5: { color: '#00E676', flameColor: '#00BFA5', radius: 1.0, opacity: 1.0, rotationSpeed: 1.5 }, // エメラルド・Lv5
  4: { color: '#D500F9', flameColor: '#6200EA', radius: 0.8, opacity: 1.0, rotationSpeed: 1.0 }, // アメジスト・Lv4
  3: { color: '#2979FF', flameColor: '#304FFE', radius: 0.6, opacity: 1.0, rotationSpeed: 0.6 }, // サファイア・Lv3
  2: { color: '#FF1744', flameColor: '#D50000', radius: 0.4, opacity: 1.0, rotationSpeed: 0.3 }, // ルビー・Lv2
  1: { color: '#FFD740', flameColor: '#FF6D00', radius: 0.2, opacity: 1.0, rotationSpeed: 0.1 }, // トパーズ・Lv1
};

export function getAuraConfig(auraLevel: number, mode: ScanMode): AuraConfig | undefined {
  if (mode === 'hidden-gems') return HIDDEN_GEMS_AURA_CONFIG[auraLevel];
  return AURA_LEVEL_CONFIG[auraLevel];
}

export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * @param time アニメーション経過時間（秒）。0 を渡すと静的描画。
 */
export function renderAura(
  ctx: CanvasRenderingContext2D,
  item: DetectedItem,
  canvasWidth: number,
  canvasHeight: number,
  mode: ScanMode = 'ranking',
  time: number = 0
): void {
  const config = getAuraConfig(item.aura_level, mode);
  if (!config) return;

  const { x_min, y_min, x_max, y_max } = item.bounding_box;
  const x1 = x_min * canvasWidth;
  const y1 = y_min * canvasHeight;
  const x2 = x_max * canvasWidth;
  const y2 = y_max * canvasHeight;

  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;
  const boxHalfSize = (x2 - x1 + y2 - y1) / 4;
  const innerRadius = boxHalfSize * 0.3;
  const outerRadius = boxHalfSize * (1 + config.radius);

  // ── アニメーション値 ────────────────────────────────────────
  // 周期をずらした sin/cos で「単純なループに見えない」揺らぎを作る
  const floatY = Math.sin(time * 0.785) * boxHalfSize * 0.2; // 8s周期: 上下揺れ
  const drift1X = Math.sin(time * 0.524) * boxHalfSize * 0.45; // 12s周期
  const drift1Y = Math.cos(time * 0.403) * boxHalfSize * 0.38; // 15.6s周期
  const drift2X = Math.cos(time * 0.628) * boxHalfSize * 0.35; // 10s周期
  const drift2Y = Math.sin(time * 0.712) * boxHalfSize * 0.28; // 8.8s周期
  const pulse = 1 + Math.sin(time * 1.047) * 0.45; // 6s周期: 輝度脈動

  // ── Layer 1: 外側のふわっとした大きなグロー ────────────────
  ctx.save();
  ctx.filter = 'blur(30px)';
  ctx.globalCompositeOperation = 'screen';
  const cx1 = centerX + drift1X;
  const cy1 = centerY + drift1Y + floatY;
  const grad1 = ctx.createRadialGradient(cx1, cy1, innerRadius, cx1, cy1, outerRadius * 1.8);
  grad1.addColorStop(0, hexToRgba(config.color, Math.min(1, config.opacity * 1.0 * pulse)));
  grad1.addColorStop(1, hexToRgba(config.color, 0));
  ctx.fillStyle = grad1;
  ctx.beginPath();
  ctx.arc(cx1, cy1, outerRadius * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Layer 2: 中間の流れるグロー ────────────────────────────
  ctx.save();
  ctx.filter = 'blur(15px)';
  ctx.globalCompositeOperation = 'screen';
  const cx2 = centerX + drift2X;
  const cy2 = centerY + drift2Y + floatY * 0.6;
  const grad2 = ctx.createRadialGradient(cx2, cy2, innerRadius * 0.4, cx2, cy2, outerRadius * 1.2);
  grad2.addColorStop(0, hexToRgba(config.color, Math.min(1, config.opacity * 1.1)));
  grad2.addColorStop(0.5, hexToRgba(config.color, config.opacity * 0.55));
  grad2.addColorStop(1, hexToRgba(config.color, 0));
  ctx.fillStyle = grad2;
  ctx.beginPath();
  ctx.arc(cx2, cy2, outerRadius * 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Layer 3: 中心の鋭いコア ────────────────────────────────
  ctx.save();
  ctx.filter = 'blur(6px)';
  ctx.globalCompositeOperation = 'screen';
  const cy3 = centerY + floatY * 0.3;
  const grad3 = ctx.createRadialGradient(centerX, cy3, 0, centerX, cy3, innerRadius * 4);
  grad3.addColorStop(0, hexToRgba(config.color, Math.min(1, config.opacity * 1.1 * pulse)));
  grad3.addColorStop(1, hexToRgba(config.color, 0));
  ctx.fillStyle = grad3;
  ctx.beginPath();
  ctx.arc(centerX, cy3, innerRadius * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
