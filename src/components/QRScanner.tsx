import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, CheckCircle, XCircle, AlertTriangle, PartyPopper, Shield } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { WeddingGuest, CheckInAttempt } from '../types';

interface Props {
  guests: WeddingGuest[];
  onCheckIn: (guestId: string) => void;
  onAddCheckInAttempt: (attempt: CheckInAttempt) => void;
}

const QRScanner: React.FC<Props> = ({ guests, onCheckIn, onAddCheckInAttempt }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'duplicate' | 'invalid';
    message: string;
    guestName?: string;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false); // ✅ Modal state

  useEffect(() => {
    checkCameraAvailability();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const checkCameraAvailability = async () => {
    try {
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setCameraError('No camera found on this device');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setCameraError('');
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasPermission(false);

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('Camera permission denied. Please allow camera access and refresh the page.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('No camera found on this device.');
        } else if (error.name === 'NotSupportedError') {
          setCameraError('Camera not supported on this device.');
        } else {
          setCameraError('Unable to access camera. Please check your browser settings.');
        }
      }
    }
  };

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setCameraError('');

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result.data),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 5,
        }
      );

      await qrScannerRef.current.start();
      setIsScanning(true);
      setShowModal(true); // ✅ Open modal

    } catch (error) {
      console.error('Error starting QR scanner:', error);
      setIsScanning(false);

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('Camera permission denied. Please allow camera access i
