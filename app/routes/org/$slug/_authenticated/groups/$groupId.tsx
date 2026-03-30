import { useState } from 'react';
import { createFileRoute, useLoaderData } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GroupMoodChart } from '@/components/group-mood-chart';
import { GroupMoodTimeline } from '@/components/group-mood-timeline';
import { MoodSelector } from '@/components/mood-selector';
import { redirect } from '@tanstack/react-router';
import { getAuthUser } from '@/actions/getAuthUser';
import { convexQuery } from '@convex-dev/react-query';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import pluralize from 'pluralize';
import { getMoodEmoji, moodOptions } from '@/lib/getMoodEmoji';
import { format, formatRelative } from 'date-fns';
import getInitials from '@/lib/getInitials';
import capitalize from 'lodash-es/capitalize';
import { useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PlusIcon, Loader2, ClipboardCheck } from 'lucide-react';
import type { Infer } from 'convex/values';
import type { moodLiteral } from 'convex/schema';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { getPlanFeatures } from '@/lib/plan-features';

export const Route = createFileRoute(
  '/org/$slug/_authenticated/groups/$groupId'
)({
  beforeLoad: async ({ params, context }) => {
    const authUser = await getAuthUser();
    if (!authUser) {
      throw redirect({
        to: '/org/$slug/sign-in',
        params: { slug: params.slug },
      });
    }
    const user = await context.queryClient.fetchQuery(
      convexQuery(api.user.getUserByClerkId, {
        clerkUserId: authUser?.id ?? '',
      })
    );

    if (!user) {
      throw redirect({
        to: '/org/$slug/sign-in',
        params: { slug: params.slug },
      });
    }

    if (!user.availableGroups?.includes(params.groupId as Id<'groups'>)) {
      throw redirect({
        to: '/org/$slug/groups',
        params: { slug: params.slug },
      });
    }
    return { groupId: params.groupId };
  },
  component: RouteComponent,
  loader: async ({ params, context }) => {
    const data = await context.queryClient.fetchQuery(
      convexQuery(api.groups.getGroupPageContent, {
        groupId: params.groupId as Id<'groups'>,
      })
    );
    return data;
  },
});

