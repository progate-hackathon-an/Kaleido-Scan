import { useState } from 'react';
import type { DetectedItem } from '../types/scan';
import { generateShareImage } from '../utils/shareImage';
import { SHARE_TEXT } from '../constants/share';

export function useShare() {
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const share = async (
    canvas: HTMLCanvasElement,
    items: DetectedItem[],
    topItem: DetectedItem,
    backgroundImage: HTMLImageElement | null
  ): Promise<void> => {
    if (!isSupported) {
      setError('お使いのブラウザは共有機能に対応していません');
      return;
    }
    try {
      const imageFile = await generateShareImage(canvas, items, backgroundImage);
      await navigator.share({ files: [imageFile], text: SHARE_TEXT(topItem.name) });
      setError(null);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return; // ユーザーがキャンセル
      setError('共有に失敗しました');
    }
  };

  return { share, isSupported, error };
}
