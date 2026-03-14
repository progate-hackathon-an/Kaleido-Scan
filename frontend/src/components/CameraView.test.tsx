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
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
