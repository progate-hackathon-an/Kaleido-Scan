import type { DetectedItem } from '../types/scan';

type Props = {
  items: DetectedItem[];
};

/**
 * 各オーラの右下に虫眼鏡アイコンを表示し、タップで詳細が見られることを示す誘導UI。
 * pointer-events: none のため、クリック検知は AuraCanvas が担当する。
 */
export function TapHints({ items }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {items.map((item) => (
        <div
          key={item.product_id}
          className="absolute"
          style={{
            left: `${item.bounding_box.x_max * 100}%`,
            top: `${item.bounding_box.y_max * 100}%`,
            transform: 'translate(-100%, -100%)',
          }}
          aria-hidden="true"
        >
          <div className="w-8 h-8 rounded-full bg-sw-black/60 backdrop-blur-sm border border-sw-orange/60 flex items-center justify-center shadow-[0_0_12px_rgba(255,145,0,0.3)]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff9100"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="22" y2="22" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
