import { useState } from 'react';
import {
  createFileRoute,
  useLoaderData,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMutation } from 'convex/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from 'convex/_generated/api';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { getPlanFeatures } from '@/lib/plan-features';
import { MoodSelector } from '@/components/mood-selector';
import type { Infer } from 'convex/values';
import type { moodLiteral } from 'convex/schema';
import { toast } from 'sonner';
import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/org/$slug/_authenticated/journal/new')({
  component: NewJournalPage,
});

function NewJournalPage() {
  const { slug } = useParams({ strict: false });
  const navigate = useNavigate();
  const user = useLoaderData({
    from: '/org/$slug/_authenticated',
  });
  const { orgSettings } = useOrgSettings();
  const organizationId = orgSettings.clerkOrgId ?? '';

  const createJournal = useMutation(api.journals.createJournal);

  const { data: journalCount } = useSuspenseQuery(
    convexQuery(api.journals.getUserJournalCount, {
      userId: user._id,
      organizationId,
    })
  );

  const planFeatures = getPlanFeatures(orgSettings.plan);
  const maxEntries = planFeatures.maxJournalEntries;
  const canCreate = journalCount < maxEntries;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Infer<typeof moodLiteral> | undefined>(
    undefined
  );
  const [tags, setTags] = useState('');
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please add a title');
      return;
    }
    if (!content.trim()) {
      toast.error('Please write some content');
      return;
    }
    if (!canCreate) {
      toast.error(
        `You've reached the maximum of ${maxEntries} journal entries on the ${planFeatures.label} plan. Upgrade to write more.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const journalId = await createJournal({
        title: title.trim(),
        content: content.trim(),
        mood,
        tags: tags
          ? tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        userId: user._id,
        organizationId,
      });
      toast.success('Journal entry saved');
      navigate({
        to: '/org/$slug/journal/$journalId',
        params: { slug: slug ?? '', journalId },
      });
    } catch {
      toast.error('Failed to save journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Writing prompts to inspire reflection
  const prompts = [
    'What are you grateful for today?',
    'What challenged you today, and how did you handle it?',
    'Describe a moment that made you smile recently.',
    'What would you tell your past self about today?',
    'What patterns have you noticed in your mood lately?',
    'What does your ideal tomorrow look like?',
  ];
  const [currentPrompt] = useState(
    () => prompts[Math.floor(Math.random() * prompts.length)]
  );

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/org/$slug/journal" params={{ slug: slug ?? '' }}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">New Entry</h2>
            <p className="text-muted-foreground">
              Take a moment to reflect on how you're feeling
            </p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Write a Reflection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Give your entry a title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Reflection</Label>
                <p className="text-xs text-muted-foreground italic">
                  Prompt: {currentPrompt}
                </p>
                <Textarea
                  id="content"
                  placeholder="Write your thoughts here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
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
                  Link a mood (optional)
                </button>
                {showMoodSelector && (
                  <div className="pt-2">
                    <MoodSelector
                      selectedMood={mood ?? 'neutral'}
                      onSelect={(m) => setMood(m === mood ? undefined : m)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated, optional)</Label>
                <Input
                  id="tags"
                  placeholder="gratitude, growth, challenge..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              {!canCreate && (
                <p className="text-sm text-destructive">
                  You've reached the limit of {maxEntries} journal entries on
                  the {planFeatures.label} plan. Upgrade to Pro for unlimited
                  entries.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link to="/org/$slug/journal" params={{ slug: slug ?? '' }}>
                  Cancel
                </Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || !canCreate}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Entry
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
