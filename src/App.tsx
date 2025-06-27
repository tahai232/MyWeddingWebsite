import React, { useState } from 'react';
import { Camera, BarChart3, Shield } from 'lucide-react';
import WeddingHeader from './components/WeddingHeader';
import AdminPage from './components/AdminPage';
import QRScanner from './components/QRScanner';
import GuestHistory from './components/GuestHistory';
import { useLocalStorage } from './hooks/useLocalStorage';
import { WeddingGuest, CheckInAttempt, TabType } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('scanner');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [guests, setGuests] = useLocalStorage<WeddingGuest[]>('wedding-guests', []);
  const [checkIns, setCheckIns] = useLocalStorage<CheckInAttempt[]>('check-in-attempts', []);

  // Simple admin password (in production, use proper authentication)
  const ADMIN_PASSWORD = 'wedding2024';

  const handleAddGuest = (guest: WeddingGuest) => {
    setGuests(prev => [...prev, guest]);
  };

  const handleDownloadGuest = (guestId: string) => {
    setGuests(prev => 
      prev.map(guest => 
        guest.id === guestId 
          ? { ...guest, downloaded: true }
          : guest
      )
    );
  };

  const handleDeleteGuest = (guestId: string) => {
    setGuests(prev => prev.filter(guest => guest.id !== guestId));
    // Also remove any check-in attempts for this guest
    setCheckIns(prev => prev.filter(attempt => 
      !attempt.qrContent.includes(guestId)
    ));
  };

  const handleCheckIn = (guestId: string) => {
    setGuests(prev => 
      prev.map(guest => 
        guest.id === guestId 
          ? { ...guest, checkedIn: true, checkInTime: Date.now() }
          : guest
      )
    );
  };

  const handleAddCheckInAttempt = (attempt: CheckInAttempt) => {
    setCheckIns(prev => [...prev, attempt]);
  };

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setShowAdmin(true);
      setAdminPassword('');
    } else {
      alert('Incorrect password');
      setAdminPassword('');
    }
  };

  const handleAdminLogout = () => {
    setShowAdmin(false);
    setActiveTab('scanner');
  };

  // If admin is logged in, show admin page
  if (showAdmin) {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleAdminLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Exit Admin
          </button>
        </div>
        <AdminPage
          guests={guests}
          onAddGuest={handleAddGuest}
          onDownloadGuest={handleDownloadGuest}
          onDeleteGuest={handleDeleteGuest}
        />
      </div>
    );
  }

  const tabs = [
    { id: 'scanner', label: 'Entrance Scanner', icon: Camera },
    { id: 'guests', label: 'Guest Management', icon: BarChart3 },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <WeddingHeader />

        {/* Admin Access Button */}
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center space-x-2">
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin password"
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <button
              onClick={handleAdminLogin}
              className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
              title="Admin Access"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 mb-8 shadow-lg border border-pink-100">
          <div className="flex flex-col sm:flex-row">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === 'scanner' && (
            <QRScanner
              guests={guests}
              onCheckIn={handleCheckIn}
              onAddCheckInAttempt={handleAddCheckInAttempt}
            />
          )}
          
          {activeTab === 'guests' && (
            <GuestHistory
              guests={guests}
              checkIns={checkIns}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap');
        
        .font-dancing {
          font-family: 'Dancing Script', cursive;
        }
        
        .font-playfair {
          font-family: 'Playfair Display', serif;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default App;