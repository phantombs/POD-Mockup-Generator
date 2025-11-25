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
  const [currentNiche, setCurrentNiche] = useState<string>('general');
  const [currentStyleContext, setCurrentStyleContext] = useState<string>('');
  const [designStrategy, setDesignStrategy] = useState<DesignStrategy | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [isZipping, setIsZipping] = useState(false);

  // Stage 1: Analyze & Generate Design Asset
  const handleGenerateDesign = async (slogan: string, niche: string, styleContext: string) => {
    setCurrentSlogan(slogan);
    setCurrentNiche(niche);
    setCurrentStyleContext(styleContext);
    setStatus(GenerationStatus.ANALYZING);
    
    // Reset all images
    setImages(INITIAL_IMAGES.map(img => ({ ...img, loading: img.configId === DESIGN_ASSET_CONFIG.id })));

    try {
      // Step 1: Analyze and Create Strategy (Now includes Style Context)
      const strategy = await generateDesignStrategy(slogan, niche, styleContext);
      setDesignStrategy(strategy);
      
      // Step 2: Generate Asset based on strategy
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
          ? { ...img, loading: false, error: 'Failed to generate design.' }
          : img
      ));
      setStatus(GenerationStatus.ERROR);
    }
  };

  // Helper to re-generate just the design asset (reuses existing strategy but could be extended to regen strategy too if needed)
  const handleRegenerateDesign = async () => {
    if (!currentSlogan) return;
    
    setStatus(GenerationStatus.GENERATING_ASSET);
    setImages(prev => prev.map(img => 
        img.configId === DESIGN_ASSET_CONFIG.id ? { ...img, loading: true, error: null } : img
    ));

    try {
        // We re-use the existing strategy. Ideally, if the user hits "Regenerate", 
        // we might want to slightly tweak the random seed or ask for a variation, 
        // but re-running the prompt usually yields a variation anyway.
        
        // Use strategy if available, otherwise fallback is handled in template
        const base64Url = await generateMockupImage(DESIGN_ASSET_CONFIG.template(currentSlogan, designStrategy || undefined));
        
        setImages(prev => prev.map(img => 
          img.configId === DESIGN_ASSET_CONFIG.id 
            ? { ...img, loading: false, imageUrl: base64Url }
            : img
        ));
        setStatus(GenerationStatus.REVIEW_ASSET);
    } catch (error) {
        setImages(prev => prev.map(img => 
            img.configId === DESIGN_ASSET_CONFIG.id ? { ...img, loading: false, error: 'Failed to retry.' } : img
        ));
        setStatus(GenerationStatus.ERROR);
    }
  };

  // Stage 2: Approve Design and Generate Mockups
  const handleApproveAndGenerateMockups = async () => {
    const designAsset = images.find(img => img.configId === DESIGN_ASSET_CONFIG.id);
    if (!designAsset?.imageUrl || !designStrategy) return;

    setStatus(GenerationStatus.GENERATING_MOCKUPS);
    
    // Set mockups to loading
    setImages(prev => prev.map(img => 
      img.configId !== DESIGN_ASSET_CONFIG.id 
        ? { ...img, loading: true, error: null } 
        : img
    ));

    // Generate all mockups using the design asset as reference AND the strategy
    PRODUCT_MOCKUP_CONFIGS.forEach((config) => {
      generateSingleMockup(config.id, config.template(currentSlogan, designStrategy), designAsset.imageUrl!);
    });
  };

  const generateSingleMockup = async (configId: string, prompt: string, referenceImage: string) => {
    try {
      const base64Url = await generateMockupImage(prompt, referenceImage);
      
      setImages((prev) =>
        prev.map((img) =>
          img.configId === configId
            ? { ...img, loading: false, imageUrl: base64Url }
            : img
        )
      );
    } catch (error) {
      setImages((prev) =>
        prev.map((img) =>
          img.configId === configId
            ? { ...img, loading: false, error: 'Failed to generate image.' }
            : img
        )
      );
    }
  };

  // Monitor completion
  React.useEffect(() => {
    const isMockupsLoading = images.filter(i => i.configId !== DESIGN_ASSET_CONFIG.id).some(img => img.loading);
    if (!isMockupsLoading && status === GenerationStatus.GENERATING_MOCKUPS) {
      setStatus(GenerationStatus.COMPLETED);
    }
  }, [images, status]);

  const handleRetry = useCallback((configId: string) => {
    if (!currentSlogan) return;

    // If retrying design asset
    if (configId === DESIGN_ASSET_CONFIG.id) {
      handleRegenerateDesign();
      return;
    }
    
    // If retrying a mockup, we need the design asset
    const designAsset = images.find(img => img.configId === DESIGN_ASSET_CONFIG.id);
    const config = PRODUCT_MOCKUP_CONFIGS.find(c => c.id === configId);
    
    if (config && designAsset?.imageUrl) {
      setImages((prev) =>
        prev.map((img) =>
          img.configId === configId ? { ...img, loading: true, error: null } : img
        )
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
          // Remove base64 header to get pure data
          const data = img.imageUrl.split(',')[1];
          // Create clean filename
          const cleanTitle = img.title.split('.')[0] + '_' + img.title.split('.')[1].trim().replace(/\s+/g, '_');
          folder.file(`${cleanTitle}.png`, data, { base64: true });
        }
      });

      try {
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `mockups-${currentSlogan.replace(/\s+/g, '-').slice(0, 20)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } catch (err) {
        console.error("Failed to zip files", err);
      }
    }
    setIsZipping(false);
  };

  const getStatusText = () => {
    if (status === GenerationStatus.ANALYZING) return "Analyzing Strategy & Style...";
    if (status === GenerationStatus.GENERATING_ASSET) return "Creating Design Asset...";
    return "Processing...";
  }

  return (
    <div className="min-h-screen pb-20 bg-slate-900">
      <Header />
      
      {/* Input is hidden if we are deep in the process, unless completed or error */}
      <div className={status === GenerationStatus.REVIEW_ASSET || status === GenerationStatus.GENERATING_MOCKUPS ? 'pointer-events-none opacity-50 filter blur-[1px] transition-all' : ''}>
         <PromptInput 
          onGenerate={handleGenerateDesign} 
          isGenerating={status === GenerationStatus.ANALYZING || status === GenerationStatus.GENERATING_ASSET}
          statusText={getStatusText()}
        />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Review Stage: Show only Design Asset */}
        {(status === GenerationStatus.REVIEW_ASSET || status === GenerationStatus.GENERATING_ASSET || status === GenerationStatus.ANALYZING) && (
           <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="w-full max-w-md mb-8">
               <h2 className="text-2xl font-bold text-white text-center mb-4">
                 {status === GenerationStatus.ANALYZING ? 'Designing Strategy...' : 'Step 1: Review Your Design'}
               </h2>
               {/* Analysis Info Box */}
               {designStrategy && status === GenerationStatus.REVIEW_ASSET && (
                 <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-sm">
                   <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                       <BrainCircuit className="w-4 h-4" />
                       <span>Strategy: {currentNiche.toUpperCase()}</span>
                     </div>
                     <p className="text-slate-400 text-xs">Style: {designStrategy.designStyle.artStyle}</p>
                     <p className="text-slate-300 italic mt-1 border-t border-slate-700 pt-1">"{designStrategy.designStyle.typography} | {designStrategy.designStyle.mood}"</p>
                   </div>
                 </div>
               )}

               {images.filter(i => i.configId === DESIGN_ASSET_CONFIG.id).map(image => (
                 <ImageCard key={image.id} image={image} onRetry={handleRetry} />
               ))}
             </div>
             
             {status === GenerationStatus.REVIEW_ASSET && (
               <div className="flex gap-4">
                 <button 
                    onClick={handleRegenerateDesign}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all"
                 >
                   <RefreshCw className="w-5 h-5" />
                   Regenerate Design
                 </button>
                 <button 
                    onClick={handleApproveAndGenerateMockups}
                    className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20"
                 >
                   <CheckCircle2 className="w-5 h-5" />
                   Approve & Generate Mockups
                 </button>
               </div>
             )}
           </div>
        )}

        {/* Mockup Stage: Show Grid */}
        {(status === GenerationStatus.GENERATING_MOCKUPS || status === GenerationStatus.COMPLETED) && (
          <div className="animate-in fade-in duration-700">
             <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                   <h2 className="text-2xl font-bold text-white">Your Mockup Collection</h2>
                   <div className="flex gap-2 text-sm mt-1">
                      <span className="text-slate-400">Niche: <span className="text-indigo-400 font-medium capitalize">{currentNiche}</span></span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-400">Style: <span className="text-pink-400 font-medium capitalize">{designStrategy?.designStyle.artStyle || 'Custom'}</span></span>
                   </div>
                </div>
                {status === GenerationStatus.COMPLETED && (
                  <button 
                    onClick={handleDownloadAll}
                    disabled={isZipping}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {isZipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    Download All (.ZIP)
                  </button>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image) => (
                  <ImageCard 
                    key={image.id} 
                    image={image} 
                    onRetry={handleRetry} 
                  />
                ))}
             </div>
             
             {status === GenerationStatus.COMPLETED && (
                <div className="mt-12 text-center">
                    <button 
                       onClick={() => {
                         setStatus(GenerationStatus.IDLE);
                         setImages(INITIAL_IMAGES);
                         setCurrentSlogan('');
                         setDesignStrategy(null);
                       }}
                       className="text-slate-500 hover:text-white underline underline-offset-4"
                    >
                      Start Over with New Slogan
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