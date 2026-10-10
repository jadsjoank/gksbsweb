'use client';

import { useState, useEffect, useRef } from 'react';
import type { EventWithQR } from "lib/types/attendance";

interface EventQRDisplayProps {
  event: EventWithQR;
}

export function EventQRDisplay({ event }: EventQRDisplayProps) {
  const [qrImage, setQrImage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code using simple pattern or API
  const generateQR = async () => {
    setLoading(true);
    setError('');

    try {
      // Method 1: Use the backend to generate and return QR
      const response = await fetch(`/api/events/${event.id}/qr`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();
      setQrImage(data.qr_image); // Should be base64 or URL
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate QR';
      setError(errorMsg);
      console.error('QR Generation Error:', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (event.qr_code && !qrImage) {
      generateQR();
    }
  }, [event.id]);

  const downloadQR = () => {
    if (!qrImage) return;

    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `${event.name}-qr-${new Date().getTime()}.png`;
    link.click();
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        QR Code - {event.name}
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin">⏳</div>
          <span className="ml-2 text-gray-600">Generating QR code...</span>
        </div>
      )}

      {qrImage ? (
        <div className="space-y-4">
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <img
              src={qrImage}
              alt={`QR Code for ${event.name}`}
              className="w-48 h-48 object-contain"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Scan this code to mark attendance</strong>
            </p>
            <p className="text-xs text-gray-500">
              Event ID: {event.id}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={downloadQR}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              ⬇️ Download
            </button>
            <button
              onClick={generateQR}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-medium"
            >
              🔄 Regenerate
            </button>
          </div>
        </div>
      ) : !loading ? (
        <button
          onClick={generateQR}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Generate QR Code
        </button>
      ) : null}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
