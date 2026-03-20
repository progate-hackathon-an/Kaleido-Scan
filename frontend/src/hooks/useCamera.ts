import { useRef, useState, useEffect } from 'react';

function dataURLToBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(data ?? '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
    });

    const track = stream.getVideoTracks()[0];
    if (track) {
      const capabilities = track.getCapabilities?.();
      if (capabilities?.width?.max && capabilities?.height?.max) {
        await track.applyConstraints({
          width: capabilities.width.max,
          height: capabilities.height.max,
        });
      }
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
        setIsReady(true);
      };
    }
  };

  const capturePhoto = (): File | null => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || video.clientWidth || 640;
    canvas.height = video.videoHeight || video.clientHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL('image/jpeg', 0.9);
    const blob = dataURLToBlob(dataURL);
    return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, isReady, startCamera, capturePhoto };
}
