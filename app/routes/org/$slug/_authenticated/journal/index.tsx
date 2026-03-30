import { Suspense, useState } from 'react';
import {
  createFileRoute,
  Link,
  useLoaderData,
  useParams,
} from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSuspenseQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { getMoodEmoji } from '@/lib/getMoodEmoji';
import { getPlanFeatures } from '@/lib/plan-features';
import { BookOpen, PlusIcon, Trash2Icon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/org/$slug/_authenticated/journal/')({
  component: () => (
    <Suspense fallback={<JournalListSkeleton />}>
      <JournalListPage />
    </Suspense>
  ),
});

function JournalListPage() {
  const { slug } = useParams({ strict: false });
  const user = useLoaderData({
    from: '/org/$slug/_authenticated',
  });
  const { orgSettings } = useOrgSettings();
  const organizationId = orgSettings.clerkOrgId ?? '';
  const deleteJournal = useMutation(api.journals.deleteJournal);

  const { data: journals } = useSuspenseQuery(
    convexQuery(api.journals.getUserJournals, {
      userId: user._id,
      organizationId,
    })
  );

  const { data: journalCount } = useSuspenseQuery(
    convexQuery(api.journals.getUserJournalCount, {
      userId: user._id,
      organizationId,
    })
  );

  const [search, setSearch] = useState('');

  const planFeatures = getPlanFeatures(orgSettings.plan);
  const maxEntries = planFeatures.maxJournalEntries;
  const canCreateMore = journalCount < maxEntries;

  const filteredJournals = search
    ? journals.filter(
        (j) =>
          j.title.toLowerCase().includes(search.toLowerCase()) ||
          j.content.toLowerCase().includes(search.toLowerCase()) ||
          j.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : journals;

  const handleDelete = async (journalId: Id<'journals'>) => {
    try {
      await deleteJournal({ journalId });
      toast.success('Journal entry deleted');
    } catch {
      toast.error('Failed to delete journal entry');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
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

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Journal</h2>
          <p className="text-muted-foreground">
            Reflect on your emotions and track your inner journey
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="relative max-w-sm flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search journals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            {maxEntries !== Infinity && (
              <span className="text-sm text-muted-foreground">
                {journalCount} / {maxEntries} entries
              </span>
            )}
            <Button asChild disabled={!canCreateMore}>
              <Link to="/org/$slug/journal/new" params={{ slug: slug ?? '' }}>
                <PlusIcon className="mr-1 h-4 w-4" />
                New Entry
              </Link>
            </Button>
          </div>
        </div>

        {filteredJournals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">
                {search ? 'No matching entries' : 'No journal entries yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-[300px]">
                {search
                  ? 'Try a different search term'
                  : 'Start writing to capture your thoughts, feelings, and reflections'}
              </p>
              {!search && (
                <Button asChild>
                  <Link
                    to="/org/$slug/journal/new"
                    params={{ slug: slug ?? '' }}
                  >
                    <PlusIcon className="mr-1 h-4 w-4" />
                    Write your first entry
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredJournals.map((journal) => (
              <Card key={journal._id} className="group relative">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {journal.mood && (
                        <span className="text-xl flex-shrink-0">
                          {getMoodEmoji(journal.mood)}
                        </span>
                      )}
                      <CardTitle className="text-base truncate">
                        {journal.title}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(journal._id);
                      }}
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <CardDescription>
                    {formatDate(journal._creationTime)} at{' '}
                    {formatTime(journal._creationTime)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {journal.content}
                  </p>
                  {journal.tags && journal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {journal.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link
                      to="/org/$slug/journal/$journalId"
                      params={{
                        slug: slug ?? '',
                        journalId: journal._id,
                      }}
                    >
                      Read more
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JournalListSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
