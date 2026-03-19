import type { BoundingBox } from '../types/scan';

/** バウンディングボックスの幅に対するマージン比率（片側） */
const MARGIN_RATIO = 0.05;

export function cropImage(imageFile: File, boundingBox: BoundingBox): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(imageFile);
    const img = new Image();

    img.onload = () => {
      const W = img.naturalWidth;
      const H = img.naturalHeight;

      const bboxW = (boundingBox.x_max - boundingBox.x_min) * W;
      const cx = ((boundingBox.x_min + boundingBox.x_max) / 2) * W;
      const cy = ((boundingBox.y_min + boundingBox.y_max) / 2) * H;

      // bbox幅＋マージンの正方形でクロップ（縦長商品のラベルが中央に映る）
      const cropSide = Math.min(bboxW * (1 + 2 * MARGIN_RATIO), W, H);
      const x = Math.max(0, Math.min(cx - cropSide / 2, W - cropSide));
      const y = Math.max(0, Math.min(cy - cropSide / 2, H - cropSide));

      const canvas = document.createElement('canvas');
      canvas.width = cropSide;
      canvas.height = cropSide;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, x, y, cropSide, cropSide, 0, 0, cropSide, cropSide);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };

    img.src = url;
  });
}
