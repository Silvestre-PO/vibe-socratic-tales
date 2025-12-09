export interface StoryResponse {
  meta: {
    detected_language: string;
    educational_concept: string;
    context_used: boolean;
    character_voice_profile: string;
  };
  storyboard: {
    title: string;
    display_text: string;
    audio_text: string;
    interactive_question: string;
    suggested_questions: string[];
  };
  visuals: {
    image_prompt: string;
  };
}

export interface ChildContext {
  childName: string;
  characterName: string;
}

export type AppState = 'IDLE' | 'ANALYZING' | 'GENERATING_MEDIA' | 'PLAYING' | 'ERROR';