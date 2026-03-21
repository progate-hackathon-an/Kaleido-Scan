import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useShare } from './useShare';
import * as shareImageModule from '../utils/shareImage';
import type { DetectedItem } from '../types/scan';

const mockItem: DetectedItem = {
  product_id: 'test-id',
  name: 'テスト商品',
  description: 'テスト説明',
  category: 'food',
  rank: 1,
  aura_level: 5,
  bounding_box: { x_min: 0.1, y_min: 0.1, x_max: 0.9, y_max: 0.9 },
};

const mockFile = new File(['fake'], 'share.png', { type: 'image/png' });

describe('useShare', () => {
  beforeEach(() => {
    vi.spyOn(shareImageModule, 'generateShareImage').mockResolvedValue(mockFile);
    // jsdom のデフォルトに戻す
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TestUseShare_CallsNavigatorShare: navigator.shareが呼ばれ、filesとtextが渡されること', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      configurable: true,
      writable: true,
    });

    const canvas = document.createElement('canvas');
    const { result } = renderHook(() => useShare());

    expect(result.current.isSupported).toBe(true);

    await act(async () => {
      await result.current.share(canvas, [mockItem], mockItem, null);
    });

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        files: [mockFile],
        text: expect.stringContaining('テスト商品'),
      })
    );
    expect(result.current.error).toBeNull();
  });

  it('TestUseShare_UnsupportedBrowser: navigator.shareが未定義の場合にエラー状態になること', async () => {
    const canvas = document.createElement('canvas');
    const { result } = renderHook(() => useShare());

    expect(result.current.isSupported).toBe(false);

    await act(async () => {
      await result.current.share(canvas, [mockItem], mockItem, null);
    });

    expect(result.current.error).toBe('このブラウザでは共有できません');
  });

  it('TestUseShare_ShareFailure: 共有に失敗した場合にエラーメッセージが設定されること', async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error('share failed'));
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      configurable: true,
      writable: true,
    });

    const canvas = document.createElement('canvas');
    const { result } = renderHook(() => useShare());

    expect(result.current.isSupported).toBe(true);

    await act(async () => {
      await result.current.share(canvas, [mockItem], mockItem, null);
    });

    expect(result.current.error).toBe('シェアできませんでした。もう一度お試しください');
  });
});
