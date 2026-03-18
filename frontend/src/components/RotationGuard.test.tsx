import { render, screen, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RotationGuard } from './RotationGuard';

// screen.orientation のモックヘルパー
function mockOrientation(type: string) {
  Object.defineProperty(window.screen, 'orientation', {
    value: {
      type,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    configurable: true,
  });
}

// matchMedia のモックヘルパー（クエリごとに matches を制御可能）
function mockMatchMedia(matches: boolean | ((query: string) => boolean)) {
  const getMatches = typeof matches === 'function' ? matches : () => matches;
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation((query: string) => ({
      matches: getMatches(query),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
    configurable: true,
  });
}

describe('RotationGuard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('landscape-primary のときオーバーレイが表示されること', () => {
    mockOrientation('landscape-primary');
    render(<RotationGuard />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('縦向きでご利用ください')).toBeInTheDocument();
  });

  it('landscape-secondary のときオーバーレイが表示されること', () => {
    mockOrientation('landscape-secondary');
    render(<RotationGuard />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('portrait-primary のときオーバーレイが非表示になること', () => {
    mockOrientation('portrait-primary');
    render(<RotationGuard />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('screen.orientation が未定義でも横向きのとき表示されること（matchMedia フォールバック）', () => {
    Object.defineProperty(window.screen, 'orientation', {
      value: undefined,
      configurable: true,
    });
    mockMatchMedia(true);
    render(<RotationGuard />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('screen.orientation が未定義で縦向きのとき非表示になること（matchMedia フォールバック）', () => {
    Object.defineProperty(window.screen, 'orientation', {
      value: undefined,
      configurable: true,
    });
    mockMatchMedia(false);
    render(<RotationGuard />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('orientation change イベントで表示状態が切り替わること', () => {
    // (pointer: coarse) を true にしてリスナー登録を通過させる
    mockMatchMedia((query) => query === '(pointer: coarse)');

    let changeHandler: (() => void) | undefined;
    Object.defineProperty(window.screen, 'orientation', {
      value: {
        type: 'portrait-primary',
        addEventListener: vi.fn((_: string, fn: () => void) => {
          changeHandler = fn;
        }),
        removeEventListener: vi.fn(),
      },
      configurable: true,
    });

    render(<RotationGuard />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // landscape に変更
    Object.defineProperty(window.screen, 'orientation', {
      value: { type: 'landscape-primary', addEventListener: vi.fn(), removeEventListener: vi.fn() },
      configurable: true,
    });
    act(() => {
      changeHandler?.();
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
