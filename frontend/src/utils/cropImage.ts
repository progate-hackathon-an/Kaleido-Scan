import type { BoundingBox } from '../types/scan';

export function cropImage(imageFile: File, boundingBox: BoundingBox): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(imageFile);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const x = boundingBox.x_min * img.naturalWidth;
      const y = boundingBox.y_min * img.naturalHeight;
      const w = (boundingBox.x_max - boundingBox.x_min) * img.naturalWidth;
      const h = (boundingBox.y_max - boundingBox.y_min) * img.naturalHeight;

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
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
