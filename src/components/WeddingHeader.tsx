import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

const WeddingHeader: React.FC = () => {
  return (
    <div className="text-center mb-8 relative">
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-2 animate-pulse">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          <Heart className="w-8 h-8 text-pink-400 animate-bounce" />
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </div>
      </div>
      
      <h1 className="text-5xl md:text-6xl font-dancing text-gradient bg-gradient-to-r from-pink-600 via-purple-600 to-yellow-500 bg-clip-text text-transparent mb-2">
        Qusay & Tahani
      </h1>
      
      <div className="flex items-center justify-center space-x-3 mb-4">
        <div className="h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent flex-1 max-w-20"></div>
        <Heart className="w-4 h-4 text-pink-500" />
        <div className="h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent flex-1 max-w-20"></div>
      </div>
      
      <p className="text-lg text-gray-600 font-playfair">Wedding Entrance System</p>
      
      <div className="mt-4 text-sm text-gray-500">
        Creating magical moments, one guest at a time ✨
      </div>
    </div>
  );
};

export default WeddingHeader;