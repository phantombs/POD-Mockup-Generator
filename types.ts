

export interface MockupRecommendation {
  productId: string;
  productName: string;
  rationale: string;
  prompt: string;
}

export interface DesignStrategy {
  designStyle: {
    typography: string;
    artStyle: string;
    colors: string;
    mood: string;
  };
  recommendedMockups: MockupRecommendation[];
}

export interface MockupConfig {
  id: string;
  title: string;
  description: string;
  template: (slogan: string, strategy?: DesignStrategy) => string;
}

export interface GeneratedImage {
  id: string;
  configId: string;
  title: string;
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING_5_ASSETS = 'GENERATING_5_ASSETS',
  REVIEW_5_ASSETS = 'REVIEW_5_ASSETS',
  ANALYZING = 'ANALYZING',
  GENERATING_MOCKUPS = 'GENERATING_MOCKUPS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface StrategySuggestion {
  title: string;
  nicheId: string;
  styleId: string;
  colorId: string;
  rationale: string;
  designStyle: {
    typography: string;
    artStyle: string;
    colors: string;
    mood: string;
  };
  recommendedMockups: MockupRecommendation[];
}

export interface DesignAsset {
  id: string;
  imageUrl: string | null;
  loading: boolean;
  isRemovingBg?: boolean;
  error: string | null;
  strategy: StrategySuggestion;
}

export interface TrendingSlogan {
  slogan: string;
  rationale: string;
  suggestedSearchTerm: string;
  traffic: string;
  conversionRate: string;
}

export interface ProductListingContent {
  title: string;
  description: string;
  tags: string[];
}

export interface ApiKey {
  id: string;
  key: string;
}

export type ImageModel = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
export type ImageSize = '1K' | '2K' | '4K';
