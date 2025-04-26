import { createFileRoute, Link, useLoaderData } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { GroupMoodChart } from '@/components/group-mood-chart';
import { GroupMoodTimeline } from '@/components/group-mood-timeline';
import { redirect } from '@tanstack/react-router';
import { getAuthUser } from '@/actions/getAuthUser';
import { convexQuery } from '@convex-dev/react-query';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import pluralize from 'pluralize';
import { moodOptions } from '@/lib/getMoodEmoji';
import { format } from 'date-fns';

export const Route = createFileRoute('/_authenticated/groups/$groupId')({
  beforeLoad: async ({ params, context }) => {
    const authUser = await getAuthUser();
    if (!authUser) {
      throw redirect({ to: '/sign-in' });
    }
    const user = await context.queryClient.fetchQuery(
      convexQuery(api.user.getUserFromNeonUserId, {
        neonUserId: authUser?.id ?? '',
      })
    );

    if (!user) {
      throw redirect({ to: '/sign-in' });
    }

    if (!user.availableGroups?.includes(params.groupId as Id<'groups'>)) {
      throw redirect({ to: '/groups' });
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
  } = useLoaderData({
    from: '/_authenticated/groups/$groupId',
  });

  const groupCreationDate = new Date(group._creationTime);
  const groupCreationDateFormatted = format(groupCreationDate, 'MMMM d, yyyy');

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
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
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link to="/log">Log Mood</Link>
            </Button>
            <Button variant="outline">Invite Members</Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
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
                  <div className="text-2xl font-bold">
                    {group.members.length}
                  </div>
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
                  <GroupMoodChart />
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
                    {[
                      {
                        user: 'Alex J.',
                        mood: 'Happy',
                        time: 'Today, 10:30 AM',
                        note: 'Great team meeting!',
                      },
                      {
                        user: 'Sam T.',
                        mood: 'Stressed',
                        time: 'Today, 9:15 AM',
                        note: 'Deadline approaching',
                      },
                      {
                        user: 'Jamie L.',
                        mood: 'Excited',
                        time: 'Yesterday, 4:45 PM',
                        note: 'New project kickoff',
                      },
                      {
                        user: 'Taylor R.',
                        mood: 'Calm',
                        time: 'Yesterday, 11:20 AM',
                        note: 'Finished major task',
                      },
                    ].map((entry, i) => (
                      <div key={i} className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage src={undefined} alt={entry.user} />
                          <AvatarFallback>
                            {entry.user.split(' ')[0][0]}
                            {entry.user.split(' ')[1][0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {entry.user} felt {entry.mood}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.note}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.time}
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
                <GroupMoodTimeline />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Group Members</CardTitle>
                <CardDescription>People in this group</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: 'Alex Johnson',
                      role: 'Owner',
                      joinedAt: 'Mar 15, 2023',
                      status: 'online',
                    },
                    {
                      name: 'Sam Taylor',
                      role: 'Admin',
                      joinedAt: 'Mar 16, 2023',
                      status: 'offline',
                    },
                    {
                      name: 'Jamie Lee',
                      role: 'Member',
                      joinedAt: 'Mar 20, 2023',
                      status: 'online',
                    },
                    {
                      name: 'Taylor Rodriguez',
                      role: 'Member',
                      joinedAt: 'Apr 2, 2023',
                      status: 'offline',
                    },
                    {
                      name: 'Jordan Smith',
                      role: 'Member',
                      joinedAt: 'Apr 10, 2023',
                      status: 'online',
                    },
                  ].map((member, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={undefined} alt={member.name} />
                          <AvatarFallback>
                            {member.name.split(' ')[0][0]}
                            {member.name.split(' ')[1][0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                member.role === 'Owner'
                                  ? 'default'
                                  : member.role === 'Admin'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {member.role}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              Joined {member.joinedAt}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          member.status === 'online' ? 'default' : 'outline'
                        }
                        className="capitalize"
                      >
                        {member.status}
                      </Badge>
                    </div>
                  ))}
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
