import { AURA_LEVEL_CONFIG, HIDDEN_GEMS_AURA_CONFIG } from './auraRenderer';

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
