import { AURA_LEVEL_CONFIG } from './auraRenderer';

describe('AURA_LEVEL_CONFIG', () => {
  it('TestGetAuraConfig_Level5: aura_level=5で金色・最大サイズの設定が返ること', () => {
    const config = AURA_LEVEL_CONFIG[5];
    const maxRadius = Math.max(...Object.values(AURA_LEVEL_CONFIG).map((c) => c.radius));

    expect(config).toBeDefined();
    expect(config.color).toBe('#FFD700');
    expect(config.radius).toBe(maxRadius);
  });

  it('TestGetAuraConfig_Level1: aura_level=1でグレー・最小サイズの設定が返ること', () => {
    const config = AURA_LEVEL_CONFIG[1];
    const minRadius = Math.min(...Object.values(AURA_LEVEL_CONFIG).map((c) => c.radius));

    expect(config).toBeDefined();
    expect(config.color).toBe('#9E9E9E');
    expect(config.radius).toBe(minRadius);
  });
});
