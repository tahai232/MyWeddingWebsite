import React from 'react';
import { Users, Clock, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react';
import { WeddingGuest, CheckInAttempt } from '../types';

interface Props {
  guests: WeddingGuest[];
  checkIns: CheckInAttempt[];
}

const GuestHistory: React.FC<Props> = ({ guests, checkIns }) => {
  const checkedInGuests = guests.filter(g => g.checkedIn);
  const totalGuests = guests.length;
  const totalCheckIns = checkIns.filter(c => c.status === 'success').length;

  const getStatusIcon = (status: CheckInAttempt['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'duplicate':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: CheckInAttempt['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'duplicate':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'invalid':
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Guests</p>
              <p className="text-3xl font-bold">{totalGuests}</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Checked In</p>
              <p className="text-3xl font-bold">{checkedInGuests.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm">Attendance Rate</p>
              <p className="text-3xl font-bold">
                {totalGuests > 0 ? Math.round((checkedInGuests.length / totalGuests) * 100) : 0}%
              </p>
            </div>
            <Download className="w-8 h-8 text-pink-200" />
          </div>
        </div>
      </div>

      {/* Checked In Guests */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-pink-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-playfair font-semibold text-gray-800">Checked In Guests</h2>
        </div>

        {checkedInGuests.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-gray-500 font-medium">No guests have checked in yet</p>
            <p className="text-sm text-gray-400 mt-1">Check-ins will appear here as guests arrive</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {checkedInGuests.map((guest) => (
              <div
                key={guest.id}
                className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border border-green-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-playfair font-semibold text-gray-800">
                      {guest.guestName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Checked in: {guest.checkInTime ? new Date(guest.checkInTime).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Present</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Check-in Attempts */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-pink-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-playfair font-semibold text-gray-800">Recent Activity</h2>
        </div>

        {checkIns.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-gray-500 font-medium">No scan attempts yet</p>
            <p className="text-sm text-gray-400 mt-1">Scanner activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {checkIns
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((attempt) => (
                <div
                  key={attempt.id}
                  className={`p-3 rounded-lg border ${getStatusColor(attempt.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(attempt.status)}
                      <div>
                        <p className="font-medium">
                          {attempt.guestName || 'Unknown Guest'}
                        </p>
                        <p className="text-sm opacity-75">
                          {new Date(attempt.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs font-medium uppercase tracking-wide">
                      {attempt.status}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestHistory;