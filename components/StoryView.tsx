import React, { useRef, useState, useEffect } from 'react';
import { StoryResponse } from '../types';

interface StoryViewProps {
  story: StoryResponse;
  audioUrl: string | null;
  generatedImageUrl: string | null;
  onReset: () => void;
  onSuggestedQuestionClick: (question: string) => void;
}

const StoryView: React.FC<StoryViewProps> = ({ story, audioUrl, generatedImageUrl, onReset, onSuggestedQuestionClick }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [highlightedText, setHighlightedText] = useState<React.ReactNode[]>([]);

  // Format time helper (e.g., 1:05)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Process text for SFX and Emotion highlighting
  useEffect(() => {
    const processText = () => {
      // Split by newlines first to handle paragraphs
      const paragraphs = story.storyboard.display_text.split('\n');
      
      return paragraphs.map((paragraph, pIndex) => {
        if (!paragraph.trim()) return <br key={`br-${pIndex}`} className="mb-4" />;

        // Split paragraph by special tags
        const parts = paragraph.split(/(\[SFX:.*?\]|\(.*?\))/g);
        
        const renderedParts = parts.map((part, index) => {
          if (part.startsWith('[SFX:')) {
            return (
              <span key={`sfx-${index}`} className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-pink-100 text-pink-600 text-sm font-bold rounded-full border border-pink-200 transform hover:scale-105 transition-transform cursor-default" title="Sound Effect">
                <span className="text-xs">🔊</span>
                {part.replace(/[\[\]]|SFX:/g, '').trim()}
              </span>
            );
          } else if (part.startsWith('(')) {
            return (
              <span key={`emo-${index}`} className="block my-2 text-indigo-500 font-medium italic text-sm">
                {part}
              </span>
            );
          }
          return <span key={`text-${index}`}>{part}</span>;
        });

        return (
          <p key={`p-${pIndex}`} className="mb-6 leading-relaxed text-slate-700">
            {renderedParts}
          </p>
        );
      });
    };
    setHighlightedText(processText());
  }, [story.storyboard.display_text]);

  // Audio Event Handlers
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      // Auto-play attempt
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-24"> {/* Padding bottom for fixed footer if needed */}
      
      {/* Main Card */}
      <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 border-white/50 ring-1 ring-black/5 relative">
        
        {/* Hero Section (Image + Title) */}
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-slate-100 overflow-hidden group">
          {generatedImageUrl ? (
            <img 
              src={generatedImageUrl} 
              alt="Magical Illustration" 
              className="w-full h-full object-cover transition-transform duration-[10s] ease-linear group-hover:scale-110"
            />
          ) : (
             <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center">
                <span className="text-4xl animate-bounce">🎨</span>
             </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 text-white">
            <div className="inline-block px-3 py-1 bg-indigo-500/80 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-widest mb-2 border border-indigo-300/30">
              {story.meta.educational_concept}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-display leading-tight shadow-black drop-shadow-lg">
              {story.storyboard.title}
            </h1>
          </div>
        </div>

        {/* Audio Player Strip (Sticky-ish look) */}
        {audioUrl && (
          <div className="bg-indigo-900 text-white p-4 md:p-6 shadow-inner relative overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-700/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6">
              
              {/* Play Button */}
              <button 
                onClick={togglePlay}
                className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-400/50"
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
                    <path fillRule="evenodd" d="M4.5 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Progress & Info */}
              <div className="flex-1 w-full flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold tracking-widest text-indigo-200 uppercase">
                   <span>Now Playing</span>
                   <div className="flex items-center gap-1">
                     {isPlaying && (
                       <span className="flex gap-0.5 h-3 items-end">
                         <span className="w-1 bg-green-400 animate-[bounce_1s_infinite]"></span>
                         <span className="w-1 bg-green-400 animate-[bounce_1.2s_infinite]"></span>
                         <span className="w-1 bg-green-400 animate-[bounce_0.8s_infinite]"></span>
                       </span>
                     )}
                     <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                   </div>
                </div>

                {/* Scrubber */}
                <div className="relative h-2 w-full group cursor-pointer">
                   <div className="absolute inset-0 bg-indigo-700 rounded-full"></div>
                   <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full transition-all duration-100"
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                   >
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"></div>
                   </div>
                   <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={onSeek}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                   />
                </div>
              </div>
            </div>

            <audio 
              ref={audioRef} 
              src={audioUrl} 
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onEnded={onEnded}
              className="hidden" 
            />
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 md:p-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] bg-repeat">
            <div className="prose prose-lg md:prose-xl prose-indigo max-w-none font-serif text-slate-800">
                {highlightedText}
            </div>

            {/* Suggested Questions Area */}
            {story.storyboard.suggested_questions && story.storyboard.suggested_questions.length > 0 && (
              <div className="mt-12 space-y-4">
                 <h4 className="text-center text-indigo-900/60 uppercase tracking-widest text-sm font-bold">What happens next?</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {story.storyboard.suggested_questions.map((q, idx) => (
                      <button 
                        key={idx}
                        onClick={() => onSuggestedQuestionClick(q)}
                        className="group relative p-4 bg-white border-2 border-indigo-100 hover:border-indigo-400 rounded-xl text-left shadow-sm hover:shadow-lg transition-all"
                      >
                         <div className="absolute top-2 right-2 text-xl opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all">✨</div>
                         <p className="text-indigo-800 font-medium pr-6">{q}</p>
                      </button>
                    ))}
                 </div>
              </div>
            )}

            {/* Interactive Question Card */}
            <div className="mt-8 bg-gradient-to-br from-amber-100 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-300 rounded-full blur-2xl opacity-50"></div>
                
                <h3 className="relative text-amber-800 font-bold uppercase tracking-widest text-sm mb-3 flex items-center gap-2">
                   <span className="bg-amber-400 text-amber-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">?</span>
                   Your Mission
                </h3>
                <p className="relative text-2xl md:text-3xl font-bold text-amber-900 font-display leading-snug">
                    {story.storyboard.interactive_question}
                </p>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50/80 backdrop-blur p-6 border-t border-gray-100 flex flex-col items-center gap-4">
            <button 
                onClick={onReset}
                className="group relative px-8 py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-full font-bold shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex items-center gap-3 overflow-hidden"
            >
                <div className="absolute inset-0 bg-indigo-50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <span className="relative flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  New Adventure (Start Over)
                </span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default StoryView;