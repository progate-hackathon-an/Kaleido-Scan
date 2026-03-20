import type { Config } from 'tailwindcss';

/**
 * Kaleido Scan デザインシステム設定
 *
 * 配色比率 70/25/5:
 *   sw-black  (#080808) — 背景・大きな余白
 *   sw-steel  (#2A323A) — カード・入力フィールド
 *   sw-orange (#FF9100) — 決定ボタン・進捗・オーラ数値
 *
 * フォント:
 *   font-display — Orbitron / Zen Dots (英数字), Kaisotai-Next-UP-B (日本語) (ロゴ・見出し・SF演出)
 *   font-body    — Zen Kaku Gothic New (説明文・長文・日本語統一)
 */
export default {
  theme: {
    extend: {
      colors: {
        'sw-black': '#080808',
        'sw-steel': '#2A323A',
        'sw-orange': '#FF9100',
      },
      fontFamily: {
        display: [
          'Orbitron',
          '"Zen Dots"',
          '"Kaisotai-Next-UP-B"',
          '"Zen Kaku Gothic New"',
          'sans-serif',
        ],
        body: ['"Zen Kaku Gothic New"', 'sans-serif'],
      },
    },
  },
} satisfies Config;
