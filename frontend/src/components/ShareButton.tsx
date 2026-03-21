import type { DetectedItem } from '../types/scan';
import { useShare } from '../hooks/useShare';

function ShareIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
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
      <ShareIcon />
      共有する
    </button>
  );
}
