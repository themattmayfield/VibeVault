import { createFileRoute, useLoaderData } from '@tanstack/react-router';
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
import { format, formatRelative } from 'date-fns';
import getInitials from '@/lib/getInitials';
import capitalize from 'lodash-es/capitalize';
import { useSuspenseQuery } from '@tanstack/react-query';

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
    lastFourMoodsWithUser,
  } = useLoaderData({
    from: '/_authenticated/groups/$groupId',
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
