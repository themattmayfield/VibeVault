import { useState } from 'react';
import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from '@tanstack/react-router';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { moodOptions } from '@/lib/getMoodEmoji';
import { getMoodEmoji } from '@/lib/getMoodEmoji';
import { format, formatRelative } from 'date-fns';
import getInitials from '@/lib/getInitials';
import capitalize from 'lodash-es/capitalize';
import { useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  PlusIcon,
  Loader2,
  ClipboardCheck,
  MoreHorizontal,
  UserMinus,
  Ban,
  UserPlus,
} from 'lucide-react';
import type { Infer } from 'convex/values';
import type { moodLiteral } from 'convex/schema';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { getPlanFeatures } from '@/lib/plan-features';

export const Route = createFileRoute(
  '/org/$slug/_authenticated/groups/$groupId'
)({
  beforeLoad: async ({ params }) => {
    const authUser = await getAuthUser();
    if (!authUser) {
      throw redirect({
        to: '/org/$slug/sign-in',
        params: { slug: params.slug },
      });
    }
    // Pass clerkUserId through context for the loader to use as SSR auth fallback
    return { groupId: params.groupId, clerkUserId: authUser.id };
  },
  component: RouteComponent,
  loader: async ({ params, context }) => {
    try {
      const data = await context.queryClient.fetchQuery(
        convexQuery(api.groups.getGroupPageContent, {
          groupId: params.groupId as Id<'groups'>,
          clerkUserId: (context as any).clerkUserId,
        })
      );
      return data;
    } catch {
      // If the user is not a member, the query will throw.
      // Redirect to the groups list.
      throw redirect({
        to: '/org/$slug/groups',
        params: { slug: params.slug },
      });
    }
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const { slug } = Route.useParams();
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

  const user = useLoaderData({ from: '/org/$slug/_authenticated' });
  const { orgSettings } = useOrgSettings();
  const clerkUserId = user.clerkUserId;

  const { data: members } = useSuspenseQuery(
    convexQuery(api.groups.getActiveGroupMembers, {
      groupId: group._id,
      clerkUserId,
    })
  );

  // Determine the current user's role in this group
  const currentUserMembership = members.find((m) => m.userId === user._id);
  const isOwner = currentUserMembership?.role === 'owner';
  const isAdmin =
    currentUserMembership?.role === 'admin' ||
    currentUserMembership?.role === 'owner';

  const groupCreationDate = new Date(group._creationTime);
  const groupCreationDateFormatted = format(groupCreationDate, 'MMMM d, yyyy');

  const [showInviteModal, setShowInviteModal] = useState(false);

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
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowInviteModal(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Members
            </Button>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="check-ins">Check-ins</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
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
                  <GroupMoodChart
                    groupId={group._id}
                    clerkUserId={clerkUserId}
                  />
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
                <GroupMoodTimeline
                  groupId={group._id}
                  clerkUserId={clerkUserId}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Check-ins Tab */}
          <TabsContent value="check-ins" className="space-y-4">
            <GroupCheckIns
              groupId={group._id}
              isAdmin={isAdmin}
              clerkUserId={clerkUserId}
            />
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Group Members</CardTitle>
                <CardDescription>
                  {members.length} {members.length === 1 ? 'person' : 'people'}{' '}
                  in this group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member) => (
                    <MemberRow
                      key={member._id}
                      member={member}
                      groupId={group._id}
                      isAdmin={isAdmin}
                      currentUserId={user._id}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <GroupSettings
              group={group}
              isOwner={isOwner}
              isAdmin={isAdmin}
              slug={slug}
              navigate={navigate}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Members Modal */}
      {showInviteModal && (
        <InviteMemberModal
          groupId={group._id}
          organizationId={orgSettings.clerkOrgId ?? ''}
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member Row with remove/ban
// ---------------------------------------------------------------------------

function MemberRow({
  member,
  groupId,
  isAdmin,
  currentUserId,
}: {
  member: {
    _id: Id<'groupMemberInfo'>;
    userId: Id<'users'>;
    role: string;
    displayName: string;
    image?: string;
    _creationTime: number;
  };
  groupId: Id<'groups'>;
  isAdmin: boolean;
  currentUserId: Id<'users'>;
}) {
  const removeMember = useMutation(api.groups.removeMember);
  const banMember = useMutation(api.groups.banMember);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'remove' | 'ban' | null>(null);

  const isCurrentUser = member.userId === currentUserId;
  const canManage = isAdmin && !isCurrentUser && member.role !== 'owner';

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeMember({ groupId, targetUserId: member.userId });
      toast.success(`${member.displayName} has been removed`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to remove member'
      );
    } finally {
      setIsRemoving(false);
      setShowConfirm(null);
    }
  };

  const handleBan = async () => {
    setIsRemoving(true);
    try {
      await banMember({ groupId, targetUserId: member.userId });
      toast.success(`${member.displayName} has been banned`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to ban member');
    } finally {
      setIsRemoving(false);
      setShowConfirm(null);
    }
  };

  const createdAt = `Joined ${formatRelative(member._creationTime, new Date())}`;

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={member.image} alt={member.displayName} />
            <AvatarFallback>
              {getInitials(member.displayName ?? '')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {member.displayName}
              {isCurrentUser && (
                <span className="text-muted-foreground ml-1">(you)</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  member.role === 'owner'
                    ? 'default'
                    : member.role === 'admin'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {capitalize(member.role)}
              </Badge>
              <p className="text-sm text-muted-foreground">{createdAt}</p>
            </div>
          </div>
        </div>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isRemoving}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowConfirm('remove')}>
                <UserMinus className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowConfirm('ban')}
                className="text-destructive"
              >
                <Ban className="mr-2 h-4 w-4" />
                Ban
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <AlertDialog
        open={showConfirm !== null}
        onOpenChange={(open) => !open && setShowConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showConfirm === 'ban' ? 'Ban' : 'Remove'} {member.displayName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showConfirm === 'ban'
                ? `${member.displayName} will be banned from this group and won't be able to rejoin.`
                : `${member.displayName} will be removed from this group. They can be re-invited later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={showConfirm === 'ban' ? handleBan : handleRemove}
              className={
                showConfirm === 'ban'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {showConfirm === 'ban' ? 'Ban Member' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Group Settings
// ---------------------------------------------------------------------------

function GroupSettings({
  group,
  isOwner,
  isAdmin,
  slug,
  navigate,
}: {
  group: any;
  isOwner: boolean;
  isAdmin: boolean;
  slug: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const leaveGroup = useMutation(api.groups.leaveGroup);
  const deleteGroupMut = useMutation(api.groups.deleteGroup);
  const updateGroup = useMutation(api.groups.updateGroup);

  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Edit state
  const [editName, setEditName] = useState(group.name);
  const [editDescription, setEditDescription] = useState(
    group.description ?? ''
  );
  const [editPrivacy, setEditPrivacy] = useState(
    group.isPrivate ? 'private' : 'public'
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error('Group name cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      await updateGroup({
        groupId: group._id,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        isPrivate: editPrivacy === 'private',
      });
      toast.success('Group settings updated');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update group'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveGroup({ groupId: group._id });
      toast.success('You have left the group');
      navigate({ to: '/org/$slug/groups', params: { slug } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave group');
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteGroupMut({ groupId: group._id });
      toast.success('Group has been deleted');
      navigate({ to: '/org/$slug/groups', params: { slug } });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete group'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      {/* Edit Group Details */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Group Details</CardTitle>
            <CardDescription>
              Edit your group's name, description, and privacy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Group Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Group name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="What is this group about?"
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Privacy</Label>
              <Select value={editPrivacy} onValueChange={setEditPrivacy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    Private - Only invited members
                  </SelectItem>
                  <SelectItem value="public">
                    Public - Anyone can find and join
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Leave / Delete */}
      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for this group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium text-lg">Leave Group</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You can leave this group at any time. Your mood data will remain
              in group analytics.
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => setShowLeaveConfirm(true)}
            >
              Leave Group
            </Button>
          </div>

          {isOwner && (
            <div>
              <h3 className="font-medium text-lg">Delete Group</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete this group, all memberships, and all
                associated check-ins. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                className="mt-2"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Group
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Confirmation */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave "{group.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer have access to this group's content. You can
              rejoin later if the group is public or you receive a new
              invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave} disabled={isLeaving}>
              {isLeaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Leave Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{group.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group, all memberships,
              check-ins, and responses. Moods shared with this group will be
              unlinked. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Invite Member Modal
// ---------------------------------------------------------------------------

function InviteMemberModal({
  groupId,
  organizationId,
  isOpen,
  onClose,
}: {
  groupId: Id<'groups'>;
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const inviteMember = useMutation(api.groups.inviteMember);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviting, setIsInviting] = useState<string | null>(null);

  // Search for users in the org via Clerk user lookup
  // For now, we'll use a simple approach: search the Convex users table
  const { data: searchResults } = useSuspenseQuery(
    convexQuery(
      api.user.getUserByClerkId,
      searchTerm ? { clerkUserId: searchTerm } : { clerkUserId: '__no_match__' }
    )
  );

  const handleInvite = async (userId: Id<'users'>) => {
    setIsInviting(userId);
    try {
      await inviteMember({ groupId, inviteeUserId: userId });
      toast.success('Invitation sent!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setIsInviting(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Enter a Clerk user ID to invite someone to this group.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-search">Clerk User ID</Label>
            <Input
              id="invite-search"
              placeholder="Enter Clerk user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchResults && searchTerm && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={searchResults.image}
                      alt={searchResults.displayName}
                    />
                    <AvatarFallback>
                      {getInitials(searchResults.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {searchResults.displayName}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleInvite(searchResults._id)}
                  disabled={isInviting === searchResults._id}
                >
                  {isInviting === searchResults._id && (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  )}
                  Invite
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Group Check-ins Component
// ---------------------------------------------------------------------------

function GroupCheckIns({
  groupId,
  isAdmin,
  clerkUserId,
}: {
  groupId: Id<'groups'>;
  isAdmin: boolean;
  clerkUserId: string;
}) {
  const { orgSettings } = useOrgSettings();
  const organizationId = orgSettings.clerkOrgId ?? '';
  const planFeatures = getPlanFeatures(orgSettings.plan);

  const { data: checkIns } = useSuspenseQuery(
    convexQuery(api.checkIns.getGroupCheckIns, { groupId, clerkUserId })
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
        organizationId,
      });
      toast.success('Check-in created');
      setShowCreateForm(false);
      setNewTitle('');
      setNewPrompt('');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create check-in'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleRespond = async (checkInId: Id<'checkIns'>) => {
    setIsResponding(true);
    try {
      await respondToCheckIn({
        checkInId,
        mood: responseMood,
        note: responseNote.trim() || undefined,
        period: today,
        organizationId,
      });
      toast.success('Response submitted');
      setRespondingTo(null);
      setResponseNote('');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to submit response'
      );
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
        {!showCreateForm && isAdmin && (
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
              {isAdmin
                ? 'Create a recurring check-in to see how everyone is feeling'
                : 'Group admins can create recurring check-ins'}
            </p>
          </CardContent>
        </Card>
      ) : (
        activeCheckIns.map((checkIn) => (
          <CheckInCard
            key={checkIn._id}
            checkIn={checkIn}
            today={today}
            clerkUserId={clerkUserId}
            isRespondingTo={respondingTo === checkIn._id}
            responseMood={responseMood}
            responseNote={responseNote}
            isResponding={isResponding}
            isAdmin={isAdmin}
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
  clerkUserId,
  isRespondingTo,
  responseMood,
  responseNote,
  isResponding,
  isAdmin,
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
  clerkUserId: string;
  isRespondingTo: boolean;
  responseMood: Infer<typeof moodLiteral>;
  responseNote: string;
  isResponding: boolean;
  isAdmin: boolean;
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
      clerkUserId,
    })
  );

  const { data: hasResponded } = useSuspenseQuery(
    convexQuery(api.checkIns.hasRespondedToday, {
      checkInId: checkIn._id,
      period: today,
      clerkUserId,
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
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeactivate}
                className="text-xs text-muted-foreground"
              >
                Deactivate
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
