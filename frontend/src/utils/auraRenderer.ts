import type { DetectedItem } from '../types/scan';

export type AuraConfig = {
  color: string;
  radius: number;
  opacity: number;
};

export const AURA_LEVEL_CONFIG: Record<number, AuraConfig> = {
  5: { color: '#FFD700', radius: 1.0, opacity: 0.9 }, // 金・Lv5（1位）
  4: { color: '#4FC3F7', radius: 0.8, opacity: 0.8 }, // 青・Lv4（2位）
  3: { color: '#66BB6A', radius: 0.6, opacity: 0.7 }, // 緑・Lv3（3位）
  2: { color: '#CE93D8', radius: 0.4, opacity: 0.6 }, // 紫・Lv2（4位）
  1: { color: '#9E9E9E', radius: 0.2, opacity: 0.4 }, // グレー・Lv1（5位）
};

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function renderAura(
  ctx: CanvasRenderingContext2D,
  item: DetectedItem,
  canvasWidth: number,
  canvasHeight: number
): void {
  const config = AURA_LEVEL_CONFIG[item.aura_level];
  if (!config) return;

  const { x_min, y_min, x_max, y_max } = item.bounding_box;

  const x1 = x_min * canvasWidth;
  const y1 = y_min * canvasHeight;
  const x2 = x_max * canvasWidth;
  const y2 = y_max * canvasHeight;

  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;

  const boxHalfSize = Math.max(x2 - x1, y2 - y1) / 2;
  const innerRadius = boxHalfSize * 0.3;
  const outerRadius = boxHalfSize * (1 + config.radius);

  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    innerRadius,
    centerX,
    centerY,
    outerRadius
  );
  gradient.addColorStop(0, hexToRgba(config.color, config.opacity));
  gradient.addColorStop(1, hexToRgba(config.color, 0));

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
