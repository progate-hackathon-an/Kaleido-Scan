import { vi, beforeEach } from 'vitest';
import { postScanRanking } from './scanApi';
import type { ScanResponse } from '../types/scan';

const mockScanResponse: ScanResponse = {
  detected_items: [
    {
      product_id: '11111111-1111-1111-1111-111111111111',
      name: '味付海苔　炭火焼紅しゃけ',
      description: '炭火で香ばしく焼き上げた紅しゃけを中の具にした手巻おにぎり。',
      category: 'food',
      rank: 1,
      total_quantity: 12500,
      aura_level: 5,
      bounding_box: { x_min: 0.1, y_min: 0.2, x_max: 0.4, y_max: 0.7 },
    },
  ],
};

describe('postScanRanking', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('TestPostScanRanking_Success: fetch成功時にScanResponseが返ること', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockScanResponse),
    });

    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await postScanRanking(file);

    expect(result).toEqual(mockScanResponse);
  });

  it('TestPostScanRanking_NetworkError: fetch失敗時にエラーがthrowされること', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });

    await expect(postScanRanking(file)).rejects.toThrow('Network error');
  });
});
