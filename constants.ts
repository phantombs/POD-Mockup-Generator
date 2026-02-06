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

export const COLOR_PALETTES = [
  { id: 'vibrant', label: 'Vibrant & Bold', colors: ['#FF0000', '#00FF00', '#0000FF'], context: 'High saturation, high energy, popping colors for maximum visibility.' },
  { id: 'pastel', label: 'Soft Pastel', colors: ['#FFB7B2', '#B2E2F2', '#E2F2B2'], context: 'Soft, gentle, trendy aesthetics for feminine or cute niches.' },
  { id: 'retro', label: 'Vintage 70s', colors: ['#E9C46A', '#F4A261', '#E76F51'], context: 'Warm yellows, burnt oranges, and deep teals for a nostalgic feel.' },
  { id: 'earth', label: 'Earth Tones', colors: ['#6B705C', '#A5A58D', '#B7B7A4'], context: 'Natural greens, browns, and muted tans for outdoor and adventure gear.' },
  { id: 'monochrome', label: 'Black & White', colors: ['#000000', '#FFFFFF', '#808080'], context: 'High contrast black and white. Timeless, minimalist, and easy to print.' },
  { id: 'neon', label: 'Cyber Neon', colors: ['#00F5FF', '#FF00E5', '#39FF14'], context: 'Electric blues, magentas, and lime greens for gaming and futuristic vibes.' },
];

export const DESIGN_STYLES = [
  { 
    id: 'auto', 
    label: '✨ Auto-Detect', 
    context: 'Analyze the slogan and niche to determine the most commercially viable artistic style automatically based on current POD trends.' 
  },
  { 
    id: 'quiet-activism', 
    label: 'Quiet Activism (Minimalist)', 
    context: 'Style: Clean, bold sans-serif or typewriter fonts, significant negative space. Focus on legible, impactful text. High contrast, minimalist aesthetic common on TikTok/Pinterest.' 
  },
  { 
    id: 'ai-futuristic', 
    label: 'AI / Futuristic Art', 
    context: 'Style: Y2K tech nostalgia, metallic/chrome textures, glitch effects, neon highlights, liquid metal fonts, and futuristic cyber-core motifs.' 
  },
  { 
    id: 'nature-eco', 
    label: 'Nature / Eco (Solar-Punk)', 
    context: 'Style: Intricate botanical line art, mushrooms, celestial bodies, solar-punk influence, muted earthy palettes, and organic, sustainable vibes.' 
  },
  { 
    id: 'fantasy-escapism', 
    label: 'Fantasy / Escapism', 
    context: 'Style: Ethereal lighting, dreamy landscapes, mythical creatures, vibrant magical colors, surreal compositions that evoke a sense of wonder.' 
  },
  { 
    id: 'pixel-art', 
    label: '8-Bit / Pixel Art', 
    context: 'Style: Retro gaming arcade aesthetic, low-resolution pixelated graphics, bright 8-bit color palette, nostalgic 90s console vibes.' 
  },
  { 
    id: 'quirky-diy', 
    label: 'Quirky DIY (Hand-Drawn)', 
    context: 'Style: Playful doodles, pencil/crayon textures, irregular lines, charmingly imperfect "human touch" designs popular for personalized gifts.' 
  },
  { 
    id: 'color-blocking', 
    label: 'Color-Blocking / Bold Graphics', 
    context: 'Style: Large geometric shapes, high-contrast clashing colors, brutalist layout, pop-art influence, maximalist and eye-catching composition.' 
  }
];

export const DESIGN_ASSET_CONFIG: MockupConfig = {
  id: 'design-asset',
  title: '1. Design Asset (Print-Ready)',
  description: 'Clean vector-style graphic optimized for T-shirt printing.',
  template: (slogan, strategy) => {
    const style = strategy?.designStyle || {
      typography: "Bold, modern typography",
      artStyle: "Vector-style graphic",
      colors: "Vibrant colors",
      mood: "Modern"
    };
    
    return `Create a high-quality POD design asset for: "${slogan}".
    Typography: ${style.typography}. 
    Art Style: ${style.artStyle}. 
    Colors: ${style.colors}. 
    Mood: ${style.mood}.
    Technical Constraint: TRANSPARENT BACKGROUND (.png format). NO background elements. The output must be a clean graphic with full transparency. Centered composition. The design must be clean, with no small stray pixels. Text must be perfectly legible and correctly spelled. Professional merchandise illustration style suitable for direct-to-garment (DTG) printing.`;
  }
};

