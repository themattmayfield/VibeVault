import { mutation, query, type QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { moodLiteral } from './schema';
import type { Id } from './_generated/dataModel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function getJournalHelper(
  ctx: QueryCtx,
  args: { journalId: Id<'journals'> }
) {
  const journal = await ctx.db.get(args.journalId);
  if (!journal) {
    throw new Error('Journal entry not found');
  }
  return journal;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get the 5 most recent journal entries for the sidebar "Recent Journals" section.
 * Returns minimal data: id, title, mood, creationTime.
 */
export const getRecentJournals = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const journals = await ctx.db
      .query('journals')
      .withIndex('by_org_and_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .order('desc')
      .take(5);

    return journals.map((j) => ({
      _id: j._id,
      title: j.title,
      mood: j.mood,
      _creationTime: j._creationTime,
    }));
  },
});

/**
 * Get a single journal entry by ID.
 */
export const getJournal = query({
  args: {
    journalId: v.id('journals'),
  },
  handler: async (ctx, args) => {
    return await getJournalHelper(ctx, args);
  },
});

/**
 * Get all journal entries for a user in an org, ordered by most recent first.
 * Bounded to 100 entries to prevent unbounded reads.
 */
export const getUserJournals = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const journals = await ctx.db
      .query('journals')
      .withIndex('by_org_and_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .order('desc')
      .take(100);

    return journals;
  },
});

/**
 * Count total journal entries for a user in an org.
 * Used to enforce plan limits on journal creation.
 */
export const getUserJournalCount = query({
  args: {
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const journals = await ctx.db
      .query('journals')
      .withIndex('by_org_and_user', (q) =>
        q.eq('organizationId', args.organizationId).eq('userId', args.userId)
      )
      .collect();

    return journals.length;
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new journal entry.
 */
export const createJournal = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    mood: v.optional(moodLiteral),
    moodEntryId: v.optional(v.id('moods')),
    tags: v.optional(v.array(v.string())),
    userId: v.id('users'),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const journalId = await ctx.db.insert('journals', {
      title: args.title,
      content: args.content,
      mood: args.mood,
      moodEntryId: args.moodEntryId,
      tags: args.tags,
      userId: args.userId,
      organizationId: args.organizationId,
    });
    return journalId;
  },
});

/**
 * Update an existing journal entry.
 */
export const updateJournal = mutation({
  args: {
    journalId: v.id('journals'),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    mood: v.optional(moodLiteral),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { journalId, ...updates } = args;
    // Only patch fields that were explicitly provided
    const patchData: Record<string, unknown> = {};
    if (updates.title !== undefined) patchData.title = updates.title;
    if (updates.content !== undefined) patchData.content = updates.content;
    if (updates.mood !== undefined) patchData.mood = updates.mood;
    if (updates.tags !== undefined) patchData.tags = updates.tags;

    if (Object.keys(patchData).length > 0) {
      await ctx.db.patch(journalId, patchData);
    }
  },
});

/**
 * Delete a journal entry.
 */
export const deleteJournal = mutation({
  args: {
    journalId: v.id('journals'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.journalId);
  },
});
