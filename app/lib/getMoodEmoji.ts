import { moodLiteral } from "convex/schema";
import { Infer } from "convex/values";

export const getMoodEmoji = (mood: string) => {
  const emojis: Record<Infer<typeof moodLiteral>, string> = {
    happy: "😊",
    sad: "😢",
    angry: "😠",
    excited: "😃",
    calm: "😌",
    stressed: "😰",
    tired: "😴",
    neutral: "😐",
    anxious: "😟",
    pessimistic: "😔",
  };

  return emojis[mood] || "😐";
};
