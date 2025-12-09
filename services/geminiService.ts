import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StoryResponse, ChildContext } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
**ROLE & PERSONA**
You are a World-Class Interactive Audio-Storyteller and Socratic Pedagogue (Target Audience: Kids 4-10 years old).
Your mission is to transform a child's drawing and question into a magical, personalized audio-story.
You are NOT a search engine. You are a "Reasoning Imagination Engine."

**CORE OBJECTIVE**
Create an immersive story starring the character from the user's drawing. The character must encounter a situation that helps the child understand the scientific answer to their question through discovery and metaphor, NOT through direct explanation.

**BRAIN REASONING ENGINE**
1. **Context & Continuity**: If 'prev_topics' are provided in the context, vaguely reference them (e.g., "Remember when we learned about gravity?").
2. **Visual Voice Profiling**: Analyze the drawing style (shaky=shy, bold=brave, etc.) to inform the text style.
3. **Socratic Simplification**: Translate abstract science into Physical Metaphors (Gravity -> Invisible Magnet).
4. **Strict Audio Protocol**:
    - **display_text**: Include [SFX: ...] tags describing the sound and (Emotion) tags for the reader.
    - **audio_text**: 
        - REMOVE (Emotion) tags (do not read acting directions out loud).
        - **TRANSFORM [SFX] tags into spoken onomatopoeia**. Do not remove them. Act them out!
        - Example: If display_text is "The balloon popped [SFX: Pop].", audio_text should be "The balloon popped. POP!".
        - Example: If display_text is "[SFX: Wind blowing] The leaves danced.", audio_text should be "Whoooosh! The wind blew and the leaves danced."

**OUTPUT FORMAT**
Respond ONLY with valid JSON.
Include 2-3 'suggested_questions' in the storyboard. These should be short, curious follow-up questions the child might ask NEXT, related to the story or the character's new knowledge.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    meta: {
      type: Type.OBJECT,
      properties: {
        detected_language: { type: Type.STRING },
        educational_concept: { type: Type.STRING },
        context_used: { type: Type.BOOLEAN },
        character_voice_profile: { type: Type.STRING },
      },
      required: ["detected_language", "educational_concept", "context_used", "character_voice_profile"]
    },
    storyboard: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        display_text: { type: Type.STRING },
        audio_text: { type: Type.STRING },
        interactive_question: { type: Type.STRING },
        suggested_questions: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["title", "display_text", "audio_text", "interactive_question", "suggested_questions"]
    },
    visuals: {
      type: Type.OBJECT,
      properties: {
        image_prompt: { type: Type.STRING },
      },
      required: ["image_prompt"]
    }
  },
  required: ["meta", "storyboard", "visuals"]
};

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to write string to DataView
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// Helper to convert PCM to WAV
const pcmToWav = (pcmData: Uint8Array, sampleRate: number): ArrayBuffer => {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF chunk
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  
  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmData, 44);

  return buffer;
};

export const generateStory = async (
  imageFile: File | null,
  question: string,
  childContext: ChildContext,
  previousTopics: string[]
): Promise<StoryResponse> => {
  
  const contextPrompt = JSON.stringify({
    child_name: childContext.childName || "Friend",
    character_name: childContext.characterName || "",
    prev_topics: previousTopics
  });

  const parts: any[] = [];

  // Add image if provided
  if (imageFile) {
    const imageBase64 = await fileToGenerativePart(imageFile);
    parts.push({
      inlineData: {
        mimeType: imageFile.type,
        data: imageBase64
      }
    });
  }

  // Construct text prompt
  let textPrompt = `User Question: ${question}\nContext: ${contextPrompt}`;
  
  if (!imageFile) {
    textPrompt += `\n(NOTE: The user did not provide a drawing. Please invent a creative, friendly character suitable for the story's theme and describe them in the visuals.image_prompt.)`;
  }

  parts.push({ text: textPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: {
      parts: parts
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  // Parse JSON (handling potential markdown code blocks if the model adds them despite config)
  const jsonStr = text.replace(/```json\n|\n```/g, "").trim();
  return JSON.parse(jsonStr) as StoryResponse;
};

export const generateSpeech = async (text: string): Promise<string> => {
  // Using the Flash TTS model
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: {
      parts: [{ text: text }]
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' } // Whimsical voice
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate speech");
  
  // Convert Base64 to Uint8Array (Raw PCM)
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const pcmBytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    pcmBytes[i] = binaryString.charCodeAt(i);
  }

  // Convert Raw PCM to WAV
  // Gemini 2.5 Flash TTS uses 24kHz sample rate
  const wavBuffer = pcmToWav(pcmBytes, 24000);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  
  return URL.createObjectURL(blob);
};

export const generateIllustration = async (prompt: string): Promise<string> => {
  // Using gemini-2.5-flash-image for standard generation
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
        // Note: imageSize is NOT supported for gemini-2.5-flash-image, so it is omitted.
      }
    }
  });

  // Extract image from response
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to generate illustration");
};