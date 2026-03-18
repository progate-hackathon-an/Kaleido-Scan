import { useRef, useEffect } from 'react';
import type { DetectedItem } from '../types/scan';

type Props = {
  items: DetectedItem[];
  onItemSelect: (item: DetectedItem) => void;
  width?: number;
  height?: number;
};

/**
 * クリック検知専用の透明Canvas。
 * 視覚的なオーラ描画は AuraEffect が担当する。
 */
export function AuraCanvas({ items, onItemSelect, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return;
    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

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
