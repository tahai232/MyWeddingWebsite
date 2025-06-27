export interface WeddingGuest {
  id: string;
  guestName: string;
  qrContent: string;
  generatedAt: number;
  downloaded: boolean;
  checkedIn: boolean;
  checkInTime?: number;
}

export interface CheckInAttempt {
  id: string;
  qrContent: string;
  timestamp: number;
  status: 'success' | 'duplicate' | 'invalid';
  guestName?: string;
}

export type TabType = 'scanner' | 'guests';