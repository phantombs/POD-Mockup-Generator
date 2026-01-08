
import { GoogleGenAI, Type } from "@google/genai";
import { DesignStrategy } from "../types";

if (!process.env.API_KEY) {
  console.error("Missing API_KEY in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDesignStrategy = async (
  slogan: string, 
  niche: string, 
  styleContext: string,
  targetAudience: string,
  colorContext: string
): Promise<DesignStrategy> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class Print-on-Demand (POD) Strategist. 
      Analyze the slogan: "${slogan}" for the niche: "${niche}".
      Target Audience: ${targetAudience || 'General public'}.
      Required Style: ${styleContext}.
      Required Color Palette: ${colorContext}.
      
      Goal: Create a design strategy that is commercially viral on platforms like Redbubble, Etsy, and Amazon Merch.
      
      Requirements:
      1. Design Style: Define typography that is legible and trendy. Suggest an art style that fits the audience. Use the color palette provided.
      2. Mockups: Suggest environments where the target audience would actually use these products.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            designStyle: {
              type: Type.OBJECT,
              properties: {
                typography: { type: Type.STRING },
                artStyle: { type: Type.STRING },
                colors: { type: Type.STRING },
                mood: { type: Type.STRING },
              },
              required: ["typography", "artStyle", "colors", "mood"]
            },
            mockups: {
              type: Type.OBJECT,
              properties: {
                tshirt: {
                  type: Type.OBJECT,
                  properties: {
                    model: { type: Type.STRING },
                    environment: { type: Type.STRING },
                    lighting: { type: Type.STRING },
                  }
                },
                mug: {
                  type: Type.OBJECT,
                  properties: {
                    setting: { type: Type.STRING },
                    props: { type: Type.STRING },
                  }
                },
                sticker: {
                  type: Type.OBJECT,
                  properties: {
                    surface: { type: Type.STRING },
                    lighting: { type: Type.STRING },
                  }
                },
                phoneCase: {
                  type: Type.OBJECT,
                  properties: {
                    surface: { type: Type.STRING },
                    props: { type: Type.STRING },
                  }
                },
                poster: {
                  type: Type.OBJECT,
                  properties: {
                    room: { type: Type.STRING },
                    style: { type: Type.STRING },
                  }
                },
                cap: {
                  type: Type.OBJECT,
                  properties: {
                    style: { type: Type.STRING },
                    setting: { type: Type.STRING },
                  }
                },
                pillow: {
                  type: Type.OBJECT,
                  properties: {
                    setting: { type: Type.STRING },
                    colors: { type: Type.STRING },
                  }
                },
                composite: {
                  type: Type.OBJECT,
                  properties: {
                    arrangement: { type: Type.STRING },
                    theme: { type: Type.STRING },
                  }
                },
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
    return {
      designStyle: { typography: "Bold Sans-serif", artStyle: "Minimalist", colors: "Modern Palette", mood: "Professional" },
      mockups: {
        tshirt: { model: "Model", environment: "Studio", lighting: "Soft" },
        mug: { setting: "Table", props: "None" },
        sticker: { surface: "Laptop", lighting: "Natural" },
        phoneCase: { surface: "Desk", props: "None" },
        poster: { room: "Living Room", style: "Black Frame" },
        cap: { style: "Baseball Cap", setting: "Street" },
        pillow: { setting: "Sofa", colors: "Matching" },
        composite: { arrangement: "Flat-lay", theme: "Unified" }
      }
    };
  }
};

export const generateMockupImage = async (prompt: string, referenceImageBase64?: string | null): Promise<string> => {
  try {
    const parts: any[] = [{ text: prompt }];
    if (referenceImageBase64) {
      const base64Data = referenceImageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: parts },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) throw new Error("No image generated.");
    
    const imagePart = candidates[0].content.parts.find(p => p.inlineData);
    if (!imagePart?.inlineData?.data) throw new Error("Missing image data.");

    return `data:image/png;base64,${imagePart.inlineData.data}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
