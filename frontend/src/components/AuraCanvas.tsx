import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import type { DetectedItem } from '../types/scan';

type Props = {
  items: DetectedItem[];
  onItemSelect: (item: DetectedItem) => void;
  width?: number;
  height?: number;
  showBoundingBoxes?: boolean;
};

/**
 * クリック検知専用の透明Canvas。
 * 視覚的なオーラ描画は AuraEffect が担当する。
 * showBoundingBoxes が true のとき、デバッグ用にバウンディングボックスを描画する。
 */
export const AuraCanvas = forwardRef<HTMLCanvasElement, Props>(
  ({ items, onItemSelect, width, height, showBoundingBoxes = false }, forwardedRef) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useImperativeHandle(forwardedRef, () => canvasRef.current!);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !width || !height) return;
      canvas.width = width;
      canvas.height = height;

      if (!showBoundingBoxes) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      for (const item of items) {
        const { x_min, y_min, x_max, y_max } = item.bounding_box;
        const x = x_min * width;
        const y = y_min * height;
        const w = (x_max - x_min) * width;
        const h = (y_max - y_min) * height;

        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
        ctx.fillRect(x, y, w, h);

        const label = `${item.name} (Lv.${item.aura_level})`;
        ctx.font = 'bold 13px monospace';
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(x, y - 20, textWidth + 8, 20);
        ctx.fillStyle = '#00ff88';
        ctx.fillText(label, x + 4, y - 5);
      }
    }, [width, height, items, showBoundingBoxes]);

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const clicked = items.find(
        ({ bounding_box: b }) => x >= b.x_min && x <= b.x_max && y >= b.y_min && y <= b.y_max
      );

      if (clicked) onItemSelect(clicked);
    };

    return (
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    );
  }
);

AuraCanvas.displayName = 'AuraCanvas';
