export interface DesignStrategy {
  designStyle: {
    typography: string;
    artStyle: string;
    colors: string;
    mood: string;
  };
  mockups: {
    tshirt: { model: string; environment: string; lighting: string };
    mug: { setting: string; props: string };
    sticker: { surface: string; lighting: string };
    phoneCase: { surface: string; props: string };
    composite: { arrangement: string; theme: string };
  };
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
  ANALYZING = 'ANALYZING',
  GENERATING_ASSET = 'GENERATING_ASSET',
  REVIEW_ASSET = 'REVIEW_ASSET',
  GENERATING_MOCKUPS = 'GENERATING_MOCKUPS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}