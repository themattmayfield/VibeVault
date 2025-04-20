import { LogMood } from '@/components/log-mood';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: LogMood,
});
