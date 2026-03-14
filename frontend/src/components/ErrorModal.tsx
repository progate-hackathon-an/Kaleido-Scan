import { Overlay } from './Overlay';

type Props = {
  isOpen: boolean;
  message: string;
  onClose: () => void;
};

export function ErrorModal({ isOpen, message, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <Overlay>
      <div role="dialog" aria-modal="true">
        <p>{message}</p>
        <button onClick={onClose}>閉じる</button>
      </div>
    </Overlay>
  );
}
