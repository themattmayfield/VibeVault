import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MoodSelector } from '@/components/mood-selector';

import { useState } from 'react';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import type { moodLiteral } from 'convex/schema';
import type { Infer } from 'convex/values';

export const Route = createFileRoute('/log')({
  component: RouteComponent,
});

function RouteComponent() {
  const addMood = useMutation(api.mood.createMood);

  const [selectedMood, setSelectedMood] =
    useState<Infer<typeof moodLiteral>>('happy');

  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMood) {
      toast.error('Please add a mood!');
      return;
    }

    try {
      addMood({ mood: selectedMood, note });
      toast.success('Mood logged successfully!', {
        description: `You're feeling ${selectedMood} today.`,
      });
      setNote('');
    } catch (_error) {
      toast.error('Failed to log mood');
    }
  };

  return (
    <div className="container max-w-2xl py-1 mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        How are you feeling today?
      </h1>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader className="mb-4">
            <CardTitle>Log Your Mood</CardTitle>
            <CardDescription>
              Track your emotional state and see patterns over time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="mood">Select your mood</Label>
              <MoodSelector
                selectedMood={selectedMood}
                onSelect={setSelectedMood}
              />
            </div>

            <div className="space-y-2 mb-2">
              <Label htmlFor="note">Add a note (optional)</Label>
              <Textarea
                id="note"
                placeholder="What's making you feel this way?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="work, family, health, etc."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div> */}

            {/* <div className="space-y-2">
              <Label htmlFor="group">Share with group (optional)</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal (Private)</SelectItem>
                  <SelectItem value="friends">Friends Group</SelectItem>
                  <SelectItem value="work">Work Team</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!selectedMood}>
              Log Mood
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
