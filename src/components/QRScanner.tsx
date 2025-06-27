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

  useEffect(() => {
    // Check camera availability on component mount
    checkCameraAvailability();
    
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const checkCameraAvailability = async () => {
    try {
      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setCameraError('No camera found on this device');
        return;
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prefer back camera
        } 
      });
      
      // Stop the stream immediately as we just wanted to check permission
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
          preferredCamera: 'environment', // Use back camera if available
          maxScansPerSecond: 5,
        }
      );

      await qrScannerRef.current.start();
      setIsScanning(true);
      setHasPermission(true);
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      setIsScanning(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
          setHasPermission(false);
        } else if (error.name === 'NotFoundError') {
          setCameraError('Camera not found. Please ensure your device has a camera.');
        } else if (error.name === 'NotReadableError') {
          setCameraError('Camera is being used by another application. Please close other camera apps.');
        } else {
          setCameraError('Failed to start camera. Please refresh the page and try again.');
        }
      }
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanResult = (data: string) => {
    if (data === lastResult) return; // Prevent duplicate scans
    
    setLastResult(data);
    
    // Parse wedding guest QR code format: WEDDING_GUEST:guestId:guestName:timestamp
    if (!data.startsWith('WEDDING_GUEST:')) {
      const attempt: CheckInAttempt = {
        id: `attempt_${Date.now()}`,
        qrContent: data,
        timestamp: Date.now(),
        status: 'invalid'
      };
      
      onAddCheckInAttempt(attempt);
      setScanResult({
        type: 'invalid',
        message: 'Invalid wedding invitation QR code'
      });
      return;
    }

    const [, guestId, guestName] = data.split(':');
    const guest = guests.find(g => g.id === guestId);

    if (!guest) {
      const attempt: CheckInAttempt = {
        id: `attempt_${Date.now()}`,
        qrContent: data,
        timestamp: Date.now(),
        status: 'invalid'
      };
      
      onAddCheckInAttempt(attempt);
      setScanResult({
        type: 'invalid',
        message: 'Guest not found in wedding list'
      });
      return;
    }

    if (guest.checkedIn) {
      const attempt: CheckInAttempt = {
        id: `attempt_${Date.now()}`,
        qrContent: data,
        timestamp: Date.now(),
        status: 'duplicate',
        guestName: guest.guestName
      };
      
      onAddCheckInAttempt(attempt);
      setScanResult({
        type: 'duplicate',
        message: `${guest.guestName} has already checked in`,
        guestName: guest.guestName
      });
      return;
    }

    // Successful check-in
    onCheckIn(guest.id);
    
    const attempt: CheckInAttempt = {
      id: `attempt_${Date.now()}`,
      qrContent: data,
      timestamp: Date.now(),
      status: 'success',
      guestName: guest.guestName
    };
    
    onAddCheckInAttempt(attempt);
    setScanResult({
      type: 'success',
      message: `Welcome ${guest.guestName}! 🎉`,
      guestName: guest.guestName
    });

    // Show confetti animation
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    // Clear result after 3 seconds
    setTimeout(() => {
      setScanResult(null);
      setLastResult('');
    }, 3000);
  };

  const requestCameraPermission = async () => {
    await checkCameraAvailability();
  };

  return (
    <div className="space-y-6">
      {/* Scanner Controls */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-pink-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-playfair font-semibold text-gray-800">Wedding Entrance Scanner</h2>
          </div>
          
          <button
            onClick={isScanning ? stopScanning : startScanning}
            disabled={hasPermission === false}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 flex items-center space-x-2 ${
              hasPermission === false
                ? 'bg-gray-400 cursor-not-allowed'
                : isScanning
                ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
                : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700'
            }`}
          >
            {isScanning ? (
              <>
                <CameraOff className="w-4 h-4" />
                <span>Stop Scanner</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Start Scanner</span>
              </>
            )}
          </button>
        </div>

        {/* Camera Error Message */}
        {cameraError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">Camera Access Issue</p>
                <p className="text-red-700 text-sm mt-1">{cameraError}</p>
                {hasPermission === false && (
                  <button
                    onClick={requestCameraPermission}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Video Scanner */}
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full max-w-md mx-auto rounded-xl border-4 border-pink-200 bg-gray-100"
            style={{ display: isScanning ? 'block' : 'none' }}
            playsInline
            muted
          />
          
          {!isScanning && (
            <div className="w-full max-w-md mx-auto h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-4 border-gray-300 flex items-center justify-center">
              <div className="text-center">
                {hasPermission === null ? (
                  <>
                    <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600 font-medium">Checking camera...</p>
                  </>
                ) : hasPermission === false ? (
                  <>
                    <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-red-600 font-medium">Camera Permission Required</p>
                    <p className="text-sm text-red-500 mt-1">Please allow camera access to scan QR codes</p>
                  </>
                ) : (
                  <>
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Click "Start Scanner" to begin</p>
                    <p className="text-sm text-gray-500 mt-1">Point camera at wedding invitation QR codes</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scan Result */}
      {scanResult && (
        <div className={`relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 ${
          scanResult.type === 'success' ? 'border-green-300 bg-green-50/80' :
          scanResult.type === 'duplicate' ? 'border-yellow-300 bg-yellow-50/80' :
          'border-red-300 bg-red-50/80'
        }`}>
          {showConfetti && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <PartyPopper className="w-20 h-20 text-yellow-400 animate-bounce" />
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            {scanResult.type === 'success' && <CheckCircle className="w-8 h-8 text-green-600" />}
            {scanResult.type === 'duplicate' && <AlertTriangle className="w-8 h-8 text-yellow-600" />}
            {scanResult.type === 'invalid' && <XCircle className="w-8 h-8 text-red-600" />}
            
            <div>
              <p className={`text-lg font-playfair font-semibold ${
                scanResult.type === 'success' ? 'text-green-800' :
                scanResult.type === 'duplicate' ? 'text-yellow-800' :
                'text-red-800'
              }`}>
                {scanResult.message}
              </p>
              
              {scanResult.type === 'success' && (
                <p className="text-sm text-green-700 mt-1">
                  Enjoy the celebration! 💕
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-200">
        <h3 className="font-playfair font-semibold text-blue-800 mb-2">How to Use:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Allow camera permission when prompted by your browser</li>
          <li>• Click "Start Scanner" to activate the camera</li>
          <li>• Point the camera at a wedding invitation QR code</li>
          <li>• The system will automatically check in valid guests</li>
          <li>• Already checked-in guests will be politely notified</li>
        </ul>
      </div>
    </div>
  );
};

export default QRScanner;