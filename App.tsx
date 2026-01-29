import React, { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { DESIGN_ASSET_CONFIG, PRODUCT_MOCKUP_CONFIGS, INITIAL_IMAGES, ALL_CONFIGS } from './constants';
import { GeneratedImage, GenerationStatus, DesignStrategy } from './types';
import { generateMockupImage, generateDesignStrategy, generatePromoVideo, generateVideoPrompt } from './services/geminiService';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import ImageCard from './components/ImageCard';
import { CheckCircle2, RefreshCw, Download, Loader2, BrainCircuit, Key, AlertCircle, Film, ExternalLink, FileText, Clipboard, X } from 'lucide-react';

const App: React.FC = () => {
  const [images, setImages] = useState<GeneratedImage[]>(INITIAL_IMAGES);
  const [currentSlogan, setCurrentSlogan] = useState<string>('');
  const [currentNiche, setCurrentNiche] = useState<string>('');
  const [currentAudience, setCurrentAudience] = useState<string>('');
  const [designStrategy, setDesignStrategy] = useState<DesignStrategy | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [isZipping, setIsZipping] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  
  const [videoPrompt, setVideoPrompt] = useState<string | null>(null);
  const [isVideoPromptGenerating, setIsVideoPromptGenerating] = useState(false);
  const [isVideoPromptModalOpen, setIsVideoPromptModalOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    };
    checkKey();
  }, []);
  
  const resetAppState = () => {
    setStatus(GenerationStatus.IDLE);
    setImages(INITIAL_IMAGES);
    setCurrentSlogan('');
    setDesignStrategy(null);
    setVideoUrl(null);
    setIsVideoGenerating(false);
    setVideoError(null);
    setVideoPrompt(null);
    setIsVideoPromptGenerating(false);
    setIsVideoPromptModalOpen(false);
  };

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setHasApiKey(true); 
  };

  const handleError = (error: any, configId?: string) => {
    const isPermissionError = error?.message?.includes('403') || error?.message?.includes('PERMISSION_DENIED');
    const isQuotaError = !isPermissionError && (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('API key not valid'));

    let errorMessage = error.message || 'An unknown error occurred.';
    if (isPermissionError) {
        errorMessage = "Permission Denied: Please enable the 'Vertex AI API' in your Google Cloud project.";
    } else if (isQuotaError) {
        errorMessage = 'API Quota/Key Error: Please connect a valid, paid API key.';
    }
    
    if (configId) {
      setImages(prev => prev.map(img => 
        img.configId === configId ? { ...img, loading: false, error: errorMessage } : img
      ));
    }
    
    // Set global error status if it's a key-related issue
    if (isQuotaError || isPermissionError) {
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleGenerateDesign = async (slogan: string, niche: string, styleContext: string, audience: string, colorContext: string) => {
    resetAppState();
    setCurrentSlogan(slogan);
    setCurrentNiche(niche);
    setCurrentAudience(audience);
    setStatus(GenerationStatus.ANALYZING);
    setImages(INITIAL_IMAGES.map(img => ({ ...img, loading: img.configId === DESIGN_ASSET_CONFIG.id })));

    try {
      const strategy = await generateDesignStrategy(slogan, niche, styleContext, audience, colorContext);
      setDesignStrategy(strategy);
      setStatus(GenerationStatus.GENERATING_ASSET);
      const base64Url = await generateMockupImage(DESIGN_ASSET_CONFIG.template(slogan, strategy));
      setImages(prev => prev.map(img => 
        img.configId === DESIGN_ASSET_CONFIG.id ? { ...img, loading: false, imageUrl: base64Url } : img
      ));
      setStatus(GenerationStatus.REVIEW_ASSET);
    } catch (error) {
      handleError(error, DESIGN_ASSET_CONFIG.id);
    }
  };

  const handleRegenerateDesign = async () => {
    if (!currentSlogan) return;
    setStatus(GenerationStatus.GENERATING_ASSET);
    setImages(prev => prev.map(img => img.configId === DESIGN_ASSET_CONFIG.id ? { ...img, loading: true, error: null } : img));
    try {
      const base64Url = await generateMockupImage(DESIGN_ASSET_CONFIG.template(currentSlogan, designStrategy || undefined));
      setImages(prev => prev.map(img => img.configId === DESIGN_ASSET_CONFIG.id ? { ...img, loading: false, imageUrl: base64Url } : img));
      setStatus(GenerationStatus.REVIEW_ASSET);
    } catch (error) {
      handleError(error, DESIGN_ASSET_CONFIG.id);
    }
  };

  const handleApproveAndGenerateMockups = async () => {
    const designAsset = images.find(img => img.configId === DESIGN_ASSET_CONFIG.id);
    if (!designAsset?.imageUrl || !designStrategy) return;
    setStatus(GenerationStatus.GENERATING_MOCKUPS);
    setImages(prev => prev.map(img => img.configId !== DESIGN_ASSET_CONFIG.id ? { ...img, loading: true, error: null } : img));
    PRODUCT_MOCKUP_CONFIGS.forEach((config) => {
      generateSingleMockup(config.id, config.template(currentSlogan, designStrategy), designAsset.imageUrl!);
    });
  };

  const generateSingleMockup = async (configId: string, prompt: string, referenceImage: string) => {
    try {
      const base64Url = await generateMockupImage(prompt, referenceImage);
      setImages(prev => prev.map(img => img.configId === configId ? { ...img, loading: false, imageUrl: base64Url } : img));
    } catch (error) {
      handleError(error, configId);
    }
  };
  
  const handleGenerateVideo = async () => {
    if (!designStrategy || !currentSlogan) return;
    
    setIsVideoGenerating(true);
    setVideoUrl(null);
    setVideoError(null);

    try {
      const referenceImageIds = ['tshirt-mockup', 'hoodie-mockup', 'phonecase-mockup'];
      const referenceImages = images
        .filter(img => referenceImageIds.includes(img.configId) && img.imageUrl)
        .map(img => img.imageUrl!);

      if (referenceImages.length < 1) {
        throw new Error("Not enough successful mockups to generate a video.");
      }

      const url = await generatePromoVideo(currentSlogan, designStrategy, referenceImages);
      setVideoUrl(url);

    } catch (error: any) {
      const isPermissionError = error?.message?.includes('403') || error?.message?.includes('PERMISSION_DENIED');
      const isQuotaError = !isPermissionError && (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('not found'));
      
      let videoErrorMessage = 'Video generation failed. Please try again.';
      if (isPermissionError) {
        videoErrorMessage = 'Permission Denied. Please ensure the "Vertex AI API" is enabled in your Google Cloud project to generate videos.';
      } else if (isQuotaError) {
        videoErrorMessage = 'Video generation requires a valid paid API Key with sufficient quota. Please check your key and billing status.';
      } else if (error.message) {
        videoErrorMessage = error.message;
      }
      setVideoError(videoErrorMessage);
    } finally {
      setIsVideoGenerating(false);
    }
  };

  const handleGenerateVideoPrompt = async () => {
    if (!designStrategy || !currentSlogan || !currentNiche) return;

    const successfulMockups = images
      .filter(img => img.imageUrl && img.configId !== DESIGN_ASSET_CONFIG.id)
      .map(img => img.imageUrl!);
    
    if (successfulMockups.length === 0) {
      alert("Please generate some mockups before creating a video script.");
      return;
    }

    setIsVideoPromptGenerating(true);
    setVideoPrompt(null);
    try {
      const prompt = await generateVideoPrompt(currentSlogan, currentNiche, currentAudience, designStrategy, successfulMockups);
      setVideoPrompt(prompt);
      setIsVideoPromptModalOpen(true);
    } catch(e) {
      // Simple error handling for prompt generation
      alert("Sorry, the AI Director is busy. Please try again in a moment.");
    } finally {
      setIsVideoPromptGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    if (videoPrompt) {
      navigator.clipboard.writeText(videoPrompt);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  useEffect(() => {
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
      setImages(prev => prev.map(img => img.configId === configId ? { ...img, loading: true, error: null } : img));
      generateSingleMockup(configId, config.template(currentSlogan, designStrategy || undefined), designAsset.imageUrl);
    }
  }, [currentSlogan, images, designStrategy]);

  const handleDownloadAll = async () => {
    setIsZipping(true);
    const zip = new JSZip();
    const folder = zip.folder(`pod-assets-${Date.now()}`);
    if (folder) {
      const sortedImages = [...images].sort((a, b) => {
        const indexA = ALL_CONFIGS.findIndex(c => c.id === a.configId);
        const indexB = ALL_CONFIGS.findIndex(c => c.id === b.configId);
        return indexA - indexB;
      });

      sortedImages.forEach(img => {
        if (img.imageUrl) {
          const sanitizedTitle = img.title
            .replace(/\s/g, '_')
            .replace(/[&/]/g, '-')
            .replace(/[()]/g, '');
          folder.file(`${sanitizedTitle}.png`, img.imageUrl.split(',')[1], { base64: true });
        }
      });
      if (videoUrl) {
        try {
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          folder.file('promo_video.mp4', blob);
        } catch (e) {
          console.error("Could not add video to zip", e);
        }
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `pod_assets_${currentSlogan.replace(/\s/g, '_').slice(0, 15)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setIsZipping(false);
  };

  const getStatusText = () => {
    if (status === GenerationStatus.ANALYZING) return "AI Strategist is thinking...";
    if (status === GenerationStatus.GENERATING_ASSET) return "Drafting Design Asset...";
    return "Processing...";
  }

  const firstError = images.find(img => img.error)?.error;
  const isPermissionError = firstError?.includes('Permission Denied');

  return (
    <div className="min-h-screen pb-20 bg-slate-900">
      <Header />
      
      {!hasApiKey && (
        <div className="max-w-5xl mx-auto px-4 mt-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-amber-200 text-sm font-semibold">High Quality & No Quota Limits</p>
                <p className="text-amber-200/60 text-xs">Connect your own paid API key to unlock high-quality models.</p>
              </div>
            </div>
            <button 
              onClick={handleOpenKeySelector}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-all text-sm whitespace-nowrap"
            >
              <Key className="w-4 h-4" />
              Connect Paid Key
            </button>
          </div>
          <p className="text-slate-500 text-[10px] mt-2 px-2">
            Requires a paid GCP project key. Learn more at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">ai.google.dev/gemini-api/docs/billing</a>
          </p>
        </div>
      )}

      <div className={status === GenerationStatus.REVIEW_ASSET || status === GenerationStatus.GENERATING_MOCKUPS ? 'pointer-events-none opacity-40 filter blur-sm transition-all duration-500' : 'transition-all duration-500'}>
         <PromptInput onGenerate={handleGenerateDesign} isGenerating={status === GenerationStatus.ANALYZING || status === GenerationStatus.GENERATING_ASSET} statusText={getStatusText()} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {status === GenerationStatus.ERROR && (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-800 rounded-3xl border border-rose-500/30 mb-8">
            <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{isPermissionError ? 'Permission Denied' : 'Generation Failed'}</h3>
            
            {isPermissionError ? (
              <>
                <p className="text-slate-400 text-center max-w-md mb-6">
                  Your API key is valid, but lacks permissions. Please enable the <strong>Vertex AI API</strong> in your Google Cloud project to proceed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <a 
                      href="https://console.cloud.google.com/apis/library/aiplatform.googleapis.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-600/30"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Enable Vertex AI API
                    </a>
                    <button 
                      onClick={handleOpenKeySelector}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
                    >
                      <Key className="w-5 h-5" />
                      Use Different Key
                    </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-400 text-center max-w-md mb-6">
                  You may have hit API quota limits or the key is invalid. To continue generating, please connect your personal paid API key.
                </p>
                <button 
                  onClick={handleOpenKeySelector}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-600/30"
                >
                  <Key className="w-5 h-5" />
                  Connect Personal Key & Retry
                </button>
              </>
            )}
          </div>
        )}

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
             <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4 border-b border-slate-800 pb-6">
                <div>
                   <h2 className="text-3xl font-extrabold text-white">Market-Ready Assets</h2>
                   <p className="text-slate-400 mt-1">High-quality visuals optimized for e-commerce and social media.</p>
                </div>
                {status === GenerationStatus.COMPLETED && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={handleGenerateVideoPrompt}
                      disabled={isVideoPromptGenerating}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-700/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isVideoPromptGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                      Generate Video Script
                    </button>
                    <button 
                        onClick={handleGenerateVideo}
                        disabled={!hasApiKey || isVideoGenerating}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        title={!hasApiKey ? "Connect a paid API key to enable video generation" : ""}
                      >
                        {isVideoGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
                        Create Promo Video
                      </button>
                    <button 
                      onClick={handleDownloadAll}
                      disabled={isZipping}
                      className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50"
                    >
                      {isZipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                      Download All
                    </button>
                  </div>
                )}
             </div>

             { (isVideoGenerating || videoUrl || videoError) && (
                <div className="mb-12">
                    <h3 className="text-2xl font-bold text-white mb-4">Social Media Video</h3>
                    {isVideoGenerating && (
                        <div className="aspect-video w-full max-w-md mx-auto bg-slate-800 rounded-xl flex flex-col items-center justify-center border border-slate-700">
                           <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
                           <p className="text-white font-semibold">Rendering your video...</p>
                           <p className="text-slate-400 text-sm">This may take a few minutes.</p>
                        </div>
                    )}
                    {videoError && (
                      <div className="aspect-video w-full max-w-md mx-auto bg-rose-500/10 rounded-xl flex flex-col items-center justify-center border border-rose-500/30 p-4">
                           <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                           <p className="text-white font-semibold text-center mb-4">Video Generation Failed</p>
                           <p className="text-rose-200 text-sm text-center mb-6 break-words">{videoError}</p>
                           <button onClick={handleOpenKeySelector} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all text-sm">
                              <Key className="w-4 h-4"/> Connect/Check API Key
                           </button>
                        </div>
                    )}
                    {videoUrl && (
                        <div className="w-full max-w-md mx-auto">
                          <video src={videoUrl} controls className="rounded-xl w-full aspect-[9/16] bg-black" />
                          <a href={videoUrl} download={`promo_video_${currentSlogan.slice(0, 15)}.mp4`} className="mt-4 w-full flex items-center justify-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-600/30">
                            <Download className="w-5 h-5" /> Download Video (MP4)
                          </a>
                        </div>
                    )}
                </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {images.map((image) => (
                  <ImageCard key={image.id} image={image} onRetry={handleRetry} />
                ))}
             </div>
             
             {status === GenerationStatus.COMPLETED && (
                <div className="mt-16 text-center">
                    <button onClick={resetAppState} className="px-8 py-3 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all text-sm font-semibold">
                      Create Another Collection
                    </button>
                </div>
             )}
          </div>
        )}
      </main>

      {isVideoPromptModalOpen && videoPrompt && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <div className='flex items-center gap-2'>
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">AI Video Director Script</h3>
              </div>
              <button onClick={() => setIsVideoPromptModalOpen(false)} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <pre className="p-6 text-sm text-slate-300 overflow-y-auto max-h-[60vh] whitespace-pre-wrap font-sans bg-slate-900/50">
              {videoPrompt}
            </pre>
            <div className="p-4 border-t border-slate-700 flex justify-end">
                <button 
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all text-sm shadow-lg shadow-indigo-500/30"
                >
                  <Clipboard className="w-4 h-4" />
                  {hasCopied ? 'Copied!' : 'Copy Script'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;