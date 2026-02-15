import React, { useState, useCallback } from 'react';
import CurveDrawer from './components/CurveDrawer';
import StoryBook from './components/StoryBook';
import { generateStoryFromCurve, generateImageForChapter } from './services/geminiService';
import { AppState, Point, StoryResponse, Language } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCurveConfirmed = useCallback(async (points: Point[], language: Language) => {
    try {
      setAppState(AppState.GENERATING_TEXT);
      setErrorMsg(null);

      // 1. Generate Story Text
      const generatedStory = await generateStoryFromCurve(points, language);
      setStory(generatedStory);
      setAppState(AppState.GENERATING_IMAGES);

      // 2. Start Image Generation in background
      // We update the state progressively as images arrive
      generateImagesProgressively(generatedStory);

    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to weave the story. Please check your connection or API key and try again.");
      setAppState(AppState.ERROR);
    }
  }, []);

  const generateImagesProgressively = async (initialStory: StoryResponse) => {
    const chapters = [...initialStory.chapters];
    
    // Create an array of promises but don't await all at once effectively blocking UI
    // We want to update state as each one finishes
    const imagePromises = chapters.map(async (chapter, index) => {
        try {
            const imageUrl = await generateImageForChapter(chapter.imagePrompt);
            
            // Functional state update to ensure we are working with latest state
            setStory(prev => {
                if (!prev) return null;
                const newChapters = [...prev.chapters];
                newChapters[index] = { ...newChapters[index], imageUrl };
                return { ...prev, chapters: newChapters };
            });
        } catch (e) {
            console.warn(`Failed to generate image for chapter ${index}`, e);
        }
    });

    // Wait for all to finish (or fail) to update global loading state
    await Promise.allSettled(imagePromises);
    setAppState(AppState.PLAYING);
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setStory(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation / Brand */}
      {appState !== AppState.PLAYING && appState !== AppState.GENERATING_IMAGES && (
         <nav className="p-6 flex items-center justify-center">
            <h1 className="text-2xl font-display font-bold tracking-widest bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                ARC NARRATOR
            </h1>
         </nav>
      )}

      {/* Main Content Switcher */}
      <main className="flex-grow flex flex-col items-center justify-center relative">
        
        {appState === AppState.IDLE && (
            <CurveDrawer onConfirm={handleCurveConfirmed} isProcessing={false} />
        )}

        {appState === AppState.GENERATING_TEXT && (
             <div className="flex flex-col items-center gap-6 animate-pulse">
                <div className="w-16 h-16 border-4 border-t-blue-500 border-r-purple-500 border-b-pink-500 border-l-transparent rounded-full animate-spin" />
                <h2 className="text-xl font-serif-story text-slate-300">Weaving your destiny...</h2>
             </div>
        )}

        {appState === AppState.ERROR && (
            <div className="text-center p-8 max-w-md bg-red-900/20 border border-red-800 rounded-xl">
                <h3 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h3>
                <p className="text-red-200 mb-6">{errorMsg}</p>
                <button 
                    onClick={handleReset}
                    className="px-6 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                    Try Again
                </button>
            </div>
        )}

        {/* Show Story Book if we have story data, even if images are still loading */}
        {(appState === AppState.GENERATING_IMAGES || appState === AppState.PLAYING) && story && (
            <StoryBook 
                story={story} 
                isGeneratingImages={appState === AppState.GENERATING_IMAGES}
                onReset={handleReset}
            />
        )}
      </main>
    </div>
  );
};

export default App;
