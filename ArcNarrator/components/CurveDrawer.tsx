import React, { useRef, useEffect, useState } from 'react';
import { Point, Language } from '../types';
import { CANVAS_HEIGHT, SAMPLING_POINTS } from '../constants';

interface CurveDrawerProps {
  onConfirm: (points: Point[], language: Language) => void;
  isProcessing: boolean;
}

const CurveDrawer: React.FC<CurveDrawerProps> = ({ onConfirm, isProcessing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [language, setLanguage] = useState<Language>('zh');

  // Resize canvas to match container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.offsetWidth;
        canvasRef.current.height = CANVAS_HEIGHT;
        drawCurve(points);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  const drawCurve = (currentPoints: Point[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid lines (Visual Aid)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Horizontal middle
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    // Vertical sections
    for (let i = 1; i < SAMPLING_POINTS; i++) {
        const x = (canvas.width / SAMPLING_POINTS) * i;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    ctx.stroke();

    // Draw Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Inter';
    ctx.fillText('High Intensity', 10, 20);
    ctx.fillText('Neutral', 10, canvas.height / 2 - 5);
    ctx.fillText('Low Intensity', 10, canvas.height - 10);

    if (currentPoints.length < 2) return;

    // Draw the curve
    ctx.beginPath();
    ctx.moveTo(currentPoints[0].x, currentPoints[0].y);

    // Smooth curve
    for (let i = 1; i < currentPoints.length - 1; i++) {
      const xc = (currentPoints[i].x + currentPoints[i + 1].x) / 2;
      const yc = (currentPoints[i].y + currentPoints[i + 1].y) / 2;
      ctx.quadraticCurveTo(currentPoints[i].x, currentPoints[i].y, xc, yc);
    }
    
    // Connect the last point
    if(currentPoints.length > 2) {
        ctx.lineTo(currentPoints[currentPoints.length - 1].x, currentPoints[currentPoints.length - 1].y);
    }

    // Gradient Stroke
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#38bdf8');
    gradient.addColorStop(0.5, '#a855f7');
    gradient.addColorStop(1, '#f472b6');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#a855f7';
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isProcessing) return;
    setIsDrawing(true);
    setHasDrawn(true);
    const pos = getPos(e);
    if (pos) {
      setPoints([pos]);
      drawCurve([pos]);
    }
  };

  const moveDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isProcessing) return;
    const pos = getPos(e);
    if (pos) {
        // Simple optimization: only add point if distance is significant
        const lastPoint = points[points.length - 1];
        if (lastPoint && Math.abs(pos.x - lastPoint.x) > 2) {
            const newPoints = [...points, pos];
            setPoints(newPoints);
            drawCurve(newPoints);
        }
    }
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const handleGenerate = () => {
    if (!canvasRef.current || points.length === 0) return;
    
    // Sample points from the drawing
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    
    // Create evenly distributed sampling points along the X axis
    const sampledPoints: Point[] = [];
    
    for (let i = 0; i < SAMPLING_POINTS; i++) {
        // Target X coordinate (center of each section)
        const targetX = (width / SAMPLING_POINTS) * i + (width / SAMPLING_POINTS / 2);
        
        // Find closest point in user's drawing to this X
        const closest = points.reduce((prev, curr) => {
            return (Math.abs(curr.x - targetX) < Math.abs(prev.x - targetX) ? curr : prev);
        });

        // Normalize Y (Intensity): 0 (Bottom) to 100 (Top)
        const intensity = ((height - closest.y) / height) * 100;

        sampledPoints.push({
            x: i, // Logical step
            y: Math.max(0, Math.min(100, intensity)) // Clamp 0-100
        });
    }

    onConfirm(sampledPoints, language);
  };

  const clearCanvas = () => {
    setPoints([]);
    setHasDrawn(false);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-6 animate-fade-in">
        <div className="text-center space-y-2">
            <h2 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Draw Your Narrative Arc
            </h2>
            <p className="text-slate-400">
                Draw a line representing the emotional intensity of your story.
            </p>
        </div>

        <div className="flex justify-center mb-2">
            <div className="bg-slate-800 p-1 rounded-lg flex gap-1">
                <button 
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${language === 'en' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    English
                </button>
                <button 
                    onClick={() => setLanguage('zh')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${language === 'zh' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    中文
                </button>
            </div>
        </div>

        <div 
            ref={containerRef}
            className="relative w-full h-[400px] bg-slate-800/50 rounded-xl border-2 border-slate-700 shadow-2xl overflow-hidden touch-none"
        >
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={moveDrawing}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={moveDrawing}
                onTouchEnd={endDrawing}
                className="cursor-crosshair w-full h-full"
            />
            
            {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-slate-500/50 text-2xl font-bold select-none">DRAW HERE</p>
                </div>
            )}
        </div>

        <div className="flex justify-center gap-4">
             <button
                onClick={clearCanvas}
                disabled={isProcessing || !hasDrawn}
                className="px-6 py-3 rounded-lg font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Clear
            </button>
            <button
                onClick={handleGenerate}
                disabled={isProcessing || !hasDrawn}
                className={`
                    px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95
                    ${isProcessing || !hasDrawn 
                        ? 'bg-slate-600 cursor-not-allowed opacity-50' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/25'}
                `}
            >
                {isProcessing ? 'Weaving Story...' : 'Generate Story'}
            </button>
        </div>
    </div>
  );
};

export default CurveDrawer;