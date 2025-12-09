import React, { useState, useRef } from 'react';
import { ChildContext } from '../types';

interface InputSectionProps {
  onSubmit: (file: File | null, question: string, context: ChildContext) => void;
  isProcessing: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onSubmit, isProcessing }) => {
  const [question, setQuestion] = useState('');
  const [childName, setChildName] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsUploading(true);
      setUploadProgress(0);

      const reader = new FileReader();
      
      reader.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const percent = Math.round((ev.loaded / ev.total) * 100);
          setUploadProgress(percent);
        }
      };

      reader.onload = (ev) => {
        setPreviewUrl(ev.target?.result as string);
        setIsUploading(false);
        setUploadProgress(100);
      };

      reader.onerror = () => {
        setIsUploading(false);
        setUploadProgress(0);
        console.error("Error reading file");
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmit(selectedFile, question, { childName, characterName });
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border-4 border-white/50 p-6 md:p-10 relative overflow-hidden">
        
        {/* Decorator */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3 font-display drop-shadow-sm">
            Socratic Tales
          </h2>
          <p className="text-slate-500 font-bold text-lg">Draw a character, ask a big question, and let magic happen!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative">
          
          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="block text-indigo-900 font-bold ml-1 text-sm uppercase tracking-wide opacity-70">1. SNAP YOUR HERO! 📸 (Optional) </label>
            <div 
              className={`relative border-4 border-dashed rounded-[2rem] p-6 transition-all duration-300 text-center cursor-pointer group min-h-[220px] flex flex-col items-center justify-center overflow-hidden
                ${previewUrl ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 bg-slate-50'}
              `}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              
              {isUploading ? (
                <div className="w-full max-w-xs mx-auto z-10">
                   <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                   <p className="text-indigo-600 font-bold animate-pulse text-sm">Scanning magic...</p>
                </div>
              ) : previewUrl ? (
                <div className="relative w-full z-10 group-hover:scale-[1.02] transition-transform duration-500">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-52 mx-auto rounded-xl shadow-lg object-contain rotate-1"
                  />
                  <div className="absolute -top-2 -right-2">
                     <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="bg-white text-red-500 p-2 rounded-full shadow-lg hover:bg-red-50 transition-colors border border-red-100"
                        title="Remove image"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                     </button>
                  </div>
                </div>
              ) : (
                <div className="py-4 z-10 flex flex-col items-center justify-center transition-transform group-hover:scale-105 duration-300">
                  {/* Superhero Placeholder SVG */}
                  <div className="relative mb-2">
                      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-300 group-hover:text-indigo-300 transition-colors duration-300 drop-shadow-sm">
                          {/* Cape */}
                          <path d="M40 45C30 60 20 90 25 105H95C100 90 90 60 80 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 4" fill="currentColor" fillOpacity="0.1"/>
                          
                          {/* Body - Hero Stance */}
                          <path d="M60 42C50 42 42 48 42 60V75L45 105H75L78 75V60C78 48 70 42 60 42Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
                          
                          {/* Head */}
                          <circle cx="60" cy="28" r="14" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.2"/>
                          
                          {/* Arms - Hands on hips */}
                          <path d="M42 50C35 55 35 70 42 75" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                          <path d="M78 50C85 55 85 70 78 75" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>

                          {/* Emblem */}
                          <circle cx="60" cy="58" r="5" fill="white" fillOpacity="0.8"/>
                      </svg>
                      
                      {/* Plus Icon / Camera Badge */}
                      <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md border-2 border-indigo-100 text-indigo-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                           <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                        </svg>
                      </div>
                  </div>
                  
                  <p className="font-display font-bold text-2xl text-slate-400 group-hover:text-indigo-500 transition-colors">
                    Who is your hero?
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2 opacity-70">
                    Tap to upload drawing
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Text Input Section */}
          <div className="space-y-4 text-center">
             <label className="block text-indigo-900 font-bold ml-1 text-sm uppercase tracking-wide opacity-70 text-left">2. WHAT IS THE MYSTERY? 🕵️‍♂️</label>
             
             <div className="relative group">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Why is the sky blue? Where does rain come from? What do ants eat?..."
                  className="w-full p-6 rounded-2xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none text-xl bg-slate-50 text-slate-700 shadow-inner placeholder:text-slate-400 h-40"
                  disabled={isProcessing}
                />
                <div className="absolute right-4 bottom-4 text-2xl opacity-20 pointer-events-none">✨</div>
             </div>
          </div>

          {/* Optional Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 opacity-80 hover:opacity-100 transition-opacity">
            <div>
              <label className="block text-indigo-800 font-bold mb-1 ml-1 text-xs uppercase tracking-wide">Kid's Name</label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="e.g. Leo"
                className="w-full p-2.5 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none bg-white text-sm"
                disabled={isProcessing}
              />
            </div>
            <div>
              <label className="block text-indigo-800 font-bold mb-1 ml-1 text-xs uppercase tracking-wide">Character Name</label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g. Fluff"
                className="w-full p-2.5 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none bg-white text-sm"
                disabled={isProcessing}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!question.trim() || isProcessing || isUploading}
            className={`w-full py-5 rounded-2xl text-2xl font-display font-bold text-white shadow-xl shadow-indigo-300/50 transform transition-all duration-200
              ${(!question.trim() || isProcessing || isUploading) 
                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-[1.02] active:scale-[0.98] ring-4 ring-white/50'}
            `}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
                Weaving Magic...
              </span>
            ) : '🚀 Start Adventure!'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputSection;