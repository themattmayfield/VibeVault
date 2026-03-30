import { Suspense, useState } from 'react';
import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSuspenseQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { getMoodEmoji, moodOptions } from '@/lib/getMoodEmoji';
import { MoodSelector } from '@/components/mood-selector';
import type { Infer } from 'convex/values';
import type { moodLiteral } from 'convex/schema';
import { toast } from 'sonner';
import {
  ArrowLeft,
  PencilIcon,
  Trash2Icon,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const Route = createFileRoute(
  '/org/$slug/_authenticated/journal/$journalId'
)({
  component: () => (
    <Suspense fallback={<JournalDetailSkeleton />}>
      <JournalDetailPage />
    </Suspense>
  ),
});

function JournalDetailPage() {
  const { slug, journalId } = Route.useParams();
  const navigate = useNavigate();
  const updateJournal = useMutation(api.journals.updateJournal);
  const deleteJournal = useMutation(api.journals.deleteJournal);

  const { data: journal } = useSuspenseQuery(
    convexQuery(api.journals.getJournal, {
      journalId: journalId as Id<'journals'>,
    })
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(journal.title);
  const [editContent, setEditContent] = useState(journal.content);
  const [editMood, setEditMood] = useState<
    Infer<typeof moodLiteral> | undefined
  >(journal.mood);
  const [editTags, setEditTags] = useState(journal.tags?.join(', ') ?? '');
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const moodLabel = journal.mood
    ? moodOptions.find((m) => m.value === journal.mood)?.label
    : null;

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!editContent.trim()) {
      toast.error('Content is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateJournal({
        journalId: journal._id,
        title: editTitle.trim(),
        content: editContent.trim(),
        mood: editMood,
        tags: editTags
          ? editTags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
      });
      toast.success('Journal entry updated');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update journal entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJournal({ journalId: journal._id });
      toast.success('Journal entry deleted');
      navigate({
        to: '/org/$slug/journal',
        params: { slug },
      });
    } catch {
      toast.error('Failed to delete journal entry');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isEditing) {
    return (
      <div className="flex flex-col">
        <div className="flex-1 space-y-4 px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">Edit Entry</h2>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Edit Journal Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Reflection</Label>
                <Textarea
                  id="content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[200px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowMoodSelector(!showMoodSelector)}
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showMoodSelector ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Mood {editMood ? `(${getMoodEmoji(editMood)})` : '(none)'}
                </button>
                {showMoodSelector && (
                  <div className="pt-2">
                    <MoodSelector
                      selectedMood={editMood ?? 'neutral'}
                      onSelect={(m) =>
                        setEditMood(m === editMood ? undefined : m)
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/org/$slug/journal" params={{ slug }}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                {journal.mood && (
                  <span className="text-3xl">{getMoodEmoji(journal.mood)}</span>
                )}
                {journal.title}
              </h2>
              <p className="text-muted-foreground">
                {formatDate(journal._creationTime)} at{' '}
                {formatTime(journal._creationTime)}
                {moodLabel && (
                  <span> &middot; Feeling {moodLabel.toLowerCase()}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <PencilIcon className="mr-1 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2Icon className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {journal.content}
            </div>
          </CardContent>
          {journal.tags && journal.tags.length > 0 && (
            <CardFooter className="border-t pt-4">
              <div className="flex flex-wrap gap-1">
                {journal.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

function JournalDetailSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-48 mt-1" />
          </div>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
