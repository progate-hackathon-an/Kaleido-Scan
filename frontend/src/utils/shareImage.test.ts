import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateShareImage } from './shareImage';
import type { DetectedItem } from '../types/scan';

const mockItem: DetectedItem = {
  product_id: 'test-id',
  name: 'テスト商品',
  description: 'テスト説明',
  category: 'food',
  rank: 1,
  total_quantity: 100,
  aura_level: 5,
  bounding_box: { x_min: 0.1, y_min: 0.1, x_max: 0.9, y_max: 0.9 },
};

describe('generateShareImage', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toBlob = vi.fn(function (callback: BlobCallback) {
      callback(new Blob(['fake-image'], { type: 'image/png' }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TestGenerateShareImage_ReturnsFile: Canvasにオーラ合成した結果がFileオブジェクトで返ること', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;

    const file = await generateShareImage(canvas, [mockItem], null);

    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe('image/png');
    expect(file.name).toMatch(/kaleid-scan.*\.png$/i);
  });
});
