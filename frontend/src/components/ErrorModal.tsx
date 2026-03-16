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
      <div
        role="dialog"
        aria-modal="true"
        className="bg-sw-steel rounded-2xl p-8 mx-6 flex flex-col items-center gap-6 max-w-sm w-full"
      >
        {/* エラーアイコン */}
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
          <span className="text-red-400 text-xl" aria-hidden="true">
            !
          </span>
        </div>

        <p className="font-body text-slate-300 text-sm text-center leading-relaxed whitespace-pre-wrap break-all">
          {message}
        </p>

        <button
          onClick={onClose}
          className="w-full bg-white text-sw-black font-body font-medium rounded-full py-3 min-h-11 active:scale-95 transition-transform duration-100"
        >
          閉じる
        </button>
      </div>
    </Overlay>
  );
}
