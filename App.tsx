import React, { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { DESIGN_ASSET_CONFIG, PRODUCT_MOCKUP_CONFIGS, INITIAL_IMAGES, ALL_CONFIGS, NICHES, DESIGN_STYLES, COLOR_PALETTES } from './constants';
import { GeneratedImage, GenerationStatus, DesignStrategy, DesignAsset, StrategySuggestion, ProductListingContent, ApiKey, TrendingSlogan, ImageModel, ImageSize } from './types';
import { generateMockupImage, generateDesignStrategy, generatePromoVideo, generateVideoPrompt, generateFiveDesignConcepts, generateProductListingContent, generateSloganSuggestions, refineProductListingContent, analyzeAndSuggestDesigns } from './services/geminiService';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import ImageCard from './components/ImageCard';
import DesignAssetCard from './components/DesignAssetCard';
import { CheckCircle2, RefreshCw, Download, Loader2, BrainCircuit, Key, AlertCircle, Film, ExternalLink, FileText, Clipboard, X, Tags, Trash2, PlusCircle, CheckCircle, Info, Wand2, Sparkles, UploadCloud, Copy, Image as ImageIcon, Crop as CropIcon, Type as TypeIcon } from 'lucide-react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('No 2d context'));
            return;
        }

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        resolve(canvas.toDataURL('image/png'));
    });
}

