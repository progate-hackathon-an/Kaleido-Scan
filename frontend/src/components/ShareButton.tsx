import type { DetectedItem } from '../types/scan';
import { useShare } from '../hooks/useShare';

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type Props = {
  canvas: HTMLCanvasElement | null;
  items: DetectedItem[];
  topItem: DetectedItem;
  backgroundImage: HTMLImageElement | null;
};

export function ShareButton({ canvas, items, topItem, backgroundImage }: Props) {
  const { share, isSupported } = useShare();

  if (!isSupported) return null;

  const handleShare = () => {
    if (!canvas) return;
    void share(canvas, items, topItem, backgroundImage);
  };

  return (
    <button
      onClick={handleShare}
      disabled={!canvas}
      aria-label="商品を共有する"
      className="w-full bg-white text-sw-black font-body font-medium rounded-full py-4 min-h-14 flex items-center justify-center gap-2 active:scale-95 transition-transform duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <XIcon />
      共有する
    </button>
  );
}
