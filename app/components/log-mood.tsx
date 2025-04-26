'use client';

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
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { LOCAL_STORAGE_MOODS_KEY } from '@/constants/localStorageMoodKey';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import type { Doc, Id } from 'convex/_generated/dataModel';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import {
  PUBLIC_GROUP_ID,
  PERSONAL_GROUP_ID,
} from '@/constants/internal-group-ids';

export function LogMood({ user }: { user: Doc<'users'> | null }) {
  const isLoggedIn = !!user;

  const addMood = useMutation(api.mood.createMood);

  const { data: getUserGroups } = useQuery(
    convexQuery(
      api.user.getUserGroups,
      isLoggedIn
        ? {
            userId: user._id,
          }
        : 'skip'
    )
  );

  const [selectedMood, setSelectedMood] =
    useState<Infer<typeof moodLiteral>>('happy');

  const [note, setNote] = useState('');

  const [tags, setTags] = useState('');
  const [group, setGroup] = useState(
    isLoggedIn ? getUserGroups?.[0]?._id || PUBLIC_GROUP_ID : PUBLIC_GROUP_ID
  );

  const moods = localStorage.getItem(LOCAL_STORAGE_MOODS_KEY);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMood) {
      toast.error('Please add a mood!');
      return;
    }

    try {
      const moodId = await addMood({
        mood: selectedMood,
        note,
        userId: user?._id,
        tags: tags.split(',').map((tag) => tag.trim()),
        ...(isLoggedIn &&
          group !== PERSONAL_GROUP_ID && { group: group as Id<'groups'> }),
      });
      if (!isLoggedIn) {
        const existingMoods = moods ? JSON.parse(moods) : [];
        localStorage.setItem(
          LOCAL_STORAGE_MOODS_KEY,
          JSON.stringify([...existingMoods, moodId])
        );
      }
      toast.success('Mood logged successfully!');
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
            {!isLoggedIn && (
              <CardDescription>
                <Link to="/sign-in" className="underline">
                  Sign in
                </Link>{' '}
                to track your emotional state and see patterns over time
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="mood">Select your mood</Label>
              <MoodSelector
                selectedMood={selectedMood}
                onSelect={setSelectedMood}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Add a note (optional)</Label>
              <Textarea
                id="note"
                placeholder="What's making you feel this way?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="work, family, health, etc."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="space-y-2 w-full">
              <Label htmlFor="group">Share with group (optional)</Label>
              <Select
                disabled={!isLoggedIn}
                value={group}
                onValueChange={setGroup}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PERSONAL_GROUP_ID}>
                    Personal (Private)
                  </SelectItem>
                  {getUserGroups?.map((group) => (
                    <SelectItem key={group._id} value={group._id}>
                      {group.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={PUBLIC_GROUP_ID}>Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter
            className={cn(!isLoggedIn && 'grid sm:grid-cols-2 gap-2')}
          >
            <Button type="submit" className="w-full" disabled={!selectedMood}>
              Log Mood {isLoggedIn ? '' : ' Anonymously'}
            </Button>
            {!isLoggedIn && (
              <Link to="/sign-up" className="cursor-pointer w-full">
                <Button
                  type="submit"
                  variant="outline"
                  className="cursor-pointer w-full"
                  disabled={!selectedMood}
                >
                  Sign up
                </Button>
              </Link>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
