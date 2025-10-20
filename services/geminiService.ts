
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { ImageFile } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const base64Data = event.target.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      } else {
        reject(new Error("Failed to read file as base64 string."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}


export const editImageWithGemini = async (prompt: string, image: ImageFile): Promise<string> => {
  try {
    const imagePart = await fileToGenerativePart(image.file);

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                imagePart,
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            return `data:${mimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error("No image was generated in the response.");

  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to edit image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while editing the image.");
  }
};
