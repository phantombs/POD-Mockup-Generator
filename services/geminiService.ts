import { GoogleGenAI, Type } from "@google/genai";
import { DesignStrategy } from "../types";

// Ensure API key is present
if (!process.env.API_KEY) {
  console.error("Missing API_KEY in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes the slogan and niche to create a design and mockup strategy.
 * Now accepts a 'styleContext' to enforce specific design trends.
 */
export const generateDesignStrategy = async (slogan: string, niche: string, styleContext: string): Promise<DesignStrategy> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this slogan: "${slogan}" for the Print-on-Demand niche: "${niche}".
      
      MANDATORY DESIGN CONSTRAINT: The visual style MUST adhere to: "${styleContext}".
      
      Create a visual design strategy for a vector graphic and 5 product mockups.
      
      1. Design Style: Define the typography, art style, colors, and mood based on the mandatory design constraint above.
      2. Mockups: Define the visual context for each product to match the niche.
         - T-Shirt: Model description (age, style), environment (gym, office, park), lighting.
         - Mug: Setting (desk, camping table, kitchen), props.
         - Sticker: Surface (laptop, helmet, water bottle, lamp post), lighting.
         - Phone Case: Surface type, props (keys, wallet, makeup).
         - Composite: Arrangement style, overall theme.
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
              }
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
    // Return a safe fallback if AI fails
    return {
      designStyle: { typography: "Bold Sans-serif", artStyle: "Minimalist", colors: "Black and White", mood: "Modern" },
      mockups: {
        tshirt: { model: "Young adult", environment: "Studio background", lighting: "Soft studio light" },
        mug: { setting: "Wooden table", props: "None" },
        sticker: { surface: "Laptop lid", lighting: "Daylight" },
        phoneCase: { surface: "White table", props: "None" },
        composite: { arrangement: "Grid layout", theme: "Clean" }
      }
    };
  }
};

/**
 * Generates an image using the Gemini 2.5 Flash Image model.
 * @param prompt The prompt to send to the model.
 * @param referenceImageBase64 Optional base64 string of an image to use as reference/input.
 * @returns A base64 string of the image.
 */
export const generateMockupImage = async (prompt: string, referenceImageBase64?: string | null): Promise<string> => {
  try {
    const parts: any[] = [{ text: prompt }];

    if (referenceImageBase64) {
      // Clean base64 string if it contains data prefix
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
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
            // imageSize is only for Pro models, Flash Image generates 1024x1024 by default
        }
      }
    });

    // Extract image data
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates returned from Gemini API.");
    }

    const responseParts = candidates[0].content.parts;
    let base64Image: string | null = null;

    for (const part of responseParts) {
      if (part.inlineData && part.inlineData.data) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      throw new Error("No image data found in the response.");
    }

    // Convert raw base64 to data URL
    return `data:image/png;base64,${base64Image}`;

  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};