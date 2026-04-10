import { GoogleGenAI, Type, VideoGenerationReferenceImage, VideoGenerationReferenceType, ThinkingLevel } from "@google/genai";
import { DesignStrategy, StrategySuggestion, TrendingSlogan, ProductListingContent, ImageModel, ImageSize } from "../types";
import { NICHES, DESIGN_STYLES, COLOR_PALETTES } from "../constants";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getApiClient = (apiKey: string | null) => {
    const keyToUse = apiKey || process.env.API_KEY;
    if (!keyToUse) {
        throw new Error("API key is missing. Please add and select a key in the API Key Manager.");
    }
    return new GoogleGenAI({ apiKey: keyToUse });
};

export const generateSloganSuggestions = async (audience: string, topic: string, timeframe: string, apiKey: string | null): Promise<TrendingSlogan[]> => {
  const ai = getApiClient(apiKey);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find trending POD slogans for:
      - Audience: "${audience || 'General US'}"
      - Topic: "${topic || 'Trending lifestyle'}"
      - Timeframe: "${timeframe}"`,
      config: {
        systemInstruction: `You are a legendary 7-figure Print-on-Demand (POD) entrepreneur and Market Intelligence Expert.
        Your expertise lies in identifying "micro-trends" before they go mainstream on platforms like Etsy US, Amazon Merch, Pinterest, and TikTok.
        
        **EXPERT ANALYSIS PROTOCOL:**
        1. Marketplace Pulse: Search for bestsellers in the US related to the topic.
        2. IP SAFETY CHECK: You MUST avoid any slogans related to Brands, Logos, Celebrities, or Trademarked Phrases.
        3. Evergreen Niche Focus: Prioritize Nature, Professions, Hobbies, and Original Humor.
        
        OUTPUT RULES:
        - slogan: Short, punchy, correctly spelled US English.
        - rationale: Detailed expert analysis in Vietnamese explaining why this will sell.
        - suggestedSearchTerm: Precise English query for US marketplaces to see competition.
        - traffic: Estimated search volume (High, Medium, Low).
        - conversionRate: Estimated potential (e.g. 3.5%).
        - Return a JSON array of up to 10 objects.`,
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: {
          type: Type.ARRAY,
          maxItems: 10,
          items: {
            type: Type.OBJECT,
            properties: {
              slogan: { type: Type.STRING },
              rationale: { type: Type.STRING },
              suggestedSearchTerm: { type: Type.STRING },
              traffic: { type: Type.STRING },
              conversionRate: { type: Type.STRING },
            },
            required: ["slogan", "rationale", "suggestedSearchTerm", "traffic", "conversionRate"]
          }
        }
      }
    });
    if (response.text) {
      return JSON.parse(response.text) as TrendingSlogan[];
    }
    throw new Error("No slogans generated");
  } catch (error) {
    console.error("Error generating slogan suggestions:", error);
    throw error;
  }
};

export const generateFiveDesignConcepts = async (slogan: string, audience: string, apiKey: string | null, isThinkingMode: boolean): Promise<StrategySuggestion[]> => {
  const ai = getApiClient(apiKey);
  try {
    const nicheOptions = NICHES.map(n => `ID: "${n.id}", Label: "${n.label}"`).join('\n');
    const styleOptions = DESIGN_STYLES.map(s => `ID: "${s.id}", Label: "${s.label}", Context: "${s.context}"`).join('\n');
    const colorOptions = COLOR_PALETTES.map(c => `ID: "${c.id}", Label: "${c.label}", Context: "${c.context}"`).join('\n');

    const model = isThinkingMode ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    const config: any = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A short, catchy title for the strategy, in English." },
            nicheId: { type: Type.STRING },
            styleId: { type: Type.STRING },
            colorId: { type: Type.STRING },
            rationale: { type: Type.STRING, description: "Your reasoning for choosing this strategy and product mix, in Vietnamese." },
            designStyle: {
              type: Type.OBJECT,
              properties: {
                typography: { type: Type.STRING }, artStyle: { type: Type.STRING }, colors: { type: Type.STRING }, mood: { type: Type.STRING },
              },
              required: ["typography", "artStyle", "colors", "mood"]
            },
            recommendedMockups: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING },
                  productName: { type: Type.STRING },
                  rationale: { type: Type.STRING, description: "Why this product fits the audience (in Vietnamese)" },
                  prompt: { type: Type.STRING, description: "Detailed prompt for mockup generation (in English)" }
                },
                required: ["productId", "productName", "rationale", "prompt"]
              },
              minItems: 5,
              maxItems: 8
            }
          },
          required: ["title", "nicheId", "styleId", "colorId", "rationale", "designStyle", "recommendedMockups"]
        }
      }
    };

    if (isThinkingMode) {
      config.thinkingConfig = { thinkingBudget: 32768 };
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: `You are a legendary 7-figure POD entrepreneur and Creative Director specializing in the US market. 
      Your goal is to transform a slogan into 3 distinct, high-converting design concepts and select the most appropriate Redbubble products for each.

      **Slogan:** "${slogan}"
      **Target Audience:** "${audience || 'US Consumers'}"

      **EXPERT ANALYSIS PROTOCOL:**
      1. **Audience Habits:** Analyze the target audience's shopping habits and lifestyle. Where do they spend time? What do they buy?
      2. **Product Strategy:** Select 5 to 8 Redbubble-supported products that have the highest conversion potential for this specific niche and audience.
      3. **Visual Direction:** Ensure the design style and color palette are perfectly aligned with the audience's aesthetic preferences.

      **REDBUBBLE SUPPORTED PRODUCTS (Choose 5-8):**
      - Standard T-Shirt, Graphic T-Shirt, Hoodie, Sweatshirt, Die-cut Sticker, iPhone Case, Samsung Case, Poster, Canvas Print, Throw Pillow, Ceramic Mug, Tote Bag, Drawstring Bag, Spiral Notebook, Hardcover Journal, Baseball Cap, Dad Hat, Greeting Card, Tapestry.

      **Language Rules:**
      - 'title', 'productId', 'productName', 'prompt' in **English**.
      - 'rationale' and 'designStyle' properties in **Vietnamese**, explaining the commercial logic.

      **Available Options:**
      **Target Niches:**
      ${nicheOptions}
      **Visual Trends:**
      ${styleOptions}
      **Color Palettes:**
      ${colorOptions}
      `,
      config: {
        ...config,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    if (response.text) {
      const suggestions = JSON.parse(response.text) as StrategySuggestion[];
      if (suggestions.length > 3) return suggestions.slice(0, 3);
      return suggestions;
    }
    throw new Error("No strategy suggestion generated");
  } catch (error) {
    console.error("Error suggesting strategies:", error);
    throw error;
  }
};

export const analyzeAndSuggestDesigns = async (imageBase64: string, description: string, apiKey: string | null): Promise<StrategySuggestion[]> => {
  const ai = getApiClient(apiKey);
  try {
    const nicheOptions = NICHES.map(n => `ID: "${n.id}", Label: "${n.label}"`).join('\n');
    const styleOptions = DESIGN_STYLES.map(s => `ID: "${s.id}", Label: "${s.label}", Context: "${s.context}"`).join('\n');
    const colorOptions = COLOR_PALETTES.map(c => `ID: "${c.id}", Label: "${c.label}", Context: "${c.context}"`).join('\n');

    const imagePart = {
      inlineData: {
        mimeType: 'image/png',
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
      },
    };

    const textPart = {
      text: `You are an expert Print-on-Demand (POD) market trend analyst and a creative director.
      Your task is to analyze the provided user-submitted design image and its accompanying description. Your goal is to generate 3 NEW, commercially improved, and distinct design concepts.
      
      **IMPORTANT:**
      - The **IMAGE** provides the visual *style* to be inspired by (e.g., retro, minimalist, watercolor).
      - The **USER'S DESCRIPTION** provides the core *theme, subject, or exact text/quote* to use. You MUST adhere to the user's description for the content. Do NOT just copy the original image's subject if the user provides a new one.

      **User's Description/Keywords:** "${description || 'No description provided. Analyze the image for theme.'}"

      **Task: Generate 3 New Concepts:**
      Based on your analysis, generate an array of 3 unique concept objects. Each concept should be a fresh take on the original theme, aimed at maximizing commercial appeal.

      **Language Rules:**
      - The 'title' must be in **English**.
      - The 'rationale' and all 'designStyle' properties MUST be in **Vietnamese**.

      **Available Options (You MUST return one ID from each category for each of the 3 strategies):**
      
      **Target Niches:**
      ${nicheOptions}

      **Visual Trends:**
      ${styleOptions}

      **Color Palettes:**
      ${colorOptions}

      **Instructions:**
      1.  Generate an array of 3 unique and diverse concept objects.
      2.  For each object, select the single best ID from the Niches, Visual Trends, and Color Palettes lists.
      3.  Provide a short, catchy 'title' in English (e.g., "Cosmic Kitty", "Retro Sunset Explorer"). This title should be suitable as a replacement for a slogan. If the user provided a quote, the title can be inspired by it.
      4.  Provide a brief 'rationale' IN VIETNAMESE explaining why this new strategy will sell better.
      5.  Crucially, for each object, also provide a detailed 'designStyle' object containing specific creative direction IN VIETNAMESE: 'typography', 'artStyle', 'colors', and 'mood'.
      `
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A short, catchy title for the strategy, in English. This will act as the new slogan." },
              nicheId: { type: Type.STRING },
              styleId: { type: Type.STRING },
              colorId: { type: Type.STRING },
              rationale: { type: Type.STRING, description: "Your reasoning for choosing this new strategy, in Vietnamese." },
              designStyle: {
                type: Type.OBJECT,
                properties: {
                  typography: { type: Type.STRING }, artStyle: { type: Type.STRING }, colors: { type: Type.STRING }, mood: { type: Type.STRING },
                },
                required: ["typography", "artStyle", "colors", "mood"]
              }
            },
            required: ["title", "nicheId", "styleId", "colorId", "rationale", "designStyle"]
          }
        }
      }
    });

    if (response.text) {
      const suggestions = JSON.parse(response.text) as StrategySuggestion[];
      if (suggestions.length > 3) return suggestions.slice(0, 3);
      return suggestions;
    }
    throw new Error("No new design concepts generated from the image.");
  } catch (error) {
    console.error("Error analyzing image and suggesting designs:", error);
    throw error;
  }
};


export const generateDesignStrategy = async (
  slogan: string, 
  niche: string, 
  styleContext: string,
  targetAudience: string,
  colorContext: string,
  apiKey: string | null
): Promise<DesignStrategy> => {
  const ai = getApiClient(apiKey);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a world-class Print-on-Demand (POD) and Social Media Strategist. 
      Analyze the slogan: "${slogan}" for the niche: "${niche}".
      Target Audience: ${targetAudience || 'General public'}.
      Required Style: ${styleContext}.
      Required Color Palette: ${colorContext}.
      
      Goal: Create a design and marketing strategy that is commercially viral.
      
      Requirements (All descriptions MUST be in **Vietnamese**):
      1. Design Style: Define typography, art style, colors, and mood.
      2. Mockups: Suggest environments for various physical products.
      3. Video: Suggest a style for a short promo video (music, visual style, transitions).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            designStyle: {
              type: Type.OBJECT,
              properties: {
                typography: { type: Type.STRING }, artStyle: { type: Type.STRING }, colors: { type: Type.STRING }, mood: { type: Type.STRING },
              }, required: ["typography", "artStyle", "colors", "mood"]
            },
            mockups: {
              type: Type.OBJECT,
              properties: {
                tshirt: { type: Type.OBJECT, properties: { model: { type: Type.STRING }, environment: { type: Type.STRING }, lighting: { type: Type.STRING }, } },
                mug: { type: Type.OBJECT, properties: { setting: { type: Type.STRING }, props: { type: Type.STRING }, } },
                sticker: { type: Type.OBJECT, properties: { surface: { type: Type.STRING }, lighting: { type: Type.STRING }, } },
                phoneCase: { type: Type.OBJECT, properties: { surface: { type: Type.STRING }, props: { type: Type.STRING }, } },
                poster: { type: Type.OBJECT, properties: { room: { type: Type.STRING }, style: { type: Type.STRING }, } },
                cap: { type: Type.OBJECT, properties: { style: { type: Type.STRING }, setting: { type: Type.STRING }, } },
                pillow: { type: Type.OBJECT, properties: { setting: { type: Type.STRING }, colors: { type: Type.STRING }, } },
                composite: { type: Type.OBJECT, properties: { arrangement: { type: Type.STRING }, theme: { type: Type.STRING }, } },
                video: { type: Type.OBJECT, properties: { music: { type: Type.STRING }, style: { type: Type.STRING }, transitions: { type: Type.STRING }, } }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as DesignStrategy;
    }
    throw new Error("No strategy generated");
  } catch (error) {
    console.error("Error generating strategy:", error);
    throw error;
  }
};

export const generateMockupImage = async (
    prompt: string, 
    apiKey: string | null, 
    model: ImageModel, 
    imageSize: ImageSize,
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1",
    referenceImageBase64?: string | null
): Promise<string> => {
  const MAX_RETRIES = 3;
  const RATE_LIMIT_BACKOFF_MS = 32000; // 32 seconds, suitable for a 2 RPM limit.

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const ai = getApiClient(apiKey);
      const parts: any[] = [{ text: prompt }];
      if (referenceImageBase64) {
        const base64Data = referenceImageBase64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
          inlineData: { mimeType: 'image/png', data: base64Data }
        });
      }
      
      const config: any = { imageConfig: { aspectRatio: aspectRatio } };
      if (model === 'gemini-3-pro-image-preview') {
          config.imageConfig.imageSize = imageSize;
          config.tools = [{googleSearch: {}}];
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: config
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) throw new Error("No image generated.");
      
      const imagePart = candidates[0].content.parts.find(p => p.inlineData);
      if (!imagePart?.inlineData?.data) throw new Error("Missing image data.");

      // Success, return the image
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    } catch (error: any) {
      const errorMessage = JSON.stringify(error) || error.message || '';
      const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');

      if (isRateLimitError && attempt < MAX_RETRIES) {
        const waitTime = RATE_LIMIT_BACKOFF_MS * attempt; // 32s, then 64s
        console.warn(`Image generation rate limit hit on attempt ${attempt}. Waiting for ${waitTime / 1000} seconds before retrying...`);
        await sleep(waitTime);
      } else {
        console.error(`Failed to generate image on attempt ${attempt}. Error:`, error);
        throw error;
      }
    }
  }
  
  throw new Error("Failed to generate image after all retries.");
};


export const generatePromoVideo = async (slogan: string, strategy: DesignStrategy, referenceImagesBase64: string[], apiKey: string | null): Promise<string> => {
  const ai = getApiClient(apiKey);
  try {
    const firstReferenceImage = referenceImagesBase64[0];
    if (!firstReferenceImage) {
        throw new Error("No valid reference images provided for video generation.");
    }

    const imagePayload = {
      imageBytes: firstReferenceImage.replace(/^data:image\/\w+;base64,/, ""),
      mimeType: 'image/png',
    };
    
    const videoCtx = { music: "upbeat electronic", style: "fast-paced", transitions: "quick cuts" };

    const prompt = `Create a short, dynamic, promotional video for a new product line with the slogan "${slogan}". 
    Video Style: ${videoCtx.style}, with ${videoCtx.transitions}. 
    Music style suggestion: ${videoCtx.music}.
    Animate the design from the reference image in a trendy style suitable for TikTok or YouTube Shorts.`;

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: imagePayload,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation completed but no download link was found.");
    }
    
    const keyToUse = apiKey || process.env.API_KEY;
    const response = await fetch(`${downloadLink}&key=${keyToUse}`);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
};

export const generateVideoPrompt = async (
  slogan: string,
  niche: string,
  targetAudience: string,
  strategy: DesignStrategy,
  imageUrls: string[],
  apiKey: string | null
): Promise<string> => {
  const ai = getApiClient(apiKey);
  try {
    const textPart = {
      text: `
        You are a creative director specializing in viral social media ads for e-commerce brands.
        Your task is to create a detailed video script and shot list for a 15-second promotional video, based on the provided product mockup images. The entire final output script MUST be in **Vietnamese**.

        **Analyze the provided images and follow these instructions:**

        **Brand & Design DNA:**
        - **Slogan:** "${slogan}"
        - **Target Audience:** ${targetAudience || 'General public'}
        - **Niche:** ${niche}
        - **Overall Mood:** ${strategy.designStyle.mood}
        - **Art Style & Colors:** Your description must reflect the visual style and colors present in the attached images.

        **Requirements for the script (in Vietnamese):**
        - **Structure:** Provide a scene-by-scene breakdown (e.g., ### Cảnh 1).
        - **Timestamps:** Suggest approximate timings for each scene (e.g., 0-3s).
        - **Visuals:** Describe the camera shot and action for each scene. **Crucially, your descriptions must be based on the content of the provided mockup images.** For example, instead of "a person wearing a t-shirt", describe the scene from the image: "Một chàng trai trẻ phong cách trên con phố thành thị nhộn nhịp, ánh sáng giờ vàng làm nổi bật chất liệu của chiếc áo phông đen."
        - **On-Screen Text:** Suggest any text overlays. The main slogan should be featured prominently.
        - **Audio:** Suggest a style of trending audio/music and sound effects (e.g., "*vút*," "*tách*").
        - **Output Format:** Use Markdown for clear formatting. The final output should be a complete, ready-to-use prompt in Vietnamese.
      `
    };

    const imageParts = imageUrls.map(url => {
      const base64Data = url.replace(/^data:image\/\w+;base64,/, "");
      return { inlineData: { mimeType: 'image/png', data: base64Data } };
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [textPart, ...imageParts] },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    if (response.text) {
      return response.text;
    }
    throw new Error("No video prompt generated");
  } catch (error) {
    console.error("Error generating video prompt:", error);
    throw error;
  }
};

export const generateProductListingContent = async (
  slogan: string,
  niche: string,
  targetAudience: string,
  designMood: string,
  apiKey: string | null
): Promise<ProductListingContent> => {
  const ai = getApiClient(apiKey);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert E-commerce SEO and POD Merchandiser specializing in **Etsy US and Amazon Merch**. 
      Your goal is to create a product listing that dominates search results and converts US shoppers.

      **Listing Requirements (Redbubble Optimized):**
      1.  **Title (SEO):** Keyword-rich, descriptive, starts with the main slogan. Max 140 characters. No brand names or celebrities.
      2.  **Description (Conversion):** Persuasive US English tone. Focus on "Benefits" and "Giftability".
      3.  **Tags (Redbubble Algorithm):** 
          - **Quantity:** Exactly 10-15 tags.
          - **Structure:** Include Main Keyword, Style (e.g., Watercolor, Minimalist), Target Audience (e.g., Dog Mom), and Detailed Description.
          - **NO SPAM:** No irrelevant tags. No brand names.
          - **NO REPETITION:** Do not repeat words in tags (e.g., use "Cute", "Funny", "Cat" instead of "Cute cat", "Funny cat"). The system combines them automatically.

      - **Slogan:** "${slogan}"
      - **Niche:** ${niche}
      - **Audience:** ${targetAudience}
      - **Mood:** ${designMood}

      The output language MUST be **English**.
      `,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "description", "tags"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ProductListingContent;
    }
    throw new Error("No product listing content generated");
  } catch (error) {
    console.error("Error generating product listing content:", error);
    throw error;
  }
};

export const refineProductListingContent = async (
  existingContent: ProductListingContent,
  instruction: string,
  apiKey: string | null
): Promise<ProductListingContent> => {
    const ai = getApiClient(apiKey);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are an expert E-commerce SEO and copywriter. A user has provided an existing product listing and an instruction to refine it.
            Your task is to rewrite the listing based *only* on the instruction. Adhere to the original format and constraints.
            
            **Refinement Instruction:** "${instruction}"
            
            **Existing Listing JSON:**
            ${JSON.stringify(existingContent)}
            
            Rewrite the JSON object according to the instruction. The output must be ONLY the revised JSON object.
            `,
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    tags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["title", "description", "tags"]
                }
            }
        });
        
        if (response.text) {
            return JSON.parse(response.text) as ProductListingContent;
        }
        throw new Error("Could not refine the content.");

    } catch (error) {
        console.error("Error refining product listing:", error);
        throw error;
    }
};