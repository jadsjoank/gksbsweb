'use client';

import { useState } from 'react';
import { QRScanner } from './QRScanner';
import type { EventWithQR } from "lib/types/attendance";

interface AttendanceFormProps {
  event: EventWithQR;
  onSuccess?: () => void;
}

export function AttendanceForm({ event, onSuccess }: AttendanceFormProps) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [showScanner, setShowScanner] = useState(false);
  const [manualQRCode, setManualQRCode] = useState('');

  const handleQRScan = async (qrCode: string) => {
    setStatus('loading');
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          qr_code: qrCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('✓ Attendance recorded successfully!');
        setShowScanner(false);
        setTimeout(() => {
          onSuccess?.();
          setStatus('idle');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to record attendance');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQRCode.trim()) {
      setMessage('Please enter QR code');
      return;
    }
    await handleQRScan(manualQRCode);
    setManualQRCode('');
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{event.name}</h2>
        <p className="text-gray-600 text-sm mt-2">
          {new Date(event.date).toLocaleDateString()} | {event.start_time}
        </p>
        {event.attendance_count !== undefined && (
          <p className="text-gray-600 text-sm mt-1">
            Current attendance: {event.attendance_count}
          </p>
        )}
      </div>

      {status === 'success' && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      {status === 'error' && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {message}
        </div>
      )}

      {showScanner && status !== 'success' ? (
        <div className="space-y-4">
          <QRScanner
            onScan={handleQRScan}
            onError={(error) => {
              setStatus('error');
              setMessage(error);
            }}
          />
          <button
            onClick={() => setShowScanner(false)}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        status !== 'success' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowScanner(true)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              📷 Scan QR Code
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter QR Code Manually
                </label>
                <input
                  type="text"
                  value={manualQRCode}
                  onChange={(e) => setManualQRCode(e.target.value)}
                  placeholder="Enter QR code from the organizer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {status === 'loading' ? 'Processing...' : 'Submit'}
              </button>
            </form>
          </div>
        )
      )}
    </div>
  );
}
