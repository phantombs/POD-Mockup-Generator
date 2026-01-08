import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { DESIGN_ASSET_CONFIG, PRODUCT_MOCKUP_CONFIGS, INITIAL_IMAGES } from './constants';
import { GeneratedImage, GenerationStatus, DesignStrategy } from './types';
import { generateMockupImage, generateDesignStrategy } from './services/geminiService';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import ImageCard from './components/ImageCard';
import { CheckCircle2, RefreshCw, Download, Loader2, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [images, setImages] = useState<GeneratedImage[]>(INITIAL_IMAGES);
  const [currentSlogan, setCurrentSlogan] = useState<string>('');
  const [currentNiche, setCurrentNiche] = useState<string>('');
  const [currentAudience, setCurrentAudience] = useState<string>('');
  const [designStrategy, setDesignStrategy] = useState<DesignStrategy | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [isZipping, setIsZipping] = useState(false);

  const handleGenerateDesign = async (
    slogan: string, 
    niche: string, 
    styleContext: string, 
    audience: string, 
    colorContext: string
  ) => {
    setCurrentSlogan(slogan);
    setCurrentNiche(niche);
    setCurrentAudience(audience);
    setStatus(GenerationStatus.ANALYZING);
    
    setImages(INITIAL_IMAGES.map(img => ({ ...img, loading: img.configId === DESIGN_ASSET_CONFIG.id, error: null, imageUrl: null })));

    try {
      const strategy = await generateDesignStrategy(slogan, niche, styleContext, audience, colorContext);
      setDesignStrategy(strategy);
      
      setStatus(GenerationStatus.GENERATING_ASSET);
      const base64Url = await generateMockupImage(DESIGN_ASSET_CONFIG.template(slogan, strategy));
      
      setImages(prev => prev.map(img => 
        img.configId === DESIGN_ASSET_CONFIG.id 
          ? { ...img, loading: false, imageUrl: base64Url }
          : img
      ));
      setStatus(GenerationStatus.REVIEW_ASSET);
    } catch (error) {
      setImages(prev => prev.map(img => 
        img.configId === DESIGN_ASSET_CONFIG.id 
          ? { ...img, loading: false, error: 'Failed to generate design asset.' }
          : img
      ));
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleRegenerateDesign = async () => {
    if (!currentSlogan) return;
    
    setStatus(GenerationStatus.GENERATING_ASSET);
    setImages(prev => prev.map(img => 
        img.configId === DESIGN_ASSET_CONFIG.id ? { ...img, loading: true, error: null } : img
    ));

    try {
        const base64Url = await generateMockupImage(DESIGN_ASSET_CONFIG.template(currentSlogan, designStrategy || undefined));
        
        setImages(prev => prev.map(img => 
          img.configId === DESIGN_ASSET_CONFIG.id 
            ? { ...img, loading: false, imageUrl: base64Url }
            : img
        ));
        setStatus(GenerationStatus.REVIEW_ASSET);
    } catch (error) {
        setImages(prev => prev.map(img => 
            img.configId === DESIGN_ASSET_CONFIG.id ? { ...img, loading: false, error: 'Retry failed.' } : img
        ));
        setStatus(GenerationStatus.ERROR);
    }
  };

  const handleApproveAndGenerateMockups = async () => {
    const designAsset = images.find(img => img.configId === DESIGN_ASSET_CONFIG.id);
    if (!designAsset?.imageUrl || !designStrategy) return;

    setStatus(GenerationStatus.GENERATING_MOCKUPS);
    
    setImages(prev => prev.map(img => 
      img.configId !== DESIGN_ASSET_CONFIG.id 
        ? { ...img, loading: true, error: null } 
        : img
    ));

    PRODUCT_MOCKUP_CONFIGS.forEach((config) => {
      generateSingleMockup(config.id, config.template(currentSlogan, designStrategy), designAsset.imageUrl!);
    });
  };

  const generateSingleMockup = async (configId: string, prompt: string, referenceImage: string) => {
    try {
      const base64Url = await generateMockupImage(prompt, referenceImage);
      setImages((prev) =>
        prev.map((img) =>
          img.configId === configId ? { ...img, loading: false, imageUrl: base64Url } : img
        )
      );
    } catch (error) {
      setImages((prev) =>
        prev.map((img) =>
          img.configId === configId ? { ...img, loading: false, error: 'Generation error.' } : img
        )
      );
    }
  };

  React.useEffect(() => {
    const isMockupsLoading = images.filter(i => i.configId !== DESIGN_ASSET_CONFIG.id).some(img => img.loading);
    if (!isMockupsLoading && status === GenerationStatus.GENERATING_MOCKUPS) {
      setStatus(GenerationStatus.COMPLETED);
    }
  }, [images, status]);

  const handleRetry = useCallback((configId: string) => {
    if (!currentSlogan) return;
    if (configId === DESIGN_ASSET_CONFIG.id) {
      handleRegenerateDesign();
      return;
    }
    const designAsset = images.find(img => img.configId === DESIGN_ASSET_CONFIG.id);
    const config = PRODUCT_MOCKUP_CONFIGS.find(c => c.id === configId);
    if (config && designAsset?.imageUrl) {
      setImages((prev) =>
        prev.map((img) => img.configId === configId ? { ...img, loading: true, error: null } : img)
      );
      generateSingleMockup(configId, config.template(currentSlogan, designStrategy || undefined), designAsset.imageUrl);
    }
  }, [currentSlogan, images, designStrategy]);

  const handleDownloadAll = async () => {
    setIsZipping(true);
    const zip = new JSZip();
    const folder = zip.folder(`pod-mockups-${Date.now()}`);
    if (folder) {
      images.forEach((img) => {
        if (img.imageUrl) {
          const data = img.imageUrl.split(',')[1];
          const cleanTitle = img.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
          folder.file(`${cleanTitle}.png`, data, { base64: true });
        }
      });
      try {
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `mockups-${currentSlogan.slice(0, 15)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Zipping failed", err);
      }
    }
    setIsZipping(false);
  };

  const getStatusText = () => {
    if (status === GenerationStatus.ANALYZING) return "AI Strategist is thinking...";
    if (status === GenerationStatus.GENERATING_ASSET) return "Drafting Design Asset...";
    return "Processing...";
  }

  return (
    <div className="min-h-screen pb-20 bg-slate-900">
      <Header />
      
      <div className={status === GenerationStatus.REVIEW_ASSET || status === GenerationStatus.GENERATING_MOCKUPS ? 'pointer-events-none opacity-40 filter blur-sm transition-all duration-500' : 'transition-all duration-500'}>
         <PromptInput 
          onGenerate={handleGenerateDesign} 
          isGenerating={status === GenerationStatus.ANALYZING || status === GenerationStatus.GENERATING_ASSET}
          statusText={getStatusText()}
        />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {(status === GenerationStatus.REVIEW_ASSET || status === GenerationStatus.GENERATING_ASSET || status === GenerationStatus.ANALYZING) && (
           <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="w-full max-w-lg mb-8">
               <div className="flex items-center justify-between mb-4 px-2">
                 <h2 className="text-2xl font-bold text-white">
                   {status === GenerationStatus.ANALYZING ? 'Crafting Strategy...' : 'Step 1: Design Review'}
                 </h2>
                 <span className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest font-bold">Vector Draft</span>
               </div>
               
               {designStrategy && status === GenerationStatus.REVIEW_ASSET && (
                 <div className="mb-6 p-5 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
                   <div className="flex items-center gap-3 mb-4 text-indigo-400 font-bold uppercase text-xs tracking-widest border-b border-slate-700 pb-3">
                     <BrainCircuit className="w-4 h-4" />
                     Market Insight
                   </div>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Target Niche</p>
                        <p className="text-white font-medium capitalize">{currentNiche}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Audience</p>
                        <p className="text-white font-medium capitalize">{currentAudience || 'General'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Art Direction</p>
                        <p className="text-slate-300 text-xs leading-relaxed">{designStrategy.designStyle.typography} — {designStrategy.designStyle.artStyle}</p>
                      </div>
                   </div>
                 </div>
               )}

               {images.filter(i => i.configId === DESIGN_ASSET_CONFIG.id).map(image => (
                 <ImageCard key={image.id} image={image} onRetry={handleRetry} />
               ))}
             </div>
             
             {status === GenerationStatus.REVIEW_ASSET && (
               <div className="flex flex-col sm:flex-row gap-4 mb-20">
                 <button 
                    onClick={handleRegenerateDesign}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700"
                 >
                   <RefreshCw className="w-5 h-5" />
                   Tweak Design
                 </button>
                 <button 
                    onClick={handleApproveAndGenerateMockups}
                    className="flex items-center justify-center gap-2 px-10 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-green-600/20"
                 >
                   <CheckCircle2 className="w-5 h-5" />
                   Looks Good, Mock It Up!
                 </button>
               </div>
             )}
           </div>
        )}

        {(status === GenerationStatus.GENERATING_MOCKUPS || status === GenerationStatus.COMPLETED) && (
          <div className="animate-in fade-in duration-1000">
             <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-slate-800 pb-6">
                <div>
                   <h2 className="text-3xl font-extrabold text-white">Market-Ready Mockups</h2>
                   <p className="text-slate-400 mt-1">High-quality lifestyle visuals optimized for e-commerce.</p>
                </div>
                {status === GenerationStatus.COMPLETED && (
                  <button 
                    onClick={handleDownloadAll}
                    disabled={isZipping}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50"
                  >
                    {isZipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    Download All Assets
                  </button>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {images.map((image) => (
                  <ImageCard 
                    key={image.id} 
                    image={image} 
                    onRetry={handleRetry} 
                  />
                ))}
             </div>
             
             {status === GenerationStatus.COMPLETED && (
                <div className="mt-16 text-center">
                    <button 
                       onClick={() => {
                         setStatus(GenerationStatus.IDLE);
                         setImages(INITIAL_IMAGES);
                         setCurrentSlogan('');
                         setDesignStrategy(null);
                       }}
                       className="px-8 py-3 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all text-sm font-semibold"
                    >
                      Create Another Collection
                    </button>
                </div>
             )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;