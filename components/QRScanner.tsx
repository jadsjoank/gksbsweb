'use client';

import { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    requestCameraPermission();
    return () => {
      // Cleanup: stop any active camera tracks when component unmounts
      const stream = videoRef.current?.srcObject as MediaStream | undefined;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setPermission('granted');
        setIsScanning(true);
        startScanning();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Camera access denied';
      setError(errorMsg);
      setPermission('denied');
      onError?.(errorMsg);
    }
  };

  const startScanning = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !video || !ctx) return;

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        try {
          // Try to detect QR code pattern (simple detection)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const detected = detectQRPattern(imageData);
          
          if (detected) {
            onScan(detected);
            setIsScanning(false);
            return;
          }
        } catch (e) {
          // Continue scanning
        }
      }

      if (isScanning) {
        requestAnimationFrame(scan);
      }
    };

    scan();
  };

  // Simple QR detection pattern matcher
  const detectQRPattern = (imageData: ImageData): string | null => {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) return code.data;
    } catch (e) {
      // ignore
    }

    return null;
  };

  const stopScanning = () => {
    setIsScanning(false);
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  if (permission === 'denied') {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={requestCameraPermission}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full rounded-lg border-2 border-dashed border-gray-400"
        />
        <canvas ref={canvasRef} className="hidden" />
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg">
            <div className="w-48 h-48 border-2 border-green-500 rounded-lg animate-pulse" />
          </div>
        )}
      </div>

      {isScanning && (
        <button
          onClick={stopScanning}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
        >
          Stop Scanning
        </button>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
