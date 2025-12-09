import React from 'react';

interface LoadingProps {
  status: 'ANALYZING' | 'GENERATING_MEDIA';
}

const Loading: React.FC<LoadingProps> = ({ status }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-8 border-indigo-100 rounded-full"></div>
        <div className="absolute inset-0 border-8 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce">
            {status === 'ANALYZING' ? '🧠' : '🎨'}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-indigo-900 mb-2">
        {status === 'ANALYZING' ? 'Dreaming up a story...' : 'Painting magic & finding voices...'}
      </h3>
      <p className="text-indigo-400">
        {status === 'ANALYZING' 
          ? 'Analyzing your masterpiece' 
          : 'Almost ready for adventure!'}
      </p>
    </div>
  );
};

export default Loading;
