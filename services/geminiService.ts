import { GoogleGenAI, Type, VideoGenerationReferenceImage, VideoGenerationReferenceType } from "@google/genai";
import { DesignStrategy, StrategySuggestion, TrendingSlogan, ProductListingContent } from "../types";
import { NICHES, DESIGN_STYLES, COLOR_PALETTES } from "../constants";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateSloganSuggestions = async (audience: string, topic: string, timeframe: string): Promise<TrendingSlogan[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional Market Intelligence Analyst specializing in the Print-on-Demand (POD) industry.

      **MISSION:** Your primary mission is to use the Google Search tool to find and analyze trending POD slogans/designs that have shown a significant increase in search volume, social media engagement, or sales within a specific timeframe. You are a "trend spy."

      **SEARCH PARAMETERS:**
      - **Target Audience:** "${audience || 'a general audience with a sense of humor'}"
      - **Niche / Topic:** "${topic || 'general funny and relatable topics'}"
      - **Timeframe for Analysis:** "${timeframe}"

      **MANDATORY RULES & PROTOCOL:**
      1.  **TIME-SENSITIVE ANALYSIS:** Your analysis and results MUST be strictly based on the popularity of the slogan within the specified **Timeframe for Analysis**. Do not provide evergreen or generally popular slogans unless they are currently surging.
      2.  **PROVIDE RATIONALE:** For each slogan, you must provide a 'rationale' (in Vietnamese) that explains *why* it is trending *within the specified timeframe*. For example, is it related to a recent event, a new meme, a TikTok trend, or a seasonal holiday?
      3.  **GENERATE CLEAN SEARCH TERM:** Provide a concise, effective 'suggestedSearchTerm' (in English) that a user can copy-paste into a marketplace (like Etsy, Amazon) to find real-world examples.
      4.  **SEARCH TERM FORMATTING:** The search term MUST ONLY contain the product description or slogan. It MUST NOT include website names.
          - **Correct:** "spill the tea sweatshirt"
          - **Incorrect:** "spill the tea sweatshirt etsy"
      5.  **LANGUAGE SPECIFICATION:**
          - 'slogan' and 'suggestedSearchTerm' MUST be in **English**.
          - 'rationale' MUST be in **Vietnamese**.
      6.  **OUTPUT FORMAT:** The output must be ONLY a JSON array of up to 10 objects, strictly adhering to the specified schema.
      `,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              slogan: { type: Type.STRING, description: "A witty and short slogan, in English." },
              rationale: { type: Type.STRING, description: "Analysis of *why* this is trending within the specified timeframe, in Vietnamese." },
              suggestedSearchTerm: { type: Type.STRING, description: "A concise and effective search query (in English) to find real products. Must not contain site names." },
            },
            required: ["slogan", "rationale", "suggestedSearchTerm"]
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

export const generateFiveDesignConcepts = async (slogan: string, audience: string): Promise<StrategySuggestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const nicheOptions = NICHES.map(n => `ID: "${n.id}", Label: "${n.label}"`).join('\n');
    const styleOptions = DESIGN_STYLES.map(s => `ID: "${s.id}", Label: "${s.label}", Context: "${s.context}"`).join('\n');
    const colorOptions = COLOR_PALETTES.map(c => `ID: "${c.id}", Label: "${c.label}", Context: "${c.context}"`).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert Print-on-Demand (POD) market trend analyst and a creative director.
      Your task is to analyze the provided slogan and target audience, then generate the top 3 most commercially viable and distinct design concepts.
      For each concept, you must provide both a high-level strategy and a specific creative direction.

      **Slogan (in English):** "${slogan}"
      **Target Audience:** "${audience || 'General public'}"

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
      3.  Provide a short, catchy 'title' in English (e.g., "Retro Gamer Vibe", "Minimalist Zen").
      4.  Provide a brief 'rationale' IN VIETNAMESE explaining why this strategy will sell.
      5.  Crucially, for each object, also provide a detailed 'designStyle' object containing specific creative direction IN VIETNAMESE: 'typography', 'artStyle', 'colors', and 'mood'.
      `,
      config: {
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
              rationale: { type: Type.STRING, description: "Your reasoning for choosing this strategy, citing market trends, in Vietnamese." },
              designStyle: {
                type: Type.OBJECT,
                properties: {
                  typography: { type: Type.STRING },
                  artStyle: { type: Type.STRING },
                  colors: { type: Type.STRING },
                  mood: { type: Type.STRING },
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
    throw new Error("No strategy suggestion generated");
  } catch (error) {
    console.error("Error suggesting strategies:", error);
    throw error;
  }
};

export const generateDesignStrategy = async (
  slogan: string, 
  niche: string, 
  styleContext: string,
  targetAudience: string,
  colorContext: string
): Promise<DesignStrategy> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

export const generateMockupImage = async (prompt: string, referenceImageBase64?: string | null): Promise<string> => {
  const MAX_RETRIES = 3;
  const INITIAL_BACKOFF_MS = 6000; // Start with a longer backoff to be safe

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const parts: any[] = [{ text: prompt }];
      if (referenceImageBase64) {
        const base64Data = referenceImageBase64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
          inlineData: { mimeType: 'image/png', data: base64Data }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) throw new Error("No image generated.");
      
      const imagePart = candidates[0].content.parts.find(p => p.inlineData);
      if (!imagePart?.inlineData?.data) throw new Error("Missing image data.");

      return `data:image/png;base64,${imagePart.inlineData.data}`;
    } catch (error: any) {
      const errorMessage = JSON.stringify(error) || error.message || '';
      const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');

      if (isRateLimitError && attempt < MAX_RETRIES) {
        const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.warn(`Rate limit hit. Retrying attempt ${attempt + 1} in ${backoffTime}ms...`);
        await sleep(backoffTime);
      } else {
        console.error("Error generating image:", error);
        throw error;
      }
    }
  }
  
  throw new Error("Failed to generate image after multiple retries due to rate limiting.");
};

