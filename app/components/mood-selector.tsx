'use client';

import { moodOptions } from '@/lib/getMoodEmoji';
import { cn } from '@/lib/utils';
import type { moodLiteral } from 'convex/schema';
import type { Infer } from 'convex/values';

interface MoodSelectorProps {
  selectedMood: Infer<typeof moodLiteral>;
  onSelect: (mood: Infer<typeof moodLiteral>) => void;
}

export function MoodSelector({ selectedMood, onSelect }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {moodOptions.map((mood) => (
        <button
          key={mood.value}
          type="button"
          onClick={() => onSelect(mood.value)}
          className={cn(
            'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer',
            mood.color,
            selectedMood === mood.value
              ? 'ring-2 ring-primary ring-offset-2'
              : ''
          )}
        >
          <span className="text-2xl">{mood.emoji}</span>
          <span className="mt-1 text-sm font-medium">{mood.label}</span>
        </button>
      ))}
    </div>
  );
}
