import type { moodLiteral } from 'convex/schema';
import type { Infer } from 'convex/values';

export const getMoodEmoji = (mood: string) => {
  const emojis: Record<Infer<typeof moodLiteral>, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    excited: '😃',
    calm: '😌',
    stressed: '😰',
    tired: '😴',
    neutral: '😐',
    anxious: '😟',
    pessimistic: '😔',
  };

  return emojis[mood] || '😐';
};

type MoodOption = {
  value: Infer<typeof moodLiteral>;
  label: string;
  emoji: string;
  color: string;
};

export const moodOptions: MoodOption[] = [
  {
    value: 'happy',
    label: 'Happy',
    emoji: getMoodEmoji('happy'),
    color: 'bg-green-100 border-green-300 hover:bg-green-200',
  },
  {
    value: 'excited',
    label: 'Excited',
    emoji: getMoodEmoji('excited'),
    color: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200',
  },
  {
    value: 'calm',
    label: 'Calm',
    emoji: getMoodEmoji('calm'),
    color: 'bg-blue-100 border-blue-300 hover:bg-blue-200',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    emoji: getMoodEmoji('neutral'),
    color: 'bg-gray-100 border-gray-300 hover:bg-gray-200',
  },
  {
    value: 'tired',
    label: 'Tired',
    emoji: getMoodEmoji('tired'),
    color: 'bg-purple-100 border-purple-300 hover:bg-purple-200',
  },
  {
    value: 'stressed',
    label: 'Stressed',
    emoji: getMoodEmoji('stressed'),
    color: 'bg-orange-100 border-orange-300 hover:bg-orange-200',
  },
  {
    value: 'sad',
    label: 'Sad',
    emoji: getMoodEmoji('sad'),
    color: 'bg-indigo-100 border-indigo-300 hover:bg-indigo-200',
  },
  {
    value: 'angry',
    label: 'Angry',
    emoji: getMoodEmoji('angry'),
    color: 'bg-red-100 border-red-300 hover:bg-red-200',
  },
  {
    value: 'anxious',
    label: 'Anxious',
    emoji: getMoodEmoji('anxious'),
    color: 'bg-pink-100 border-pink-300 hover:bg-pink-200',
  },
  {
    value: 'pessimistic',
    label: 'Pessimistic',
    emoji: getMoodEmoji('pessimistic'),
    color: 'bg-gray-100 border-gray-300 hover:bg-gray-200',
  },
];
