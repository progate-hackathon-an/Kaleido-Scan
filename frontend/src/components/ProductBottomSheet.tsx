import type { DetectedItem } from '../types/scan';
import { useSwipeDown } from '../hooks/useSwipeDown';

type Props = {
  isOpen: boolean;
  item: DetectedItem | null;
  croppedImageUrl: string | null;
  onClose: () => void;
};

export function ProductBottomSheet({ isOpen, item, croppedImageUrl, onClose }: Props) {
  const { onTouchStart, onTouchEnd } = useSwipeDown(onClose);

  if (!isOpen || !item) return null;

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div aria-label="ドラッグハンドル" />
      {croppedImageUrl && <img src={croppedImageUrl} alt={item.name} />}
      <span>{`🏅 ${item.rank}位`}</span>
      <h2>{item.name}</h2>
      <p>{item.description}</p>
    </div>
  );
}
