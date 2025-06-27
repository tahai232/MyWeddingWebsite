import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, CheckCircle, XCircle, AlertTriangle, PartyPopper, Shield, X, Maximize } from 'lucide-react';
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
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'duplicate' | 'invalid';
    message: string;
    guestName?: string;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Check camera availability on component mount
    checkCameraAvailability();
    
    return () => {
      cleanupScanner();
    };
  }, []);

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCameraModal) {
        handleCloseCamera();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showCameraModal]);

  // Initialize scanner when modal is shown and video element is available
  useEffect(() => {
    if (showCameraModal && isInitializing && videoRef.current) {
      initializeScanner();
    }
  }, [showCameraModal, isInitializing, videoRef.current]);

  const cleanupScanner = () => {
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      } catch (error) {
        console.log('Scanner cleanup error:', error);
      }
      qrScannerRef.current = null;
    }
  };

  const checkCameraAvailability = async () => {
    try {
      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setCameraError('No camera found on this device');
        setHasPermission(false);
        return;
      }

      setHasPermission(true);
      setCameraError('');
    } catch (error) {
      console.error('Camera availability check error:', error);
      setHasPermission(false);
      setCameraError('Unable to access camera. Please check your browser settings.');
    }
  };

  const initializeScanner = async () => {
    try {
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      // Clean up any existing scanner
      cleanupScanner();

      // Create new scanner
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result.data),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 3,
          returnDetailedScanResult: false,
        }
      );

      // Start the scanner
      await qrScannerRef.current.start();
      setIsScanning(true);
      setIsInitializing(false);
      console.log('QR Scanner started successfully');

    } catch (error) {
      console.error('Error starting QR scanner:', error);
      setIsScanning(false);
      setIsInitializing(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('Camera permission denied. Please allow camera access and try again.');
          setHasPermission(false);
        } else if (error.name === 'NotFoundError') {
          setCameraError('Camera not found. Please ensure your device has a camera.');
        } else if (error.name === 'NotReadableError') {
          setCameraError('Camera is being used by another application.');
        } else {
          setCameraError(`Failed to start camera: ${error.message}`);
        }
      } else {
        setCameraError('Failed to start camera. Please try again.');
      }
    }
  };

  const startScanning = async () => {
    if (hasPermission === false) {
      setCameraError('Camera permission is required to scan QR codes');
      return;
    }

    setIsInitializing(true);
    setShowCameraModal(true);
    setCameraError('');
    setScanResult(null);
  };

  const handleCloseCamera = () => {
    cleanupScanner();
    setIsScanning(false);
    setShowCameraModal(false);
    setIsInitializing(false);
    setScanResult(null);
    setLastResult('');
  };

  const handleScanResult = (data: string) => {
    if (data === lastResult) return; // Prevent duplicate scans
    
    setLastResult(data);
    console.log('QR Code scanned:', data);
    
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

    const parts = data.split(':');
    if (parts.length < 3) {
      const attempt: CheckInAttempt = {
        id: `attempt_${Date.now()}`,
        qrContent: data,
        timestamp: Date.now(),
        status: 'invalid'
      };
      
      onAddCheckInAttempt(attempt);
      setScanResult({
        type: 'invalid',
        message: 'Invalid QR code format'
      });
      return;
    }

    const [, guestId, guestName] = parts;
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

    // Auto-close camera after successful scan
    setTimeout(() => {
      handleCloseCamera();
    }, 2500);
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setCameraError('');
    } catch (error) {
      console.error('Permission request error:', error);
      setHasPermission(false);
      setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
    }
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
            onClick={startScanning}
            disabled={hasPermission === false || isScanning || isInitializing}
            className={`px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 flex items-center space-x-2 ${
              hasPermission === false
                ? 'bg-gray-400 cursor-not-allowed'
                : isScanning || isInitializing
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isInitializing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Starting Camera...</span>
              </>
            ) : (
              <>
                <Maximize className="w-5 h-5" />
                <span>{isScanning ? 'Scanner Active' : 'Open Camera Scanner'}</span>
              </>
            )}
          </button>
        </div>

        {/* Camera Error Message */}
        {cameraError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Camera Access Issue</p>
                <p className="text-red-700 text-sm mt-1">{cameraError}</p>
                {hasPermission === false && (
                  <button
                    onClick={requestCameraPermission}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Request Permission
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Area */}
        <div className="relative">
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
                  <p className="text-gray-600 font-medium">Click "Open Camera Scanner" to begin</p>
                  <p className="text-sm text-gray-500 mt-1">Camera will open in a popup window</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal Popup */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-playfair font-semibold text-gray-800">QR Code Scanner</h3>
                {isScanning && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Active</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleCloseCamera}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Camera Feed */}
            <div className="relative mb-4">
              {isInitializing ? (
                <div className="w-full h-96 bg-gray-100 rounded-xl border-4 border-pink-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600 font-medium">Starting camera...</p>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-96 object-cover rounded-xl border-4 border-pink-200 bg-gray-100"
                    playsInline
                    muted
                    autoPlay
                  />
                  
                  {/* Scanning Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative">
                        <div className="w-48 h-48 border-4 border-green-400 rounded-lg animate-pulse">
                          {/* Corner brackets */}
                          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <p className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Scanning...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Error in Modal */}
            {cameraError && showCameraModal && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <p className="text-red-800 text-sm">{cameraError}</p>
                </div>
              </div>
            )}

            {/* Scan Result in Modal */}
            {scanResult && (
              <div className={`relative mb-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                scanResult.type === 'success' ? 'border-green-300 bg-green-50' :
                scanResult.type === 'duplicate' ? 'border-yellow-300 bg-yellow-50' :
                'border-red-300 bg-red-50'
              }`}>
                {showConfetti && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <PartyPopper className="w-12 h-12 text-yellow-400 animate-bounce" />
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  {scanResult.type === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
                  {scanResult.type === 'duplicate' && <AlertTriangle className="w-6 h-6 text-yellow-600" />}
                  {scanResult.type === 'invalid' && <XCircle className="w-6 h-6 text-red-600" />}
                  
                  <div>
                    <p className={`font-playfair font-semibold ${
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

            {/* Modal Instructions */}
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 mb-4">
              <p className="text-sm text-blue-700 text-center">
                <strong>Point your camera at a wedding invitation QR code</strong>
                <br />
                The scanner will automatically detect and process valid codes
              </p>
            </div>

            {/* Close Button */}
            <div className="flex justify-center">
              <button
                onClick={handleCloseCamera}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
              >
                <CameraOff className="w-4 h-4" />
                <span>Close Scanner</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-200">
        <h3 className="font-playfair font-semibold text-blue-800 mb-2">How to Use:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Allow camera permission when prompted by your browser</li>
          <li>• Click "Open Camera Scanner" to launch the camera popup</li>
          <li>• Point the camera at a wedding invitation QR code</li>
          <li>• The system will automatically check in valid guests</li>
          <li>• Press Escape or click the close button to exit the scanner</li>
        </ul>
      </div>
    </div>
  );
};

export default QRScanner;