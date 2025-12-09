import React, { useState } from 'react';
import InputSection from './components/InputSection';
import StoryView from './components/StoryView';
import Loading from './components/Loading';
import { AppState, StoryResponse, ChildContext } from './types';
import { generateStory, generateSpeech, generateIllustration } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [storyData, setStoryData] = useState<StoryResponse | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Context Engineering State
  const [previousTopics, setPreviousTopics] = useState<string[]>([]);
  
  // Keep track of the current session's inputs to reuse for follow-up questions
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentContext, setCurrentContext] = useState<ChildContext>({ childName: '', characterName: '' });

  const handleStartAdventure = async (file: File | null, question: string, context: ChildContext) => {
    // Save current inputs for potential follow-up questions
    setCurrentFile(file);
    setCurrentContext(context);
    
    await processStoryGeneration(file, question, context);
  };

  const processStoryGeneration = async (file: File | null, question: string, context: ChildContext) => {
    setAppState('ANALYZING');
    setErrorMsg(null);
    setAudioUrl(null);
    setImageUrl(null);

    try {
      // 1. Generate Story Metadata & Text
      const story = await generateStory(file, question, context, previousTopics);
      setStoryData(story);
      
      // Update history with the new concept
      setPreviousTopics(prev => {
        // Keep only last 3 topics to avoid context bloat
        const newHistory = [...prev, story.meta.educational_concept];
        return newHistory.slice(-3);
      });

      setAppState('GENERATING_MEDIA');

      // 2. Parallel Generation: Audio & Illustration
      try {
        const [audioResult, imageResult] = await Promise.allSettled([
          generateSpeech(story.storyboard.audio_text),
          generateIllustration(story.visuals.image_prompt)
        ]);

        if (audioResult.status === 'fulfilled') {
          setAudioUrl(audioResult.value);
        } else {
          console.error("Audio generation failed:", audioResult.reason);
        }

        if (imageResult.status === 'fulfilled') {
          setImageUrl(imageResult.value);
        } else {
            console.error("Image generation failed:", imageResult.reason);
        }

      } catch (mediaError) {
        console.error("Media generation error", mediaError);
      }

      setAppState('PLAYING');

    } catch (err: any) {
      console.error("Story generation failed:", err);
      setErrorMsg("Oops! The magic wand sputtered. Please try again!");
      setAppState('ERROR');
    }
  };

  const handleSuggestedQuestionClick = async (question: string) => {
    // Reuse the existing file and context, but with the new question
    await processStoryGeneration(currentFile, question, currentContext);
  };

  const handleReset = () => {
    setAppState('IDLE');
    setStoryData(null);
    setAudioUrl(null);
    setImageUrl(null);
    setErrorMsg(null);
    setPreviousTopics([]); // Optional: Clear history on full reset, or keep it? Clearing seems safer for "Start Over".
    setCurrentFile(null);
    setCurrentContext({ childName: '', characterName: '' });
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-purple-100 to-white font-sans text-slate-800">
      
      {/* Navbar */}
      <nav className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto flex items-center justify-center md:justify-start">
          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-5 py-2 rounded-full shadow-sm border border-white/50">
            <span className="text-3xl animate-[bounce_2s_infinite]">✨</span>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 font-display">
              Socratic Tales
            </h1>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 pb-20">
        
        {appState === 'IDLE' && (
          <InputSection onSubmit={handleStartAdventure} isProcessing={false} />
        )}

        {(appState === 'ANALYZING' || appState === 'GENERATING_MEDIA') && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loading status={appState} />
          </div>
        )}

        {appState === 'PLAYING' && storyData && (
          <StoryView 
            story={storyData} 
            audioUrl={audioUrl}
            generatedImageUrl={imageUrl}
            onReset={handleReset}
            onSuggestedQuestionClick={handleSuggestedQuestionClick}
          />
        )}

        {appState === 'ERROR' && (
          <div className="max-w-md mx-auto text-center p-10 bg-white rounded-[2rem] shadow-xl border-red-100 border-4">
            <div className="text-7xl mb-6">🙈</div>
            <h2 className="text-2xl font-bold text-red-500 mb-2 font-display">Oh no!</h2>
            <p className="text-gray-600 mb-8 text-lg">{errorMsg || "Something went wrong in the magic lab."}</p>
            <button 
              onClick={handleReset}
              className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-300/50"
            >
              Try Again
            </button>
          </div>
        )}

      </main>

      <footer className="fixed bottom-0 w-full p-4 bg-white/50 backdrop-blur text-center text-xs text-indigo-400 pointer-events-none z-50">
        Powered by Gemini 2.5 & 3 Pro
      </footer>
    </div>
  );
};

export default App;