import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Point, StoryResponse, Language } from "../types";

const apiKey = process.env.API_KEY;

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: apiKey });

/**
 * Generates a story based on the intensity curve provided.
 */
export const generateStoryFromCurve = async (normalizedPoints: Point[], language: Language): Promise<StoryResponse> => {
  if (!apiKey) throw new Error("API Key is missing");

  // Format points for the prompt
  const pointsDescription = normalizedPoints
    .map((p, i) => `Chapter ${i + 1}: Intensity Level ${Math.round(p.y)}%`)
    .join('\n');

  const langInstruction = language === 'zh' 
    ? "Simplified Chinese (简体中文)" 
    : "English";

  const systemInstruction = `
    You are a master storyteller and visual director. 
    Your task is to write a cohesive, engaging story divided into ${normalizedPoints.length} chapters.
    The story's dramatic tension and emotional intensity MUST strictly follow the provided intensity curve.
    
    LANGUAGE REQUIREMENT:
    The 'title', 'theme', 'chapterTitle', and 'content' MUST be written in ${langInstruction}.
    The 'imagePrompt' MUST be written in English to ensure best image generation results.

    INTENSITY GUIDELINES:
    - Low Intensity (0-30%): Calm, peaceful, exposition, or resolution.
    - Medium Intensity (30-60%): Rising action, mystery, travel, dialogue.
    - High Intensity (60-85%): Conflict, danger, rapid movement, revelation.
    - Extreme Intensity (85-100%): Climax, battle, major plot twist, epiphany.

    CONTENT REQUIREMENTS:
    - GENRE/THEME: Do NOT default to Cyberpunk. Choose a random, unique genre from: Historical Fiction, High Fantasy, Space Opera, Murder Mystery, Psychological Horror, Western, Romance, Slice of Life, Folklore, or Steampunk.
    - LENGTH: Each chapter content MUST be substantial, approximately 150-200 words. Detail the environment, internal monologues, and sensory details.
    
    For each chapter, provide:
    1. A short title (in ${langInstruction}).
    2. The story content (approx 150-200 words, in ${langInstruction}).
    3. An 'intensity' score (number) based on the input.
    4. An 'imagePrompt' that describes the visual scene vividly for an AI image generator (English). Focus on lighting, color, and mood.
  `;

  const prompt = `
    Create a story based on this dramatic arc:
    ${pointsDescription}
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: `The main title of the story in ${langInstruction}` },
      theme: { type: Type.STRING, description: `The genre or theme chosen in ${langInstruction}` },
      chapters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            chapterTitle: { type: Type.STRING },
            content: { type: Type.STRING },
            intensity: { type: Type.NUMBER },
            imagePrompt: { type: Type.STRING },
          },
          required: ["chapterTitle", "content", "intensity", "imagePrompt"],
        },
      },
    },
    required: ["title", "theme", "chapters"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as StoryResponse;

  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
};

/**
 * Generates an image for a specific story chapter.
 */
export const generateImageForChapter = async (imagePrompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: imagePrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    // Extract base64 image from the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    // Return a fallback placeholder if generation fails to keep the app running
    return `https://picsum.photos/800/450?blur=2`;
  }
};
