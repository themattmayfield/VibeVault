import { createFileRoute } from '@tanstack/react-router';
import { LogMood } from '@/components/log-mood';

export const Route = createFileRoute('/_authenticated/log')({
  component: LogMood,
});
