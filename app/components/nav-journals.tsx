'use client';

import {
  BookOpenIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { Link, useParams } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { getMoodEmoji } from '@/lib/getMoodEmoji';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function NavJournals({
  userId,
  organizationId,
}: {
  userId: Id<'users'>;
  organizationId: string;
}) {
  const { slug } = useParams({ strict: false }) as { slug?: string };
  const { isMobile } = useSidebar();
  const deleteJournal = useMutation(api.journals.deleteJournal);

  const { data: recentJournals } = useSuspenseQuery(
    convexQuery(api.journals.getRecentJournals, {
      userId,
      organizationId,
    })
  );

  const handleDelete = async (journalId: Id<'journals'>) => {
    try {
      await deleteJournal({ journalId });
      toast.success('Journal entry deleted');
    } catch {
      toast.error('Failed to delete journal entry');
    }
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Recent Journals</SidebarGroupLabel>
      <SidebarGroupAction asChild title="New journal entry">
        <Link to="/org/$slug/journal/new" params={{ slug: slug ?? '' }}>
          <PlusIcon />
          <span className="sr-only">New journal entry</span>
        </Link>
      </SidebarGroupAction>
      <SidebarMenu>
        {recentJournals.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link
                to="/org/$slug/journal/new"
                params={{ slug: slug ?? '' }}
                className="text-sidebar-foreground/70"
              >
                <BookOpenIcon className="text-sidebar-foreground/50" />
                <span>Write your first reflection...</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          <>
            {recentJournals.map((journal) => (
              <SidebarMenuItem key={journal._id}>
                <SidebarMenuButton asChild>
                  <Link
                    to="/org/$slug/journal/$journalId"
                    params={{
                      slug: slug ?? '',
                      journalId: journal._id,
                    }}
                  >
                    <span className="text-base leading-none">
                      {journal.mood ? (
                        getMoodEmoji(journal.mood)
                      ) : (
                        <BookOpenIcon className="h-4 w-4" />
                      )}
                    </span>
                    <span className="truncate">{journal.title}</span>
                  </Link>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction
                      showOnHover
                      className="rounded-sm data-[state=open]:bg-accent"
                    >
                      <MoreHorizontalIcon />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-32 rounded-lg"
                    side={isMobile ? 'bottom' : 'right'}
                    align={isMobile ? 'end' : 'start'}
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        to="/org/$slug/journal/$journalId"
                        params={{
                          slug: slug ?? '',
                          journalId: journal._id,
                        }}
                      >
                        <BookOpenIcon />
                        <span>Open</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(journal._id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2Icon />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-sidebar-foreground/70">
                <Link to="/org/$slug/journal" params={{ slug: slug ?? '' }}>
                  <MoreHorizontalIcon className="text-sidebar-foreground/70" />
                  <span>All journals</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
