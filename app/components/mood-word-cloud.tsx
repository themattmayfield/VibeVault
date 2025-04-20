'use client';

import { useEffect, useRef } from 'react';

const tags = [
  { text: 'work', value: 64 },
  { text: 'family', value: 42 },
  { text: 'weekend', value: 128 },
  { text: 'friends', value: 38 },
  { text: 'exercise', value: 25 },
  { text: 'sleep', value: 32 },
  { text: 'food', value: 18 },
  { text: 'travel', value: 15 },
  { text: 'weather', value: 22 },
  { text: 'movies', value: 12 },
  { text: 'music', value: 20 },
  { text: 'reading', value: 8 },
  { text: 'gaming', value: 14 },
  { text: 'shopping', value: 10 },
  { text: 'cooking', value: 16 },
];

export function MoodWordCloud() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw word cloud (simplified version)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxFontSize = 36;
    const minFontSize = 12;

    // Sort tags by value (descending)
    const sortedTags = [...tags].sort((a, b) => b.value - a.value);

    // Find max value for scaling
    const maxValue = Math.max(...sortedTags.map((tag) => tag.value));

    // Draw each tag
    sortedTags.forEach((tag, index) => {
      // Calculate font size based on value
      const fontSize =
        minFontSize + (tag.value / maxValue) * (maxFontSize - minFontSize);

      // Set font
      ctx.font = `${Math.round(fontSize)}px Arial`;
      ctx.textAlign = 'center';

      // Calculate position (simplified layout)
      const angle = (index / sortedTags.length) * Math.PI * 2;
      const radius = (canvas.height / 3) * (0.6 + Math.random() * 0.4);
      const x =
        centerX + Math.cos(angle) * radius * (0.5 + Math.random() * 0.5);
      const y =
        centerY + Math.sin(angle) * radius * (0.5 + Math.random() * 0.5);

      // Set color based on value
      const hue = 200 + (tag.value / maxValue) * 160;
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;

      // Draw text
      ctx.fillText(tag.text, x, y);
    });
  }, []);

  return (
    <div className="h-[200px] w-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
