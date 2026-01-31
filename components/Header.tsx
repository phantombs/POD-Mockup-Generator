import React from 'react';
import { Palette, ShoppingBag, Sparkles, Key, CheckCircle } from 'lucide-react';

interface HeaderProps {
  onOpenKeyManager: () => void;
  activeKeyDisplay: string | null;
}

const Header: React.FC<HeaderProps> = ({ onOpenKeyManager, activeKeyDisplay }) => {
  return (
    <div className="relative w-full py-8 text-center bg-gradient-to-b from-slate-900 to-slate-800 border-b border-slate-700">
      
      <div className="absolute top-4 right-4">
        <button 
          onClick={onOpenKeyManager}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
        >
          <Key className="w-4 h-4 text-amber-400" />
          <div className="text-left">
            <span className="font-bold">API Key Manager</span>
            {activeKeyDisplay ? (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-slate-400 font-mono">{activeKeyDisplay}</span>
              </div>
            ) : (
              <span className="text-slate-400">Using default key</span>
            )}
          </div>
        </button>
      </div>

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
      <div className="mt-4 flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
        <p className="max-w-2xl text-lg text-slate-400">
          Pro-Grade AI Design Engine for Print-on-Demand.
        </p>
      </div>
    </div>
  );
};

export default Header;
