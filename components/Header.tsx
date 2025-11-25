import React from 'react';
import { Palette, ShoppingBag } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <div className="w-full py-8 text-center bg-gradient-to-b from-slate-900 to-slate-800 border-b border-slate-700">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-3 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
          <Palette className="w-8 h-8 text-white" />
        </div>
        <div className="p-3 bg-rose-600 rounded-lg shadow-lg shadow-rose-500/30">
          <ShoppingBag className="w-8 h-8 text-white" />
        </div>
      </div>
      <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
        POD <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">Mockup Studio</span>
      </h1>
      <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
        Enter your slogan, and we'll generate 6 professional mockups ready for your Redbubble or Printful store.
      </p>
    </div>
  );
};

export default Header;