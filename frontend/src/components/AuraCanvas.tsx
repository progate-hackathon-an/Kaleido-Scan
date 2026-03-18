import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import type { DetectedItem, ScanMode } from '../types/scan';
import { renderAura } from '../utils/auraRenderer';

type Props = {
  items: DetectedItem[];
  onItemSelect: (item: DetectedItem) => void;
  width?: number;
  height?: number;
  mode?: ScanMode;
};

export const AuraCanvas = forwardRef<HTMLCanvasElement, Props>(
  ({ items, onItemSelect, width, height, mode = 'ranking' }, forwardedRef) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useImperativeHandle(forwardedRef, () => canvasRef.current!);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (width) canvas.width = width;
      if (height) canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      items.forEach((item) => renderAura(ctx, item, canvas.width, canvas.height, mode));
    }, [items, width, height, mode]);

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / canvas.width;
      const y = (e.clientY - rect.top) / canvas.height;

      const clicked = items.find(
        ({ bounding_box: b }) => x >= b.x_min && x <= b.x_max && y >= b.y_min && y <= b.y_max
      );

      if (clicked) onItemSelect(clicked);
    };

    return <canvas ref={canvasRef} onClick={handleClick} />;
  }
);

AuraCanvas.displayName = 'AuraCanvas';
