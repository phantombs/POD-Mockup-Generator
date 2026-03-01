import { MockupConfig } from './types';

export const NICHES = [
  { id: 'general', label: 'General / Lifestyle' },
  { id: 'fitness', label: 'Fitness & Gym' },
  { id: 'gaming', label: 'Gaming & Geek Culture' },
  { id: 'pets', label: 'Pets (Dog Mom / Cat Dad)' },
  { id: 'outdoors', label: 'National Parks & Adventure' },
  { id: 'funny', label: 'Sarcastic / Snarky' },
  { id: 'professions', label: 'Professions (Nurse, Teacher, Trucker)' },
  { id: 'family', label: 'Family (Grandma, New Dad, Siblings)' },
  { id: 'hustle', label: 'Work / Hustle Culture' },
  { id: 'holidays', label: 'Seasonal / US Holidays' },
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
    id: 'retro-wavy', 
    label: 'Retro Wavy / Groovy', 
    context: 'Style: 70s inspired wavy typography, thick outlines, warm retro colors (mustard, terracotta, teal). High demand on Etsy for "Mama" and "Teacher" niches.' 
  },
  { 
    id: 'distressed-vintage', 
    label: 'Distressed Vintage', 
    context: 'Style: Weathered, cracked textures, muted colors, collegiate fonts. Evokes a "thrifted" look popular in US collegiate and outdoor niches.' 
  },
  { 
    id: 'minimalist-line-art', 
    label: 'Minimalist Line Art', 
    context: 'Style: Single-line drawings, abstract faces, botanical elements, clean serif fonts. High-end aesthetic for home decor and apparel.' 
  },
  { 
    id: 'bold-typography', 
    label: 'Bold Statement Typography', 
    context: 'Style: Massive, heavy sans-serif fonts, often stacked or arched. Focus is 100% on the message. High visibility for political or social statements.' 
  },
  { 
    id: 'kawaii-cute', 
    label: 'Kawaii / Pastel Pop', 
    context: 'Style: Adorable characters, soft pastel colors, bubbly fonts. Popular for Gen Z and "soft girl" aesthetics.' 
  },
  { 
    id: 'brutalist-tech', 
    label: 'Brutalist / Cyber-Core', 
    context: 'Style: Raw, unpolished, industrial fonts, metallic textures, high contrast, glitch art. Popular in gaming and tech-wear.' 
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
    
    return `Create a professional, high-resolution PRINT-READY design asset for: "${slogan}".
    Typography: ${style.typography}. 
    Art Style: ${style.artStyle}. 
    Colors: ${style.colors}. 
    Mood: ${style.mood}.
    
    CRITICAL TECHNICAL SPECS:
    1. ISOLATED ON TRANSPARENT BACKGROUND: The graphic must be perfectly isolated with NO background, NO shadows, and NO gradients behind it.
    2. HIGH DEFINITION: Sharp edges, clean lines, suitable for large format printing (5000px+ quality).
    3. RGB COLOR SPACE: Vibrant and accurate colors.
    4. COMPOSITION: Centered, balanced, and professional.
    5. NO MOCKUPS: Do not show the design on a shirt or any product. Just the raw graphic.
    
    This is for a Print-on-Demand (POD) master file. The quality must be elite.`;
  }
};

export const PRODUCT_MOCKUP_CONFIGS: MockupConfig[] = [
  {
    id: 'tshirt-mockup',
    title: '2. Lifestyle T-Shirt',
    description: 'Design on a premium heavy cotton t-shirt.',
    template: (slogan) => {
      return `Professional product photography of a premium t-shirt featuring the design from the reference image (quote: "${slogan}"). Model: A stylish young adult. Environment: Urban street background. Lighting: Golden hour lighting. The t-shirt is the focus, high detail on fabric texture.`;
    }
  },
  {
    id: 'phonecase-mockup',
    title: '3. Premium Phone Case',
    description: 'Sleek impact-resistant phone case.',
    template: (slogan) => {
      return `A high-end studio shot of a premium glossy phone case featuring the design from the reference (quote: "${slogan}"). Surface: Modern glass desk. Props: A cup of coffee and a notebook. Dramatic soft lighting, Apple-style aesthetic.`;
    }
  },
  {
    id: 'poster-mockup',
    title: '4. Framed Wall Art',
    description: 'Minimalist framed poster for home decor.',
    template: (slogan) => {
      return `A lifestyle photo of a large framed vertical poster on a wall. The poster shows the design from the reference (quote: "${slogan}"). Room: Scandinavian living room. Frame Style: Minimalist black frame. Natural light coming from a window.`;
    }
  },
  {
    id: 'cap-mockup',
    title: '5. Embroidered Cap',
    description: 'Classic baseball cap with embroidered logo.',
    template: (slogan) => {
      return `Close-up shot of a high-quality cotton baseball cap featuring the design from the reference as an embroidered patch (quote: "${slogan}"). Style: Vintage dad hat. Setting: Outdoor park bench. Focus on embroidery texture and stitching.`;
    }
  },
  {
    id: 'mug-mockup',
    title: '6. Desk & Home Mug',
    description: '11oz ceramic mug in a cozy setting.',
    template: (slogan) => {
      return `A high-end studio shot of a white ceramic mug displaying the graphic from the reference (quote: "${slogan}"). Setting: Modern minimalist kitchen. Props: Steam rising from the mug. 8k resolution, commercial look.`;
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
    template: (slogan) => {
      return `A lifestyle interior photo of a square throw pillow featuring the design from the reference (quote: "${slogan}"). Setting: Velvet navy sofa. Lighting: Warm and cozy. Professional interior design photography.`;
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