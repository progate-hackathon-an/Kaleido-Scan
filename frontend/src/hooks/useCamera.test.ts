import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { useCamera } from './useCamera';

const mockApplyConstraints = vi.fn().mockResolvedValue(undefined);
const mockGetCapabilities = vi.fn().mockReturnValue({
  width: { max: 1920 },
  height: { max: 1080 },
});
const mockTrack = {
  stop: vi.fn(),
  getCapabilities: mockGetCapabilities,
  applyConstraints: mockApplyConstraints,
};
const mockStream = {
  getTracks: () => [mockTrack],
  getVideoTracks: () => [mockTrack],
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
      video: { facingMode: { ideal: 'environment' } },
    });
  });

  it('TestUseCamera_StartCamera_ApplyMaxResolution: startCamera呼び出しでデバイス最大解像度が適用されること', async () => {
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(mockApplyConstraints).toHaveBeenCalledWith({
      width: 1920,
      height: 1080,
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
