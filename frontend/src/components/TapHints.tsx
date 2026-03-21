import type { CSSProperties } from 'react';
import type { DetectedItem } from '../types/scan';
import { computeLabelAnchors } from './tapHintsUtils';

type Props = {
  items: DetectedItem[];
};

/**
 * 各オーラの下部中央に「商品名 + 虫眼鏡アイコン」を表示し、タップで詳細が見られることを示す誘導UI。
 * pointer-events: none のため、クリック検知は AuraCanvas が担当する。
 */
export function TapHints({ items }: Props) {
  const anchors = computeLabelAnchors(items);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {items.map((item, i) => {
        const { left, top, transform } = anchors[i];
        const style: CSSProperties = { left, top, transform };

        return (
          <div key={item.product_id} className="absolute" style={style} aria-hidden="true">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sw-black/70 backdrop-blur-sm border border-sw-orange/60 shadow-[0_0_12px_rgba(255,145,0,0.3)] max-w-40">
              <span className="font-body text-white text-xs font-medium break-keep break-words leading-none min-w-0">
                {item.name}
              </span>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff9100"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="22" y2="22" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
