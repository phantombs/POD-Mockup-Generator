import React, { useState } from 'react';
import { Loader2, Sparkles, Users, BrainCircuit, Palette, Film, Wand2, Lightbulb, X, Search, Copy, Telescope, Calendar } from 'lucide-react';
import { generateSloganSuggestions } from '../services/geminiService';
import { TrendingSlogan } from '../types';

interface PromptInputProps {
  onGenerate: (slogan: string, audience: string) => void;
  isGenerating: boolean;
  statusText?: string;
}

const PromptInput: React.FC<PromptInputProps> = ({ 
  onGenerate, 
  isGenerating, 
  statusText,
}) => {
  const [slogan, setSlogan] = useState('');
  const [audience, setAudience] = useState('');
  
  // State for the new Trend Spy modal
  const [isTrendSpyModalOpen, setIsTrendSpyModalOpen] = useState(false);
  const [isSearchingTrends, setIsSearchingTrends] = useState(false);
  const [trendResults, setTrendResults] = useState<TrendingSlogan[] | null>(null);
  const [searchTopic, setSearchTopic] = useState('');
  const [searchTimeframe, setSearchTimeframe] = useState('Past 7 days');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (slogan.trim()) {
      onGenerate(slogan, audience);
    }
  };

  const handleOpenTrendSpy = () => {
    setTrendResults(null);
    setSearchTopic('');
    setIsTrendSpyModalOpen(true);
  };
  
  const handleSearchTrends = async () => {
    setIsSearchingTrends(true);
    setTrendResults(null);
    try {
      const suggestions = await generateSloganSuggestions(audience, searchTopic, searchTimeframe);
      if (suggestions && suggestions.length > 0) {
        setTrendResults(suggestions);
      } else {
        // Handle no results found
        setTrendResults([]);
      }
    } catch (error) {
      console.error("Failed to search trends:", error);
      alert("Sorry, the AI analyst is busy. Please try again in a moment.");
    } finally {
      setIsSearchingTrends(false);
    }
  };


  const handleSelectSlogan = (selectedSlogan: string) => {
    setSlogan(selectedSlogan);
    setIsTrendSpyModalOpen(false);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto -mt-6 relative z-10 px-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700 flex flex-col gap-5">
        
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
                <div className="relative">
                  <input
                      type="text"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      placeholder="e.g., 'Not all who wander are lost'"
                      className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium pr-10"
                      disabled={isGenerating}
                  />
                  <button 
                    type="button" 
                    onClick={handleOpenTrendSpy}
                    disabled={isGenerating}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md"
                    title="Open Trend Spy Tool"
                  >
                    <Telescope className="w-4 h-4" />
                  </button>
                </div>
            </div>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isGenerating || !slogan.trim()}
          className="w-full font-bold px-8 py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{statusText || 'Brainstorming Market Strategy...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate Viral Design & Mockups</span>
            </>
          )}
        </button>
      </form>
      <div className="text-center mt-4 text-slate-500 text-xs flex items-center justify-center gap-3">
        <span className="flex items-center gap-1"><BrainCircuit className="w-3 h-3" /> Strategy: Gemini 3 Flash</span>
        <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> Image: Gemini Flash Image</span>
        <span className="flex items-center gap-1"><Film className="w-3 h-3" /> Video: Veo</span>
      </div>

      {isTrendSpyModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <div className='flex items-center gap-2'>
                <Telescope className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Market Trend Spy</h3>
              </div>
              <button onClick={() => setIsTrendSpyModalOpen(false)} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 border-b border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1 ml-1">Niche / Chủ đề</label>
                    <div className="relative">
                        <input type="text" value={searchTopic} onChange={(e) => setSearchTopic(e.target.value)} placeholder="e.g., Corgi dogs, Programming, Books"
                            className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm pl-10" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1 ml-1">Khoảng thời gian</label>
                  <div className="relative">
                    <select value={searchTimeframe} onChange={(e) => setSearchTimeframe(e.target.value)}
                      className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none pl-10"
                    >
                      <option>Past 7 days</option>
                      <option>Past 30 days</option>
                      <option>Past 90 days</option>
                    </select>
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>
               <button onClick={handleSearchTrends} disabled={isSearchingTrends} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                {isSearchingTrends ? <><Loader2 className="w-5 h-5 animate-spin" /> <span>Analyzing Trends...</span></> : <> <Telescope className="w-5 h-5" /> <span>Find Hot Trends</span> </>}
               </button>
            </div>

            <div className="p-2 sm:p-4 overflow-y-auto">
              {isSearchingTrends && (
                <div className='flex flex-col items-center justify-center text-center py-16'>
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
                  <p className="text-white font-semibold">AI is analyzing market data...</p>
                  <p className="text-slate-400 text-sm">This may take a moment.</p>
                </div>
              )}
              {trendResults && !isSearchingTrends && (
                trendResults.length > 0 ? (
                  <ul className="space-y-3">
                    {trendResults.map((item, index) => (
                      <li key={index} className="animate-in fade-in-50 duration-500">
                        <div className="w-full text-left p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                          <button onClick={() => handleSelectSlogan(item.slogan)} className="w-full text-left group">
                            <p className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                              <span className="text-indigo-400 font-black mr-2 text-lg">{index + 1}.</span>
                              {item.slogan}
                            </p>
                          </button>
                          <div className="flex items-start gap-2 mt-2 pl-6">
                            <Lightbulb className="w-4 h-4 text-amber-400/80 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-400">{item.rationale}</p>
                          </div>
                          <div className="flex items-center justify-between mt-3 pl-6 gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Search className="w-4 h-4 text-sky-400/80 flex-shrink-0" />
                              <p className="text-xs text-slate-400 truncate select-all" title={item.suggestedSearchTerm}>
                                {item.suggestedSearchTerm}
                              </p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleCopyText(item.suggestedSearchTerm); }} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600 px-2 py-1 rounded-md transition-colors flex-shrink-0">
                              <Copy className="w-3 h-3" />
                              <span>{copiedText === item.suggestedSearchTerm ? 'Copied!' : 'Copy Term'}</span>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className='flex flex-col items-center justify-center text-center py-16'>
                    <Search className="w-8 h-8 text-slate-500 mb-4" />
                    <p className="text-white font-semibold">No specific trends found</p>
                    <p className="text-slate-400 text-sm">Try a broader topic or a different timeframe.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptInput;