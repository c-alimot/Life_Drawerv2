import { supabase } from './client';
import {
  Entry,
  EntryWithRelations,
  CreateEntryRequest,
  UpdateEntryRequest,
  SearchEntriesRequest,
  ApiError,
} from '@types';
import { API_ERRORS } from '@constants/errors';

export const entriesService = {
  /**
   * Create a new entry
   */
  async createEntry(userId: string, request: CreateEntryRequest) {
    try {
      // Step 1: Create entry
      const { data: entry, error: entryError } = await supabase
        .from('entries')
        .insert({
          user_id: userId,
          title: request.title,
          content: request.content,
          mood: request.mood || null,
        })
        .select()
        .single();

      if (entryError || !entry) {
        throw entryError || new Error('Failed to create entry');
      }

      // Step 2: Link drawers
      if (request.drawerIds && request.drawerIds.length > 0) {
        const { error: drawerError } = await supabase.from('entry_drawers').insert(
          request.drawerIds.map((drawerId) => ({
            entry_id: entry.id,
            drawer_id: drawerId,
          }))
        );

        if (drawerError) {
          // Clean up entry if drawer linking fails
          await supabase.from('entries').delete().eq('id', entry.id);
          throw drawerError;
        }
      }

      // Step 3: Link tags
      if (request.tagIds && request.tagIds.length > 0) {
        const { error: tagError } = await supabase.from('entry_tags').insert(
          request.tagIds.map((tagId) => ({
            entry_id: entry.id,
            tag_id: tagId,
          }))
        );

        if (tagError) {
          // Clean up entry if tag linking fails
          await supabase.from('entries').delete().eq('id', entry.id);
          throw tagError;
        }
      }

      // Step 4: Fetch entry with relations
      return this.getEntryById(entry.id, userId);
    } catch (error) {
      console.error('Create entry error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Get entry by ID with all relations
   */
  async getEntryById(entryId: string, userId: string): Promise<EntryWithRelations> {
    try {
      // Fetch entry
      const { data: entry, error: entryError } = await supabase
        .from('entries')
        .select()
        .eq('id', entryId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (entryError || !entry) {
        throw entryError || new Error('Entry not found');
      }

      // Fetch drawers through junction table
      const { data: entryDrawersData, error: drawerError } = await supabase
        .from('entry_drawers')
        .select('drawer_id')
        .eq('entry_id', entryId);

      if (drawerError) throw drawerError;

      const drawerIds = entryDrawersData?.map((ed) => ed.drawer_id) || [];

      const drawers = drawerIds.length > 0
        ? (
            await supabase
              .from('drawers')
              .select()
              .in('id', drawerIds)
          ).data?.map(this.mapDrawerRow) || []
        : [];

      // Fetch tags through junction table
      const { data: entryTagsData, error: tagError } = await supabase
        .from('entry_tags')
        .select('tag_id')
        .eq('entry_id', entryId);

      if (tagError) throw tagError;

      const tagIds = entryTagsData?.map((et) => et.tag_id) || [];

      const tags = tagIds.length > 0
        ? (
            await supabase
              .from('tags')
              .select()
              .in('id', tagIds)
          ).data?.map(this.mapTagRow) || []
        : [];

      // Fetch author
      const { data: author, error: authorError } = await supabase
        .from('profiles')
        .select()
        .eq('id', entry.user_id)
        .single();

      if (authorError || !author) {
        throw authorError || new Error('Author not found');
      }

      return {
        ...this.mapEntryRow(entry),
        drawers,
        tags,
        author: this.mapProfileRow(author),
      };
    } catch (error) {
      console.error('Get entry error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Get entries with optional filters
   */
  async getEntries(userId: string, request?: SearchEntriesRequest) {
    try {
      let query = supabase
        .from('entries')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null);

      // Text search
      if (request?.query) {
        query = query.or(
          `title.ilike.%${request.query}%,content.ilike.%${request.query}%`
        );
      }

      // Mood filter
      if (request?.moodValues && request.moodValues.length > 0) {
        query = query.in('mood', request.moodValues);
      }

      // Date range
      if (request?.startDate) {
        query = query.gte('created_at', request.startDate);
      }

      if (request?.endDate) {
        query = query.lte('created_at', request.endDate);
      }

      // Sorting and pagination
      query = query
        .order('created_at', { ascending: false })
        .range(
          request?.offset || 0,
          (request?.offset || 0) + (request?.limit || 20) - 1
        );

      const { data: entries, error: entriesError, count } = await query;

      if (entriesError) throw entriesError;

      // For drawer and tag filtering, we need to fetch and filter manually
      let filteredEntries = entries || [];

      if (
        (request?.drawerIds && request.drawerIds.length > 0) ||
        (request?.tagIds && request.tagIds.length > 0)
      ) {
        filteredEntries = await this.filterByDrawersAndTags(
          filteredEntries,
          request?.drawerIds,
          request?.tagIds,
          userId
        );
      }

      // Fetch relations for each entry
      const entriesWithRelations = await Promise.all(
        filteredEntries.map(async (entry) => {
          try {
            return await this.getEntryById(entry.id, userId);
          } catch {
            return null;
          }
        })
      );

      const validEntries = entriesWithRelations.filter(
        Boolean
      ) as EntryWithRelations[];

      return {
        entries: validEntries,
        total: count || 0,
        hasMore: (count || 0) > ((request?.offset || 0) + (request?.limit || 20)),
      };
    } catch (error) {
      console.error('Get entries error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Get recent entries for home screen
   */
  async getRecentEntries(userId: string, limit: number = 10) {
    return this.getEntries(userId, { limit, offset: 0 });
  },

  /**
   * Update entry
   */
  async updateEntry(
    entryId: string,
    userId: string,
    request: UpdateEntryRequest
  ): Promise<EntryWithRelations> {
    try {
      const { error } = await supabase
        .from('entries')
        .update({
          title: request.title,
          content: request.content,
          mood: request.mood,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .eq('user_id', userId);

      if (error) throw error;

      return this.getEntryById(entryId, userId);
    } catch (error) {
      console.error('Update entry error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Delete entry (soft delete)
   */
  async deleteEntry(entryId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('entries')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Delete entry error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Link entry to drawer
   */
  async linkEntryToDrawer(entryId: string, drawerId: string): Promise<void> {
    try {
      const { error } = await supabase.from('entry_drawers').insert({
        entry_id: entryId,
        drawer_id: drawerId,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Link entry to drawer error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Unlink entry from drawer
   */
  async unlinkEntryFromDrawer(entryId: string, drawerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('entry_drawers')
        .delete()
        .eq('entry_id', entryId)
        .eq('drawer_id', drawerId);

      if (error) throw error;
    } catch (error) {
      console.error('Unlink entry from drawer error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Link entry to tag
   */
  async linkEntryToTag(entryId: string, tagId: string): Promise<void> {
    try {
      const { error } = await supabase.from('entry_tags').insert({
        entry_id: entryId,
        tag_id: tagId,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Link entry to tag error:', error);
      throw this.handleError(error);
    }
  },

  /**
   * Unlink entry from tag
   */
  async unlinkEntryFromTag(entryId: string, tagId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('entry_tags')
        .delete()
        .eq('entry_id', entryId)
        .eq('tag_id', tagId);

      if (error) throw error;
    } catch (error) {
      console.error('Unlink entry from tag error:', error);
      throw this.handleError(error);
    }
  },

  // ==================== HELPERS ====================

  private async filterByDrawersAndTags(
    entries: any[],
    drawerIds?: string[],
    tagIds?: string[],
    userId?: string
  ) {
    if (!drawerIds?.length && !tagIds?.length) {
      return entries;
    }

    const filteredEntryIds = new Set<string>();

    // Filter by drawers
    if (drawerIds?.length) {
      const { data: entryDrawersData } = await supabase
        .from('entry_drawers')
        .select('entry_id')
        .in('drawer_id', drawerIds);

      entryDrawersData?.forEach((ed) => filteredEntryIds.add(ed.entry_id));
    }

    // Filter by tags
    if (tagIds?.length) {
      const { data: entryTagsData } = await supabase
        .from('entry_tags')
        .select('entry_id')
        .in('tag_id', tagIds);

      entryTagsData?.forEach((et) => filteredEntryIds.add(et.entry_id));
    }

    return entries.filter((entry) => filteredEntryIds.has(entry.id));
  },

  private mapEntryRow(row: any): Entry {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      mood: row.mood,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  },

  private mapDrawerRow(row: any) {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  private mapTagRow(row: any) {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  private mapProfileRow(row: any) {
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      createdAt: row.created_at,
      updatedAt: row.created_at,
    };
  },

  private handleError(error: any): ApiError {
    const errorMessage = (error?.message || 'Unknown error').toLowerCase();

    if (errorMessage.includes('not found')) {
      return API_ERRORS.ENTRY_NOT_FOUND;
    }

    if (errorMessage.includes('unauthorized')) {
      return API_ERRORS.UNAUTHORIZED;
    }

    if (error?.status === 401) {
      return API_ERRORS.UNAUTHORIZED;
    }

    if (error?.status === 403) {
      return API_ERRORS.FORBIDDEN;
    }

    return API_ERRORS.UNKNOWN_ERROR;
  },
};