function RouteComponent() {
  const {
    group,
    activityLevel,
    creatorDisplayName,
    moodSummaryToday,
    numberOfNewMembersInLastMonth,
    lastFourMoodsWithUser,
  } = useLoaderData({
    from: '/org/$slug/_authenticated/groups/$groupId',
  });

  const { data: members } = useSuspenseQuery(
    convexQuery(api.groups.getActiveGroupMembers, {
      groupId: group._id,
    })
  );

  const groupCreationDate = new Date(group._creationTime);
  const groupCreationDateFormatted = format(groupCreationDate, 'MMMM d, yyyy');

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight">
                {group.name}
              </h2>
              {group.isPrivate && <Badge variant="outline">Private</Badge>}
            </div>
            <p className="text-muted-foreground">{group.description}</p>
          </div>
          <Button variant="outline">Invite Members</Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="check-ins">Check-ins</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{members.length}</div>
                  <p className="text-xs text-muted-foreground">
                    +{numberOfNewMembersInLastMonth} in the last month
                  </p>
                </CardContent>
              </Card>
              {moodSummaryToday.totalCount > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Group Mood Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      Mostly{' '}
                      {
                        moodOptions.find(
                          (mood) =>
                            mood.value === moodSummaryToday.mostCommonMood
                        )?.label
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pluralize('member', moodSummaryToday.totalCount, true)}{' '}
                      logged moods
                    </p>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {groupCreationDateFormatted}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    By {creatorDisplayName}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Activity Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activityLevel}</div>
                  <p className="text-xs text-muted-foreground">
                    Based on mood logs
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Group Mood Distribution</CardTitle>
                  <CardDescription>
                    How everyone in the group is feeling
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <GroupMoodChart groupId={group._id} />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest mood logs in the group
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lastFourMoodsWithUser.map((mood, i) => (
                      <div key={i} className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage
                            src={mood?.user?.image}
                            alt={mood?.user?.displayName}
                          />
                          <AvatarFallback>
                            {getInitials(mood?.user.displayName ?? '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {mood?.user?.displayName} felt {mood?.mood}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {mood?.note}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {capitalize(
                              formatRelative(
                                mood?._creationTime ?? new Date(),
                                new Date()
                              )
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Mood Timeline</CardTitle>
                <CardDescription>
                  How group moods have changed over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GroupMoodTimeline groupId={group._id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="check-ins" className="space-y-4">
            <GroupCheckIns groupId={group._id} />
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Group Members</CardTitle>
                <CardDescription>People in this group</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member, i) => {
                    const role = member?.role;
                    const createdAt = `Joined ${formatRelative(
                      member?._creationTime ?? new Date(),
                      new Date()
                    )}`;
                    const status = 'online';
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage
                              src={member?.image}
                              alt={member?.displayName}
                            />
                            <AvatarFallback>
                              {getInitials(member?.displayName ?? '')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member?.displayName}</p>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  role === 'owner'
                                    ? 'default'
                                    : role === 'admin'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {capitalize(role)}
                              </Badge>
                              <p className="text-sm text-muted-foreground">
                                {createdAt}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={status === 'online' ? 'default' : 'outline'}
                          className="capitalize"
                        >
                          {status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Group Settings</CardTitle>
                <CardDescription>Manage your group preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">Privacy</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This group is currently{' '}
                      {group.isPrivate ? 'private' : 'public'}. Only invited
                      members can see the content.
                    </p>
                    <Button variant="outline" className="mt-2">
                      Change Privacy Settings
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-medium text-lg">Notifications</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You're receiving notifications for all new mood logs in
                      this group.
                    </p>
                    <Button variant="outline" className="mt-2">
                      Manage Notifications
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-medium text-lg">Leave Group</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You can leave this group at any time. Your mood data will
                      be removed from group analytics.
                    </p>
                    <Button variant="destructive" className="mt-2">
                      Leave Group
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group Check-ins Component
// ---------------------------------------------------------------------------

function GroupCheckIns({ groupId }: { groupId: Id<'groups'> }) {
  const user = useLoaderData({ from: '/org/$slug/_authenticated' });
  const { orgSettings } = useOrgSettings();
  const organizationId = orgSettings.clerkOrgId ?? '';
  const planFeatures = getPlanFeatures(orgSettings.plan);

  const { data: checkIns } = useSuspenseQuery(
    convexQuery(api.checkIns.getGroupCheckIns, { groupId })
  );

  const today = format(new Date(), 'yyyy-MM-dd');
  const activeCheckIns = checkIns.filter((c) => c.isActive);
  const canCreateMore =
    activeCheckIns.length < planFeatures.maxCheckInsPerGroup;

  const createCheckIn = useMutation(api.checkIns.createCheckIn);
  const respondToCheckIn = useMutation(api.checkIns.respondToCheckIn);
  const deactivateCheckIn = useMutation(api.checkIns.deactivateCheckIn);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newFrequency, setNewFrequency] = useState<
    'daily' | 'weekly' | 'biweekly' | 'monthly'
  >('daily');
  const [isCreating, setIsCreating] = useState(false);

  // Response state
  const [respondingTo, setRespondingTo] = useState<Id<'checkIns'> | null>(null);
  const [responseMood, setResponseMood] =
    useState<Infer<typeof moodLiteral>>('neutral');
  const [responseNote, setResponseNote] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast.error('Please add a title');
      return;
    }
    setIsCreating(true);
    try {
      await createCheckIn({
        groupId,
        title: newTitle.trim(),
        prompt: newPrompt.trim() || undefined,
        frequency: newFrequency,
        createdBy: user._id,
        organizationId,
      });
      toast.success('Check-in created');
      setShowCreateForm(false);
      setNewTitle('');
      setNewPrompt('');
    } catch {
      toast.error('Failed to create check-in');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRespond = async (checkInId: Id<'checkIns'>) => {
    setIsResponding(true);
    try {
      await respondToCheckIn({
        checkInId,
        userId: user._id,
        mood: responseMood,
        note: responseNote.trim() || undefined,
        period: today,
        organizationId,
      });
      toast.success('Response submitted');
      setRespondingTo(null);
      setResponseNote('');
    } catch {
      toast.error('Failed to submit response');
    } finally {
      setIsResponding(false);
    }
  };

  const handleDeactivate = async (checkInId: Id<'checkIns'>) => {
    try {
      await deactivateCheckIn({ checkInId });
      toast.success('Check-in deactivated');
    } catch {
      toast.error('Failed to deactivate check-in');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Check-ins</h3>
          <p className="text-sm text-muted-foreground">
            Regular mood check-ins for the group
          </p>
        </div>
        {!showCreateForm && (
          <Button
            onClick={() => setShowCreateForm(true)}
            disabled={!canCreateMore}
            size="sm"
          >
            <PlusIcon className="mr-1 h-4 w-4" />
            New Check-in
          </Button>
        )}
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Check-in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Morning Check-in"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Prompt (optional)</Label>
              <Textarea
                placeholder="e.g., How are you starting the day?"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={newFrequency}
                onValueChange={(v) =>
                  setNewFrequency(
                    v as 'daily' | 'weekly' | 'biweekly' | 'monthly'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </CardFooter>
        </Card>
      )}

      {activeCheckIns.length === 0 && !showCreateForm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold mb-1">No check-ins yet</h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              Create a recurring check-in to see how everyone is feeling
            </p>
          </CardContent>
        </Card>
      ) : (
        activeCheckIns.map((checkIn) => (
          <CheckInCard
            key={checkIn._id}
            checkIn={checkIn}
            today={today}
            userId={user._id}
            isRespondingTo={respondingTo === checkIn._id}
            responseMood={responseMood}
            responseNote={responseNote}
            isResponding={isResponding}
            onStartRespond={() => setRespondingTo(checkIn._id)}
            onCancelRespond={() => setRespondingTo(null)}
            onMoodChange={setResponseMood}
            onNoteChange={setResponseNote}
            onSubmitResponse={() => handleRespond(checkIn._id)}
            onDeactivate={() => handleDeactivate(checkIn._id)}
          />
        ))
      )}
    </div>
  );
}

function CheckInCard({
  checkIn,
  today,
  userId,
  isRespondingTo,
  responseMood,
  responseNote,
  isResponding,
  onStartRespond,
  onCancelRespond,
  onMoodChange,
  onNoteChange,
  onSubmitResponse,
  onDeactivate,
}: {
  checkIn: {
    _id: Id<'checkIns'>;
    title?: string;
    prompt?: string;
    frequency: string;
  };
  today: string;
  userId: Id<'users'>;
  isRespondingTo: boolean;
  responseMood: Infer<typeof moodLiteral>;
  responseNote: string;
  isResponding: boolean;
  onStartRespond: () => void;
  onCancelRespond: () => void;
  onMoodChange: (mood: Infer<typeof moodLiteral>) => void;
  onNoteChange: (note: string) => void;
  onSubmitResponse: () => void;
  onDeactivate: () => void;
}) {
  const { data: responses } = useSuspenseQuery(
    convexQuery(api.checkIns.getCheckInResponses, {
      checkInId: checkIn._id,
      period: today,
    })
  );

  const { data: hasResponded } = useSuspenseQuery(
    convexQuery(api.checkIns.hasRespondedToday, {
      checkInId: checkIn._id,
      userId,
      period: today,
    })
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {checkIn.title ?? 'Team Check-in'}
            </CardTitle>
            {checkIn.prompt && (
              <CardDescription className="mt-1">
                {checkIn.prompt}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize">
              {checkIn.frequency}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeactivate}
              className="text-xs text-muted-foreground"
            >
              Deactivate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's responses */}
        {responses.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Today's responses ({responses.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {responses.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1"
                  title={r.note ?? undefined}
                >
                  <span className="text-sm">{getMoodEmoji(r.mood)}</span>
                  <span className="text-xs font-medium">{r.displayName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Response form */}
        {!hasResponded && !isRespondingTo && (
          <Button size="sm" onClick={onStartRespond}>
            Respond
          </Button>
        )}
        {hasResponded && !isRespondingTo && (
          <p className="text-sm text-muted-foreground">
            You've already checked in today
          </p>
        )}
        {isRespondingTo && (
          <div className="space-y-3 border rounded-lg p-4">
            <MoodSelector selectedMood={responseMood} onSelect={onMoodChange} />
            <Textarea
              placeholder="How are you feeling? (optional)"
              value={responseNote}
              onChange={(e) => onNoteChange(e.target.value)}
              className="min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={onSubmitResponse}
                disabled={isResponding}
              >
                {isResponding && (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                )}
                Submit
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelRespond}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
