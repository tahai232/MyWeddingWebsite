import React, { useState } from 'react';
import { Plus, Download, UserPlus, Sparkles, Gift, Trash2, AlertTriangle, Shield, Lock, Hash } from 'lucide-react';
import { WeddingGuest } from '../types';
import { generateGuestQRCode, downloadQRCode } from '../utils/qrGenerator';

interface Props {
  guests: WeddingGuest[];
  onAddGuest: (guest: WeddingGuest) => void;
  onDownloadGuest: (guestId: string) => void;
  onDeleteGuest: (guestId: string) => void;
}

const AdminPage: React.FC<Props> = ({ guests, onAddGuest, onDownloadGuest, onDeleteGuest }) => {
  const [guestName, setGuestName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleGenerateGuest = async () => {
    if (!guestName.trim()) return;

    setIsGenerating(true);
    try {
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const qrContent = await generateGuestQRCode(guestId, guestName);
      
      const newGuest: WeddingGuest = {
        id: guestId,
        guestName: guestName.trim(),
        qrContent,
        generatedAt: Date.now(),
        downloaded: false,
        checkedIn: false
      };

      onAddGuest(newGuest);
      setGuestName('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error generating guest QR:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (guest: WeddingGuest) => {
    downloadQRCode(guest.qrContent, guest.guestName);
    onDownloadGuest(guest.id);
  };

  const handleDeleteClick = (guestId: string) => {
    setDeleteConfirm(guestId);
  };

  const confirmDelete = (guestId: string) => {
    onDeleteGuest(guestId);
    setDeleteConfirm(null);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Admin Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-playfair font-bold text-gray-800">Admin Panel</h1>
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-lg text-gray-600 font-playfair">Wedding Guest Management System</p>
          <div className="mt-2 text-sm text-gray-500">
            Generate and manage wedding invitations
          </div>
        </div>

        <div className="space-y-6">
          {/* Generation Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-playfair font-semibold text-gray-800">Generate Wedding Invitation</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter guest name..."
                  className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white/90"
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerateGuest()}
                />
              </div>
              <button
                onClick={handleGenerateGuest}
                disabled={!guestName.trim() || isGenerating}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 font-medium"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Generate QR</span>
                  </>
                )}
              </button>
            </div>

            {showSuccess && (
              <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg flex items-center space-x-2 text-green-800">
                <Gift className="w-4 h-4" />
                <span>Guest invitation created successfully! 🎉</span>
              </div>
            )}
          </div>

          {/* Guest List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-playfair font-semibold text-gray-800">Generated Invitations</h2>
              </div>
              <div className="text-sm text-gray-600">
                {guests.length} invitation{guests.length !== 1 ? 's' : ''} created
              </div>
            </div>

            {guests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-500 font-medium">No invitations generated yet</p>
                <p className="text-sm text-gray-400 mt-1">Start by creating your first wedding invitation above</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {guests.map((guest) => (
                  <div
                    key={guest.id}
                    className="bg-gradient-to-r from-white to-purple-50 rounded-xl p-4 border border-purple-100 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-center">
                          <img
                            src={guest.qrContent}
                            alt={`QR Code for ${guest.guestName}`}
                            className="w-16 h-16 rounded-lg border-2 border-purple-200 mb-2"
                          />
                          <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                            <Hash className="w-3 h-3" />
                            <span className="font-mono">{guest.id}</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-playfair font-semibold text-gray-800 text-lg">
                            {guest.guestName}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>Generated: {new Date(guest.generatedAt).toLocaleDateString()}</span>
                            {guest.downloaded && (
                              <span className="flex items-center space-x-1 text-blue-600">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>Downloaded</span>
                              </span>
                            )}
                            {guest.checkedIn && (
                              <span className="flex items-center space-x-1 text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Checked In</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(guest)}
                          className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Download</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(guest.id)}
                          className="p-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-playfair font-semibold text-gray-800">Confirm Delete</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this guest invitation? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => confirmDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-medium"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap');
          
          .font-dancing {
            font-family: 'Dancing Script', cursive;
          }
          
          .font-playfair {
            font-family: 'Playfair Display', serif;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AdminPage;