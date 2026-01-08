import React, { useState } from 'react';
import { Wand2, Loader2, Sparkles, PenTool, Paintbrush, Users, Palette } from 'lucide-react';
import { NICHES, DESIGN_STYLES, COLOR_PALETTES } from '../constants';

interface PromptInputProps {
  onGenerate: (slogan: string, niche: string, styleContext: string, audience: string, colorContext: string) => void;
  isGenerating: boolean;
  statusText?: string;
}

const PromptInput: React.FC<PromptInputProps> = ({ onGenerate, isGenerating, statusText }) => {
  const [slogan, setSlogan] = useState('');
  const [selectedNicheId, setSelectedNicheId] = useState(NICHES[0].id);
  const [customNiche, setCustomNiche] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState(DESIGN_STYLES[0].id);
  const [selectedColorId, setSelectedColorId] = useState(COLOR_PALETTES[0].id);
  const [audience, setAudience] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalNiche = '';
    if (selectedNicheId === 'custom') {
        finalNiche = customNiche.trim();
    } else {
        const nicheObj = NICHES.find(n => n.id === selectedNicheId);
        finalNiche = nicheObj ? nicheObj.label : selectedNicheId;
    }

    const styleObj = DESIGN_STYLES.find(s => s.id === selectedStyleId) || DESIGN_STYLES[0];
    const colorObj = COLOR_PALETTES.find(c => c.id === selectedColorId) || COLOR_PALETTES[0];

    if (slogan.trim() && finalNiche) {
      onGenerate(slogan, finalNiche, styleObj.context, audience, colorObj.context);
    }
  };

  const isCustomNiche = selectedNicheId === 'custom';

  return (
    <div className="w-full max-w-5xl mx-auto -mt-6 relative z-10 px-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700 flex flex-col gap-5">
        
        {/* Row 1: Primary Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Niche & Custom */}
            <div className="flex flex-col gap-3">
                <div className="relative">
                  <label className="block text-xs text-slate-400 font-semibold mb-1 ml-1">Target Niche</label>
                  <select
                    value={selectedNicheId}
                    onChange={(e) => setSelectedNicheId(e.target.value)}
                    className="w-full appearance-none bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm pr-10"
                    disabled={isGenerating}
                  >
                    {NICHES.map((n) => (
                        <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                  <Sparkles className="absolute right-3 top-[34px] w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                {isCustomNiche && (
                    <input
                        type="text"
                        value={customNiche}
                        onChange={(e) => setCustomNiche(e.target.value)}
                        placeholder="Type niche..."
                        className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        disabled={isGenerating}
                    />
                )}
            </div>

            {/* Style Selector */}
            <div className="relative">
                <label className="block text-xs text-slate-400 font-semibold mb-1 ml-1">Visual Trend</label>
                <select
                    value={selectedStyleId}
                    onChange={(e) => setSelectedStyleId(e.target.value)}
                    className="w-full appearance-none bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm pr-10"
                    disabled={isGenerating}
                >
                    {DESIGN_STYLES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                </select>
                <Paintbrush className="absolute right-3 top-10 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            {/* Color Palette Selector */}
            <div className="relative">
                <label className="block text-xs text-slate-400 font-semibold mb-1 ml-1">Color Palette</label>
                <div className="grid grid-cols-3 gap-2">
                    {COLOR_PALETTES.map((cp) => (
                        <button
                            key={cp.id}
                            type="button"
                            onClick={() => setSelectedColorId(cp.id)}
                            className={`p-1 rounded-lg border transition-all ${selectedColorId === cp.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}
                            title={cp.label}
                        >
                            <div className="flex gap-0.5 mb-1 justify-center">
                                {cp.colors.map((c, i) => (
                                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                                ))}
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate">{cp.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Row 2: Audience & Slogan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
                <label className="block text-xs text-slate-400 font-semibold mb-1 ml-1">Who is this for? (Audience)</label>
                <div className="relative">
                    <input
                        type="text"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="e.g., Cat Lovers, Proud Teachers, Gen Z..."
                        className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm pl-10"
                        disabled={isGenerating}
                    />
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
            </div>

            <div className="relative">
                <label className="block text-xs text-slate-400 font-semibold mb-1 ml-1">Slogan / Text on Shirt</label>
                <input
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="e.g., 'Not all who wander are lost'"
                    className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                    disabled={isGenerating}
                />
            </div>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isGenerating || !slogan.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{statusText || 'Brainstorming Market Strategy...'}</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>Generate Viral Design & Mockups</span>
            </>
          )}
        </button>
      </form>
      <div className="text-center mt-4 text-slate-500 text-xs flex items-center justify-center gap-4">
        <span className="flex items-center gap-1"><BrainCircuit className="w-3 h-3" /> Strategy: Gemini 3 Pro</span>
        <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> Image: Gemini 2.5 Flash Image</span>
      </div>
    </div>
  );
};

export default PromptInput;
import { BrainCircuit } from 'lucide-react';