export const generatePromoVideo = async (slogan: string, strategy: DesignStrategy, referenceImagesBase64: string[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const referenceImagesPayload: VideoGenerationReferenceImage[] = referenceImagesBase64
      .slice(0, 3) // Use up to 3 images as per API limitation
      .map(b64 => ({
        image: {
          imageBytes: b64.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: 'image/png',
        },
        referenceType: VideoGenerationReferenceType.ASSET,
      }));

    if (referenceImagesPayload.length === 0) {
        throw new Error("No valid reference images provided for video generation.");
    }
    
    const videoCtx = strategy.mockups.video || { music: "upbeat electronic", style: "fast-paced", transitions: "quick cuts" };

    const prompt = `Create a short, dynamic, promotional video for a new product line with the slogan "${slogan}". 
    Video Style: ${videoCtx.style}, with ${videoCtx.transitions}. 
    Music style suggestion: ${videoCtx.music}.
    Showcase the product designs from the reference images in a trendy style suitable for TikTok or YouTube Shorts.`;

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        referenceImages: referenceImagesPayload,
        resolution: '720p',
        aspectRatio: '9:16' // Vertical for social media
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation completed but no download link was found.");
    }

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
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
  imageUrls: string[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  designMood: string
): Promise<ProductListingContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert E-commerce SEO and Print-on-Demand (POD) Merchandiser. Your goal is to create highly effective, keyword-rich product listings that are optimized for discoverability on free traffic platforms like Etsy, Redbubble, and Amazon Merch.

      **TASK:** Generate a product listing for a design based on the following information. The output language MUST be **English**.

      - **Main Slogan/Text on Design:** "${slogan}"
      - **Target Niche:** ${niche}
      - **Target Audience:** ${targetAudience}
      - **Overall Mood/Style of the Design:** ${designMood}

      **OUTPUT REQUIREMENTS:**
      1.  **Title:** Create a compelling, SEO-friendly title. Start with the core slogan, then add relevant keywords about the niche, audience, and product type (e.g., "Funny T-Shirt", "Gift for X", "Sarcastic Mug").
      2.  **Description:** Write a short, engaging paragraph. Describe the design and who it would be a perfect gift for. Weave in long-tail keywords naturally. Use persuasive language.
      3.  **Tags:** Provide a list of 13-15 of the most relevant, high-traffic keywords and tags. Include a mix of broad and specific terms. Think about what a customer would search for to find this exact product.

      The entire output must be a single, valid JSON object following the specified schema.
      `,
      config: {
        responseMimeType: "application/json",
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
