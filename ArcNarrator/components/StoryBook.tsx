import React, { useState, useEffect } from 'react';
import { StoryResponse, StoryChapter } from '../types';
import { getIntensityColor } from '../constants';

interface StoryBookProps {
  story: StoryResponse;
  isGeneratingImages: boolean;
  onReset: () => void;
}

const StoryBook: React.FC<StoryBookProps> = ({ story, isGeneratingImages, onReset }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const currentChapter = story.chapters[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === story.chapters.length - 1;

  const nextChapter = () => {
    if (!isLast) setCurrentIndex(prev => prev + 1);
  };

  const prevChapter = () => {
    if (!isFirst) setCurrentIndex(prev => prev - 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextChapter();
      if (e.key === 'ArrowLeft') prevChapter();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, story.chapters.length]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white overflow-hidden flex flex-col font-sans">
       {/* Background Image Layer */}
       <div className="absolute inset-0 z-0 transition-all duration-700 ease-in-out bg-slate-900">
          {currentChapter.imageUrl ? (
            <img 
              key={currentChapter.imageUrl} // Key change forces animation restart
              src={currentChapter.imageUrl} 
              alt={currentChapter.imagePrompt}
              className="w-full h-full object-cover animate-fade-in"
              style={{ animationDuration: '1.2s' }}
            />
          ) : (
             // Fallback gradient while loading
            <div className={`w-full h-full bg-gradient-to-br ${getIntensityColor(currentChapter.intensity)} animate-pulse opacity-50`} />
          )}
          
          {/* Enhanced Dark Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/30 pointer-events-none" />
       </div>

       {/* Top Bar */}
       <div className="relative z-10 p-6 flex justify-between items-start animate-fade-in">
          <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-lg flex flex-col gap-1">
             <h1 className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">
               {story.title}
             </h1>
             <p className="text-xs text-slate-300 font-mono tracking-widest opacity-80">{story.theme}</p>
          </div>
          
          <div className="flex gap-4">
            <button 
                onClick={onReset}
                className="px-4 py-2 text-sm font-medium bg-black/40 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full transition-all text-white/90 hover:text-white"
            >
                New Story
            </button>
          </div>
       </div>

       {/* Middle Area - Desktop Navigation Arrows */}
       <div className="flex-1 relative z-10 flex items-center justify-between px-4 pointer-events-none">
          <button 
             onClick={prevChapter}
             disabled={isFirst}
             className={`pointer-events-auto p-4 rounded-full bg-black/20 backdrop-blur-md border border-white/5 hover:bg-white/10 text-white transition-all duration-300 transform hover:scale-110 ${isFirst ? 'opacity-0 cursor-default' : 'opacity-100 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'}`}
             aria-label="Previous Chapter"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          <button 
             onClick={nextChapter}
             disabled={isLast}
             className={`pointer-events-auto p-4 rounded-full bg-black/20 backdrop-blur-md border border-white/5 hover:bg-white/10 text-white transition-all duration-300 transform hover:scale-110 ${isLast ? 'opacity-0 cursor-default' : 'opacity-100 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'}`}
             aria-label="Next Chapter"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
       </div>

       {/* Bottom Content Area */}
       <div 
         key={currentIndex} // Restart animation on page turn
         className="relative z-10 w-full max-w-5xl mx-auto p-6 md:p-12 pb-16 flex flex-col items-center text-center animate-slide-up"
       >
           {/* Chapter Info Badges */}
           <div className="mb-6 flex items-center gap-3">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm shadow-sm">
                Chapter {currentIndex + 1} / {story.chapters.length}
              </span>
              {isGeneratingImages && !currentChapter.imageUrl && (
                  <span className="text-xs flex items-center gap-2 px-3 py-1 text-blue-300 animate-pulse">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-ping"/>
                      Generating Scene...
                  </span>
              )}
           </div>

           {/* Title */}
           <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] leading-tight">
              {currentChapter.chapterTitle}
           </h2>
           
           {/* Content - Increased max width and adjusted font size for longer text */}
           <p className="text-base md:text-xl font-serif-story leading-relaxed text-slate-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] max-w-4xl text-justify md:text-center">
              {currentChapter.content}
           </p>

           {/* Mobile Nav Controls */}
           <div className="mt-10 flex gap-4 md:hidden w-full max-w-xs">
              <button 
                onClick={prevChapter} 
                disabled={isFirst}
                className="flex-1 py-3 bg-white/10 backdrop-blur border border-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed active:bg-white/20 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={nextChapter} 
                disabled={isLast}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600/50 to-purple-600/50 backdrop-blur border border-white/10 rounded-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed active:opacity-80 transition-all shadow-lg"
              >
                Next
              </button>
           </div>
       </div>
    </div>
  );
};

export default StoryBook;