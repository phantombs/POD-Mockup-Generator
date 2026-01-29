import { GoogleGenAI, Type, VideoGenerationReferenceImage, VideoGenerationReferenceType } from "@google/genai";
import { DesignStrategy } from "../types";

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
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class Print-on-Demand (POD) and Social Media Strategist. 
      Analyze the slogan: "${slogan}" for the niche: "${niche}".
      Target Audience: ${targetAudience || 'General public'}.
      Required Style: ${styleContext}.
      Required Color Palette: ${colorContext}.
      
      Goal: Create a design and marketing strategy that is commercially viral on platforms like Redbubble, Etsy, and TikTok.
      
      Requirements:
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
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
    console.error("Error generating image:", error);
    throw error;
  }
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