import type { DetectedItem } from '../types/scan';

export function generateShareImage(
  auraCanvas: HTMLCanvasElement,
  items: DetectedItem[],
  backgroundImage: HTMLImageElement | null
): Promise<File> {
  if (items.length === 0) {
    return Promise.reject(new Error('共有する商品がありません'));
  }

  const offscreen = document.createElement('canvas');
  offscreen.width = auraCanvas.width;
  offscreen.height = auraCanvas.height;
  const ctx = offscreen.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Canvas コンテキストの取得に失敗しました'));
  }

  if (backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0, offscreen.width, offscreen.height);
  }
  ctx.drawImage(auraCanvas, 0, 0);

  return new Promise((resolve, reject) => {
    offscreen.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas の画像生成に失敗しました'));
        return;
      }
      const file = new File([blob], `kaleid-scan-${Date.now()}.png`, {
        type: 'image/png',
      });
      resolve(file);
    }, 'image/png');
  });
}
