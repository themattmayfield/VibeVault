import {
  createFileRoute,
  useLoaderData,
  useParams,
} from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from '@tanstack/react-router';
import getInitials from '@/lib/getInitials';
import { CreateGroupModal } from '@/components/create-group-modal';
import { useState } from 'react';
import { api } from 'convex/_generated/api';
import { useSuspenseQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { getPlanFeatures } from '@/lib/plan-features';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { Search, Users, Inbox, Loader2 } from 'lucide-react';
import { formatRelative } from 'date-fns';

export const Route = createFileRoute('/org/$slug/_authenticated/groups/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = useParams({ strict: false });
  const { orgSettings } = useOrgSettings();
  const organizationId = orgSettings.clerkOrgId ?? '';
  const user = useLoaderData({ from: '/org/$slug/_authenticated' });
  const clerkUserId = user.clerkUserId;

  const { data: groups } = useSuspenseQuery(
    convexQuery(api.groups.getUsersGroups, {
      organizationId,
      clerkUserId,
    })
  );

  const { data: discoverableGroups } = useSuspenseQuery(
    convexQuery(api.groups.getDiscoverableGroups, {
      organizationId,
      clerkUserId,
    })
  );

  const { data: pendingInvites } = useSuspenseQuery(
    convexQuery(api.groups.getUserPendingInvites, {
      organizationId,
      clerkUserId,
    })
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const planFeatures = getPlanFeatures(orgSettings.plan);
  const maxGroups = planFeatures.maxGroups;
  const canCreateMoreGroups = groups.length < maxGroups;

  // Filter groups by search term (client-side for "My Groups")
  const filteredGroups = searchTerm
    ? groups.filter((g) =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : groups;

  const filteredDiscoverable = searchTerm
    ? discoverableGroups.filter((g) =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : discoverableGroups;

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {maxGroups !== Infinity && (
              <span className="text-sm text-muted-foreground">
                {groups.length} / {maxGroups} groups
              </span>
            )}
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!canCreateMoreGroups}
            >
              Create New Group
            </Button>
          </div>
        </div>

        <Tabs defaultValue="my-groups" className="space-y-4">
          <TabsList>
            <TabsTrigger value="my-groups">My Groups</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="invites" className="relative">
              Invites
              {pendingInvites.length > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                >
                  {pendingInvites.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* My Groups Tab */}
          <TabsContent value="my-groups" className="space-y-4">
            {filteredGroups.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <h3 className="font-semibold mb-1">
                    {searchTerm
                      ? 'No groups match your search'
                      : 'No groups yet'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[300px]">
                    {searchTerm
                      ? 'Try a different search term'
                      : 'Create a group to start sharing moods with your team'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredGroups.map((group) => (
                  <Card key={group._id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{group.name}</span>
                        <div className="flex items-center gap-1">
                          {group.isPrivate && (
                            <Badge variant="outline">Private</Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {group.userRole}
                          </Badge>
                        </div>
                      </CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                          {group.members.map((member, index) => (
                            <Avatar
                              key={index}
                              className="border-2 border-background"
                            >
                              <AvatarImage
                                src={member.image}
                                alt={member.displayName}
                              />
                              <AvatarFallback>
                                {getInitials(member.displayName ?? '')}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {group.memberCount}{' '}
                          {group.memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-sm font-medium">Activity:</span>
                        <Badge
                          variant={
                            group.activityLevel === 'High'
                              ? 'default'
                              : group.activityLevel === 'Medium'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {group.activityLevel}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link
                          to="/org/$slug/groups/$groupId"
                          params={{ slug: slug ?? '', groupId: group._id }}
                        >
                          View Group
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-4">
            {filteredDiscoverable.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <h3 className="font-semibold mb-1">
                    {searchTerm
                      ? 'No public groups match your search'
                      : 'No public groups to discover'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[300px]">
                    {searchTerm
                      ? 'Try a different search term'
                      : 'Public groups created in your organization will appear here'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDiscoverable.map((group) => (
                  <DiscoverGroupCard key={group._id} group={group} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Invites Tab */}
          <TabsContent value="invites" className="space-y-4">
            {pendingInvites.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <h3 className="font-semibold mb-1">No pending invitations</h3>
                  <p className="text-sm text-muted-foreground max-w-[300px]">
                    When someone invites you to a group, it will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Group Invitations</CardTitle>
                  <CardDescription>
                    Pending invitations to join groups
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingInvites.map((invite) => (
                      <InviteRow key={invite.groupId} invite={invite} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        organizationId={organizationId}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DiscoverGroupCard({
  group,
}: {
  group: {
    _id: string;
    name: string;
    description?: string;
    memberCount: number;
    activityLevel: 'Low' | 'Medium' | 'High';
  };
}) {
  const joinGroup = useMutation(api.groups.joinGroup);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await joinGroup({
        groupId: group._id as any,
      });
      toast.success(`Joined "${group.name}" successfully!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{group.name}</CardTitle>
        <CardDescription>{group.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm font-medium">Activity:</span>
          <Badge
            variant={
              group.activityLevel === 'High'
                ? 'default'
                : group.activityLevel === 'Medium'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {group.activityLevel}
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleJoin}
          disabled={isJoining}
        >
          {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Join Group
        </Button>
      </CardFooter>
    </Card>
  );
}

function InviteRow({
  invite,
}: {
  invite: {
    groupId: string;
    groupName: string;
    groupDescription?: string;
    invitedAt: number;
    memberCount: number;
  };
}) {
  const acceptInvite = useMutation(api.groups.acceptInvite);
  const declineInvite = useMutation(api.groups.declineInvite);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptInvite({ groupId: invite.groupId as any });
      toast.success(`Joined "${invite.groupName}"!`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to accept invite'
      );
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await declineInvite({ groupId: invite.groupId as any });
      toast.success('Invitation declined');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to decline invite'
      );
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarFallback>{getInitials(invite.groupName)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{invite.groupName}</p>
          <p className="text-sm text-muted-foreground">
            {invite.memberCount} members &middot;{' '}
            {formatRelative(invite.invitedAt, new Date())}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAccept} disabled={isAccepting}>
          {isAccepting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDecline}
          disabled={isDeclining}
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
