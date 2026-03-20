import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { useScan } from './useScan';
import type { ScanResponse } from '../types/scan';

vi.mock('../api/scanApi', () => ({
  postScan: vi.fn(),
}));

import { postScan } from '../api/scanApi';
const mockPostScan = vi.mocked(postScan);

const mockResponse: ScanResponse = {
  detected_items: [
    {
      product_id: '11111111-1111-1111-1111-111111111111',
      name: '味付海苔　炭火焼紅しゃけ',
      description: '炭火で香ばしく焼き上げた紅しゃけを中の具にした手巻おにぎり。',
      category: 'food',
      rank: 1,
      aura_level: 5,
      bounding_box: { x_min: 0.1, y_min: 0.2, x_max: 0.4, y_max: 0.7 },
    },
  ],
};

describe('useScan', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('TestUseScan_Success: scan成功時にresultにレスポンスが格納されること', async () => {
    mockPostScan.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useScan());
    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.scan(file, 'ranking');
    });

    expect(result.current.result).toEqual(mockResponse);
    expect(result.current.error).toBeNull();
  });

  it('TestUseScan_LoadingState: scan中はisLoadingがtrueになり、完了後にfalseに戻ること', async () => {
    let resolve!: (v: ScanResponse) => void;
    mockPostScan.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );

    const { result } = renderHook(() => useScan());
    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });

    act(() => {
      void result.current.scan(file, 'ranking');
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve(mockResponse);
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('TestUseScan_ServerError: scan失敗時にerrorに「スキャンに失敗しました」が格納されること', async () => {
    mockPostScan.mockRejectedValue(new Error('Internal Server Error'));

    const { result } = renderHook(() => useScan());
    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.scan(file, 'ranking');
    });

    expect(result.current.error).toBe('スキャンに失敗しました');
    expect(result.current.result).toBeNull();
  });
});
