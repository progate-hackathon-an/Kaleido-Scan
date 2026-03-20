import { vi } from 'vitest';
import {
  AURA_LEVEL_CONFIG,
  HIDDEN_GEMS_AURA_CONFIG,
  renderFlameAura,
  renderAura,
} from './auraRenderer';
import type { DetectedItem } from '../types/scan';

// 細長いバウンディングボックス (幅80px, 高さ20px) を持つ検出アイテム
function makeWideItem(): DetectedItem {
  return {
    product_id: 'p1',
    name: 'test',
    description: '',
    category: '',
    rank: 1,
    total_quantity: 1,
    aura_level: 5,
    bounding_box: { x_min: 0, x_max: 0.8, y_min: 0.4, y_max: 0.6 },
  };
}

function makeCtxMock() {
  const gradMock = { addColorStop: vi.fn() };
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    closePath: vi.fn(),
    createRadialGradient: vi.fn().mockReturnValue(gradMock),
    globalAlpha: 0,
    globalCompositeOperation: '',
    filter: '',
    fillStyle: '',
  } as unknown as CanvasRenderingContext2D;
}

// canvasWidth=100, canvasHeight=100 で幅80px×高さ20pxの細長いアイテム
// avg-based bboxR = (80 + 20) / 4 = 25
// max-based bboxR = Math.max(80, 20) / 2 = 40
const WIDE_CANVAS_SIZE = 100;
const WIDE_ITEM_BBOX_R_AVG = 25; // 期待値: 平均ベース
const WIDE_ITEM_BBOX_R_MAX = 40; // 旧実装(修正前): maxベース

describe('renderFlameAura', () => {
  it('TestRenderFlameAura_WideItem_UsesAverageBboxRadius: 細長いアイテムのオーラ半径が縦横の平均に基づくこと', () => {
    const ctx = makeCtxMock();
    const item = makeWideItem();

    renderFlameAura(ctx, item, WIDE_CANVAS_SIZE, WIDE_CANVAS_SIZE, 'ranking', 0);

    const calls = (ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    // 1回目の createRadialGradient の第3引数: bboxR * 0.2
    const innerR = calls[0][2] as number;
    expect(innerR).toBeCloseTo(WIDE_ITEM_BBOX_R_AVG * 0.2); // 5.0
    expect(innerR).not.toBeCloseTo(WIDE_ITEM_BBOX_R_MAX * 0.2); // 8.0 (旧実装)
  });
});

describe('renderAura', () => {
  it('TestRenderAura_WideItem_UsesAverageBboxRadius: 細長いアイテムのグロー半径が縦横の平均に基づくこと', () => {
    const ctx = makeCtxMock();
    const item = makeWideItem();

    renderAura(ctx, item, WIDE_CANVAS_SIZE, WIDE_CANVAS_SIZE, 'ranking', 0);

    const calls = (ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    // Layer 1 の createRadialGradient 第3引数: innerRadius = boxHalfSize * 0.3
    const innerR = calls[0][2] as number;
    expect(innerR).toBeCloseTo(WIDE_ITEM_BBOX_R_AVG * 0.3); // 7.5
    expect(innerR).not.toBeCloseTo(WIDE_ITEM_BBOX_R_MAX * 0.3); // 12.0 (旧実装)
  });
});

describe('AURA_LEVEL_CONFIG', () => {
  it('TestGetAuraConfig_Level5: aura_level=5で金色・最大サイズ・最速回転の設定が返ること', () => {
    const config = AURA_LEVEL_CONFIG[5];
    const maxRadius = Math.max(...Object.values(AURA_LEVEL_CONFIG).map((c) => c.radius));
    const maxRotationSpeed = Math.max(
      ...Object.values(AURA_LEVEL_CONFIG).map((c) => c.rotationSpeed)
    );

    expect(config).toBeDefined();
    expect(config.color).toBe('#FFD700');
    expect(config.radius).toBe(maxRadius);
    expect(config.rotationSpeed).toBe(maxRotationSpeed);
  });

  it('TestGetAuraConfig_Level1: aura_level=1でグレー・最小サイズ・最遅回転の設定が返ること', () => {
    const config = AURA_LEVEL_CONFIG[1];
    const minRadius = Math.min(...Object.values(AURA_LEVEL_CONFIG).map((c) => c.radius));
    const minRotationSpeed = Math.min(
      ...Object.values(AURA_LEVEL_CONFIG).map((c) => c.rotationSpeed)
    );

    expect(config).toBeDefined();
    expect(config.color).toBe('#CFD8DC');
    expect(config.radius).toBe(minRadius);
    expect(config.rotationSpeed).toBe(minRotationSpeed);
  });

  it('TestGetAuraConfig_RotationOrder: aura_levelが高いほどrotationSpeedが大きいこと', () => {
    const speeds = [1, 2, 3, 4, 5].map((lv) => AURA_LEVEL_CONFIG[lv].rotationSpeed);
    for (let i = 0; i < speeds.length - 1; i++) {
      expect(speeds[i]).toBeLessThan(speeds[i + 1]);
    }
  });
});

describe('HIDDEN_GEMS_AURA_CONFIG', () => {
  it('TestHiddenGemsConfig_Level5: aura_level=5で最速回転の設定が返ること', () => {
    const config = HIDDEN_GEMS_AURA_CONFIG[5];
    const maxRotationSpeed = Math.max(
      ...Object.values(HIDDEN_GEMS_AURA_CONFIG).map((c) => c.rotationSpeed)
    );

    expect(config).toBeDefined();
    expect(config.rotationSpeed).toBe(maxRotationSpeed);
  });

  it('TestHiddenGemsConfig_Level1: aura_level=1で最遅回転の設定が返ること', () => {
    const config = HIDDEN_GEMS_AURA_CONFIG[1];
    const minRotationSpeed = Math.min(
      ...Object.values(HIDDEN_GEMS_AURA_CONFIG).map((c) => c.rotationSpeed)
    );

    expect(config).toBeDefined();
    expect(config.rotationSpeed).toBe(minRotationSpeed);
  });

  it('TestHiddenGemsConfig_RotationOrder: aura_levelが高いほどrotationSpeedが大きいこと', () => {
    const speeds = [1, 2, 3, 4, 5].map((lv) => HIDDEN_GEMS_AURA_CONFIG[lv].rotationSpeed);
    for (let i = 0; i < speeds.length - 1; i++) {
      expect(speeds[i]).toBeLessThan(speeds[i + 1]);
    }
  });

  it('TestHiddenGemsConfig_RotationRange: rankingモードと同じ回転速度レンジであること', () => {
    const rankingMax = Math.max(...Object.values(AURA_LEVEL_CONFIG).map((c) => c.rotationSpeed));
    const rankingMin = Math.min(...Object.values(AURA_LEVEL_CONFIG).map((c) => c.rotationSpeed));
    const gemsMax = Math.max(...Object.values(HIDDEN_GEMS_AURA_CONFIG).map((c) => c.rotationSpeed));
    const gemsMin = Math.min(...Object.values(HIDDEN_GEMS_AURA_CONFIG).map((c) => c.rotationSpeed));

    expect(gemsMax).toBe(rankingMax);
    expect(gemsMin).toBe(rankingMin);
  });
});
