import { createFileRoute, useLoaderData } from '@tanstack/react-router';
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

export const Route = createFileRoute('/_authenticated/groups')({
  component: RouteComponent,
});
function RouteComponent() {
  const user = useLoaderData({
    from: '/_authenticated',
  });
  const { data: groups } = useSuspenseQuery(
    convexQuery(api.groups.getUsersGroups, {
      userId: user._id,
    })
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const name = user.displayName ?? '';
  const image = user.image ?? '';
  const initials = getInitials(name);

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <Input placeholder="Search groups..." className="max-w-sm" />
          <div className="flex items-center">
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create New Group
            </Button>
          </div>
        </div>

        <Tabs defaultValue="my-groups" className="space-y-4">
          <TabsList>
            <TabsTrigger value="my-groups">My Groups</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="invites">Invites</TabsTrigger>
          </TabsList>

          <TabsContent value="my-groups" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Card key={group._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{group.name}</span>
                      {group.isPrivate && (
                        <Badge variant="outline">Private</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <Avatar
                            key={i}
                            className="border-2 border-background"
                          >
                            <AvatarImage src={image} alt={name} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {group.members.length} members
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-sm font-medium">Activity:</span>
                      <Badge
                        variant={
                          // 'High' === 'High'
                          // biome-ignore lint/correctness/noConstantCondition: nice
                          true
                            ? 'default'
                            : // 'Medium' === 'Medium'
                              // biome-ignore lint/correctness/noConstantCondition: nice
                              true
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {'High'}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to="/">View Group</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="discover" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  id: 'wellness',
                  name: 'Wellness Warriors',
                  description: 'Track mood as part of wellness journey',
                  members: 156,
                  isPrivate: false,
                  activity: 'High',
                },
                {
                  id: 'students',
                  name: 'Student Support',
                  description: 'Share and track student stress levels',
                  members: 89,
                  isPrivate: false,
                  activity: 'Medium',
                },
                {
                  id: 'parents',
                  name: 'Parent Circle',
                  description: 'Track moods through parenting journey',
                  members: 112,
                  isPrivate: false,
                  activity: 'High',
                },
              ].map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <Avatar
                            key={i}
                            className="border-2 border-background"
                          >
                            <AvatarImage src={image} alt={name} />
                            <AvatarFallback>U{i + 1}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {group.members} members
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-sm font-medium">Activity:</span>
                      <Badge
                        variant={
                          group.activity === 'High'
                            ? 'default'
                            : group.activity === 'Medium'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {group.activity}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Join Group
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="invites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Group Invitations</CardTitle>
                <CardDescription>
                  Pending invitations to join groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: 'design-team',
                      name: 'Design Team',
                      from: 'Sarah Johnson',
                      date: '2 days ago',
                    },
                  ].map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage
                            src="/placeholder.svg?height=40&width=40"
                            alt={invite.from}
                          />
                          <AvatarFallback>SJ</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{invite.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Invited by {invite.from} • {invite.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm">Accept</Button>
                        <Button size="sm" variant="outline">
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
