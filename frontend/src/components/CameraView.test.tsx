import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { CameraView } from './CameraView';

vi.mock('../hooks/useCamera', () => ({
  useCamera: () => ({
    videoRef: { current: null },
    isReady: false,
    startCamera: vi.fn().mockResolvedValue(undefined),
    capturePhoto: vi.fn().mockReturnValue(null),
  }),
}));

describe('CameraView', () => {
  it('TestCameraView_RenderShutterButton: シャッターボタンが描画されること', () => {
    render(<CameraView onCapture={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'オーラを診断する' })).toBeInTheDocument();
  });

  it('TestCameraView_RenderTabs: 3つのモードタブが描画されること', () => {
    render(<CameraView onCapture={vi.fn()} />);
    expect(screen.getByText('掘り出しもの')).toBeInTheDocument();
    expect(screen.getByText('売り上げ')).toBeInTheDocument();
    expect(screen.getByText('急上昇')).toBeInTheDocument();
  });
});
