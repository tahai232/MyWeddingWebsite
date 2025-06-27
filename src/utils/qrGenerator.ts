import QRCode from 'qrcode';

export const generateGuestQRCode = async (guestId: string, guestName: string): Promise<string> => {
  const qrData = `WEDDING_GUEST:${guestId}:${guestName}:${Date.now()}`;
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#9581b9',    // Purple QR code
        light: '#00000000'  // Transparent background
      },
      width: 256
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const downloadQRCode = (dataURL: string, guestName: string) => {
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = `${guestName.replace(/\s+/g, '_')}_Wedding_Invitation.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};