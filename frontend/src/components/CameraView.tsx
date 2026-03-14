import { useEffect } from 'react';
import { useCamera } from '../hooks/useCamera';

type Props = {
  onCapture: (file: File) => void;
};

export function CameraView({ onCapture }: Props) {
  const { videoRef, isReady, startCamera, capturePhoto } = useCamera();

  useEffect(() => {
    void startCamera();
    // startCamera はマウント時の一度だけ呼べばよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShutter = () => {
    const file = capturePhoto();
    if (file) onCapture(file);
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline muted />
      <button onClick={handleShutter} disabled={!isReady}>
        撮影
      </button>
    </div>
  );
}
