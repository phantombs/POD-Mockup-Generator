import { MockupConfig } from './types';

export const NICHES = [
  { id: 'general', label: 'General / Lifestyle' },
  { id: 'fitness', label: 'Fitness & Gym' },
  { id: 'gaming', label: 'Gaming & Geek Culture' },
  { id: 'pets', label: 'Pets (Cats/Dogs)' },
  { id: 'outdoors', label: 'Outdoors & Adventure' },
  { id: 'funny', label: 'Funny / Sarcastic' },
  { id: 'inspirational', label: 'Inspirational / Spiritual' },
  { id: 'work', label: 'Work / Hustle Culture' },
  { id: 'custom', label: 'Custom / Other (Type your own)' },
];

export const DESIGN_STYLES = [
  { 
    id: 'auto', 
    label: '✨ Auto-Detect (Let AI Choose)', 
    context: 'Analyze the slogan and niche to determine the most commercially viable artistic style automatically.' 
  },
  { 
    id: 'minimalist', 
    label: 'Minimalist Typography', 
    context: 'Style: Clean, bold sans-serif fonts, negative space, high contrast black/white or monochrome. Focus on legibility and simple geometric shapes.' 
  },
  { 
    id: 'retro', 
    label: 'Retro / Vintage (70s-90s)', 
    context: 'Style: 70s/80s/90s aesthetic, distressed texture (grunge), warm sunset colors, serif or cooper black fonts, cassette/vinyl motifs, slightly faded look.' 
  },
  { 
    id: 'y2k', 
    label: 'Y2K / Early 2000s', 
    context: 'Style: Early 2000s futuristic, chrome/metallic fonts, neon pinks and blues, glitch effects, tribal tattoos, digital grids, rave aesthetic.' 
  },
  { 
    id: 'futuristic', 
    label: 'AI / Futuristic / Cyberpunk', 
    context: 'Style: Abstract digital art, neon lights, dystopian vibes, surrealism, high-tech interface elements, glossy finishes.' 
  },
  { 
    id: 'hand-drawn', 
    label: 'Hand-Drawn / Sketchy', 
    context: 'Style: Organic imperfections, doodle style, pencil or charcoal texture, playful scribbles, unfinished lines, human touch.' 
  },
  { 
    id: 'brutalist', 
    label: 'Anti-Design / Brutalist', 
    context: 'Style: Chaotic layout, raw typography, clashing colors, pixelated elements, lo-fi aesthetic, MS Paint style, ironic and edgy.' 
  },
  { 
    id: 'fake-brand', 
    label: 'Nostalgia / Fake Brand', 
    context: 'Style: Logo-style design, crests, badges, corporate mascots, established date typography, varsity/collegiate lettering.' 
  },
  { 
    id: 'nature', 
    label: 'Nature / Eco / Solarpunk', 
    context: 'Style: Earth tones (greens, browns), botanical illustrations, sustainable vibes, soft organic shapes, cottagecore or solarpunk aesthetic.' 
  },
  { 
    id: 'bold-graphic', 
    label: 'Color-Blocking / Bold Graphic', 
    context: 'Style: Oversized graphics, flat design with no gradients, bright contrasting colors, pop-art influence, large shapes.' 
  },
  { 
    id: 'pixel-art', 
    label: '8-Bit / Pixel Art', 
    context: 'Style: Retro video game aesthetic, blocky pixels, limited color palette, arcade vibes.' 
  },
  { 
    id: 'kawaii', 
    label: 'Quirky / Kawaii DIY', 
    context: 'Style: Cute characters, pastel colors, sticker-bomb aesthetic, patches, playful icons, soft rounded fonts.' 
  }
];

