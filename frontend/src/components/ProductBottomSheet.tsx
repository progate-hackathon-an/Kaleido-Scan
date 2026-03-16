import type { DetectedItem } from '../types/scan';
import { useSwipeDown } from '../hooks/useSwipeDown';

type Props = {
  isOpen: boolean;
  item: DetectedItem | null;
  croppedImageUrl: string | null;
  onClose: () => void;
};

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

export function ProductBottomSheet({ isOpen, item, croppedImageUrl, onClose }: Props) {
  const { onTouchStart, onTouchEnd } = useSwipeDown(onClose);

  if (!isOpen || !item) return null;

  const handleShare = () => {
    if (navigator.share) {
      void navigator.share({ title: item.name, text: item.description });
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 animate-[slide-up_0.3s_ease-out]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="bg-sw-steel rounded-t-3xl px-6 pt-3 pb-12 flex flex-col gap-6">
        {/* ドラッグハンドル */}
        <div className="flex justify-center pt-1">
          <div className="w-10 h-1 bg-slate-500 rounded-full" aria-label="ドラッグハンドル" />
        </div>

        {/* ヘッダー: 商品名 + ランクバッジ */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl text-white font-bold leading-tight">{item.name}</h2>
          <span className="shrink-0 font-body text-xs text-slate-300 bg-sw-black/70 px-3 py-1.5 rounded-full border border-slate-600">
            Rank {item.rank}
          </span>
        </div>

        {/* 商品画像 */}
        {croppedImageUrl && (
          <div className="bg-sw-black rounded-2xl overflow-hidden">
            <img src={croppedImageUrl} alt={item.name} className="w-full object-cover max-h-52" />
          </div>
        )}

        {/* 商品説明 */}
        <div className="bg-sw-black/50 rounded-2xl p-4">
          <p className="font-body text-slate-300 text-sm leading-relaxed">{item.description}</p>
        </div>

        {/* 共有ボタン */}
        <button
          onClick={handleShare}
          aria-label="商品を共有する"
          className="w-full bg-white text-sw-black font-body font-medium rounded-full py-4 min-h-14 flex items-center justify-center gap-2 active:scale-95 transition-transform duration-100"
        >
          <ShareIcon />
          共有する
        </button>
      </div>
    </div>
  );
}
