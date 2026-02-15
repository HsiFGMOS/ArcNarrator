export const CANVAS_HEIGHT = 400;
export const SAMPLING_POINTS = 5; // Number of story chapters to generate based on curve

export const INTENSITY_COLORS = {
  LOW: 'from-blue-900/40 to-slate-900/40',
  MEDIUM: 'from-emerald-900/40 to-slate-900/40',
  HIGH: 'from-orange-900/40 to-slate-900/40',
  EXTREME: 'from-red-900/40 to-slate-900/40',
};

export const getIntensityColor = (intensity: number) => {
  if (intensity < 30) return INTENSITY_COLORS.LOW;
  if (intensity < 60) return INTENSITY_COLORS.MEDIUM;
  if (intensity < 85) return INTENSITY_COLORS.HIGH;
  return INTENSITY_COLORS.EXTREME;
};

// Helper to determine text color based on intensity for subtle UI hints
export const getIntensityTextColor = (intensity: number) => {
  if (intensity < 30) return 'text-blue-300';
  if (intensity < 60) return 'text-emerald-300';
  if (intensity < 85) return 'text-orange-300';
  return 'text-red-400';
};
