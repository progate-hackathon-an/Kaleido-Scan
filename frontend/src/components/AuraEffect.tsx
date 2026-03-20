import { useRef, useEffect } from 'react';
import type { DetectedItem, ScanMode } from '../types/scan';
import { renderFlameAura } from '../utils/auraRenderer';

type Props = {
  items: DetectedItem[];
  mode?: ScanMode;
  // imageUrl は将来の拡張のため保持（現在の炎描画では未使用）
  imageUrl?: string | null;
};

/**
 * Canvas上でノイズ変形した炎状オーラをアニメーション描画するコンポーネント。
 * pointer-events: none かつ mixBlendMode: screen で下層の画像に重ねて使用する。
 */
export function AuraEffect({ items, mode = 'ranking' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (timestamp: number) => {
      const t = timestamp * 0.001;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // rank 降順（例: 5→1）で描画し、高順位オーラが手前レイヤーになるようにする
      [...items]
        .sort((a, b) => b.rank - a.rank)
        .forEach((item) => renderFlameAura(ctx, item, canvas.width, canvas.height, mode, t));

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [items, mode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    />
  );
}
