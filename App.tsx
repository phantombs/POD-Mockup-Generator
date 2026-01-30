

import React, { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { DESIGN_ASSET_CONFIG, PRODUCT_MOCKUP_CONFIGS, INITIAL_IMAGES, ALL_CONFIGS, NICHES, DESIGN_STYLES, COLOR_PALETTES } from './constants';
import { GeneratedImage, GenerationStatus, DesignStrategy, DesignAsset, StrategySuggestion, ProductListingContent } from './types';
import { generateMockupImage, generateDesignStrategy, generatePromoVideo, generateVideoPrompt, generateFiveDesignConcepts, generateProductListingContent } from './services/geminiService';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import ImageCard from './components/ImageCard';
import DesignAssetCard from './components/DesignAssetCard';
import { CheckCircle2, RefreshCw, Download, Loader2, BrainCircuit, Key, AlertCircle, Film, ExternalLink, FileText, Clipboard, X, Tags } from 'lucide-react';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [images, setImages] = useState<GeneratedImage[]>(INITIAL_IMAGES);
  const [designStrategy, setDesignStrategy] = useState<DesignStrategy | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  
  const [currentSlogan, setCurrentSlogan] = useState<string>('');
  const [currentAudience, setCurrentAudience] = useState<string>('');
  
  const [designAssets, setDesignAssets] = useState<DesignAsset[]>([]);
  const [selectedDesignAssetId, setSelectedDesignAssetId] = useState<string | null>(null);

  const [isZipping, setIsZipping] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  
  const [videoPrompt, setVideoPrompt] = useState<string | null>(null);
  const [isVideoPromptGenerating, setIsVideoPromptGenerating] = useState(false);
  const [isVideoPromptModalOpen, setIsVideoPromptModalOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const [productListing, setProductListing] = useState<ProductListingContent | null>(null);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isGeneratingListing, setIsGeneratingListing] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);


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
    setCurrentAudience('');
    setDesignStrategy(null);
    setDesignAssets([]);
    setSelectedDesignAssetId(null);
    setVideoUrl(null);
    setIsVideoGenerating(false);
    setVideoError(null);
    setVideoPrompt(null);
    setIsVideoPromptGenerating(false);
    setIsVideoPromptModalOpen(false);
    setProductListing(null);
    setIsListingModalOpen(false);
    setIsGeneratingListing(false);
  };

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setHasApiKey(true); 
  };

  const handleError = (error: any, assetId?: string) => {
    const isPermissionError = error?.message?.includes('403') || error?.message?.includes('PERMISSION_DENIED');
    const isQuotaError = !isPermissionError && (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('API key not valid'));

    let errorMessage = error.message || 'An unknown error occurred.';
    if (isPermissionError) {
        errorMessage = "Permission Denied: Please enable the 'Vertex AI API' in your Google Cloud project.";
    } else if (isQuotaError) {
        errorMessage = 'API Quota/Key Error: Please connect a valid, paid API key.';
    }
    
    if (assetId) {
      setDesignAssets(prev => prev.map(asset => 
        asset.id === assetId ? { ...asset, loading: false, error: errorMessage } : asset
      ));
    }
    
    if (isQuotaError || isPermissionError) {
      setStatus(GenerationStatus.ERROR);
    }
  };
  
  const handleStartGenerationProcess = async (slogan: string, audience: string) => {
    resetAppState();
    setCurrentSlogan(slogan);
    setCurrentAudience(audience);
    setStatus(GenerationStatus.GENERATING_5_ASSETS);

    try {
      const topConcepts = await generateFiveDesignConcepts(slogan, audience);
      
      const initialAssets: DesignAsset[] = topConcepts.map((concept, index) => ({
        id: `design-${index}`,
        imageUrl: null,
        loading: true,
        error: null,
        strategy: concept
      }));
      setDesignAssets(initialAssets);
      
      // Generate concepts sequentially to avoid rate limiting
      for (const asset of initialAssets) {
        try {
            // The detailed strategy is now fetched in the initial call, so we pass it directly.
            const imageUrl = await generateMockupImage(DESIGN_ASSET_CONFIG.template(slogan, { designStyle: asset.strategy.designStyle } as DesignStrategy));
            
            setDesignAssets(prev => prev.map(a => 
              a.id === asset.id ? { ...a, loading: false, imageUrl: imageUrl, error: null } : a
            ));
        } catch (error: any) {
            handleError(error, asset.id);
        }
        await sleep(5000); // Add a delay to prevent rate limiting
      }

      setStatus(GenerationStatus.REVIEW_5_ASSETS);

    } catch (e: any) {
      handleError(e);
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleSelectDesign = (assetId: string) => {
    setSelectedDesignAssetId(assetId);
  };

  const generateSingleMockup = useCallback(async (configId: string, prompt: string, referenceImage: string) => {
    try {
      const base64Url = await generateMockupImage(prompt, referenceImage);
      setImages(prev => prev.map(img => img.configId === configId ? { ...img, loading: false, imageUrl: base64Url } : img));
    } catch (error: any) {
      const isPermissionError = error?.message?.includes('403') || error?.message?.includes('PERMISSION_DENIED');
      const isQuotaError = !isPermissionError && (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('API key not valid'));

      let errorMessage = error.message || 'An unknown error occurred.';
      if (isPermissionError) {
          errorMessage = "Permission Denied: Enable Vertex AI API.";
      } else if (isQuotaError) {
          errorMessage = 'API Quota/Key Error: Check key.';
      }
      
      setImages(prev => prev.map(img => img.configId === configId ? { ...img, loading: false, error: errorMessage } : img));

      if (isQuotaError || isPermissionError) {
        setStatus(GenerationStatus.ERROR);
      }
    }
  }, []);

  const handleApproveAndGenerateMockups = async () => {
    const selectedAsset = designAssets.find(asset => asset.id === selectedDesignAssetId);
    if (!selectedAsset?.imageUrl) return;

    setStatus(GenerationStatus.GENERATING_MOCKUPS);
    
    // Set the first image (design asset) for the final grid
    const finalImages: GeneratedImage[] = ALL_CONFIGS.map(config => ({
      id: config.id,
      configId: config.id,
      title: config.title,
      imageUrl: config.id === DESIGN_ASSET_CONFIG.id ? selectedAsset.imageUrl : null,
      loading: config.id !== DESIGN_ASSET_CONFIG.id,
      error: null,
    }));
    setImages(finalImages);

    // Generate detailed strategy for the selected design to guide mockups
    try {
        const nicheObj = NICHES.find(n => n.id === selectedAsset.strategy.nicheId) || NICHES[0];
        const styleObj = DESIGN_STYLES.find(s => s.id === selectedAsset.strategy.styleId) || DESIGN_STYLES[0];
        const colorObj = COLOR_PALETTES.find(c => c.id === selectedAsset.strategy.colorId) || COLOR_PALETTES[0];
        
        const detailedStrategy = await generateDesignStrategy(currentSlogan, nicheObj.label, styleObj.context, currentAudience, colorObj.context);
        setDesignStrategy(detailedStrategy);
        
        // Generate mockups sequentially with a delay
        for (const config of PRODUCT_MOCKUP_CONFIGS) {
          await generateSingleMockup(config.id, config.template(currentSlogan, detailedStrategy), selectedAsset.imageUrl!);
          await sleep(5000);
        }
    } catch (e) {
      handleError(e);
      setStatus(GenerationStatus.ERROR);
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
      let videoErrorMessage = 'Video generation failed. Please try again.';
      if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        videoErrorMessage = 'API rate limit reached. Please wait a moment and try again.';
      } else if (error.message) {
        videoErrorMessage = `An API error occurred: ${error.message}`;
      }
      setVideoError(videoErrorMessage);
    } finally {
      setIsVideoGenerating(false);
    }
  };

  const handleGenerateVideoPrompt = async () => {
    const selectedAsset = designAssets.find(asset => asset.id === selectedDesignAssetId);
    const niche = NICHES.find(n => n.id === selectedAsset?.strategy.nicheId)?.label || 'General';
    if (!designStrategy || !currentSlogan || !niche) return;

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
      const prompt = await generateVideoPrompt(currentSlogan, niche, currentAudience, designStrategy, successfulMockups);
      setVideoPrompt(prompt);
      setIsVideoPromptModalOpen(true);
    } catch(e) {
      // Simple error handling for prompt generation
      alert("Sorry, the AI Director is busy. Please try again in a moment.");
    } finally {
      setIsVideoPromptGenerating(false);
    }
  };

  const handleGenerateListingContent = async () => {
    const selectedAsset = designAssets.find(asset => asset.id === selectedDesignAssetId);
    const niche = NICHES.find(n => n.id === selectedAsset?.strategy.nicheId)?.label || 'General';
    if (!designStrategy || !currentSlogan || !niche) return;

    setIsGeneratingListing(true);
    setProductListing(null);
    try {
        const content = await generateProductListingContent(
            currentSlogan,
            niche,
            currentAudience,
            designStrategy.designStyle.mood
        );
        setProductListing(content);
        setIsListingModalOpen(true);
    } catch (e) {
        alert("Sorry, the AI Merchandiser is busy. Please try again in a moment.");
    } finally {
        setIsGeneratingListing(false);
    }
  };

  const handleCopyPrompt = () => {
    if (videoPrompt) {
      navigator.clipboard.writeText(videoPrompt);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const handleCopySection = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  useEffect(() => {
    const isMockupsLoading = images.filter(i => i.configId !== DESIGN_ASSET_CONFIG.id).some(img => img.loading);
    if (!isMockupsLoading && status === GenerationStatus.GENERATING_MOCKUPS) {
      setStatus(GenerationStatus.COMPLETED);
    }
  }, [images, status]);

  // FIX: Implement retry/regenerate functionality for individual mockups.
  const handleRetry = useCallback((configId: string) => {
    if (status === GenerationStatus.REVIEW_5_ASSETS) {
      alert("To retry a concept, please use the 'Start Over' button for a fresh set of concepts.");
      return;
    }

    if (configId === DESIGN_ASSET_CONFIG.id) return; // Cannot retry main asset here

    const selectedAsset = designAssets.find(asset => asset.id === selectedDesignAssetId);
    if (selectedAsset?.imageUrl && designStrategy && currentSlogan) {
      const config = PRODUCT_MOCKUP_CONFIGS.find(c => c.id === configId);
      if (config) {
        setImages(prev => prev.map(img => 
          img.configId === configId ? { ...img, loading: true, error: null } : img
        ));
        generateSingleMockup(config.id, config.template(currentSlogan, designStrategy), selectedAsset.imageUrl);
      }
    }
  }, [status, designAssets, selectedDesignAssetId, designStrategy, currentSlogan, generateSingleMockup]);


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
    if (status === GenerationStatus.GENERATING_5_ASSETS) return "AI is generating 3 concepts...";
    if (status === GenerationStatus.GENERATING_MOCKUPS) return "Generating all your mockups...";
    if (status === GenerationStatus.ANALYZING) return "AI Strategist is thinking...";
    return "Processing...";
  }

  const firstError = images.find(img => img.error)?.error;
  const isPermissionError = firstError?.includes('Permission Denied');
  const isGeneratingAnything = status !== GenerationStatus.IDLE && status !== GenerationStatus.COMPLETED && status !== GenerationStatus.ERROR;

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

      <div className="transition-all duration-500 relative">
         <PromptInput 
            onGenerate={handleStartGenerationProcess}
            isGenerating={isGeneratingAnything}
            statusText={getStatusText()}
         />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {status === GenerationStatus.ERROR && (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-800 rounded-3xl border border-rose-500/30 mb-8">
            <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{isPermissionError ? 'Permission Denied' : 'Generation Failed'}</h3>
            {isPermissionError ? (
               <p className="text-slate-400 text-center max-w-md mb-6">Your API key is valid, but lacks permissions. Please enable the <strong>Vertex AI API</strong> in your Google Cloud project to proceed.</p>
            ) : (
               <p className="text-slate-400 text-center max-w-md mb-6">You may have hit API quota limits or the key is invalid. To continue generating, please connect your personal paid API key.</p>
            )}
            <button onClick={resetAppState} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-600/30">
              <RefreshCw className="w-5 h-5" /> Try Again
            </button>
          </div>
        )}

        {(status === GenerationStatus.GENERATING_5_ASSETS || status === GenerationStatus.REVIEW_5_ASSETS) && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-white">Step 1: Choose Your Winning Concept</h2>
                <p className="text-slate-400 mt-1">The AI has generated 3 concepts based on top market trends. Select one to continue.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {designAssets.map(asset => (
                <DesignAssetCard 
                  key={asset.id} 
                  asset={asset} 
                  isSelected={selectedDesignAssetId === asset.id}
                  onSelect={handleSelectDesign}
                />
              ))}
            </div>
            {status === GenerationStatus.REVIEW_5_ASSETS && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button onClick={resetAppState} className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all">
                      <RefreshCw className="w-5 h-5" /> Start Over
                  </button>
                  <button 
                      onClick={handleApproveAndGenerateMockups}
                      disabled={!selectedDesignAssetId}
                      className="flex items-center justify-center gap-2 px-10 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <CheckCircle2 className="w-5 h-5" /> Generate Mockups With This Design
                  </button>
              </div>
            )}
          </div>
        )}

        {(status === GenerationStatus.GENERATING_MOCKUPS || status === GenerationStatus.COMPLETED) && (
          <div className="animate-in fade-in duration-1000">
             <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4 border-b border-slate-800 pb-6">
                <div>
                   <h2 className="text-3xl font-extrabold text-white">Step 2: Market-Ready Assets</h2>
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
                      onClick={handleGenerateListingContent}
                      disabled={isGeneratingListing}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-600/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isGeneratingListing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Tags className="w-5 h-5" />}
                      Generate SEO Content
                    </button>
                    <button 
                        onClick={handleGenerateVideo}
                        disabled={isVideoGenerating}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        title="Generate a short promo video for social media"
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
                    {isVideoGenerating && (<div className="aspect-video w-full max-w-md mx-auto bg-slate-800 rounded-xl flex flex-col items-center justify-center border border-slate-700"><Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" /><p className="text-white font-semibold">Rendering your video...</p><p className="text-slate-400 text-sm">This may take a few minutes.</p></div>)}
                    {videoError && (<div className="aspect-video w-full max-w-md mx-auto bg-rose-500/10 rounded-xl flex flex-col items-center justify-center border border-rose-500/30 p-4"><AlertCircle className="w-12 h-12 text-rose-500 mb-4" /><p className="text-white font-semibold text-center mb-4">Video Generation Failed</p><p className="text-rose-200 text-sm text-center mb-6 break-words">{videoError}</p></div>)}
                    {videoUrl && (<div className="w-full max-w-md mx-auto"><video src={videoUrl} controls className="rounded-xl w-full aspect-[9/16] bg-black" /><a href={videoUrl} download={`promo_video_${currentSlogan.slice(0, 15)}.mp4`} className="mt-4 w-full flex items-center justify-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-600/30"><Download className="w-5 h-5" /> Download Video (MP4)</a></div>)}
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
            <div className="p-4 border-b border-slate-700 flex justify-between items-center"><div className='flex items-center gap-2'><FileText className="w-5 h-5 text-indigo-400" /><h3 className="text-lg font-bold text-white">AI Video Director Script</h3></div><button onClick={() => setIsVideoPromptModalOpen(false)} className="p-1 rounded-full hover:bg-slate-700 transition-colors"><X className="w-5 h-5 text-slate-400" /></button></div>
            <pre className="p-6 text-sm text-slate-300 overflow-y-auto max-h-[60vh] whitespace-pre-wrap font-sans bg-slate-900/50">{videoPrompt}</pre>
            <div className="p-4 border-t border-slate-700 flex justify-end"><button onClick={handleCopyPrompt} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all text-sm shadow-lg shadow-indigo-500/30"><Clipboard className="w-4 h-4" />{hasCopied ? 'Copied!' : 'Copy Script'}</button></div>
          </div>
        </div>
      )}

      {isListingModalOpen && productListing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <div className='flex items-center gap-2'>
                        <Tags className="w-5 h-5 text-teal-400" />
                        <h3 className="text-lg font-bold text-white">Product Listing SEO Content</h3>
                    </div>
                    <button onClick={() => setIsListingModalOpen(false)} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Title Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-white">Title</h4>
                            <button onClick={() => handleCopySection(productListing.title, 'title')} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600 px-2 py-1 rounded-md transition-colors">
                                <Clipboard className="w-3 h-3" />
                                {copiedSection === 'title' ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <p className="p-3 bg-slate-900/50 rounded-lg text-sm text-slate-300 border border-slate-700">{productListing.title}</p>
                    </div>
                    {/* Description Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-white">Description</h4>
                            <button onClick={() => handleCopySection(productListing.description, 'description')} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600 px-2 py-1 rounded-md transition-colors">
                                <Clipboard className="w-3 h-3" />
                                {copiedSection === 'description' ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <p className="p-3 bg-slate-900/50 rounded-lg text-sm text-slate-300 border border-slate-700 whitespace-pre-wrap">{productListing.description}</p>
                    </div>
                    {/* Tags Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-white">Tags / Keywords</h4>
                            <button onClick={() => handleCopySection(productListing.tags.join(', '), 'tags')} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600 px-2 py-1 rounded-md transition-colors">
                                <Clipboard className="w-3 h-3" />
                                {copiedSection === 'tags' ? 'Copied!' : 'Copy as CSV'}
                            </button>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 flex flex-wrap gap-2">
                            {productListing.tags.map((tag, index) => (
                                <span key={index} className="bg-slate-700 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-700 flex justify-end">
                    <button onClick={() => setIsListingModalOpen(false)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all text-sm shadow-lg shadow-indigo-500/30">Close</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;