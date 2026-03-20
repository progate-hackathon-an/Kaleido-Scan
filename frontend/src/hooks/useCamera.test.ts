import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { useCamera } from './useCamera';

const mockStream = {
  getTracks: () => [{ stop: vi.fn() }],
} as unknown as MediaStream;

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
    writable: true,
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
    'data:image/jpeg;base64,dGVzdA=='
  );
});

describe('useCamera', () => {
  it('TestUseCamera_StartCamera: startCamera呼び出しでgetUserMediaが呼ばれること', async () => {
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 4096 },
        height: { ideal: 2160 },
      },
    });
  });

  it('TestUseCamera_CapturePhoto: capturePhoto呼び出しでFileオブジェクトが返ること', async () => {
    const { result } = renderHook(() => useCamera());

    const videoElement = document.createElement('video');
    Object.defineProperty(result.current.videoRef, 'current', {
      value: videoElement,
      writable: true,
    });

    const file = result.current.capturePhoto();

    expect(file).toBeInstanceOf(File);
  });
});
