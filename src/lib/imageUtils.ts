import { removeBackground } from "@imgly/background-removal";

/**
 * Removes the background from a base64 image string using AI.
 * @param base64Image The source image in base64 format.
 * @returns A promise that resolves to the processed image in base64 format.
 */
export async function aiRemoveBackground(base64Image: string): Promise<string> {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Image);
    const blob = await response.blob();
    
    // Remove background
    const resultBlob = await removeBackground(blob, {
      progress: (step, current, total) => {
        console.log(`Background removal: ${step} ${current}/${total}`);
      },
    });
    
    // Convert result blob back to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(resultBlob);
    });
  } catch (error) {
    console.error("Failed to remove background:", error);
    // Return original image if background removal fails
    return base64Image;
  }
}

/**
 * Converts a base64 image to a Blob.
 */
export async function base64ToBlob(base64: string): Promise<Blob> {
  const response = await fetch(base64);
  return await response.blob();
}