export const PRODUCT_MOCKUP_CONFIGS: MockupConfig[] = [
  {
    id: 'tshirt-mockup',
    title: '2. Lifestyle T-Shirt',
    description: 'Design on a premium heavy cotton t-shirt.',
    template: (slogan, strategy) => {
      const ctx = strategy?.mockups?.tshirt || {
        model: "A stylish young adult",
        environment: "Urban street background",
        lighting: "Golden hour lighting"
      };
      
      return `Professional product photography of a premium t-shirt featuring the design from the reference image (quote: "${slogan}"). Model: ${ctx.model}. Environment: ${ctx.environment}. Lighting: ${ctx.lighting}. The t-shirt is the focus, high detail on fabric texture.`;
    }
  },
  {
    id: 'phonecase-mockup',
    title: '3. Premium Phone Case',
    description: 'Sleek impact-resistant phone case.',
    template: (slogan, strategy) => {
      const ctx = strategy?.mockups?.phoneCase || {
        surface: "Modern glass desk",
        props: "A cup of coffee and a notebook"
      };
      return `A high-end studio shot of a premium glossy phone case featuring the design from the reference (quote: "${slogan}"). Surface: ${ctx.surface}. Props: ${ctx.props}. Dramatic soft lighting, Apple-style aesthetic.`;
    }
  },
  {
    id: 'poster-mockup',
    title: '4. Framed Wall Art',
    description: 'Minimalist framed poster for home decor.',
    template: (slogan, strategy) => {
      const ctx = strategy?.mockups?.poster || {
        room: "Scandinavian living room",
        style: "Minimalist black frame"
      };
      return `A lifestyle photo of a large framed vertical poster on a wall. The poster shows the design from the reference (quote: "${slogan}"). Room: ${ctx.room}. Frame Style: ${ctx.style}. Natural light coming from a window.`;
    }
  },
  {
    id: 'cap-mockup',
    title: '5. Embroidered Cap',
    description: 'Classic baseball cap with embroidered logo.',
    template: (slogan, strategy) => {
      const ctx = strategy?.mockups?.cap || {
        style: "Vintage dad hat",
        setting: "Outdoor park bench"
      };
      return `Close-up shot of a high-quality cotton baseball cap featuring the design from the reference as an embroidered patch (quote: "${slogan}"). Style: ${ctx.style}. Setting: ${ctx.setting}. Focus on embroidery texture and stitching.`;
    }
  },
  {
    id: 'mug-mockup',
    title: '6. Desk & Home Mug',
    description: '11oz ceramic mug in a cozy setting.',
    template: (slogan, strategy) => {
      const ctx = strategy?.mockups?.mug || {
        setting: "Modern minimalist kitchen",
        props: "Steam rising from the mug"
      };
      return `A high-end studio shot of a white ceramic mug displaying the graphic from the reference (quote: "${slogan}"). Setting: ${ctx.setting}. Props: ${ctx.props}. 8k resolution, commercial look.`;
    }
  },
  {
    id: 'sticker-mockup',
    title: '7. Laptop Sticker',
    description: 'Vinyl die-cut sticker on a laptop.',
    template: (slogan, strategy) => {
      return `Close-up shot of a high-quality vinyl sticker on a modern silver laptop. The sticker shows the design from the reference (quote: "${slogan}"). Clean white border around the sticker (die-cut).`;
    }
  },
  {
    id: 'pillow-mockup',
    title: '8. Accent Throw Pillow',
    description: 'Square decorative pillow for sofas.',
    template: (slogan, strategy) => {
      const ctx = strategy?.mockups?.pillow || {
        setting: "Velvet navy sofa",
        colors: "Cozy warm tones"
      };
      return `A lifestyle interior photo of a square throw pillow featuring the design from the reference (quote: "${slogan}"). Setting: ${ctx.setting}. Lighting: Warm and cozy. Professional interior design photography.`;
    }
  },
  {
    id: 'tote-mockup',
    title: '9. Canvas Tote Bag',
    description: 'Eco-friendly tote bag mockup.',
    template: (slogan, strategy) => {
      return `A lifestyle photo of an eco-friendly beige canvas tote bag with the design from the reference image (quote: "${slogan}"). The bag is hanging on a wooden hook. Aesthetic: Sustainable, organic.`;
    }
  },
  {
    id: 'hoodie-mockup',
    title: '10. Premium Hoodie',
    description: 'Design on a cozy streetwear hoodie.',
    template: (slogan, strategy) => {
      return `Streetwear style photo of a cozy black hoodie with a large print on the back featuring the design from the reference (quote: "${slogan}"). Atmospheric lighting, urban vibes.`;
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