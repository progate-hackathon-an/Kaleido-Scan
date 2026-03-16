import { clsx } from 'clsx';

type Props = {
  onCapture: () => void;
  isReady: boolean;
  isScanning: boolean;
};

/**
 * オーラ診断メイン操作ボタン
 *
 * - 72px 円形ボタン（Apple/Google 最小タップターゲット 44px を超過）
 * - sw-orange グロウリングでメインアクションを強調
 * - スキャン中: animate-pulse + 強化グロウで「生命エネルギー脈動」演出
 * - タップ時: active:scale-95 で即時フィードバック
 */
export function ShutterButton({ onCapture, isReady, isScanning }: Props) {
  return (
    <button
      onClick={onCapture}
      disabled={!isReady || isScanning}
      aria-label="オーラを診断する"
      className={clsx(
        // Layout
        'relative flex items-center justify-center',
        'w-18 h-18 rounded-full',
        // Ring: sw-orange アクセントリング (5% カラー)
        'ring-[3px] ring-sw-orange/80',
        // Glow: オーラの輝き
        'shadow-[0_0_20px_rgba(255,145,0,0.35)]',
        // Base fill
        'bg-sw-black',
        // Touch feedback — 操作を受け付けたことを直感的に伝える
        'transition-all duration-100 active:scale-95',
        // Disabled
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        // Hover (non-touch)
        'hover:shadow-[0_0_28px_rgba(255,145,0,0.55)] hover:ring-sw-orange',
        // Scanning: 脈打つ演出
        isScanning && 'animate-pulse ring-sw-orange shadow-[0_0_32px_rgba(255,145,0,0.65)]'
      )}
    >
      {/* 内円: 撮影準備完了を白で示す / スキャン中はオーラ色に変化 */}
      <span
        className={clsx(
          'w-13 h-13 rounded-full transition-colors duration-300',
          isScanning ? 'bg-sw-orange/20' : 'bg-white'
        )}
      />
    </button>
  );
}