export const DESIGN_ASSET_CONFIG: MockupConfig = {
  id: 'design-asset',
  title: '1. Design Asset (Vector Style)',
  description: 'Minimalist typography and graphic design suitable for screen printing.',
  template: (slogan, strategy) => {
    const style = strategy?.designStyle || {
      typography: "Bold, modern typography",
      artStyle: "Vector-style graphic",
      colors: "Vibrant colors",
      mood: "Modern"
    };
    
    return `Graphic design featuring the quote "${slogan}". 
    Typography: ${style.typography}. 
    Art Style: ${style.artStyle}. 
    Colors: ${style.colors}. 
    Mood: ${style.mood}.
    Constraint: The design MUST be on a plain, solid white background. The graphic must be isolated and centered. High resolution, clean lines, suitable for screen printing. Aspect Ratio: Square (1:1).`;
  }
};

export const PRODUCT_MOCKUP_CONFIGS: MockupConfig[] = [
  {
    id: 'tshirt-mockup',
    title: '2. T-Shirt Mockup',
    description: 'Lifestyle photo of a model wearing the design.',
    template: (slogan, strategy) => {
      const ctx = strategy?.mockups?.tshirt || {
        model: "A diverse, attractive model",
        environment: "soft, sunlit urban environment",
        lighting: "Natural lighting"
      };
      
      return `A stylish lifestyle photo of a modern t-shirt mockup in a dark color (e.g., black or navy). The t-shirt features the exact design from the reference image provided (quote: "${slogan}"). Model: ${ctx.model}. Environment: ${ctx.environment}. Lighting: ${ctx.lighting}. Focus on the detail and texture of the fabric. Photography style: Product photography, Depth of Field.`;
    }
  },
  {
    id: 'mug-mockup',
    title: '3. Coffee Mug Mockup',
    description: 'Ceramic mug shot in a themed setting.',
    template: (slogan, strategy) => {
      const ctx = strategy?.mockups?.mug || {
        setting: "simple wooden desk next to a laptop",
        props: "green plant"
      };

      return `High-quality studio shot of a classic white ceramic coffee mug, prominently displaying the graphic from the reference image (quote: "${slogan}"). Setting: ${ctx.setting}. Props: ${ctx.props}. Soft, focused light highlights the mug. Aesthetic: Clean, professional, commercial product photography.`;
    }
  },
  {
    id: 'sticker-mockup',
    title: '4. Sticker Mockup',
    description: 'Die-cut vinyl sticker on a relevant surface.',
    template: (slogan, strategy) => {
      const ctx = strategy?.mockups?.sticker || {
        surface: "weathered, matte black motorcycle helmet",
        lighting: "Harsh, directional light"
      };

      return `Close-up, detailed photo of a durable vinyl sticker applied to a ${ctx.surface}. The sticker features the design from the reference image (quote: "${slogan}"). Show the slight curvature and texture of the sticker edge. Lighting: ${ctx.lighting}.`;
    }
  },
  {
    id: 'phone-case-mockup',
    title: '5. Phone Case Mockup',
    description: 'Clear case on a modern smartphone.',
    template: (slogan, strategy) => {
      const ctx = strategy?.mockups?.phoneCase || {
        surface: "minimalist concrete or marble surface",
        props: "stylish sunglasses"
      };

      return `A clean flat lay photo of a modern smartphone with a clear phone case mockup. The case features the design from the reference image (quote: "${slogan}"). Surface: ${ctx.surface}. Props adjacent to phone: ${ctx.props}. Color Palette: Neutral and muted.`;
    }
  },
  {
    id: 'composite-mockup',
    title: '6. Brand Composite',
    description: 'Collection of products displayed together.',
    template: (slogan, strategy) => {
      const ctx = strategy?.mockups?.composite || {
        arrangement: "flat-lay or shelf display",
        theme: "Unified color theme, premium lifestyle branding"
      };

      return `A cohesive, aesthetically pleasing ${ctx.arrangement} showing a T-shirt (folded neatly), a Coffee Mug, and a Sticker. All items feature the design from the reference image (quote: "${slogan}"). Aesthetic: ${ctx.theme}.`;
    }
  }
];

export const ALL_CONFIGS = [DESIGN_ASSET_CONFIG, ...PRODUCT_MOCKUP_CONFIGS];

export const INITIAL_IMAGES = ALL_CONFIGS.map((config) => ({
  id: config.id,
  configId: config.id,
  title: config.title,
  imageUrl: null,
  loading: false,
  error: null,
}));