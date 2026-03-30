import { Suspense, useState } from 'react';
import {
  createFileRoute,
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSuspenseQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Doc, Id } from 'convex/_generated/dataModel';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { getPlanFeatures } from '@/lib/plan-features';
import { getMoodEmoji, moodOptions } from '@/lib/getMoodEmoji';
import type { Infer } from 'convex/values';
import type { moodLiteral } from 'convex/schema';
import { toast } from 'sonner';
import {
  Target,
  PlusIcon,
  CheckCircle2,
  XCircle,
  Trash2Icon,
  Flame,
  TrendingDown,
  TrendingUp,
  Loader2,
} from 'lucide-react';

export const Route = createFileRoute('/org/$slug/_authenticated/goals')({
  component: () => (
    <Suspense fallback={<GoalsSkeleton />}>
      <GoalsPage />
    </Suspense>
  ),
});

function GoalsPage() {
  const { slug } = useParams({ strict: false });
  const user = useLoaderData({ from: '/org/$slug/_authenticated' });
  const { orgSettings } = useOrgSettings();
  const organizationId = orgSettings.clerkOrgId ?? '';

  const { data: goals } = useSuspenseQuery(
    convexQuery(api.goals.getUserGoals, {
      userId: user._id,
      organizationId,
    })
  );

  const { data: activeGoalCount } = useSuspenseQuery(
    convexQuery(api.goals.getActiveGoalCount, {
      userId: user._id,
      organizationId,
    })
  );

  // Get recent mood data for progress calculation
  const { data: recentMoods } = useSuspenseQuery(
    convexQuery(api.mood.getUserLast30DaysMoods, {
      userId: user._id,
      organizationId,
    })
  );

  const { data: currentStreak } = useSuspenseQuery(
    convexQuery(api.mood.getUsersCurrentStreak, {
      userId: user._id,
      organizationId,
    })
  );

  const planFeatures = getPlanFeatures(orgSettings.plan);
  const maxGoals = planFeatures.maxActiveGoals;
  const canCreateMore = activeGoalCount < maxGoals;

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const abandonedGoals = goals.filter((g) => g.status === 'abandoned');

  // Calculate progress for a goal
  const getGoalProgress = (goal: Doc<'goals'>) => {
    if (goal.type === 'streak') {
      const target = goal.targetCount ?? 7;
      return Math.min(100, Math.round((currentStreak / target) * 100));
    }
    if (goal.type === 'mood_target' && goal.targetMood && goal.targetCount) {
      const now = new Date();
      const periodStart =
        goal.timeframe === 'weekly'
          ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const moodsInPeriod = recentMoods.filter(
        (m) => m._creationTime >= periodStart.getTime()
      );
      const matchingMoods = moodsInPeriod.filter(
        (m) => m.mood === goal.targetMood
      );

      if (goal.targetDirection === 'decrease') {
        // For decrease goals, fewer is better
        const count = matchingMoods.length;
        if (count <= goal.targetCount) return 100;
        return Math.max(
          0,
          Math.round(
            ((moodsInPeriod.length - count) / moodsInPeriod.length) * 100
          )
        );
      }
      // For increase goals
      return Math.min(
        100,
        Math.round((matchingMoods.length / goal.targetCount) * 100)
      );
    }
    return 0;
  };

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Goals</h2>
            <p className="text-muted-foreground">
              Set intentions and track your progress
            </p>
          </div>
          <div className="flex items-center gap-2">
            {maxGoals !== Infinity && (
              <span className="text-sm text-muted-foreground">
                {activeGoalCount} / {maxGoals} active
              </span>
            )}
            <CreateGoalDialog
              userId={user._id}
              organizationId={organizationId}
              canCreate={canCreateMore}
              planLabel={planFeatures.label}
              slug={slug ?? ''}
            />
          </div>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeGoals.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedGoals.length})
            </TabsTrigger>
            <TabsTrigger value="abandoned">
              Abandoned ({abandonedGoals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeGoals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-1">
                    No active goals
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-[300px]">
                    Set a goal to give your mood tracking a sense of direction
                    and purpose
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal._id}
                    goal={goal}
                    progress={getGoalProgress(goal)}
                    currentStreak={currentStreak}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedGoals.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No completed goals yet. Keep working on your active goals!
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal._id}
                    goal={goal}
                    progress={100}
                    currentStreak={currentStreak}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="abandoned" className="space-y-4">
            {abandonedGoals.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  No abandoned goals. Nice!
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {abandonedGoals.map((goal) => (
                  <GoalCard
                    key={goal._id}
                    goal={goal}
                    progress={0}
                    currentStreak={currentStreak}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  progress,
  currentStreak,
}: {
  goal: Doc<'goals'>;
  progress: number;
  currentStreak: number;
}) {
  const updateStatus = useMutation(api.goals.updateGoalStatus);
  const deleteGoal = useMutation(api.goals.deleteGoal);

  const handleComplete = async () => {
    try {
      await updateStatus({ goalId: goal._id, status: 'completed' });
      toast.success('Goal completed!');
    } catch {
      toast.error('Failed to update goal');
    }
  };

  const handleAbandon = async () => {
    try {
      await updateStatus({ goalId: goal._id, status: 'abandoned' });
      toast.success('Goal abandoned');
    } catch {
      toast.error('Failed to update goal');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGoal({ goalId: goal._id });
      toast.success('Goal deleted');
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  const typeLabel =
    goal.type === 'mood_target'
      ? 'Mood Target'
      : goal.type === 'streak'
        ? 'Streak Goal'
        : 'Custom Goal';

  const typeIcon =
    goal.type === 'streak' ? (
      <Flame className="h-4 w-4" />
    ) : goal.targetDirection === 'decrease' ? (
      <TrendingDown className="h-4 w-4" />
    ) : (
      <TrendingUp className="h-4 w-4" />
    );

  const progressDetail =
    goal.type === 'streak'
      ? `${currentStreak} / ${goal.targetCount ?? 7} days`
      : goal.type === 'mood_target' && goal.targetMood
        ? `${getMoodEmoji(goal.targetMood)} ${goal.targetDirection === 'decrease' ? 'Reduce' : 'Increase'} ${goal.targetMood}`
        : '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {typeIcon}
            <CardTitle className="text-base">{goal.title}</CardTitle>
          </div>
          <Badge
            variant={
              goal.status === 'active'
                ? 'default'
                : goal.status === 'completed'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {typeLabel}
          </Badge>
        </div>
        {goal.description && (
          <CardDescription>{goal.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{progressDetail}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {goal.timeframe === 'weekly' ? 'Weekly' : 'Monthly'}
          </Badge>
          <span>
            Created{' '}
            {new Date(goal._creationTime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </CardContent>
      {goal.status === 'active' && (
        <CardFooter className="gap-2">
          <Button size="sm" onClick={handleComplete} className="flex-1">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Complete
          </Button>
          <Button size="sm" variant="outline" onClick={handleAbandon}>
            <XCircle className="mr-1 h-3.5 w-3.5" />
            Abandon
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2Icon className="h-3.5 w-3.5" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function CreateGoalDialog({
  userId,
  organizationId,
  canCreate,
  planLabel,
  slug,
}: {
  userId: Id<'users'>;
  organizationId: string;
  canCreate: boolean;
  planLabel: string;
  slug: string;
}) {
  const createGoal = useMutation(api.goals.createGoal);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'mood_target' | 'streak' | 'custom'>(
    'mood_target'
  );
  const [targetMood, setTargetMood] = useState<
    Infer<typeof moodLiteral> | undefined
  >(undefined);
  const [targetDirection, setTargetDirection] = useState<
    'increase' | 'decrease'
  >('decrease');
  const [targetCount, setTargetCount] = useState('3');
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('mood_target');
    setTargetMood(undefined);
    setTargetDirection('decrease');
    setTargetCount('3');
    setTimeframe('weekly');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please add a title');
      return;
    }

    setIsSubmitting(true);
    try {
      await createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        targetMood: type === 'mood_target' ? targetMood : undefined,
        targetDirection: type === 'mood_target' ? targetDirection : undefined,
        targetCount: Number(targetCount) || undefined,
        timeframe,
        userId,
        organizationId,
      });
      toast.success('Goal created');
      resetForm();
      setOpen(false);
    } catch {
      toast.error('Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!canCreate}>
          <PlusIcon className="mr-1 h-4 w-4" />
          New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Goal</DialogTitle>
          <DialogDescription>
            Set an intention to work towards. Track your progress over time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="goal-title">Title</Label>
            <Input
              id="goal-title"
              placeholder="e.g., Reduce stress this week"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-desc">Description (optional)</Label>
            <Textarea
              id="goal-desc"
              placeholder="Why is this goal important to you?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Goal Type</Label>
            <Select
              value={type}
              onValueChange={(v) =>
                setType(v as 'mood_target' | 'streak' | 'custom')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mood_target">Mood Target</SelectItem>
                <SelectItem value="streak">Logging Streak</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'mood_target' && (
            <>
              <div className="space-y-2">
                <Label>Target Mood</Label>
                <Select
                  value={targetMood ?? ''}
                  onValueChange={(v) =>
                    setTargetMood(v as Infer<typeof moodLiteral>)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {moodOptions.map((mood) => (
                      <SelectItem key={mood.value} value={mood.value}>
                        {mood.emoji} {mood.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select
                  value={targetDirection}
                  onValueChange={(v) =>
                    setTargetDirection(v as 'increase' | 'decrease')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="decrease">
                      Decrease (fewer days)
                    </SelectItem>
                    <SelectItem value="increase">
                      Increase (more days)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target-count">
                {type === 'streak' ? 'Target Days' : 'Target Count'}
              </Label>
              <Input
                id="target-count"
                type="number"
                min="1"
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select
                value={timeframe}
                onValueChange={(v) => setTimeframe(v as 'weekly' | 'monthly')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GoalsSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div>
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-2 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