const App: React.FC = () => {
  const [images, setImages] = useState<GeneratedImage[]>(INITIAL_IMAGES);
  const [designStrategy, setDesignStrategy] = useState<DesignStrategy | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  
  const [currentSlogan, setCurrentSlogan] = useState<string>('');
  const [currentAudience, setCurrentAudience] = useState<string>('');
  
  const [designAssets, setDesignAssets] = useState<DesignAsset[]>([]);
  const [selectedDesignAssetId, setSelectedDesignAssetId] = useState<string | null>(null);

  const [isZipping, setIsZipping] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [activeApiKeyId, setActiveApiKeyId] = useState<string | null>(null);
  const [isKeyManagerOpen, setIsKeyManagerOpen] = useState(false);
  const [newApiKeyInput, setNewApiKeyInput] = useState("");
  
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
  const [refinementInstruction, setRefinementInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);


  const [globalError, setGlobalError] = useState<string | null>(null);
  const [keySwitchNotification, setKeySwitchNotification] = useState<string | null>(null);
  const [hasPlatformKey, setHasPlatformKey] = useState(false);
  
  // New Feature States
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [imageModel, setImageModel] = useState<ImageModel>('gemini-2.5-flash-image');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [isRedesignModalOpen, setIsRedesignModalOpen] = useState(false);
  const [isAnalyzingRedesign, setIsAnalyzingRedesign] = useState(false);
  const [redesignPreviewImage, setRedesignPreviewImage] = useState<string | null>(null);
  const [redesignError, setRedesignError] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const redesignImgRef = useRef<HTMLImageElement>(null);
  const [redesignDescription, setRedesignDescription] = useState('');

  // Trend Spy State
  const [isTrendSpyModalOpen, setIsTrendSpyModalOpen] = useState(false);
  const [isSearchingTrends, setIsSearchingTrends] = useState(false);
  const [trendResults, setTrendResults] = useState<TrendingSlogan[] | null>(null);
  const [searchTopic, setSearchTopic] = useState('');
  const [searchTimeframe, setSearchTimeframe] = useState('Past 7 days');
  const [copiedText, setCopiedText] = useState<string | null>(null);


  const activeApiKey = apiKeys.find(k => k.id === activeApiKeyId)?.key || null;

  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem('pod-api-keys');
      const storedActiveId = localStorage.getItem('pod-active-api-key-id');
      if (storedKeys) {
        const parsedKeys = JSON.parse(storedKeys);
        setApiKeys(parsedKeys);
         if (storedActiveId) {
            const parsedActiveId = JSON.parse(storedActiveId);
            // Ensure the active ID is still valid
            if (parsedKeys.some((k: ApiKey) => k.id === parsedActiveId)) {
                setActiveApiKeyId(parsedActiveId);
            } else if (parsedKeys.length > 0) {
                // If old active key was deleted, default to the first one
                setActiveApiKeyId(parsedKeys[0].id);
            }
        } else if (parsedKeys.length > 0) {
             setActiveApiKeyId(parsedKeys[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load API keys from localStorage", error);
    }
  }, []);

  const handleGlobalPaste = useCallback((event: ClipboardEvent) => {
    const target = event.target as HTMLElement;
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
    
    if (isRedesignModalOpen || isKeyManagerOpen || isVideoPromptModalOpen || isListingModalOpen || isTrendSpyModalOpen || isTyping) {
        return;
    }

    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (!blob) continue;

            event.preventDefault();

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Image = e.target?.result as string;
                if (base64Image) {
                    handleOpenRedesignModal();
                    setRedesignPreviewImage(base64Image);
                    setRedesignError(null);
                }
            };
            reader.readAsDataURL(blob);
            return;
        }
    }
  }, [isRedesignModalOpen, isKeyManagerOpen, isVideoPromptModalOpen, isListingModalOpen, isTrendSpyModalOpen]);

  useEffect(() => {
    document.addEventListener('paste', handleGlobalPaste);
    return () => {
        document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [handleGlobalPaste]);
  
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
    setGlobalError(null);
    setKeySwitchNotification(null);
  };

  useEffect(() => {
    const checkPlatformKey = async () => {
      try {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasPlatformKey(hasKey);
        }
      } catch (e) {
        console.error("Failed to check platform API key", e);
      }
    };
    checkPlatformKey();
  }, []);

  const handleOpenPlatformKeySelector = async () => {
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        setHasPlatformKey(true);
      }
    } catch (e) {
      console.error("Failed to open platform key selector", e);
    }
  };

  const handleAddApiKey = () => {
    if (newApiKeyInput.trim() && !apiKeys.some(k => k.key === newApiKeyInput.trim())) {
      const newKey: ApiKey = { id: `key-${Date.now()}`, key: newApiKeyInput.trim() };
      const updatedKeys = [...apiKeys, newKey];
      setApiKeys(updatedKeys);
      localStorage.setItem('pod-api-keys', JSON.stringify(updatedKeys));
      if (!activeApiKeyId) {
        handleSetActiveApiKey(newKey.id);
      }
      setNewApiKeyInput("");
    }
  };

  const handleDeleteApiKey = (idToDelete: string) => {
    const updatedKeys = apiKeys.filter(k => k.id !== idToDelete);
    setApiKeys(updatedKeys);
    localStorage.setItem('pod-api-keys', JSON.stringify(updatedKeys));
    if (activeApiKeyId === idToDelete) {
      const newActiveId = updatedKeys.length > 0 ? updatedKeys[0].id : null;
      handleSetActiveApiKey(newActiveId);
    }
  };

  const handleSetActiveApiKey = (id: string | null) => {
    setActiveApiKeyId(id);
    localStorage.setItem('pod-active-api-key-id', JSON.stringify(id));
  };

  const maskApiKey = (key: string) => {
    if (key.length < 8) return "....";
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };
  
  const runWithApiKeyRotation = async <T,>(
    operation: (apiKey: string | null) => Promise<T>
  ): Promise<T> => {
    if (apiKeys.length === 0 && !process.env.API_KEY) {
      throw new Error("No API key available. Please add one in the Key Manager.");
    }
  
    const initialActiveKeyId = activeApiKeyId;
    const orderedKeys = apiKeys.length > 0
      ? (() => {
          const startIndex = initialActiveKeyId ? apiKeys.findIndex(k => k.id === initialActiveKeyId) : 0;
          if (startIndex === -1) return apiKeys;
          return [...apiKeys.slice(startIndex), ...apiKeys.slice(0, startIndex)];
        })()
      : [{ id: 'default', key: process.env.API_KEY || '' }];
  
    const triedKeyIds = new Set<string>();
  
    for (const key of orderedKeys) {
      if (triedKeyIds.has(key.id)) continue;
  
      if (key.id !== 'default' && activeApiKeyId !== key.id) {
        handleSetActiveApiKey(key.id);
        if (initialActiveKeyId) {
          const message = `Key quota reached. Trying next key: ${maskApiKey(key.key)}`;
          setKeySwitchNotification(message);
          setTimeout(() => setKeySwitchNotification(prev => prev === message ? null : prev), 6000);
        }
      }
  
      try {
        const result = await operation(key.key);
        if (keySwitchNotification) setKeySwitchNotification(null);
        return result;
      } catch (error: any) {
        const errorMessage = error.message || JSON.stringify(error) || '';
        const isQuotaError = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');
        const isPermissionError = errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED');
  
        if (isQuotaError) {
          console.warn(`Quota exceeded for key ${maskApiKey(key.key)}. Trying next key...`);
          triedKeyIds.add(key.id);
        } else if (isPermissionError) {
          if (key.id === 'default') {
            throw new Error("Default API key does not have permission for this model. Please connect a paid Google Cloud project in the Key Manager.");
          }
          throw new Error(`API key ${maskApiKey(key.key)} does not have permission for this model. Please ensure it has access to the requested model.`);
        } else {
          throw error;
        }
      }
    }
  
    throw new Error("All available API keys have exceeded their quota. Please add a new key or wait for the quota to reset.");
  };


  const handleError = (error: any, assetId?: string) => {
    const errorMessage = error.message || 'An unknown error occurred.';
    setGlobalError(errorMessage);
    
    if (assetId) {
      setDesignAssets(prev => prev.map(asset => 
        asset.id === assetId ? { ...asset, loading: false, error: 'Failed' } : asset
      ));
    }
    
    setStatus(GenerationStatus.ERROR);
  };
  
  const handleStartGenerationProcess = async (slogan: string, audience: string) => {
    resetAppState();
    setCurrentSlogan(slogan);
    setCurrentAudience(audience);
    setStatus(GenerationStatus.GENERATING_5_ASSETS);

    try {
      const topConcepts = await runWithApiKeyRotation(key => generateFiveDesignConcepts(slogan, audience, key, isThinkingMode));
      
      const initialAssets: DesignAsset[] = topConcepts.map((concept, index) => ({
        id: `design-${index}`,
        imageUrl: null,
        loading: true,
        error: null,
        strategy: concept
      }));
      setDesignAssets(initialAssets);
      
      for (const asset of initialAssets) {
        try {
            const template = DESIGN_ASSET_CONFIG.template(slogan, { designStyle: asset.strategy.designStyle } as DesignStrategy);
            // Use selected model and size for the master design asset
            const imageUrl = await runWithApiKeyRotation(key => generateMockupImage(template, key, imageModel, imageModel === 'gemini-3-pro-image-preview' ? '4K' : '1K', '1:1'));
            
            setDesignAssets(prev => prev.map(a => 
              a.id === asset.id ? { ...a, loading: false, imageUrl: imageUrl, error: null } : a
            ));
        } catch (error: any) {
            console.error(`Failed to generate design asset ${asset.id}:`, error);
            handleError(error, asset.id);
        }
        await sleep(2000);
      }

      setStatus(GenerationStatus.REVIEW_5_ASSETS);

    } catch (e: any) {
      handleError(e);
    }
  };

  const handleAnalyzeAndRedesign = async (imageBase64: string, description: string) => {
    setIsAnalyzingRedesign(true);
    setIsRedesignModalOpen(false);
    resetAppState();
    setStatus(GenerationStatus.GENERATING_5_ASSETS);

    try {
        const topConcepts = await runWithApiKeyRotation(key => analyzeAndSuggestDesigns(imageBase64, description, key));
        
        const initialAssets: DesignAsset[] = topConcepts.map((concept, index) => ({
            id: `design-${index}`,
            imageUrl: null,
            loading: true,
            error: null,
            strategy: concept
        }));
        setDesignAssets(initialAssets);
        
        for (const asset of initialAssets) {
            try {
                const placeholderSlogan = asset.strategy.title; 
                const template = DESIGN_ASSET_CONFIG.template(placeholderSlogan, { designStyle: asset.strategy.designStyle } as DesignStrategy);
                // Use selected model and size for the master design asset
                const imageUrl = await runWithApiKeyRotation(key => generateMockupImage(template, key, imageModel, imageModel === 'gemini-3-pro-image-preview' ? '4K' : '1K', '1:1'));
                
                setDesignAssets(prev => prev.map(a => 
                  a.id === asset.id ? { ...a, loading: false, imageUrl: imageUrl, error: null } : a
                ));
            } catch (error: any) {
                console.error(`Failed to generate design asset ${asset.id}:`, error);
                handleError(error, asset.id);
            }
            await sleep(2000);
        }
        setStatus(GenerationStatus.REVIEW_5_ASSETS);
    } catch (e: any) {
        handleError(e);
    } finally {
        setIsAnalyzingRedesign(false);
    }
  };

  const handleSelectDesign = (assetId: string) => {
    setSelectedDesignAssetId(assetId);
    const selectedAsset = designAssets.find(asset => asset.id === assetId);
    if (selectedAsset) {
        if (!currentSlogan) {
            setCurrentSlogan(selectedAsset.strategy.title);
        }
    }
  };

  const generateSingleMockup = async (configId: string, prompt: string, referenceImage: string) => {
    try {
      const base64Url = await runWithApiKeyRotation(key => generateMockupImage(prompt, key, imageModel, imageSize, "1:1", referenceImage));
      setImages(prev => prev.map(img => img.configId === configId ? { ...img, loading: false, imageUrl: base64Url, error: null } : img));
    } catch (error: any) {
      const errorMessage = error.message || 'An unknown error occurred.';
      setImages(prev => prev.map(img => img.configId === configId ? { ...img, loading: false, error: errorMessage } : img));
      setStatus(GenerationStatus.ERROR);
      setGlobalError(errorMessage);
    }
  };

  const handleApproveAndGenerateMockups = async () => {
    const selectedAsset = designAssets.find(asset => asset.id === selectedDesignAssetId);
    if (!selectedAsset?.imageUrl) return;

    setStatus(GenerationStatus.GENERATING_MOCKUPS);
    setGlobalError(null);
    setKeySwitchNotification(null);
    
    // Use the dynamic recommendations from the selected strategy
    const recommendations = selectedAsset.strategy.recommendedMockups || [];
    
    const finalImages: GeneratedImage[] = [
      {
        id: DESIGN_ASSET_CONFIG.id,
        configId: DESIGN_ASSET_CONFIG.id,
        title: DESIGN_ASSET_CONFIG.title,
        imageUrl: selectedAsset.imageUrl,
        loading: false,
        error: null,
      },
      ...recommendations.map((rec, idx) => ({
        id: `mockup-${idx}`,
        configId: rec.productId,
        title: rec.productName,
        imageUrl: null,
        loading: true,
        error: null,
      }))
    ];
    setImages(finalImages);

    try {
        // We no longer need to call generateDesignStrategy here as it's already in the asset
        setDesignStrategy({
          designStyle: selectedAsset.strategy.designStyle,
          recommendedMockups: recommendations
        });
        
        for (let i = 0; i < recommendations.length; i++) {
          const rec = recommendations[i];
          const mockupId = `mockup-${i}`;
          
          try {
            const base64Url = await runWithApiKeyRotation(key => 
              generateMockupImage(rec.prompt, key, imageModel, imageSize, "1:1", selectedAsset.imageUrl!)
            );
            setImages(prev => prev.map(img => img.id === mockupId ? { ...img, loading: false, imageUrl: base64Url, error: null } : img));
          } catch (error: any) {
            const errorMessage = error.message || 'An unknown error occurred.';
            setImages(prev => prev.map(img => img.id === mockupId ? { ...img, loading: false, error: errorMessage } : img));
          }
          await sleep(2000);
        }
    } catch (e: any) {
      handleError(e);
    }
  };
  
  const handleGenerateVideo = async () => {
    if (!designStrategy || !currentSlogan) return;
    setIsVideoGenerating(true);
    setVideoUrl(null);
    setVideoError(null);
    try {
      // Use any successful mockup image as reference
      const referenceImages = images.filter(img => img.id.startsWith('mockup-') && img.imageUrl).map(img => img.imageUrl!);
      if (referenceImages.length < 1) throw new Error("At least one successful mockup is needed to generate a video.");
      const url = await runWithApiKeyRotation(key => generatePromoVideo(currentSlogan, designStrategy, referenceImages, key));
      setVideoUrl(url);
    } catch (error: any) {
      setVideoError(error.message || 'Video generation failed. Please try again.');
    } finally {
      setIsVideoGenerating(false);
    }
  };

  const handleGenerateVideoPrompt = async () => {
    const selectedAsset = designAssets.find(asset => asset.id === selectedDesignAssetId);
    const niche = NICHES.find(n => n.id === selectedAsset?.strategy.nicheId)?.label || 'General';
    if (!designStrategy || !currentSlogan || !niche) return;
    const successfulMockups = images.filter(img => img.imageUrl && img.configId !== DESIGN_ASSET_CONFIG.id).map(img => img.imageUrl!);
    if (successfulMockups.length === 0) { alert("Please generate some mockups before creating a video script."); return; }
    setIsVideoPromptGenerating(true);
    setVideoPrompt(null);
    try {
      const prompt = await runWithApiKeyRotation(key => generateVideoPrompt(currentSlogan, niche, currentAudience, designStrategy, successfulMockups, key));
      setVideoPrompt(prompt);
      setIsVideoPromptModalOpen(true);
    } catch(e: any) { alert(e.message || "Sorry, the AI Director is busy. Please try again.");
    } finally { setIsVideoPromptGenerating(false); }
  };

  const handleGenerateListingContent = async () => {
    const selectedAsset = designAssets.find(asset => asset.id === selectedDesignAssetId);
    const niche = NICHES.find(n => n.id === selectedAsset?.strategy.nicheId)?.label || 'General';
    if (!designStrategy || !currentSlogan || !niche) return;
    setIsGeneratingListing(true);
    setProductListing(null);
    try {
        const content = await runWithApiKeyRotation(key => generateProductListingContent(
            currentSlogan, niche, currentAudience, designStrategy.designStyle.mood, key
        ));
        setProductListing(content);
        setIsListingModalOpen(true);
    } catch (e: any) { alert(e.message || "Sorry, the AI Merchandiser is busy. Please try again.");
    } finally { setIsGeneratingListing(false); }
  };

  const handleCopyPrompt = () => { if (videoPrompt) { navigator.clipboard.writeText(videoPrompt); setHasCopied(true); setTimeout(() => setHasCopied(false), 2000); } };
  const handleCopySection = (text: string, section: string) => { navigator.clipboard.writeText(text); setCopiedSection(section); setTimeout(() => setCopiedSection(null), 2000); };

  useEffect(() => {
    const isMockupsLoading = images.filter(i => i.configId !== DESIGN_ASSET_CONFIG.id).some(img => img.loading);
    if (!isMockupsLoading && status === GenerationStatus.GENERATING_MOCKUPS) { 
      setStatus(GenerationStatus.COMPLETED); 
      
      // Auto-generate SEO Content and Video Script when mockups are done
      const autoGenerateContent = async () => {
        const selectedAsset = designAssets.find(asset => asset.id === selectedDesignAssetId);
        const niche = NICHES.find(n => n.id === selectedAsset?.strategy.nicheId)?.label || 'General';
        
        if (designStrategy && currentSlogan && niche) {
          // 1. Auto-generate SEO Listing
          setIsGeneratingListing(true);
          try {
            const content = await runWithApiKeyRotation(key => generateProductListingContent(
              currentSlogan, niche, currentAudience, designStrategy.designStyle.mood, key
            ));
            setProductListing(content);
          } catch (e) { console.error("Auto SEO generation failed", e); }
          finally { setIsGeneratingListing(false); }

          // 2. Auto-generate Video Script
          const successfulMockups = images.filter(img => img.imageUrl && img.id.startsWith('mockup-')).map(img => img.imageUrl!);
          if (successfulMockups.length > 0) {
            setIsVideoPromptGenerating(true);
            try {
              const prompt = await runWithApiKeyRotation(key => generateVideoPrompt(currentSlogan, niche, currentAudience, designStrategy, successfulMockups, key));
              setVideoPrompt(prompt);
            } catch (e) { console.error("Auto Video Script generation failed", e); }
            finally { setIsVideoPromptGenerating(false); }
          }
        }
      };
      autoGenerateContent();
    }
  }, [images, status]);

  const handleRetry = async (imageId: string) => {
    if (status === GenerationStatus.REVIEW_5_ASSETS) { alert("To retry a concept, please use the 'Start Over' button for a fresh set of concepts."); return; }
    if (imageId === DESIGN_ASSET_CONFIG.id) return;
    
    const selectedAsset = designAssets.find(asset => asset.id === selectedDesignAssetId);
    if (selectedAsset?.imageUrl && designStrategy) {
      // Find the recommendation for this image
      const mockupIndex = parseInt(imageId.split('-')[1]);
      const rec = designStrategy.recommendedMockups[mockupIndex];
      
      if (rec) {
        setImages(prev => prev.map(img => img.id === imageId ? { ...img, loading: true, error: null } : img));
        try {
          const base64Url = await runWithApiKeyRotation(key => 
            generateMockupImage(rec.prompt, key, imageModel, imageSize, "1:1", selectedAsset.imageUrl!)
          );
          setImages(prev => prev.map(img => img.id === imageId ? { ...img, loading: false, imageUrl: base64Url, error: null } : img));
        } catch (error: any) {
          const errorMessage = error.message || 'An unknown error occurred.';
          setImages(prev => prev.map(img => img.id === imageId ? { ...img, loading: false, error: errorMessage } : img));
        }
      }
    }
  };

  const handleDownloadAll = async () => {
    setIsZipping(true);
    const zip = new JSZip();
    const folder = zip.folder(`pod-assets-${Date.now()}`);
    if (folder) {
      const sortedImages = [...images];
      sortedImages.forEach(img => { 
        if (img.imageUrl) { 
          const sanitizedTitle = img.title.replace(/\s/g, '_').replace(/[&/()]/g, ''); 
          folder.file(`${sanitizedTitle}.png`, img.imageUrl.split(',')[1], { base64: true }); 
        } 
      });
      
      if (videoUrl) { 
        try { 
          const response = await fetch(videoUrl); 
          const blob = await response.blob(); 
          folder.file('promo_video.mp4', blob); 
        } catch (e) { console.error("Could not add video to zip", e); } 
      }

      // Add SEO Content
      if (productListing) {
        const seoText = `TITLE: ${productListing.title}\n\nDESCRIPTION:\n${productListing.description}\n\nTAGS:\n${productListing.tags.join(', ')}`;
        folder.file('seo_listing_content.txt', seoText);
      }

      // Add Video Script
      if (videoPrompt) {
        folder.file('video_script_prompt.txt', videoPrompt);
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

  const handleOpenTrendSpy = () => { setTrendResults(null); setSearchTopic(''); setIsTrendSpyModalOpen(true); };
  const handleSearchTrends = async () => {
    setIsSearchingTrends(true);
    setTrendResults(null);
    try {
      // Add a 60-second timeout to prevent indefinite hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Trend analysis timed out. Please try a more specific topic.")), 60000)
      );
      
      const suggestions = await Promise.race([
        runWithApiKeyRotation(key => generateSloganSuggestions(currentAudience, searchTopic, searchTimeframe, key)),
        timeoutPromise
      ]) as TrendingSlogan[];
      
      setTrendResults(suggestions || []);
    } catch (error: any) {
      alert(error.message || "Sorry, the AI analyst is busy. Please try again.");
    } finally { setIsSearchingTrends(false); }
  };
  const handleCopyTrendText = (text: string) => { navigator.clipboard.writeText(text); setCopiedText(text); setTimeout(() => setCopiedText(null), 2000); };
  
  const handleRefineListing = async () => {
    if (!productListing || !refinementInstruction) return;
    setIsRefining(true);
    try {
        const refinedContent = await runWithApiKeyRotation(key => refineProductListingContent(
            productListing, refinementInstruction, key
        ));
        setProductListing(refinedContent);
        setRefinementInstruction('');
    } catch (e: any) {
        alert(e.message || "Sorry, the AI Merchandiser is busy. Please try again.");
    } finally {
        setIsRefining(false);
    }
  };

  const handleOpenRedesignModal = () => {
    setRedesignPreviewImage(null);
    setRedesignError(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setRedesignDescription('');
    setIsRedesignModalOpen(true);
  };

  const handleRedesignFileChange = (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setRedesignError("Image size cannot exceed 4MB.");
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        setRedesignPreviewImage(reader.result as string);
        setRedesignError(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
    };
    reader.onerror = () => {
        setRedesignError("Failed to read the image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleRedesignPaste = async () => {
    try {
        setRedesignError(null);
        const permission = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
        if (permission.state === 'denied') {
            throw new Error('Not allowed to read clipboard.');
        }
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            const imageType = item.types.find(type => type.startsWith('image/'));
            if (imageType) {
                const blob = await item.getType(imageType);
                const reader = new FileReader();
                reader.onload = () => {
                    setRedesignPreviewImage(reader.result as string);
                    setCrop(undefined);
                    setCompletedCrop(undefined);
                };
                reader.readAsDataURL(blob);
                return;
            }
        }
        setRedesignError("No image found on clipboard.");
    } catch (error: any) {
        setRedesignError(`Paste failed: ${error.message}`);
    }
  };

  const handleCropAndAnalyze = async () => {
    if (completedCrop?.width && completedCrop?.height && redesignImgRef.current) {
      try {
        const croppedImageBase64 = await getCroppedImg(redesignImgRef.current, completedCrop);
        handleAnalyzeAndRedesign(croppedImageBase64, redesignDescription);
      } catch (e) {
        console.error('Cropping failed', e);
        setRedesignError('Could not crop the image. Please try again.');
      }
    } else {
      setRedesignError('Please select an area to crop first.');
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    ));
  }

  const getStatusText = () => {
    if (status === GenerationStatus.GENERATING_5_ASSETS) return isAnalyzingRedesign ? "AI is analyzing your image..." : "AI is generating 3 concepts...";
    if (status === GenerationStatus.GENERATING_MOCKUPS) return "Generating all your mockups...";
    if (status === GenerationStatus.ANALYZING) return "AI Strategist is thinking...";
    return "Processing...";
  };

  const isGeneratingAnything = status !== GenerationStatus.IDLE && status !== GenerationStatus.COMPLETED && status !== GenerationStatus.ERROR;

  return (
    <div className="min-h-screen pb-20 bg-slate-900">
      <Header 
        onOpenKeyManager={() => setIsKeyManagerOpen(true)}
        activeKeyDisplay={activeApiKey ? maskApiKey(activeApiKey) : null}
      />

      <div className="transition-all duration-500 relative">
         <PromptInput 
            onGenerate={handleStartGenerationProcess}
            isGenerating={isGeneratingAnything}
            statusText={getStatusText()}
            currentSlogan={currentSlogan}
            setCurrentSlogan={setCurrentSlogan}
            currentAudience={currentAudience}
            setCurrentAudience={setCurrentAudience}
            isThinkingMode={isThinkingMode}
            setIsThinkingMode={setIsThinkingMode}
            onOpenTrendSpy={handleOpenTrendSpy}
            isTrendSpyModalOpen={isTrendSpyModalOpen}
            setIsTrendSpyModalOpen={setIsTrendSpyModalOpen}
            isSearchingTrends={isSearchingTrends}
            handleSearchTrends={handleSearchTrends}
            trendResults={trendResults}
            searchTopic={searchTopic}
            setSearchTopic={setSearchTopic}
            searchTimeframe={searchTimeframe}
            setSearchTimeframe={setSearchTimeframe}
            copiedText={copiedText}
            handleCopyTrendText={handleCopyTrendText}
            onOpenRedesignModal={handleOpenRedesignModal}
         />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {keySwitchNotification && (
          <div className="max-w-7xl mx-auto mb-6">
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-3 flex items-center gap-3 text-sm text-sky-200 animate-in fade-in duration-300">
                  <Info className="w-5 h-5 text-sky-400 flex-shrink-0" />
                  <p>{keySwitchNotification}</p>
              </div>
          </div>
        )}

        {status === GenerationStatus.ERROR && (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-800 rounded-3xl border border-rose-500/30 mb-8">
            <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Generation Failed</h3>
             <p className="text-slate-400 text-center max-w-md mb-6">{globalError}</p>
            <div className='flex items-center gap-4'>
              <button onClick={() => setIsKeyManagerOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all">
                <Key className="w-5 h-5" /> Manage API Keys
              </button>
              <button onClick={resetAppState} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-600/30">
                <RefreshCw className="w-5 h-5" /> Try Again
              </button>
            </div>
          </div>
        )}

        {(status === GenerationStatus.GENERATING_5_ASSETS || status === GenerationStatus.REVIEW_5_ASSETS) && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-white">Step 1: Choose Your Winning Concept</h2>
                <p className="text-slate-400 mt-1">The AI has generated 3 concepts. Select one to continue.</p>
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
                    <button onClick={handleGenerateVideoPrompt} disabled={isVideoPromptGenerating} className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-700/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"> {isVideoPromptGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />} Generate Video Script </button>
                     <button onClick={handleGenerateListingContent} disabled={isGeneratingListing} className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-600/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"> {isGeneratingListing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Tags className="w-5 h-5" />} Generate SEO Content </button>
                    <button onClick={handleGenerateVideo} disabled={isVideoGenerating} className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap" title="Generate a short promo video for social media"> {isVideoGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />} Create Promo Video </button>
                    <button onClick={handleDownloadAll} disabled={isZipping} className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50"> {isZipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} Download All </button>
                  </div>
                )}
             </div>

            {/* Image Generation Settings */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-8 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                    <h4 className="font-bold text-white">Image Generation Engine</h4>
                    <p className="text-xs text-slate-400">Choose between speed (Flash) or quality (Pro).</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg">
                    <button onClick={() => setImageModel('gemini-2.5-flash-image')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${imageModel === 'gemini-2.5-flash-image' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Flash Image</button>
                    <button onClick={() => setImageModel('gemini-3-pro-image-preview')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${imageModel === 'gemini-3-pro-image-preview' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>Pro Image</button>
                </div>
                {imageModel === 'gemini-3-pro-image-preview' && (
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-300">Size:</label>
                        <select value={imageSize} onChange={(e) => setImageSize(e.target.value as ImageSize)} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                            <option value="1K">1K</option>
                            <option value="2K">2K</option>
                            <option value="4K">4K</option>
                        </select>
                    </div>
                )}
            </div>

             { (isVideoGenerating || videoUrl || videoError) && ( <div className="mb-12"> <h3 className="text-2xl font-bold text-white mb-4">Social Media Video</h3> {isVideoGenerating && (<div className="aspect-video w-full max-w-md mx-auto bg-slate-800 rounded-xl flex flex-col items-center justify-center border border-slate-700"><Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" /><p className="text-white font-semibold">Rendering your video...</p><p className="text-slate-400 text-sm">This may take a few minutes.</p></div>)} {videoError && (<div className="aspect-video w-full max-w-md mx-auto bg-rose-500/10 rounded-xl flex flex-col items-center justify-center border border-rose-500/30 p-4"><AlertCircle className="w-12 h-12 text-rose-500 mb-4" /><p className="text-white font-semibold text-center mb-4">Video Generation Failed</p><p className="text-rose-200 text-sm text-center mb-6 break-words">{videoError}</p></div>)} {videoUrl && (<div className="w-full max-w-md mx-auto"><video src={videoUrl} controls className="rounded-xl w-full aspect-[9/16] bg-black" /><a href={videoUrl} download={`promo_video_${currentSlogan.slice(0, 15)}.mp4`} className="mt-4 w-full flex items-center justify-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-600/30"><Download className="w-5 h-5" /> Download Video (MP4)</a></div>)} </div> )}

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {images.map((image) => ( <ImageCard key={image.id} image={image} onRetry={handleRetry} /> ))} </div>
             
             {status === GenerationStatus.COMPLETED && ( <div className="mt-16 text-center"> <button onClick={resetAppState} className="px-8 py-3 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all text-sm font-semibold"> Create Another Collection </button> </div> )}
          </div>
        )}
      </main>

      {isKeyManagerOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <div className='flex items-center gap-2'> <Key className="w-5 h-5 text-amber-400" /> <h3 className="text-lg font-bold text-white">API Key Manager</h3> </div>
                    <button onClick={() => setIsKeyManagerOpen(false)} className="p-1 rounded-full hover:bg-slate-700 transition-colors"> <X className="w-5 h-5 text-slate-400" /> </button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mb-4">
                    <h4 className="text-sm font-bold text-indigo-300 mb-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Paid Model Access
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">To use Gemini 3 Pro Image or Veo Video models, you must connect a paid Google Cloud project.</p>
                    <button 
                      onClick={handleOpenPlatformKeySelector}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${hasPlatformKey ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}`}
                    >
                      {hasPlatformKey ? <><CheckCircle className="w-4 h-4" /> Project Connected</> : <><ExternalLink className="w-4 h-4" /> Connect Paid Project</>}
                    </button>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="block text-[10px] text-slate-500 mt-2 hover:text-slate-400 underline text-center">Learn about Gemini API billing</a>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                    <h4 className="text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5" /> Mẹo cho tài khoản Miễn phí
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Bạn có thể thêm <b>nhiều API Key</b> từ các tài khoản Google khác nhau. Ứng dụng sẽ tự động xoay vòng (Rotate) để tránh lỗi giới hạn lượt gọi (Rate Limit). Nên dùng model <b>Flash Image</b> cho Key miễn phí.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Or Use Custom Keys</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">Custom keys are stored locally. Use these if you have your own API keys.</p>
                  <div className="flex gap-2">
                    <input type="text" value={newApiKeyInput} onChange={(e) => setNewApiKeyInput(e.target.value)} placeholder="Enter new API Key..." className="flex-grow bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"/>
                    <button onClick={handleAddApiKey} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors text-sm"><PlusCircle className="w-4 h-4"/> Add Key</button>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-700 overflow-y-auto">
                    {apiKeys.length === 0 ? ( <p className='text-sm text-slate-500 text-center py-8'>No API keys added yet.</p> ) : (
                      <ul className="space-y-2">
                        {apiKeys.map(k => (
                          <li key={k.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
                            <span className="font-mono text-sm text-slate-300">{maskApiKey(k.key)}</span>
                            <div className="flex items-center gap-2">
                              {activeApiKeyId === k.id ? ( <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Active</span> ) : ( <button onClick={() => handleSetActiveApiKey(k.id)} className="text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md transition-colors">Set Active</button> )}
                              <button onClick={() => handleDeleteApiKey(k.id)} className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
            </div>
        </div>
      )}

      {isRedesignModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl flex flex-col">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <div className='flex items-center gap-2'> <ImageIcon className="w-5 h-5 text-indigo-400" /> <h3 className="text-lg font-bold text-white">Redesign Image</h3> </div>
                    <button onClick={() => setIsRedesignModalOpen(false)} className="p-1 rounded-full hover:bg-slate-700 transition-colors"> <X className="w-5 h-5 text-slate-400" /> </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="w-full min-h-[300px] rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center text-center p-1 bg-slate-900/50">
                    {redesignPreviewImage ? (
                      <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        onComplete={c => setCompletedCrop(c)}
                        aspect={1}
                        className="max-h-full"
                      >
                        <img ref={redesignImgRef} src={redesignPreviewImage} onLoad={onImageLoad} alt="Crop preview" style={{ maxHeight: '60vh' }}/>
                      </ReactCrop>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-slate-500 mb-2" />
                        <p className="text-slate-300 font-semibold">Drag & drop an image here</p>
                        <p className="text-slate-500 text-xs mt-1">or use the buttons below</p>
                      </>
                    )}
                  </div>
                  
                  {redesignPreviewImage && (
                    <div className="relative">
                        <label className="block text-xs text-slate-400 font-semibold mb-1 ml-1">Describe the design (or enter a quote)</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={redesignDescription}
                                onChange={(e) => setRedesignDescription(e.target.value)}
                                placeholder="e.g., 'Cosmic Cat', a funny cat in space..."
                                className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm pl-10"
                            />
                            <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        </div>
                    </div>
                  )}

                  {redesignError && <p className="text-sm text-rose-400 text-center">{redesignError}</p>}
                  
                  {!redesignPreviewImage && (
                    <div className="flex gap-4">
                        <label className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors cursor-pointer">
                          <UploadCloud className="w-4 h-4" />
                          <span>Upload File</span>
                          <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={(e) => handleRedesignFileChange(e.target.files ? e.target.files[0] : null)} />
                        </label>
                        <button onClick={handleRedesignPaste} className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors">
                          <Copy className="w-4 h-4" />
                          <span>Paste Image</span>
                        </button>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-700 flex items-center justify-between">
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                        <CropIcon className="w-4 h-4" />
                        <span>Select the main design, then add a description.</span>
                    </p>
                    <button 
                        onClick={handleCropAndAnalyze}
                        disabled={!completedCrop?.width || !completedCrop?.height || isAnalyzingRedesign}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isAnalyzingRedesign ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        Analyze & Redesign
                    </button>
                </div>
            </div>
        </div>
      )}

      {isVideoPromptModalOpen && videoPrompt && ( <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"> <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl flex flex-col"> <div className="p-4 border-b border-slate-700 flex justify-between items-center"><div className='flex items-center gap-2'><FileText className="w-5 h-5 text-indigo-400" /><h3 className="text-lg font-bold text-white">AI Video Director Script</h3></div><button onClick={() => setIsVideoPromptModalOpen(false)} className="p-1 rounded-full hover:bg-slate-700 transition-colors"><X className="w-5 h-5 text-slate-400" /></button></div> <pre className="p-6 text-sm text-slate-300 overflow-y-auto max-h-[60vh] whitespace-pre-wrap font-sans bg-slate-900/50">{videoPrompt}</pre> <div className="p-4 border-t border-slate-700 flex justify-end"><button onClick={handleCopyPrompt} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all text-sm shadow-lg shadow-indigo-500/30"><Clipboard className="w-4 h-4" />{hasCopied ? 'Copied!' : 'Copy Script'}</button></div> </div> </div> )}
      {isListingModalOpen && productListing && ( <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"> <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"> <div className="p-4 border-b border-slate-700 flex justify-between items-center"> <div className='flex items-center gap-2'> <Tags className="w-5 h-5 text-teal-400" /> <h3 className="text-lg font-bold text-white">Product Listing SEO Content</h3> </div> <button onClick={() => setIsListingModalOpen(false)} className="p-1 rounded-full hover:bg-slate-700 transition-colors"> <X className="w-5 h-5 text-slate-400" /> </button> </div> <div className="p-6 space-y-6 overflow-y-auto"> <div> <div className="flex justify-between items-center mb-2"> <h4 className="font-bold text-white">Title</h4> <button onClick={() => handleCopySection(productListing.title, 'title')} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600 px-2 py-1 rounded-md transition-colors"> <Clipboard className="w-3 h-3" /> {copiedSection === 'title' ? 'Copied!' : 'Copy'} </button> </div> <p className="p-3 bg-slate-900/50 rounded-lg text-sm text-slate-300 border border-slate-700">{productListing.title}</p> </div> <div> <div className="flex justify-between items-center mb-2"> <h4 className="font-bold text-white">Description</h4> <button onClick={() => handleCopySection(productListing.description, 'description')} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600 px-2 py-1 rounded-md transition-colors"> <Clipboard className="w-3 h-3" /> {copiedSection === 'description' ? 'Copied!' : 'Copy'} </button> </div> <p className="p-3 bg-slate-900/50 rounded-lg text-sm text-slate-300 border border-slate-700 whitespace-pre-wrap">{productListing.description}</p> </div> <div> <div className="flex justify-between items-center mb-2"> <h4 className="font-bold text-white">Tags / Keywords</h4> <button onClick={() => handleCopySection(productListing.tags.join(', '), 'tags')} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600 px-2 py-1 rounded-md transition-colors"> <Clipboard className="w-3 h-3" /> {copiedSection === 'tags' ? 'Copied!' : 'Copy as CSV'} </button> </div> <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 flex flex-wrap gap-2"> {productListing.tags.map((tag, index) => ( <span key={index} className="bg-slate-700 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span> ))} </div> </div> <div className="mt-4 pt-4 border-t border-slate-700/50"> <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Wand2 className="w-4 h-4 text-indigo-400"/>AI Content Refiner</h4> <div className="flex gap-2"> <input type="text" value={refinementInstruction} onChange={(e) => setRefinementInstruction(e.target.value)} placeholder="e.g., make it funnier, target Gen Z..." className="flex-grow bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"/> <button onClick={handleRefineListing} disabled={isRefining || !refinementInstruction} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"> {isRefining ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} Refine </button> </div> </div> </div> <div className="p-4 border-t border-slate-700 flex justify-end"> <button onClick={() => setIsListingModalOpen(false)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all text-sm shadow-lg shadow-indigo-500/30">Close</button> </div> </div> </div> )}
    </div>
  );
};

export default App;