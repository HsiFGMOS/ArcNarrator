export type Language = 'en' | 'zh';

export interface Point {
  x: number;
  y: number;
}

export interface StoryChapter {
  chapterTitle: string;
  content: string;
  intensity: number; // 0 to 100
  imagePrompt: string;
  imageUrl?: string; // Populated after generation
}

export interface StoryResponse {
  title: string;
  theme: string;
  chapters: StoryChapter[];
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING_TEXT = 'GENERATING_TEXT',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}
