import React, { useState } from 'react';
import { Wand2, Loader2, Sparkles, PenTool, Paintbrush } from 'lucide-react';
import { NICHES, DESIGN_STYLES } from '../constants';

interface PromptInputProps {
  onGenerate: (slogan: string, niche: string, styleContext: string) => void;
  isGenerating: boolean;
  statusText?: string;
}

const PromptInput: React.FC<PromptInputProps> = ({ onGenerate, isGenerating, statusText }) => {
  const [slogan, setSlogan] = useState('');
  const [selectedNicheId, setSelectedNicheId] = useState(NICHES[0].id);
  const [customNiche, setCustomNiche] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState(DESIGN_STYLES[0].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine the final niche string to send
    let finalNiche = '';
    if (selectedNicheId === 'custom') {
        finalNiche = customNiche.trim();
    } else {
        const nicheObj = NICHES.find(n => n.id === selectedNicheId);
        finalNiche = nicheObj ? nicheObj.label : selectedNicheId;
    }

    // Determine Style Context
    const styleObj = DESIGN_STYLES.find(s => s.id === selectedStyleId) || DESIGN_STYLES[0];
    const styleContext = styleObj.context;

    if (slogan.trim() && finalNiche) {
      onGenerate(slogan, finalNiche, styleContext);
    }
  };

  const isCustomNiche = selectedNicheId === 'custom';

  return (
    <div className="w-full max-w-4xl mx-auto -mt-6 relative z-10 px-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-700 flex flex-col gap-4">
        
        {/* Row 1: Selections */}
        <div className="flex flex-col sm:flex-row gap-3">
            {/* Niche Selector */}
            <div className={`${isCustomNiche ? 'sm:w-1/3' : 'sm:w-1/2'} transition-all duration-300`}>
                <label className="block text-xs text-slate-400 font-semibold mb-1 ml-1">Target Niche</label>
                <div className="relative">
                  <select
                    value={selectedNicheId}
                    onChange={(e) => setSelectedNicheId(e.target.value)}
                    className="w-full appearance-none bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer truncate pr-8 text-sm"
                    disabled={isGenerating}
                  >
                    {NICHES.map((n) => (
                        <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
            </div>

            {/* Custom Niche Input */}
            {isCustomNiche && (
                <div className="flex-1 animate-in fade-in zoom-in-95 duration-200">
                    <label className="block text-xs text-indigo-400 font-semibold mb-1 ml-1">Describe Niche</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={customNiche}
                            onChange={(e) => setCustomNiche(e.target.value)}
                            placeholder="e.g. Zombie Apocalypse..."
                            className="w-full bg-slate-900 text-white placeholder-slate-500 px-4 py-3 rounded-xl border border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                            disabled={isGenerating}
                            autoFocus
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
                            <PenTool className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            )}

            {/* Style Selector */}
            <div className="sm:w-1/2">
                <label className="block text-xs text-slate-400 font-semibold mb-1 ml-1">Design Style (Trend)</label>
                <div className="relative">
                  <select
                    value={selectedStyleId}
                    onChange={(e) => setSelectedStyleId(e.target.value)}
                    className="w-full appearance-none bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer truncate pr-8 text-sm"
                    disabled={isGenerating}
                  >
                    {DESIGN_STYLES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <Paintbrush className="w-4 h-4" />
                  </div>
                </div>
            </div>
        </div>

        {/* Row 2: Slogan Input */}
        <div>
            <label className="block text-xs text-slate-400 font-semibold mb-1 ml-1">Slogan / Quote</label>
            <input
            type="text"
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            placeholder="e.g., 'Coffee First, Problems Later'"
            className="w-full bg-slate-900 text-white placeholder-slate-500 px-6 py-4 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
            disabled={isGenerating}
            />
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isGenerating || !slogan.trim() || (isCustomNiche && !customNiche.trim())}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{statusText || 'Processing...'}</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>Generate Design Strategy & Assets</span>
            </>
          )}
        </button>
      </form>
      <div className="text-center mt-3 text-slate-500 text-xs">
        Powered by Gemini 2.5 Flash & Flash Image Model
      </div>
    </div>
  );
};

export default PromptInput;